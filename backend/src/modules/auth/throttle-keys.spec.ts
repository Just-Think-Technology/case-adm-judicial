// Login throttle key — brute-force budget is per IP and per e-mail

import { buildLoginThrottleKey } from './throttle-keys';

function contextWith(body: unknown, tracker: string) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ body }) }),
  } as never;
}

describe('buildLoginThrottleKey', () => {
  it('keys by tracker and normalized e-mail', () => {
    expect(buildLoginThrottleKey(contextWith({ email: 'Credor@Case.COM ' }, '203.0.113.7'), '203.0.113.7')).toBe(
      'login:203.0.113.7:credor@case.com',
    );
  });

  it('separates budgets per e-mail on the same IP', () => {
    const first = buildLoginThrottleKey(contextWith({ email: 'a@case.com' }, '203.0.113.7'), '203.0.113.7');
    const second = buildLoginThrottleKey(contextWith({ email: 'b@case.com' }, '203.0.113.7'), '203.0.113.7');

    expect(first).not.toBe(second);
  });

  it('separates budgets per IP for the same e-mail', () => {
    const first = buildLoginThrottleKey(contextWith({ email: 'a@case.com' }, '203.0.113.7'), '203.0.113.7');
    const second = buildLoginThrottleKey(contextWith({ email: 'a@case.com' }, '198.51.100.9'), '198.51.100.9');

    expect(first).not.toBe(second);
  });

  it('falls back to a stable bucket when the body carries no e-mail', () => {
    expect(buildLoginThrottleKey(contextWith({}, '203.0.113.7'), '203.0.113.7')).toBe(
      'login:203.0.113.7:unknown',
    );
  });
});
