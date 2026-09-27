// Auth service — registration, verification, login, reset and sessions

import { Injectable } from '@nestjs/common';
import { THROTTLED_MESSAGE } from '../../common/throttling/throttling.constants';
import { QueryClient } from '../../prisma/query-client';
import { PrismaService } from '../../prisma/prisma.service';
import { RegistrationLimitService } from '../accounts/registration-limit.service';
import { UserRepository } from '../accounts/user.repository';
import { MailerService } from '../notifications/mailer.service';
import { EmailTokenRepository } from './email-token.repository';
import { PasswordService } from './password.service';
import { SessionRepository } from './session.repository';
import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
  TokenService,
  VERIFICATION_TOKEN_TTL_MS,
} from './token.service';

/** The address is already taken — the contract requires a specific message. */
export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Este e-mail já está cadastrado no sistema.');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

/** The link is unknown, expired or already used. */
export class InvalidVerificationLinkError extends Error {
  constructor() {
    super('O link de verificação não é válido.');
    this.name = 'InvalidVerificationLinkError';
  }
}

/** Wrong password or unknown e-mail — deliberately one message for both. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Credenciais inválidas.');
    this.name = 'InvalidCredentialsError';
  }
}

/** The account exists but the e-mail was never confirmed. */
export class EmailNotVerifiedError extends Error {
  constructor() {
    super('Necessário validar o e-mail.');
    this.name = 'EmailNotVerifiedError';
  }
}

/** The reset link is unknown, expired or already used. */
export class InvalidResetLinkError extends Error {
  constructor() {
    super('O link de redefinição não é válido ou já foi utilizado.');
    this.name = 'InvalidResetLinkError';
  }
}

/** A second resend inside the five-minute cooldown window. */
export class VerificationCooldownError extends Error {
  constructor() {
    super(THROTTLED_MESSAGE);
    this.name = 'VerificationCooldownError';
  }
}

/** The two passwords do not match. */
export class PasswordMismatchError extends Error {
  constructor() {
    super('A confirmação deve ser igual à senha.');
    this.name = 'PasswordMismatchError';
  }
}

/** The session is unknown, expired or revoked — log in again. */
export class InvalidSessionError extends Error {
  constructor() {
    super('Sessão inválida. Entre novamente.');
    this.name = 'InvalidSessionError';
  }
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  ip: string;
}

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

/**
 * Owns the authentication flows. Every rule below traces to
 * .agents/decisions/accounts-and-access.md or to docs/base-system-features.md
 * §4.2–§4.5 — the service never invents policy, it executes it.
 */
