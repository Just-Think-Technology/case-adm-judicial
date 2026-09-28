'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { StatusSeal } from '@/components/status-seal';
import { formatDate } from '@/lib/format';
import { bffSend } from '@/lib/bff-client';
import type { ClientDocuments } from '@/lib/types';

const STATUSES = ['Em análise', 'Deferido', 'Indeferido'] as const;

// One client's documents (§4.14, Fluxo 2): real totals on top, a status picker
// per row, and a single SALVAR ALTERAÇÕES that persists every change at once.
// Rows arrive server-rendered for page one; paging continues through the BFF.
export function ClientDocumentsManager({ initial, userId }: { initial: ClientDocuments; userId: string }): React.ReactNode {
  const [data, setData] = useState<ClientDocuments>(initial);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ kind: '', text: '' });

  const loadPage = useCallback(
    async (page: number) => {
      try {
        const response = await fetch(`/bff/clients/${encodeURIComponent(userId)}/documents?page=${page}`);
        if (!response.ok) return;
        setData((await response.json()) as ClientDocuments);
        setDrafts({});
        window.scrollTo({ top: 0 });
      } catch {
        // Pagination keeps the current page on failure — the table stays.
      }
    },
    [userId],
  );

  useEffect(() => {
    setData(initial);
    setDrafts({});
  }, [initial]);

  const changed = Object.entries(drafts).filter(
    ([id, status]) => data.items.find((item) => item.id === id)?.status !== status,
  );

  async function save(): Promise<void> {
    if (changed.length === 0 || saving) return;
    setSaving(true);
    setNotice({ kind: '', text: '' });
    let failures = 0;
    for (const [id, status] of changed) {
      const result = await bffSend('PATCH', `/bff/documents/${id}/status`, { status });
      if (result.status !== 200) failures += 1;
    }
    setSaving(false);
    if (failures === 0) {
      setNotice({ kind: 'ok', text: 'Alterações salvas com sucesso!' });
      setDrafts({});
      void loadPage(data.page);
    } else {
      setNotice({
        kind: 'error',
        text: `${failures} documento(s) não puderam ser atualizados. Tente novamente.`,
      });
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Estatísticas do cliente">
        {[
          { label: 'Total', value: data.stats.total },
          { label: 'Em análise', value: data.stats.emAnalise },
          { label: 'Deferidos', value: data.stats.deferidos },
          { label: 'Indeferidos', value: data.stats.indeferidos },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-navy-950/10 bg-white p-4 text-center shadow-sm">
            <p className="font-display text-2xl font-semibold text-navy-950">{stat.value}</p>
            <p className="text-xs font-semibold tracking-wide text-navy-950/60 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {notice.text ? (
        <p role={notice.kind === 'ok' ? 'status' : 'alert'} className={`mt-4 rounded-lg px-3 py-2 text-sm font-semibold ${notice.kind === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {notice.text}
        </p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-xl border border-navy-950/10 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-navy-950/10 text-xs tracking-wide text-navy-950/60 uppercase">
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Enviado em</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item) => (
              <tr key={item.id} className="border-b border-navy-950/5 last:border-0">
                <td className="px-4 py-3">
                  <a href={`/bff/documents/${item.id}/content`} className="font-semibold text-navy-950 hover:text-gold-600 hover:underline">
                    {item.name}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/empresas/${item.company.id}`} className="text-navy-950/70 hover:text-gold-600 hover:underline">
                    {item.company.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-navy-950/70">{item.customType ?? item.type}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusSeal status={drafts[item.id] ?? item.status} />
                    <label className="sr-only" htmlFor={`status-${item.id}`}>
                      Status de {item.name}
                    </label>
                    <select
                      id={`status-${item.id}`}
                      value={drafts[item.id] ?? item.status}
                      onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))}
                      className="rounded-lg border border-navy-950/15 bg-white px-2 py-1.5 text-sm font-semibold text-navy-950 focus:border-gold-500 focus:outline-none"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-navy-950/60">{formatDate(item.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={save}
          disabled={changed.length === 0 || saving}
          className="rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Salvando…' : 'SALVAR ALTERAÇÕES'}
        </button>
        {data.totalPages > 1 ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={data.page <= 1}
              onClick={() => void loadPage(data.page - 1)}
              className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-500 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-navy-950/60">
              Página {data.page} de {data.totalPages}
            </span>
            <button
              type="button"
              disabled={data.page >= data.totalPages}
              onClick={() => void loadPage(data.page + 1)}
              className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-500 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
