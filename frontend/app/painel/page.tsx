import { CompanyPanel } from '@/components/company-panel';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { CompanyCard } from '@/lib/types';

export const metadata = { title: 'Painel corporativo | Portal do Credor' };

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
      <h1 className="font-display text-4xl font-semibold tracking-tight text-navy-950">Painel corporativo</h1>
      <p className="mt-2 text-navy-950/60">
        Processos de Recuperação Judicial e Falência, com os documentos públicos de cada empresa.
      </p>
      <div className="mt-6">
        {companies === null ? (
          <p role="alert" className="rounded-xl border border-navy-950/10 bg-white p-8 text-center text-navy-950/70">
            Não foi possível carregar as empresas agora. Tente novamente em instantes.
          </p>
        ) : (
          <CompanyPanel companies={companies} isAdmin={isAdmin} ownId={session?.id ?? ''} />
        )}
      </div>
    </div>
  );
}
