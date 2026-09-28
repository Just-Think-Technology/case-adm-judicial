import { afterEach, describe, expect, it, vi } from 'vitest';

// server-only is a build-time guard for Client Components; under vitest every
// module is "client", so the guard is stubbed to test the proxy logic itself.
vi.mock('server-only', () => ({}));

import { proxyBackend } from '@/app/bff/_proxy';

afterEach(() => {
  vi.unstubAllGlobals();
});

function backendOk(payload: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    ),
  );
}

describe('proxyBackend', () => {
  it('forwards status and body from the backend', async () => {
    backendOk([{ id: 'c1' }]);
    const response = await proxyBackend('/companies', new Request('http://test/bff/companies'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: 'c1' }]);
  });

  it('preserves backend error statuses', async () => {
    backendOk({ message: 'Não encontrado.' }, 404);
    const response = await proxyBackend('/companies/missing', new Request('http://test/bff/companies/missing'));
    expect(response.status).toBe(404);
  });

  it('forwards the session cookie to the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', fetchMock);
    await proxyBackend(
      '/companies',
      new Request('http://test/bff/companies', { headers: { cookie: 'session=abc' } }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const forwarded = init.headers instanceof Headers ? init.headers.get('cookie') : undefined;
    expect(forwarded).toBe('session=abc');
  });

  it('answers 204 with an empty body instead of crashing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    const response = await proxyBackend('/companies/c1', new Request('http://test/bff/companies/c1', { method: 'DELETE' }));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });

  it('forwards the CSRF token and the client IP', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetchMock);
    await proxyBackend(
      '/auth/login',
      new Request('http://test/bff/auth/login', {
        method: 'POST',
        headers: { 'x-csrf-token': 'csrf-123', 'x-forwarded-for': '203.0.113.7' },
      }),
    );
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/auth/login');
    const forwarded = init.headers as Headers;
    expect(forwarded.get('x-csrf-token')).toBe('csrf-123');
    expect(forwarded.get('x-forwarded-for')).toBe('203.0.113.7');
  });

  it('translates the refresh-cookie scope back to /bff/*', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('{}', {
          headers: [
            ['set-cookie', 'access_token=aaa; Path=/'],
            ['set-cookie', 'refresh_token=rrr; Path=/auth/refresh'],
          ],
        }),
      ),
    );
    const response = await proxyBackend('/auth/login', new Request('http://test/bff/auth/login'));
    expect(response.headers.getSetCookie()).toEqual([
      'access_token=aaa; Path=/',
      'refresh_token=rrr; Path=/bff/auth/refresh',
    ]);
  });

  it('answers 502 in Portuguese when the backend is down', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
    );
    const response = await proxyBackend('/companies', new Request('http://test/bff/companies'));
    expect(response.status).toBe(502);
    expect(((await response.json()) as { message: string }).message).toMatch(/indisponível/i);
  });
});
