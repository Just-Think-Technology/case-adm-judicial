import { NextResponse } from 'next/server';
import { backendUrl } from '@/lib/backend';

// Streams a public document file to the visitor. Headers pass through so the
// browser keeps the backend's inline/attachment decision and file name.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  let upstream: Response;
  try {
    upstream = await fetch(backendUrl(`/documents/${encodeURIComponent(id)}/content`), {
      headers: request.headers.get('cookie') ? { cookie: request.headers.get('cookie')! } : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Serviço indisponível. Tente novamente.' }, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    const body = await upstream.text().catch(() => '');
    return new NextResponse(body, { status: upstream.status });
  }
  const headers = new Headers();
  for (const name of ['content-type', 'content-disposition', 'content-length']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new NextResponse(upstream.body, { status: upstream.status, headers });
}
