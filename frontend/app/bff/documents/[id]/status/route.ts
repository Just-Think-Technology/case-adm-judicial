import { proxyBackend } from '@/app/bff/_proxy';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  return proxyBackend(`/documents/${encodeURIComponent(id)}/status`, request);
}
