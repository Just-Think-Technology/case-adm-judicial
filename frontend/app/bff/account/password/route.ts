import { proxyBackend } from '@/app/bff/_proxy';

export async function PATCH(request: Request): Promise<Response> {
  return proxyBackend('/account/password', request);
}
