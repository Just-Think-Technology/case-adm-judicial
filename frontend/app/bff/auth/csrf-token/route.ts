import { proxyBackend } from '@/app/bff/_proxy';

export async function GET(request: Request): Promise<Response> {
  return proxyBackend('/auth/csrf-token', request);
}
