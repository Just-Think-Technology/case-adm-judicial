// Optional session guard — names the caller for throttling, blocks nobody

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { resolveSessionIdentity } from './session-identity';
import { TokenService } from './token.service';

/**
 * Resolves the account behind the access-token cookie onto `request.user` and
 * always lets the request through.
 *
 * It exists for one ordering reason: the throttler consumes its budget before
 * the enforcing guards run, so without this the identity would not be known
 * yet and every authenticated request would be keyed by IP. Registering this
 * ahead of the throttler keeps the documented rule — per account when a session
 * exists, per IP otherwise — without authenticating anyone: anonymous requests
 * pass with no identity, and the real guard still decides access downstream.
 */
@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const identity = resolveSessionIdentity(request?.cookies, this.tokens);

    if (identity) {
      request.user = identity;
    }

    return true;
  }
}
