'use client';

import { useMemo, useState } from 'react';
import { CompanyCard } from '@/components/company-card';
import type { CompanyCard as CompanyCardData, CompanyNature } from '@/lib/types';

const TABS: CompanyNature[] = ['Recuperação Judicial', 'Falência'];

const EMPTY_BY_NATURE: Record<CompanyNature, string> = {
  'Recuperação Judicial':
    'Nenhuma empresa encontrada — nenhuma empresa de Recuperação Judicial foi cadastrada ainda',
  Falência: 'Nenhuma empresa encontrada — nenhuma empresa em Falência foi cadastrada ainda',
};

// Visitor panel: nature tabs + instant search over name and process number.
// Filtering is client-side over the server-fetched list — instant while typing.
export function CompanyPanel({ companies }: { companies: CompanyCardData[] }): React.ReactNode {
  const [tab, setTab] = useState<CompanyNature>('Recuperação Judicial');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return companies.filter((company) => {
      if (company.nature !== tab) return false;
      if (!term) return true;
      return (
        company.name.toLowerCase().includes(term) || company.processNumber.toLowerCase().includes(term)
      );
    });
  }, [companies, tab, query]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Natureza do processo" className="flex gap-2">
          {TABS.map((nature) => (
            <button
              key={nature}
              role="tab"
              aria-selected={tab === nature}
              onClick={() => setTab(nature)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                tab === nature ? 'bg-navy-950 text-white' : 'bg-white text-navy-950 ring-1 ring-navy-950/15 hover:ring-gold-500'
              }`}
            >
              {nature}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-80">
          <span className="sr-only">Buscar por nome da empresa ou número do processo</span>
          <span aria-hidden className="pointer-events-none absolute top-2.5 left-3 text-navy-950/40">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por empresa ou processo…"
            className="w-full rounded-lg border border-navy-950/15 bg-white py-2 pr-3 pl-10 text-sm text-navy-950 placeholder:text-navy-950/40 focus:border-gold-500 focus:outline-none"
          />
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <p role="status" className="mt-6 rounded-xl border border-dashed border-navy-950/20 bg-white p-8 text-center text-navy-950/60">
          {query.trim()
            ? 'Nenhum resultado encontrado — tente buscar por outro termo'
            : EMPTY_BY_NATURE[tab]}
        </p>
      )}
    </div>
  );
}

function SearchIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3 3" strokeLinecap="round" />
    </svg>
  );
}
