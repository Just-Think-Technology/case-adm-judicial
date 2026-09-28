import { proxyBackend } from '@/app/bff/_proxy';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const { userId } = await params;
  return proxyBackend(`/clients/${encodeURIComponent(userId)}`, request);
}
