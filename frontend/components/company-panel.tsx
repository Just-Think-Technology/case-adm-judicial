'use client';

import { useMemo, useState } from 'react';
import { CompanyCard } from '@/components/company-card';
import { notifyToast } from '@/lib/toast';
import type { CompanyCard as CompanyCardData, CompanyNature } from '@/lib/types';

const COMPANY_TABS: Array<CompanyNature | 'Todas'> = ['Todas', 'Recuperação Judicial', 'Falência'];

const EMPTY_BY_NATURE: Record<CompanyNature | 'Todas', string> = {
  Todas: 'Nenhuma empresa cadastrada ainda',
  'Recuperação Judicial': 'Nenhuma empresa de Recuperação Judicial cadastrada ainda',
  Falência: 'Nenhuma empresa em Falência cadastrada ainda',
};

type Sort =
  | { by: 'name'; dir: 'az' | 'za' }
  | { by: 'date'; dir: 'new' | 'old' };

// Company panel: nature tabs (including all), instant search, and two sort
// controls sharing one active criterion — touching one moves the other back
// to its caption, so they never fight over the order.
export function CompanyPanel({
  companies,
  isAdmin = false,
}: {
  companies: CompanyCardData[];
  isAdmin?: boolean;
}): React.ReactNode {
  const [tab, setTab] = useState<CompanyNature | 'Todas'>('Todas');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState(companies);
  const [sort, setSort] = useState<Sort>({ by: 'name', dir: 'az' });

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = items.filter((company) => {
      if (tab !== 'Todas' && company.nature !== tab) return false;
      if (!term) return true;
      return (
        company.name.toLowerCase().includes(term) || company.processNumber.toLowerCase().includes(term)
      );
    });
    const sorted = [...filtered];
    if (sort.by === 'name') {
      sorted.sort((a, b) =>
        sort.dir === 'az' ? a.name.localeCompare(b.name, 'pt-BR') : b.name.localeCompare(a.name, 'pt-BR'),
      );
    } else {
      sorted.sort((a, b) =>
        sort.dir === 'new'
          ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
          : Date.parse(a.createdAt) - Date.parse(b.createdAt),
      );
    }
    return sorted;
  }, [items, tab, query, sort]);

  function removed(id: string, name: string): void {
    setItems((current) => current.filter((company) => company.id !== id));
    notifyToast('success', `Empresa '${name}' foi removido(a) com sucesso!`);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
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
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm text-navy-950/70">
            Nome
            <select
              aria-label="Ordenar por nome"
              value={sort.by === 'name' ? sort.dir : ''}
              onChange={(event) => setSort({ by: 'name', dir: event.target.value as 'az' | 'za' })}
              className="rounded-lg border border-navy-950/15 bg-white px-2 py-2 text-sm font-semibold text-navy-950 focus:border-gold-500 focus:outline-none"
            >
              <option value="" disabled>
                Nome…
              </option>
              <option value="az">A–Z</option>
              <option value="za">Z–A</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-navy-950/70">
            Data
            <select
              aria-label="Ordenar por data de criação"
              value={sort.by === 'date' ? sort.dir : ''}
              onChange={(event) => setSort({ by: 'date', dir: event.target.value as 'new' | 'old' })}
              className="rounded-lg border border-navy-950/15 bg-white px-2 py-2 text-sm font-semibold text-navy-950 focus:border-gold-500 focus:outline-none"
            >
              <option value="" disabled>
                Data…
              </option>
              <option value="new">Mais recentes</option>
              <option value="old">Mais antigas</option>
            </select>
          </label>
          <label className="relative block sm:w-72">
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
      </div>

      {visible.length > 0 ? (
        <>
          <p className="mt-5 text-sm text-navy-950/55" role="status">
            {visible.length} {visible.length === 1 ? 'processo' : 'processos'}
            {tab === 'Todas' ? '' : ` em ${tab}`}
          </p>
          <div className="mt-3 grid gap-5 sm:grid-cols-2">
            {visible.map((company) => (
              <CompanyCard key={company.id} company={company} isAdmin={isAdmin} onRemoved={removed} />
            ))}
          </div>
        </>
      ) : (
        <p role="status" className="mt-6 rounded-xl border border-dashed border-navy-950/20 bg-white p-8 text-center text-navy-950/60">
          {query.trim()
            ? 'Nenhum resultado encontrado. Tente buscar por outro termo'
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
