import { forbidden, notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ClientDocumentsManager } from '@/components/client-documents-manager';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { ClientDocuments } from '@/lib/types';

export const metadata = { title: 'Documentos do cliente — Portal do Credor' };

// One client's documents (§4.14): administrators only. Non-administrators get
// the 403 page; visitors are sent to login first.
export default async function ClientDocumentsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<React.ReactNode> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') forbidden();
  const { userId } = await params;
  let data: ClientDocuments | null = null;
  try {
    const upstream = await backendFetch(`/clients/${encodeURIComponent(userId)}/documents`, {
      cookie: (await cookies()).toString(),
    });
    if (upstream.status === 404) notFound();
    if (upstream.ok) data = (await upstream.json()) as ClientDocuments;
  } catch {
    data = null;
  }
  if (!data) notFound();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/painel" className="text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
        ← VOLTAR
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-navy-950">{data.user.name}</h1>
      <p className="mt-1 text-navy-950/60">{data.user.email}</p>
      <div className="mt-6">
        <ClientDocumentsManager initial={data} userId={userId} />
      </div>
    </div>
  );
}