@Injectable()
export class AuthService {
  private readonly appUrl: string;

  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly emailTokens: EmailTokenRepository,
    private readonly limits: RegistrationLimitService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly mailer: MailerService,
    private readonly prisma: PrismaService,
  ) {
    // Links mailed to users must point at the public gateway, which only the
    // deployment knows — same direct-env pattern as the rest of the codebase.
    this.appUrl = process.env.APP_URL ?? 'http://localhost';
  }

  /**
   * Creates an unverified account and sends the confirmation e-mail.
   * Registration never logs the user in.
   */
  async register(input: RegisterInput): Promise<{ id: string }> {
    const email = input.email.trim().toLowerCase();

    if (input.password !== input.passwordConfirmation) {
      throw new PasswordMismatchError();
    }
    await this.limits.assertCanRegister(input.ip);

    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash: await this.passwords.hash(input.password),
      registrationIp: input.ip,
    });

    await this.sendVerificationEmail(user.id, email, user.name);
    return { id: user.id };
  }

  /** Confirms the e-mail behind a single-use link. */
  async verifyEmail(rawToken: string): Promise<void> {
    const record = await this.emailTokens.findValidByHash(
      this.tokens.hashToken(rawToken),
      'VERIFICATION',
    );
    if (!record) {
      throw new InvalidVerificationLinkError();
    }

    // One transaction, consume first: a link burned without the account being
    // confirmed would leave the guarantee half-honoured, and throwing after the
    // consume rolls the burn back, so a failed attempt keeps the link usable.
    await this.prisma.$transaction(async (tx) => {
      if (!(await this.emailTokens.consume(record.id, tx))) {
        throw new InvalidVerificationLinkError();
      }
      await this.users.markVerified(record.userId, tx);
    });
  }

  /**
   * Re-sends the confirmation, at most once per user every five minutes. An
   * unknown or already-verified address gets the same answer — the form never
   * discloses whether an account exists.
   */
  async resendVerification(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await this.users.findByEmail(normalized);

    if (!user || user.emailVerified) {
      return;
    }

    const lastSent = await this.emailTokens.latestSentAt(user.id, 'VERIFICATION');
    if (lastSent && Date.now() - lastSent.getTime() < 5 * 60 * 1000) {
      throw new VerificationCooldownError();
    }

    await this.sendVerificationEmail(user.id, user.email, user.name);
  }

  /**
   * Authenticates a verified account and opens a session. The e-mail is
   * normalized before lookup; a wrong password and an unknown e-mail produce
   * the same answer so neither can be probed.
   */
  async login(input: LoginInput): Promise<SessionTokens> {
    const user = await this.users.findByEmail(input.email.trim().toLowerCase());

    if (!user || !(await this.passwords.verify(user.passwordHash, input.password))) {
      throw new InvalidCredentialsError();
    }
    if (!user.emailVerified) {
      throw new EmailNotVerifiedError();
    }

    return this.openSession(user.id, user.role, true, input.userAgent);
  }

  /**
   * Starts a password reset. Always answers the same way — the contract
   * requires a specific message per case, so the distinction lives there.
   */
  async forgotPassword(email: string): Promise<{ sent: boolean }> {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (!user) {
      return { sent: false };
    }

    const { raw, hash } = this.tokens.newOpaqueToken();
    await this.emailTokens.create({
      userId: user.id,
      tokenHash: hash,
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    });
    await this.mailer.sendPasswordResetEmail(
      { email: user.email, name: user.name },
      `${this.appUrl}/redefinir-senha?token=${raw}`,
    );
    return { sent: true };
  }

  /**
   * Applies a new password through a single-use link and ends every session —
   * a reset arrives with no session of its own, so there is no current one to
   * keep, unlike the authenticated password change.
   */
  async resetPassword(rawToken: string, password: string, passwordConfirmation: string): Promise<void> {
    const record = await this.emailTokens.findValidByHash(
      this.tokens.hashToken(rawToken),
      'PASSWORD_RESET',
    );
    if (!record) {
      throw new InvalidResetLinkError();
    }
    if (password !== passwordConfirmation) {
      throw new PasswordMismatchError();
    }

    const passwordHash = await this.passwords.hash(password);

    // One transaction, consume first. The order matters twice over: a crash
    // between the password write and the revocation would leave every session —
    // including one held by an attacker who triggered the reset — alive under
    // the new password, and a losing racer must change nothing at all.
    await this.prisma.$transaction(async (tx) => {
      if (!(await this.emailTokens.consume(record.id, tx))) {
        throw new InvalidResetLinkError();
      }
      await this.users.updatePassword(record.userId, passwordHash, tx);
      await this.sessions.revokeAll(record.userId, tx);
    });
  }

  /**
   * Rotates the refresh token: the presented row is revoked and a new one is
   * issued. Presenting an already-used or revoked token means theft — every
   * session of that user dies.
   */
  async refresh(rawToken: string, userAgent?: string): Promise<SessionTokens> {
    const record = await this.sessions.findByHash(this.tokens.hashToken(rawToken));
    if (!record) {
      throw new InvalidSessionError();
    }
    if (record.revokedAt !== null || record.expiresAt.getTime() <= Date.now()) {
      await this.sessions.revokeAll(record.userId);
      throw new InvalidSessionError();
    }

    const user = await this.users.findById(record.userId);
    if (!user) {
      throw new InvalidSessionError();
    }

    // One transaction so a crash mid-rotation cannot consume the old token
    // without handing out a new one, which would log the user out for good.
    return this.prisma.$transaction(async (tx) => {
      await this.sessions.revokeById(record.id, tx);
      return this.openSession(user.id, user.role, user.emailVerified, userAgent, tx);
    });
  }

  /** Ends one session — the row named by the access token, owned by the caller. */
  async logout(sessionId: string, userId: string): Promise<void> {
    const record = await this.sessions.findById(sessionId);
    if (record && record.userId === userId && record.revokedAt === null) {
      await this.sessions.revokeById(record.id);
    }
  }

  private async openSession(
    userId: string,
    role: string,
    emailVerified: boolean,
    userAgent?: string,
    client?: QueryClient,
  ): Promise<SessionTokens> {
    const { raw, hash } = this.tokens.newOpaqueToken();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    const session = await this.sessions.create(
      {
        userId,
        tokenHash: hash,
        userAgent,
        expiresAt: refreshExpiresAt,
      },
      client,
    );

    return {
      accessToken: this.tokens.signAccess({
        sub: userId,
        role,
        emailVerified,
        jti: session.id,
      }),
      refreshToken: raw,
      refreshExpiresAt,
    };
  }

  private async sendVerificationEmail(userId: string, email: string, name: string): Promise<void> {
    const { raw, hash } = this.tokens.newOpaqueToken();
    await this.emailTokens.create({
      userId,
      tokenHash: hash,
      type: 'VERIFICATION',
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    });
    await this.mailer.sendVerificationEmail(
      { email, name },
      `${this.appUrl}/verificar-email?token=${raw}`,
    );
  }
}
