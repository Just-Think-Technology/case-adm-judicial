'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatDate } from '@/lib/format';
import { bffSend } from '@/lib/bff-client';
import { notifyToast } from '@/lib/toast';
import type { ClientItem, ClientList } from '@/lib/types';

// Clients tab (§4.7, admin only): general search plus company-name search act
// together, cards show role seal and up to three company tags, removal spares
// the admin's own card and every removal asks first.
export function ClientsPanel({ ownId }: { ownId: string }): React.ReactNode {
  const [query, setQuery] = useState('');
  const [companyQuery, setCompanyQuery] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<ClientList | null>(null);
  const [failed, setFailed] = useState(false);
  const [removing, setRemoving] = useState<ClientItem | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (query.trim()) params.set('search', query.trim());
      if (companyQuery.trim()) params.set('company', companyQuery.trim());
      const response = await fetch(`/bff/clients?${params}`);
      if (!response.ok) {
        setList(null);
        setFailed(true);
        return;
      }
      setList((await response.json()) as ClientList);
    } catch {
      setList(null);
      setFailed(true);
    }
  }, [query, companyQuery, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(): Promise<void> {
    if (!removing) return;
    setBusy(true);
    const result = await bffSend('DELETE', `/bff/clients/${removing.id}`);
    setBusy(false);
    if (result.status === 204) {
      setRemoving(null);
      notifyToast('success', `Cliente '${removing.name}' foi removido(a) com sucesso!`);
      void load();
    } else {
      notifyToast('error', result.message);
    }
  }

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative block">
          <span className="sr-only">Buscar por nome ou e-mail do cliente</span>
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nome ou e-mail…"
            className="w-full rounded-lg border border-navy-950/15 bg-paper-50 px-3 py-2 text-sm text-navy-950 placeholder:text-navy-950/40 focus:border-gold-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="sr-only">Buscar pelo nome da empresa</span>
          <input
            type="search"
            value={companyQuery}
            onChange={(event) => {
              setCompanyQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar pelo nome da empresa…"
            className="w-full rounded-lg border border-navy-950/15 bg-paper-50 px-3 py-2 text-sm text-navy-950 placeholder:text-navy-950/40 focus:border-gold-500 focus:outline-none"
          />
        </label>
      </div>

      {failed ? (
        <p role="alert" className="mt-4 rounded-xl border border-navy-950/10 bg-white p-8 text-center text-navy-950/70">
          Não foi possível carregar os clientes agora. Tente novamente em instantes.
        </p>
      ) : list === null ? (
        <p className="mt-4 rounded-xl border border-navy-950/10 bg-white p-8 text-center text-navy-950/50">
          Carregando clientes…
        </p>
      ) : list.items.length > 0 ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.items.map((client) => (
              <article key={client.id} data-testid="client-card" className="relative flex flex-col rounded-xl border border-navy-950/10 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display truncate text-base font-semibold text-navy-950" title={client.name}>
                      {client.name}
                    </h3>
                    <p className="truncate text-xs text-navy-950/60">{client.email}</p>
                  </div>
                  {client.id === ownId ? null : (
                    <details className="relative shrink-0">
                      <summary aria-label={`Opções de ${client.name}`} className="cursor-pointer list-none rounded px-2 py-1 text-xl leading-none text-navy-950/60 hover:bg-mist-50 hover:text-navy-950">
                        ⋮
                      </summary>
                      <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-navy-950/10 bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          onClick={() => setRemoving(client)}
                          className="block w-full rounded px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                          REMOVER
                        </button>
                      </div>
                    </details>
                  )}
                </div>
                <p className="mt-2">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${client.role === 'ADMIN' ? 'bg-navy-950 text-gold-500 ring-navy-950' : 'bg-mist-50 text-navy-950/70 ring-navy-950/10'}`}>
                    {client.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
                  </span>
                </p>
                <p className="mt-2 text-xs text-navy-950/50">Desde {formatDate(client.createdAt)}</p>
                {client.companies.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Empresas com documentos">
                    {client.companies.slice(0, 3).map((company) => (
                      <span key={company.id} className="rounded bg-gold-100 px-2 py-0.5 text-xs font-semibold text-navy-950">
                        {company.name} ({company.nature === 'Recuperação Judicial' ? 'RJ' : 'Fal.'})
                      </span>
                    ))}
                    {client.totalCompanies > 3 ? (
                      <span className="rounded bg-mist-50 px-2 py-0.5 text-xs font-semibold text-navy-950/60">
                        +{client.totalCompanies - 3} mais
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-auto pt-3">
                  <Link
                    href={`/clientes/${client.id}`}
                    className="block rounded-lg bg-navy-950 px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white hover:bg-navy-800"
                  >
                    ACESSAR
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {list.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-500 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-navy-950/60">
                Página {list.page} de {list.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= list.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-500 disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p role="status" className="mt-6 rounded-xl border border-dashed border-navy-950/20 bg-white p-8 text-center text-navy-950/60">
          {query.trim() || companyQuery.trim()
            ? 'Nenhum resultado encontrado. Tente buscar por outro termo'
            : 'Nenhum cliente encontrado. Nenhum cliente foi cadastrado ainda'}
        </p>
      )}
      {removing ? (
        <ConfirmDialog
          title="Remover cliente"
          message={`Tem certeza que deseja remover '${removing.name}'? Todos os documentos enviados por esse cliente são removidos junto e não há como desfazer.`}
          confirmLabel="REMOVER"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setRemoving(null)}
        />
      ) : null}
    </div>
  );
}
