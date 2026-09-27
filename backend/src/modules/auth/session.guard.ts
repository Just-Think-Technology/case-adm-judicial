// Authenticated guard — the access-token cookie is the session

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

export interface AuthenticatedUser {
  id: string;
  role: string;
  emailVerified: boolean;
  sessionId: string;
}

/**
 * Authenticates a request from its access-token cookie. The frontend never
 * reads or writes this cookie and never builds an Authorization header — the
 * browser attaches it, the server verifies the signature, and the role comes
 * from the claim, never from anything the client sends.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const raw: unknown = request?.cookies?.access_token;

    if (typeof raw !== 'string' || raw === '') {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }

    try {
      const claims = this.tokens.verifyAccess(raw);
      request.user = {
        id: claims.sub,
        role: claims.role,
        emailVerified: claims.emailVerified,
        sessionId: claims.jti,
      } satisfies AuthenticatedUser;
      return true;
    } catch {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }
  }
}
