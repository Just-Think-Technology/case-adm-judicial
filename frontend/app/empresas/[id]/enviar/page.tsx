import { notFound, redirect } from 'next/navigation';
import { UploadWizard } from '@/components/upload-wizard';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { CompanyDetails } from '@/lib/types';

export const metadata = { title: 'Adicionar documento — Portal do Credor' };

// Upload screen (§4.9): the company is fixed from the page of origin and the
// destination requires login — visitors are sent to /login first.
export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactNode> {
  if (!(await getSession())) redirect('/login');
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
  return <UploadWizard companyId={company.id} companyName={company.name} />;
}
