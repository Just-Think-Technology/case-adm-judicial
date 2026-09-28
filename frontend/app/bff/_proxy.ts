import { NextResponse } from 'next/server';
import { backendFetch } from '@/lib/backend';

// Thin same-origin proxy: the browser calls /bff/*, we forward to the NestJS
// API (status + body preserved) and pass the session cookie through so auth
// keeps working once the login slice lands.
export async function proxyBackend(path: string, request: Request): Promise<NextResponse> {
  const incoming = new URL(request.url);
  let upstream: Response;
  try {
    upstream = await backendFetch(path, {
      searchParams: incoming.searchParams,
      cookie: request.headers.get('cookie'),
    });
  } catch {
    return NextResponse.json({ message: 'Serviço indisponível. Tente novamente.' }, { status: 502 });
  }
  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  });
}
