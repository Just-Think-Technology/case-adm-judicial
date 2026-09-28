import { NextResponse } from 'next/server';
import { backendUrl } from '@/lib/backend';

// Refresh cookie is scoped by the backend to /auth/refresh; through the BFF
// the browser only visits /bff/*, so the scope is translated on the way out.
// Without this the browser would never send the refresh cookie back.
const BACKEND_REFRESH_PATH = 'Path=/auth/refresh';
const BFF_REFRESH_PATH = 'Path=/bff/auth/refresh';

function translateSetCookie(value: string): string {
  return value.replace(BACKEND_REFRESH_PATH, BFF_REFRESH_PATH);
}

// Thin same-origin proxy: the browser calls /bff/*, we forward to the NestJS
// API (method + body + status preserved), pass the session cookie, the CSRF
// double-submit header and the real client IP through, and translate
// Set-Cookie scopes back to /bff/* on the way out.
export async function proxyBackend(path: string, request: Request): Promise<NextResponse> {
  const incoming = new URL(request.url);
  const headers = new Headers();
  for (const name of ['cookie', 'x-csrf-token', 'x-forwarded-for', 'content-type']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstream: Response;
  try {
    upstream = await fetch(
      backendUrl(path) + (incoming.search ? incoming.search : ''),
      {
        method: request.method,
        headers,
        // Streamed, never buffered: uploads ride the same proxy as JSON, and
        // a 60 MB file must not sit in Next.js memory first. `duplex` is an
        // undici extension missing from the DOM RequestInit — the spread keeps
        // the excess-property check from firing on a runtime-valid option.
        body: hasBody ? request.body : undefined,
        ...(hasBody ? { duplex: 'half' as const } : {}),
        cache: 'no-store',
      },
    );
  } catch {
    return NextResponse.json({ message: 'Serviço indisponível. Tente novamente.' }, { status: 502 });
  }
  const body = await upstream.text();
  const outgoing = new NextResponse(body, { status: upstream.status });
  const contentType = upstream.headers.get('content-type');
  if (contentType) outgoing.headers.set('content-type', contentType);
  for (const setCookie of upstream.headers.getSetCookie()) {
    outgoing.headers.append('set-cookie', translateSetCookie(setCookie));
  }
  return outgoing;
}
