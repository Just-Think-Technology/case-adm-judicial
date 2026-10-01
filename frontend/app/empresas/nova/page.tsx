import { forbidden, redirect } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { CompanyForm } from '@/components/company-form';
import { getSession } from '@/lib/session';


// Company registration (§4.8a): administrators only, reached from the header
// "Empresas" item. Everyone else gets the 403 page, never the form.
export default async function NewCompanyPage(): Promise<React.ReactNode> {
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.role !== 'ADMIN') forbidden();
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <BackButton href="/painel" />
      <h1 className="font-display mt-4 text-3xl font-semibold text-navy-950">Adicionar empresa</h1>
      <p className="mt-2 text-navy-950/60">Todos os campos são obrigatórios.</p>
      <CompanyForm />
    </div>
  );
}
