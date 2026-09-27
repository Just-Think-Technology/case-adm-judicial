// Throttler configuration — global limit, account-or-IP keying, PT-BR message

import { GLOBAL_LIMIT_PER_MINUTE, ONE_MINUTE_IN_MS, THROTTLED_MESSAGE } from './throttling.constants';
import { resolveClientIp } from './client-ip';

const ANONYMOUS_TRACKER = 'anonymous';

/**
 * Keying rule for every throttled route: the authenticated account when there is
 * a session, the source IP otherwise. Visitors have no account to throttle.
 *
 * The decision also asks for `POST /auth/login` to be keyed by IP **and** e-mail.
 * That route has no session yet, so it overrides `generateKey` with its own
 * decorator when it is implemented.
 *
 * @param req - The incoming request
 * @returns The account id, or the client IP for an unauthenticated caller
 */
export function getThrottleTracker(req: Record<string, unknown>): string {
  const user = req.user as { id?: unknown } | undefined;
  const userId = user?.id;

  if (typeof userId === 'string' && userId !== '') {
    return userId;
  }

  return resolveClientIp(req) ?? ANONYMOUS_TRACKER;
}

/**
 * Message returned when a limit is hit. A bare 429 tells the user nothing about
 * what to do, so the decision requires an actionable PT-BR message.
 */
export const throttledMessage = (): string => THROTTLED_MESSAGE;

/** Global per-IP ceiling, the baseline every route inherits. */
export const globalThrottler = {
  name: 'global',
  ttl: ONE_MINUTE_IN_MS,
  limit: GLOBAL_LIMIT_PER_MINUTE,
  getTracker: getThrottleTracker,
};
