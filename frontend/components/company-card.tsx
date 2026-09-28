import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { CompanyCard as CompanyCardData } from '@/lib/types';

// Panel card per §4.7: nature icon, name, process number, creation date and
// the ACESSAR button. Admin actions arrive in the admin slice.
export function CompanyCard({ company }: { company: CompanyCardData }): React.ReactNode {
  const isRJ = company.nature === 'Recuperação Judicial';
  return (
    <article
      data-testid="company-card"
      className="flex flex-col rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isRJ ? 'bg-navy-950 text-gold-500' : 'bg-gold-100 text-gold-600'}`}
        >
          {isRJ ? <BuildingIcon /> : <AlertIcon />}
        </span>
        <div className="min-w-0">
          <h3 className="font-display truncate text-lg font-semibold text-navy-950" title={company.name}>
            {company.name}
          </h3>
          <p className="text-sm text-navy-950/60">{company.processNumber}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-navy-950/50">Cadastrada em {formatDate(company.createdAt)}</p>
      <Link
        href={`/empresas/${company.id}`}
        className="mt-4 rounded-lg bg-navy-950 px-4 py-2 text-center text-sm font-semibold tracking-wide text-white hover:bg-navy-800"
      >
        ACESSAR
      </Link>
    </article>
  );
}

function BuildingIcon(): React.ReactNode {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="3" width="12" height="14" rx="1" />
      <path d="M7.5 6.5h1.5M11 6.5h1.5M7.5 9.5h1.5M11 9.5h1.5M7.5 12.5h1.5M11 12.5h1.5M9 17v-2h2v2" />
    </svg>
  );
}

function AlertIcon(): React.ReactNode {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M10 2.5 17.5 15.5h-15L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 7.5v3.5M10 13.2v.1" strokeLinecap="round" />
    </svg>
  );
}
