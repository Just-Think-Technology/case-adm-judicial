// Session identity — whose cookie this is, without deciding anything

import type { AccessTokenClaims, TokenService } from './token.service';

/** The caller behind a valid access-token cookie. */
export interface SessionIdentity {
  id: string;
  role: string;
  emailVerified: boolean;
  sessionId: string;
}

/**
 * Names the account behind the request's access-token cookie, or nothing when
 * the cookie names nobody.
 *
 * Verification covers the signature only: whether the session is still alive
 * (not revoked, user not deleted) is the enforcing guard's job, not the
 * resolver's. For throttle keying, a revoked-but-unexpired token still names
 * its account — the budget continues to follow the person, and the request is
 * still blocked downstream by the guard that enforces.
 *
 * The function is deliberately free of Nest imports so it can be unit-tested
 * directly (the repo's jest setup does not load the ESM-only @nestjs/common).
 *
 * @param cookies - The parsed cookies of the incoming request
 * @param tokens - The token service, for signature verification
 */
export function resolveSessionIdentity(
  cookies: unknown,
  tokens: Pick<TokenService, 'verifyAccess'>,
): SessionIdentity | undefined {
  const raw = (cookies as { access_token?: unknown } | undefined)?.access_token;

  if (typeof raw !== 'string' || raw === '') {
    return undefined;
  }

  let claims: AccessTokenClaims;
  try {
    claims = tokens.verifyAccess(raw);
  } catch {
    return undefined;
  }

  return {
    id: claims.sub,
    role: claims.role,
    emailVerified: claims.emailVerified,
    sessionId: claims.jti,
  };
}
