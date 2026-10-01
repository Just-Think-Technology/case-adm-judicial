import { forbidden, redirect } from 'next/navigation';
import Link from 'next/link';
import { ClientsPanel } from '@/components/clients-panel';
import { getSession } from '@/lib/session';

// Clients (§4.7/§4.15): administrators only, reached from the header instead
// of living as a panel tab.
export default async function ClientsPage(): Promise<React.ReactNode> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') forbidden();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/painel" className="text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700">
        ← VOLTAR
      </Link>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-navy-950">Clientes</h1>
      <p className="mt-2 text-navy-950/60">Credores com documentos nos processos.</p>
      <div className="mt-6">
        <ClientsPanel ownId={session.id} />
      </div>
    </div>
  );
}
