// Authenticated guard — the access-token cookie is the session

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { resolveSessionIdentity, type SessionIdentity } from './session-identity';
import { SessionRepository } from './session.repository';
import { TokenService } from './token.service';

/** The caller behind a valid access-token cookie. */
export type AuthenticatedUser = SessionIdentity;

/**
 * Authenticates a request from its access-token cookie. The frontend never
 * reads or writes this cookie and never builds an Authorization header — the
 * browser attaches it, the server verifies the signature, and the role comes
 * from the claim, never from anything the client sends.
 */
@Injectable()
export class AuthenticatedGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly sessions: SessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // The identity logic has a single home in session-identity.ts — this guard
    // only adds the decision: no identity, no entry.
    const identity = resolveSessionIdentity(request?.cookies, this.tokens);

    if (!identity) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }

    // Liveness: the signature says who, the row says whether the session is
    // still standing. Logout, password reset/change revoke the row and user
    // deletion cascades it — a replayed access token dies with it instead of
    // living until exp. One indexed lookup per authenticated request.
    const session = await this.sessions.findById(identity.sessionId);
    if (!session || session.userId !== identity.id || session.revokedAt !== null) {
      throw new UnauthorizedException('Sessão inválida ou expirada. Entre novamente.');
    }

    request.user = identity;
    return true;
  }
}
