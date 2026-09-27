// Login throttle key — brute-force budget is per IP and per e-mail

import type { ExecutionContext } from '@nestjs/common';

/**
 * Builds the throttle key for the login route. The global tracker keys by
 * account-or-IP, but login has no session yet — and keying by IP alone would
 * let one attacker burn the budget of every user behind the same NAT. Adding
 * the normalized e-mail gives each account its own budget on a shared address.
 *
 * @param context - The execution context of the login request
 * @param tracker - The shared tracker string (account id or source IP)
 * @returns A stable key namespaced to the login route
 */
export function buildLoginThrottleKey(context: ExecutionContext, tracker: string): string {
  const request = context.switchToHttp().getRequest();
  const raw = request?.body?.email;
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';

  return `login:${tracker}:${email === '' ? 'unknown' : email}`;
}
