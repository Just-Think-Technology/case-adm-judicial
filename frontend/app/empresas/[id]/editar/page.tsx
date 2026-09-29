import { forbidden, notFound, redirect } from 'next/navigation';
import { CompanyForm } from '@/components/company-form';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { CompanyDetails } from '@/lib/types';

export const metadata = { title: 'Editar empresa | Portal do Credor' };

// Company editing (§4.8b): the same form as registration, prefilled, with the
// button turned SALVAR. Same guards as creation.
export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactNode> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') forbidden();
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
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-navy-950">Editar empresa</h1>
      <p className="mt-2 text-navy-950/60">Todos os campos são obrigatórios.</p>
      <CompanyForm initial={company} />
    </div>
  );
}
