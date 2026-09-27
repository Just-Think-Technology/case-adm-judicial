// Throttler keying and client IP resolution

import { GLOBAL_LIMIT_PER_MINUTE, ONE_MINUTE_IN_MS } from './throttling.constants';
import { getThrottleTracker, defaultThrottler } from './throttler.config';
import { resolveClientIp } from './client-ip';

describe('resolveClientIp', () => {
  it('reads the left-most X-Forwarded-For entry, the original client', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.7, 172.20.0.4' } };

    expect(resolveClientIp(req)).toBe('203.0.113.7');
  });

  it('trims surrounding whitespace', () => {
    const req = { headers: { 'x-forwarded-for': '  203.0.113.7 , 172.20.0.4 ' } };

    expect(resolveClientIp(req)).toBe('203.0.113.7');
  });

  it('accepts the header arriving as an array', () => {
    const req = { headers: { 'x-forwarded-for': ['203.0.113.7', '172.20.0.4'] } };

    expect(resolveClientIp(req)).toBe('203.0.113.7');
  });

  it('returns undefined when the header is absent', () => {
    expect(resolveClientIp({ headers: {} })).toBeUndefined();
  });

  it('returns undefined for an empty header instead of an empty key', () => {
    expect(resolveClientIp({ headers: { 'x-forwarded-for': '   ' } })).toBeUndefined();
  });

  it('returns undefined when there are no headers at all', () => {
    expect(resolveClientIp({})).toBeUndefined();
  });
});

describe('getThrottleTracker', () => {
  it('keys by the account when a session exists', () => {
    const req = {
      user: { id: 'clx123' },
      headers: { 'x-forwarded-for': '203.0.113.7' },
    };

    expect(getThrottleTracker(req)).toBe('clx123');
  });

  it('keys by IP for a visitor with no account', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.7' } };

    expect(getThrottleTracker(req)).toBe('203.0.113.7');
  });

  it('falls back to a shared bucket when no address can be resolved', () => {
    expect(getThrottleTracker({ headers: {} })).toBe('anonymous');
  });

  it('ignores a session without a usable id', () => {
    const req = { user: {}, headers: { 'x-forwarded-for': '203.0.113.7' } };

    expect(getThrottleTracker(req)).toBe('203.0.113.7');
  });
});

describe('defaultThrottler', () => {
  it('is 100 requests per minute, the documented baseline', () => {
    expect(defaultThrottler.limit).toBe(GLOBAL_LIMIT_PER_MINUTE);
    expect(defaultThrottler.ttl).toBe(ONE_MINUTE_IN_MS);
  });

  it('uses the shared keying rule', () => {
    expect(defaultThrottler.getTracker).toBe(getThrottleTracker);
  });

  it('is named default, the only name per-route overrides resolve against', () => {
    expect(defaultThrottler.name).toBe('default');
  });
});
