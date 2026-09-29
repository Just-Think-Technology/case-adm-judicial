'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClientsPanel } from '@/components/clients-panel';
import { CompanyCard } from '@/components/company-card';
import type { CompanyCard as CompanyCardData, CompanyNature } from '@/lib/types';

const COMPANY_TABS: CompanyNature[] = ['Recuperação Judicial', 'Falência'];

const EMPTY_BY_NATURE: Record<CompanyNature, string> = {
  'Recuperação Judicial':
    'Nenhuma empresa encontrada — nenhuma empresa de Recuperação Judicial foi cadastrada ainda',
  Falência: 'Nenhuma empresa encontrada — nenhuma empresa em Falência foi cadastrada ainda',
};

type Tab = CompanyNature | 'Clientes';

// Visitor panel: nature tabs + instant search over name and process number.
// Administrators also get the Clientes tab and the per-card management menu.
export function CompanyPanel({
  companies,
  isAdmin = false,
  ownId = '',
}: {
  companies: CompanyCardData[];
  isAdmin?: boolean;
  ownId?: string;
}): React.ReactNode {
  const [tab, setTab] = useState<Tab>('Recuperação Judicial');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(companies);
  const [notice, setNotice] = useState('');

  const visible = useMemo(() => {
    if (tab === 'Clientes') return [];
    const term = query.trim().toLowerCase();
    return items.filter((company) => {
      if (company.nature !== tab) return false;
      if (!term) return true;
      return (
        company.name.toLowerCase().includes(term) || company.processNumber.toLowerCase().includes(term)
      );
    });
  }, [items, tab, query]);

  function removed(id: string, name: string): void {
    setItems((current) => current.filter((company) => company.id !== id));
    setNotice(`Empresa '${name}' foi removido(a) com sucesso!`);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Natureza do processo" className="flex flex-wrap gap-2">
          {COMPANY_TABS.map((nature) => (
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
          {isAdmin ? (
            <button
              role="tab"
              aria-selected={tab === 'Clientes'}
              onClick={() => setTab('Clientes')}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                tab === 'Clientes' ? 'bg-navy-950 text-white' : 'bg-white text-navy-950 ring-1 ring-navy-950/15 hover:ring-gold-500'
              }`}
            >
              Clientes
            </button>
          ) : null}
        </div>
        {tab === 'Clientes' ? null : (
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
        )}
      </div>

      {isAdmin && tab !== 'Clientes' ? (
        <div className="mt-4">
          <Link
            href="/empresas/nova"
            className="inline-block rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-gold-600"
          >
            + Nova empresa
          </Link>
        </div>
      ) : null}

      {notice ? (
        <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
          {notice}
        </p>
      ) : null}

      {tab === 'Clientes' ? (
        <div className="mt-6">
          <ClientsPanel ownId={ownId} />
        </div>
      ) : visible.length > 0 ? (
        <>
          <p className="mt-5 text-sm text-navy-950/55" role="status">
            {visible.length} {visible.length === 1 ? 'processo' : 'processos'} em {tab}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((company) => (
              <CompanyCard key={company.id} company={company} isAdmin={isAdmin} onRemoved={removed} />
            ))}
          </div>
        </>
      ) : (
        <p role="status" className="mt-6 rounded-xl border border-dashed border-navy-950/20 bg-white p-8 text-center text-navy-950/60">
          {query.trim()
            ? 'Nenhum resultado encontrado — tente buscar por outro termo'
            : EMPTY_BY_NATURE[tab as CompanyNature]}
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
