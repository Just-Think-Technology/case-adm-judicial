// Auth controller — §4.2–§4.5 transport only, no business rules

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  FORGOT_PASSWORD_LIMIT_PER_MINUTE,
  LOGIN_LIMIT_PER_MINUTE,
  ONE_MINUTE_IN_MS,
  REGISTER_LIMIT_PER_MINUTE,
  VERIFICATION_LIMIT_PER_MINUTE,
} from '../../common/throttling/throttling.constants';
import { getThrottleTracker } from '../../common/throttling/throttler.config';
import { resolveClientIp } from '../../common/throttling/client-ip';
import {
  AuthService,
  InvalidResetLinkError,
  InvalidSessionError,
  InvalidVerificationLinkError,
} from './auth.service';
import { AuthExceptionFilter } from './auth-exception.filter';
import { AuthenticatedGuard, type AuthenticatedUser } from './session.guard';
import { CsrfGuard, CSRF_COOKIE_NAME } from './csrf.guard';
import { CsrfService } from './csrf.service';
import { CurrentUser } from './current-user.decorator';
import { buildLoginThrottleKey } from './throttle-keys';
import { REFRESH_TOKEN_TTL_MS } from './token.service';
import { EmailDto } from './dto/email.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/** Fifteen minutes, matching the access-token lifetime. */
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Transport for §4.2–§4.5. Every handler validates input through its DTO,
 * delegates to the service, and shapes the response — status codes, cookies
 * and messages live here, rules live in the service.
 */
@Controller('auth')
@UseFilters(AuthExceptionFilter)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly csrf: CsrfService,
  ) {}

  private setSessionCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string },
  ): void {
    const secure = isProduction();
    const base = { httpOnly: true, secure } as const;
    response.cookie('access_token', tokens.accessToken, {
      ...base,
      sameSite: 'lax',
      maxAge: ACCESS_COOKIE_MAX_AGE_MS,
      path: '/',
    });
    // Scoped to the refresh route only, per the session decision — the browser
    // does not attach it to ordinary requests.
    response.cookie('refresh_token', tokens.refreshToken, {
      ...base,
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_TTL_MS,
      path: '/auth/refresh',
    });
  }

  private clearSessionCookies(response: Response): void {
    response.clearCookie('access_token', { path: '/' });
    response.clearCookie('refresh_token', { path: '/auth/refresh' });
  }

  /** Issues the readable half of the double-submit CSRF check. */
  @Get('csrf-token')
  csrfToken(@Res({ passthrough: true }) response: Response): { token: string } {
    const token = this.csrf.issueToken();
    response.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      sameSite: 'lax',
      secure: isProduction(),
      path: '/',
    });
    return { token };
  }

  /** §4.2 — creates an unverified account; never logs in. */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(CsrfGuard)
  @Throttle({
    default: {
      limit: REGISTER_LIMIT_PER_MINUTE,
      ttl: ONE_MINUTE_IN_MS,
      getTracker: getThrottleTracker,
    },
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: { headers?: Record<string, string | string[] | undefined> },
  ): Promise<{ message: string }> {
    await this.auth.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      passwordConfirmation: dto.passwordConfirmation,
      ip: resolveClientIp({ headers: request.headers ?? {} }) ?? 'unknown',
    });
    return {
      message:
        'Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta, inclusive a caixa de spam.',
    };
  }

  /** §4.3 — confirms the account behind the mailed link. */
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string): Promise<{ message: string }> {
    if (typeof token !== 'string' || token === '') {
      throw new InvalidVerificationLinkError();
    }
    await this.auth.verifyEmail(token);
    return { message: 'E-mail verificado com sucesso!' };
  }

  /** §4.3 — re-sends the confirmation, throttled per user and per minute. */
  @Post('verification-notification')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @Throttle({
    default: {
      limit: VERIFICATION_LIMIT_PER_MINUTE,
      ttl: ONE_MINUTE_IN_MS,
      getTracker: getThrottleTracker,
    },
  })
  async resendVerification(@Body() dto: EmailDto): Promise<{ message: string }> {
    await this.auth.resendVerification(dto.email);
    return {
      message: 'E-mail de verificação reenviado! Verifique também a caixa de spam.',
    };
  }

  /** §4.4 — opens a session for a verified account. */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @Throttle({
    default: {
      limit: LOGIN_LIMIT_PER_MINUTE,
      ttl: ONE_MINUTE_IN_MS,
      getTracker: getThrottleTracker,
      generateKey: buildLoginThrottleKey,
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Req() request: { headers?: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const header = request.headers?.['user-agent'];
    const tokens = await this.auth.login({
      email: dto.email,
      password: dto.password,
      userAgent: typeof header === 'string' ? header : undefined,
    });
    this.setSessionCookies(response, tokens);
    return { message: 'Login realizado com sucesso.' };
  }

  /** §4.5 — starts a reset; answers the same way for unknown addresses. */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @Throttle({
    default: {
      limit: FORGOT_PASSWORD_LIMIT_PER_MINUTE,
      ttl: ONE_MINUTE_IN_MS,
      getTracker: getThrottleTracker,
    },
  })
  async forgotPassword(@Body() dto: EmailDto): Promise<{ message: string }> {
    const { sent } = await this.auth.forgotPassword(dto.email);
    return {
      message: sent
        ? 'E-mail de redefinição enviado!'
        : 'Não foi encontrado usuário com esse endereço.',
    };
  }

  /** §4.5 — reveals the address behind a valid link for the readonly field. */
  @Get('reset-password')
  async resetEmail(@Query('token') token: string): Promise<{ email: string }> {
    if (typeof token !== 'string' || token === '') {
      throw new InvalidResetLinkError();
    }
    return { email: await this.auth.resetEmailAddress(token) };
  }

  /** §4.5 — applies the new password through the mailed link. */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.auth.resetPassword(dto.token, dto.password, dto.passwordConfirmation);
    return { message: 'Senha redefinida com sucesso!' };
  }

  /** Rotates the refresh token from its scoped cookie. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: { cookies?: Record<string, unknown>; headers?: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const raw = request.cookies?.refresh_token;
    if (typeof raw !== 'string' || raw === '') {
      throw new InvalidSessionError();
    }
    const header = request.headers?.['user-agent'];
    const tokens = await this.auth.refresh(raw, typeof header === 'string' ? header : undefined);
    this.setSessionCookies(response, tokens);
    return { message: 'Sessão renovada.' };
  }

  /** §4.4 — ends the current session. */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthenticatedGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.auth.logout(user.sessionId, user.id);
    this.clearSessionCookies(response);
    return { message: 'Você saiu da conta.' };
  }
}
