import { proxyBackend } from '@/app/bff/_proxy';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return proxyBackend(`/companies/${encodeURIComponent(id)}/documents`, request);
}
