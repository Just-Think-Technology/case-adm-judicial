// Security headers — the CSP policy every backend response carries

import helmet from 'helmet';
import { getSecurityHeaders } from './security-headers';

/**
 * Runs the Helmet middleware over a fake exchange and returns the headers it set,
 * which is the only way to observe the policy that actually reaches a client.
 */
function headersFor(options: Parameters<typeof helmet>[0]): Record<string, string> {
  const headers: Record<string, string> = {};
  const req = { headers: {}, socket: {} };
  const res = {
    setHeader: (key: string, value: string) => {
      headers[key.toLowerCase()] = value;
    },
    getHeader: (key: string) => headers[key.toLowerCase()],
    removeHeader: (key: string) => {
      delete headers[key.toLowerCase()];
    },
  };

  helmet(options)(req as never, res as never, () => undefined);

  return headers;
}

describe('getSecurityHeaders', () => {
  const production = headersFor(getSecurityHeaders(true));

  it('locks the framing down, the documented DENY', () => {
    expect(production['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(production['x-frame-options']).toBe('DENY');
  });

  it('refuses objects and restricts scripts to the same origin', () => {
    expect(production['content-security-policy']).toContain("object-src 'none'");
    expect(production['content-security-policy']).toContain("script-src 'self'");
  });

  it('keeps unsafe-eval and unsafe-inline out of script-src', () => {
    const policy = production['content-security-policy'] ?? '';
    const scriptSrc = policy.split(';').find((d) => d.trim().startsWith('script-src'));

    expect(scriptSrc).toBe("script-src 'self'");
    expect(scriptSrc).not.toContain('unsafe-eval');
    expect(scriptSrc).not.toContain('unsafe-inline');
  });

  it('allows inline styles, the one documented exception', () => {
    expect(production['content-security-policy']).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('confines connections to the gateway origin', () => {
    expect(production['content-security-policy']).toContain("connect-src 'self'");
  });

  it('sets the documented referrer and nosniff', () => {
    expect(production['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(production['x-content-type-options']).toBe('nosniff');
  });

  it('sends HSTS for a year with subdomains in production', () => {
    expect(production['strict-transport-security']).toContain('max-age=31536000');
    expect(production['strict-transport-security']).toContain('includeSubDomains');
  });

  it('omits HSTS in development so plain HTTP localhost keeps working', () => {
    const development = headersFor(getSecurityHeaders(false));

    expect(development['strict-transport-security']).toBeUndefined();
  });

  it('keeps the CSP itself in development — only HSTS is conditional', () => {
    const development = headersFor(getSecurityHeaders(false));

    expect(development['content-security-policy']).toContain("script-src 'self'");
    expect(development['x-frame-options']).toBe('DENY');
  });
});
