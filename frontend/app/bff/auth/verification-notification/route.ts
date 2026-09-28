import { proxyBackend } from '@/app/bff/_proxy';

export async function POST(request: Request): Promise<Response> {
  return proxyBackend('/auth/verification-notification', request);
}
