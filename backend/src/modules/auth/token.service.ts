// Token service — access JWT, opaque refresh tokens, e-mail tokens

import { createHash, randomBytes } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

/** Fifteen minutes, per the session decision. Hot path, stateless. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** Seven days, rotating, per the session decision. */
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Verification link lifetime — generous, e-mail delivery is slow. */
export const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Reset link lifetime — short, it is a live credential grant. */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface AccessTokenClaims {
  sub: string;
  role: string;
  emailVerified: boolean;
  jti: string;
}

/** Signs access tokens and mints the opaque tokens the database stores hashed. */
export class TokenService {
  constructor(private readonly accessSecret: string) {}

  signAccess(claims: AccessTokenClaims): string {
    return jwt.sign(claims, this.accessSecret, {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });
  }

  verifyAccess(raw: string): AccessTokenClaims {
    const payload = jwt.verify(raw, this.accessSecret, { algorithms: ['HS256'] });

    if (typeof payload !== 'object' || payload === null) {
      throw new Error('Access token payload is not an object');
    }

    const { sub, role, emailVerified, jti } = payload as Record<string, unknown>;
    if (
      typeof sub !== 'string' ||
      typeof role !== 'string' ||
      typeof emailVerified !== 'boolean' ||
      typeof jti !== 'string'
    ) {
      throw new Error('Access token is missing required claims');
    }

    return { sub, role, emailVerified, jti };
  }

  /**
   * Mints a 256-bit opaque token. The raw value travels exactly once — inside
   * the cookie or the e-mail link — and only the SHA-256 hash is stored, so a
   * database leak hands over no working sessions.
   */
  newOpaqueToken(): { raw: string; hash: string } {
    const raw = randomBytes(32).toString('hex');
    return { raw, hash: this.hashToken(raw) };
  }

  hashToken(raw: string): string {
    return createHash('sha256').update(raw, 'utf8').digest('hex');
  }
}
