import { proxyBackend } from '@/app/bff/_proxy';

export async function GET(request: Request): Promise<Response> {
  return proxyBackend('/companies', request);
}

export async function POST(request: Request): Promise<Response> {
  return proxyBackend('/companies', request);
}
