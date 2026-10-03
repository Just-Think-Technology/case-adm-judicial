import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdminDocuments } from '@/components/admin-documents';
import { CompanyDocuments } from '@/components/company-documents';
import { ObservationsBox } from '@/components/observations-box';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { CompanyDetails } from '@/lib/types';

function field(label: string, value: string | null): React.ReactNode {
  return (
    <div className="border-b border-navy-950/10 py-3 last:border-0">
      <p className="text-xs font-semibold tracking-wide text-navy-950/50 uppercase">{label}</p>
      <p className="mt-1 text-sm text-navy-950">{value?.trim() ? value : 'Não informado'}</p>
    </div>
  );
}

// Company page (§4.8d): case data block plus the document list. Signed-in
// creditors get the scope filter with status on their own documents and the
// direct upload entry; visitors keep the public variant with login as gateway.
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactNode> {
  const { id } = await params;
  let company: CompanyDetails | null = null;
  try {
    const upstream = await backendFetch(`/companies/${encodeURIComponent(id)}`);
    if (upstream.status === 404) notFound();
    if (upstream.ok) company = (await upstream.json()) as CompanyDetails;
  } catch {
    company = null;
  }
  if (!company) notFound();
  const session = await getSession();
  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/painel" className="text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
        ← VOLTAR
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-navy-950">{company.name}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="h-fit rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm" aria-label="Dados do processo">
          {field('Número do processo', company.processNumber)}
          {field('Administrador Judicial', company.judicialAdmin)}
          {field('Vara', company.comarca)}
          {field('Juiz de Direito', company.judge)}
          {field('Protocolo', company.protocolDate)}
          <ObservationsBox text={company.observations} />
          <Link
            href={session ? `/empresas/${company.id}/enviar` : '/login'}
            className="mt-5 block rounded-lg bg-navy-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-navy-800"
          >
            ENVIAR DOCUMENTOS
          </Link>
        </aside>

        {isAdmin ? (
          <AdminDocuments companyId={company.id} />
        ) : (
          <CompanyDocuments companyId={company.id} authed={session !== null} />
        )}
      </div>
    </div>
  );
}
