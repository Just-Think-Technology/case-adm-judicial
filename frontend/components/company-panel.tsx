'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ClientsPanel } from '@/components/clients-panel';
import { CompanyCard } from '@/components/company-card';
import { notifyToast } from '@/lib/toast';
import type { CompanyCard as CompanyCardData, CompanyNature } from '@/lib/types';

const COMPANY_TABS: CompanyNature[] = ['Recuperação Judicial', 'Falência'];

const EMPTY_BY_NATURE: Record<CompanyNature, string> = {
  'Recuperação Judicial':
    'Nenhuma empresa encontrada. Nenhuma empresa de Recuperação Judicial foi cadastrada ainda',
  Falência: 'Nenhuma empresa encontrada. Nenhuma empresa em Falência foi cadastrada ainda',
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
  const [nameOrder, setNameOrder] = useState<'all' | 'az' | 'za'>('all');
  const [dateOrder, setDateOrder] = useState<'all' | 'new' | 'old'>('all');

  const visible = useMemo(() => {
    if (tab === 'Clientes') return [];
    const term = query.trim().toLowerCase();
    const filtered = items.filter((company) => {
      if (company.nature !== tab) return false;
      if (!term) return true;
      return (
        company.name.toLowerCase().includes(term) || company.processNumber.toLowerCase().includes(term)
      );
    });
    // A single active criterion: touching one select resets the other, so the
    // two filters never fight over the order.
    const sorted = [...filtered];
    if (nameOrder !== 'all') {
      sorted.sort((a, b) =>
        nameOrder === 'az' ? a.name.localeCompare(b.name, 'pt-BR') : b.name.localeCompare(a.name, 'pt-BR'),
      );
    } else if (dateOrder !== 'all') {
      sorted.sort((a, b) =>
        dateOrder === 'new'
          ? Date.parse(b.createdAt) - Date.parse(a.createdAt)
          : Date.parse(a.createdAt) - Date.parse(b.createdAt),
      );
    }
    return sorted;
  }, [items, tab, query, nameOrder, dateOrder]);

  function removed(id: string, name: string): void {
    setItems((current) => current.filter((company) => company.id !== id));
    notifyToast('success', `Empresa '${name}' foi removido(a) com sucesso!`);
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
          <div className="flex flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 text-sm text-navy-950/70">
              Nome
              <select
                aria-label="Ordenar por nome"
                value={nameOrder}
                onChange={(event) => {
                  setNameOrder(event.target.value as 'all' | 'az' | 'za');
                  setDateOrder('all');
                }}
                className="rounded-lg border border-navy-950/15 bg-white px-2 py-2 text-sm font-semibold text-navy-950 focus:border-gold-500 focus:outline-none"
              >
                <option value="all">Padrão</option>
                <option value="az">A–Z</option>
                <option value="za">Z–A</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-navy-950/70">
              Data
              <select
                aria-label="Ordenar por data de criação"
                value={dateOrder}
                onChange={(event) => {
                  setDateOrder(event.target.value as 'all' | 'new' | 'old');
                  setNameOrder('all');
                }}
                className="rounded-lg border border-navy-950/15 bg-white px-2 py-2 text-sm font-semibold text-navy-950 focus:border-gold-500 focus:outline-none"
              >
                <option value="all">Padrão</option>
                <option value="new">Mais recentes</option>
                <option value="old">Mais antigas</option>
              </select>
            </label>
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
            ? 'Nenhum resultado encontrado. Tente buscar por outro termo'
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
