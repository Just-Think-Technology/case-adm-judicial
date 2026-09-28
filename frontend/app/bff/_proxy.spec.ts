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
    expect((init.headers as Record<string, string>).cookie).toBe('session=abc');
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
