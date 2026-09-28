import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicDocumentRow } from '@/components/public-document-row';
import { backendFetch } from '@/lib/backend';
import type { CompanyDetails, PublicDocument } from '@/lib/types';

function field(label: string, value: string | null): React.ReactNode {
  return (
    <div className="border-b border-navy-950/10 py-3 last:border-0">
      <p className="text-xs font-semibold tracking-wide text-navy-950/50 uppercase">{label}</p>
      <p className="mt-1 text-sm text-navy-950">{value?.trim() ? value : 'Não informado'}</p>
    </div>
  );
}

// Company page (§4.8d, visitor variant): case data block + public documents.
// Unauthenticated visitors see no filter and no action buttons; sending
// documents requires login, so the button points at /login until slice 2.
export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactNode> {
  const { id } = await params;
  let company: CompanyDetails | null = null;
  let documents: PublicDocument[] | null = null;
  try {
    const [companyUpstream, documentsUpstream] = await Promise.all([
      backendFetch(`/companies/${encodeURIComponent(id)}`),
      backendFetch(`/companies/${encodeURIComponent(id)}/documents`),
    ]);
    if (companyUpstream.status === 404) notFound();
    if (companyUpstream.ok) company = (await companyUpstream.json()) as CompanyDetails;
    if (documentsUpstream.ok) documents = (await documentsUpstream.json()) as PublicDocument[];
  } catch {
    company = null;
  }
  if (!company) notFound();

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
          <div className="mt-4 rounded-lg bg-gold-100 p-4">
            <p className="text-xs font-semibold tracking-wide text-gold-600 uppercase">OBS/AVISOS</p>
            <p className="mt-1 text-sm text-navy-950">
              {company.observations?.trim() ? company.observations : 'Nenhum aviso disponível.'}
            </p>
          </div>
          <Link
            href="/login"
            className="mt-5 block rounded-lg bg-navy-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-navy-800"
          >
            ENVIAR DOCUMENTOS
          </Link>
        </aside>

        <section aria-label="Documentos públicos">
          <h2 className="font-display text-xl font-semibold text-navy-950">Documentos públicos</h2>
          {documents === null ? (
            <p role="alert" className="mt-4 rounded-xl border border-navy-950/10 bg-white p-6 text-navy-950/70">
              Não foi possível carregar os documentos agora. Tente novamente em instantes.
            </p>
          ) : documents.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {documents.map((document) => (
                <PublicDocumentRow key={document.id} document={document} />
              ))}
            </ul>
          ) : (
            <p role="status" className="mt-4 rounded-xl border border-dashed border-navy-950/20 bg-white p-6 text-center text-navy-950/60">
              Nenhum documento encontrado para essa empresa.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
