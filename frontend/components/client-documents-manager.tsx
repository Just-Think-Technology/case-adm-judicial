'use client';

import { useCallback, useEffect, useState } from 'react';
import { StatusSeal } from '@/components/status-seal';
import { formatDate } from '@/lib/format';
import type { ClientDocuments } from '@/lib/types';

// One client's documents (§4.14): real totals on top and the uploads as
// plain cards — no table, no status editing here. Rows arrive server-rendered
// for page one; paging continues through the BFF.
export function ClientDocumentsManager({ initial, userId }: { initial: ClientDocuments; userId: string }): React.ReactNode {
  const [data, setData] = useState<ClientDocuments>(initial);

  const loadPage = useCallback(
    async (page: number) => {
      try {
        const response = await fetch(`/bff/clients/${encodeURIComponent(userId)}/documents?page=${page}`);
        if (!response.ok) return;
        setData((await response.json()) as ClientDocuments);
        window.scrollTo({ top: 0 });
      } catch {
        // Pagination keeps the current page on failure — the list stays.
      }
    },
    [userId],
  );

  useEffect(() => {
    setData(initial);
  }, [initial]);

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

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {data.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-navy-950/10 bg-white px-4 py-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <a
                href={`/bff/documents/${item.id}/content`}
                className="block truncate font-semibold text-navy-950 hover:text-gold-700 hover:underline"
                title={item.name}
              >
                {item.name}
              </a>
              <p className="truncate text-xs text-navy-950/60">
                {item.customType ?? item.type} · {item.company.name} · {formatDate(item.createdAt)}
              </p>
            </div>
            <StatusSeal status={item.status} />
          </li>
        ))}
      </ul>

      {data.totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => void loadPage(data.page - 1)}
            className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-600 disabled:opacity-40"
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
            className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-600 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  );
}
