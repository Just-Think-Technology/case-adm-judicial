'use client';

import Link from 'next/link';
import { useState } from 'react';import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatDate } from '@/lib/format';
import { bffSend } from '@/lib/bff-client';
import type { CompanyCard as CompanyCardData } from '@/lib/types';

// Panel card per §4.7: nature icon, name, process number, creation date and
// the ACESSAR button. Administrators also get the three-dot menu with EDITAR
// (same form, prefilled) and REMOVER (confirmed, irreversible).
export function CompanyCard({
  company,
  isAdmin = false,
  onRemoved,
}: {
  company: CompanyCardData;
  isAdmin?: boolean;
  onRemoved?: (id: string, name: string) => void;
}): React.ReactNode {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const isRJ = company.nature === 'Recuperação Judicial';

  async function remove(): Promise<void> {
    setBusy(true);
    const result = await bffSend('DELETE', `/bff/companies/${company.id}`);
    setBusy(false);
    if (result.status === 204) {
      setConfirming(false);
      onRemoved?.(company.id, company.name);
    }
  }

  return (
    <article
      data-testid="company-card"
      className="relative flex flex-col rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isRJ ? 'bg-navy-950 text-gold-500' : 'bg-gold-100 text-gold-700'}`}
        >
          {isRJ ? <BuildingIcon /> : <AlertIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold tracking-[0.14em] text-gold-700 uppercase">
            {company.nature}
          </p>
          <h3 className="font-display truncate text-lg leading-snug font-semibold text-navy-950" title={company.name}>
            {company.name}
          </h3>
          <p className="text-sm text-navy-950/60 tabular-nums">{company.processNumber}</p>
        </div>
        {isAdmin ? (
          <details className="relative shrink-0">
            <summary aria-label={`Opções de ${company.name}`} className="cursor-pointer list-none rounded px-2 py-1 text-xl leading-none text-navy-950/60 hover:bg-mist-50 hover:text-navy-950">
              ⋮
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-32 rounded-lg border border-navy-950/10 bg-white p-1 shadow-lg">
              <Link
                href={`/empresas/${company.id}/editar`}
                className="block rounded px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-mist-50"
              >
                EDITAR
              </Link>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="block w-full rounded px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                REMOVER
              </button>
            </div>
          </details>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-navy-950/50">Cadastrada em {formatDate(company.createdAt)}</p>
      <Link
        href={`/empresas/${company.id}`}
        className="mt-4 rounded-lg bg-navy-950 px-4 py-2 text-center text-sm font-semibold tracking-wide text-white hover:bg-navy-800"
      >
        ACESSAR
      </Link>
      {confirming ? (
        <ConfirmDialog
          title="Remover empresa"
          message={`Tem certeza que deseja remover a empresa '${company.name}'? Todos os documentos vinculados deixam de existir e não há como desfazer.`}
          confirmLabel="REMOVER"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
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
