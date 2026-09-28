import 'server-only';

// Server-side gateway to the NestJS API. Only the server (Server Components
// and /bff route handlers) talks to the backend; the browser only ever calls
// same-origin /bff URLs, so the httpOnly session cookie keeps flowing.
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3000';

export function backendUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}/api${normalized}`;
}

interface ForwardOptions {
  searchParams?: URLSearchParams;
  cookie?: string | null;
}

export async function backendFetch(path: string, options: ForwardOptions = {}): Promise<Response> {
  const url = backendUrl(path) + (options.searchParams?.size ? `?${options.searchParams}` : '');
  return fetch(url, {
    headers: options.cookie ? { cookie: options.cookie } : undefined,
    cache: 'no-store',
  });
}
