import { CompanyPanel } from '@/components/company-panel';
import { BackButton } from '@/components/back-button';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { CompanyCard } from '@/lib/types';


// Corporate panel (§4.7): RJ/Falência tabs for everyone, the Clientes tab and
// the card management menu for administrators. Data loads server-side; an
// outage renders a friendly message, never a stack.
export default async function PanelPage(): Promise<React.ReactNode> {
  const session = await getSession();
  const isAdmin = session?.role === 'ADMIN';
  let companies: CompanyCard[] | null = null;
  try {
    const upstream = await backendFetch('/companies');
    if (upstream.ok) companies = (await upstream.json()) as CompanyCard[];
  } catch {
    companies = null;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BackButton href="/" label="INÍCIO" />
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-navy-950">Painel corporativo</h1>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-navy-950/60">
          Processos de Recuperação Judicial e Falência, com os documentos públicos de cada empresa.
        </p>
        {isAdmin ? (
          <div className="flex shrink-0 gap-2">
            <a
              href="/empresas/nova"
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-600"
            >
              + Nova empresa
            </a>
            <a
              href="/clientes"
              className="rounded-lg bg-gold-500 px-4 py-2 text-sm font-bold text-navy-950 hover:bg-gold-600"
            >
              Clientes
            </a>
          </div>
        ) : null}
      </div>
      <div className="mt-6">
        {companies === null ? (
          <p role="alert" className="rounded-xl border border-navy-950/10 bg-white p-8 text-center text-navy-950/70">
            Não foi possível carregar as empresas agora. Tente novamente em instantes.
          </p>
        ) : (
          <CompanyPanel companies={companies} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
