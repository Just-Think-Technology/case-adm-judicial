import { redirect } from 'next/navigation';
import { LandingPage, type FeaturedCase } from '@/components/landing-page';
import { backendFetch } from '@/lib/backend';
import { getSession } from '@/lib/session';
import type { CompanyCard } from '@/lib/types';

// Presentation page (§4.1): visitors see the landing, signed-in accounts are
// forwarded to the corporate panel instead. The hero features a live case —
// the first Recuperação Judicial, if any — so the subject is visible at once.
export default async function Home(): Promise<React.ReactNode> {
  if (await getSession()) redirect('/painel');
  let featured: FeaturedCase | undefined;
  try {
    const upstream = await backendFetch('/companies');
    if (upstream.ok) {
      const companies = (await upstream.json()) as CompanyCard[];
      const pick =
        companies.find((company) => company.nature === 'Recuperação Judicial') ?? companies[0];
      if (pick) {
        let documentCount = 0;
        try {
          const docs = await backendFetch(`/companies/${encodeURIComponent(pick.id)}/documents`);
          if (docs.ok) documentCount = ((await docs.json()) as unknown[]).length;
        } catch {
          documentCount = 0;
        }
        featured = {
          id: pick.id,
          name: pick.name,
          processNumber: pick.processNumber,
          nature: pick.nature,
          documentCount,
        };
      }
    }
  } catch {
    featured = undefined;
  }
  return <LandingPage featured={featured} />;
}
