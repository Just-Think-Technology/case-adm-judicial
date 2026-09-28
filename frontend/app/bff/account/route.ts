import { proxyBackend } from '@/app/bff/_proxy';

export async function GET(request: Request): Promise<Response> {
  return proxyBackend('/account', request);
}

export async function PATCH(request: Request): Promise<Response> {
  return proxyBackend('/account', request);
}
