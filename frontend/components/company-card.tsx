'use client';

import Link from 'next/link';
import { useState } from 'react';import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatDate, formatRelative } from '@/lib/format';
import { bffSend } from '@/lib/bff-client';
import { notifyToast } from '@/lib/toast';
import type { CompanyCard as CompanyCardData } from '@/lib/types';

// Panel card per §4.7: gold-tinted nature icon, name, process number with a
// copy shortcut, and a relative-age footer. The whole card is one link to the
// company page — the copy button and the admin menu float above it.
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

  async function copyProcessNumber(): Promise<void> {
    try {
      await navigator.clipboard.writeText(company.processNumber);
      notifyToast('success', 'Número do processo copiado.');
    } catch {
      notifyToast('error', 'Não foi possível copiar agora.');
    }
  }

  return (
    <article
      data-testid="company-card"
      className="group relative flex flex-col rounded-2xl border border-navy-950/10 bg-white p-6 shadow-sm transition hover:border-gold-500/40 hover:shadow-lg"
    >
      <Link
        href={`/empresas/${company.id}`}
        aria-label={`Acessar processo de ${company.name}`}
        className="absolute inset-0 rounded-2xl"
      />
      <div className="relative flex items-start gap-4">
        <span
          aria-hidden
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/10 ${isRJ ? 'text-gold-700' : 'text-navy-800'}`}
        >
          {isRJ ? <BuildingIcon /> : <AlertIcon />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.18em] text-gold-700 uppercase">
            {company.nature}
          </p>
          <h3 className="font-display mt-1 line-clamp-2 text-xl leading-snug font-semibold text-navy-950" title={company.name}>
            {company.name}
          </h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-navy-950/60 tabular-nums">
            <span className="truncate">{company.processNumber}</span>
            <button
              type="button"
              onClick={copyProcessNumber}
              aria-label={`Copiar número do processo de ${company.name}`}
              title="Copiar número do processo"
              className="relative z-10 shrink-0 rounded p-1 text-navy-950/40 hover:bg-mist-50 hover:text-gold-700"
            >
              <CopyIcon />
            </button>
          </p>
        </div>
        {isAdmin ? (
          <details className="relative z-10 shrink-0">
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
      <div className="relative mt-4 flex items-center justify-between gap-3 border-t border-navy-950/10 pt-4">
        <p className="min-w-0 truncate text-xs text-navy-950/50" title={`Cadastrada em ${formatDate(company.createdAt)}`}>
          Atualizado {formatRelative(company.updatedAt)}
        </p>
        <span aria-hidden className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-navy-950 transition group-hover:text-gold-700">
          Acessar processo
          <span className="inline-block transition group-hover:translate-x-1">→</span>
        </span>
      </div>
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
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <rect x="4" y="3" width="12" height="14" rx="1" />
      <path d="M7.5 6.5h1.5M11 6.5h1.5M7.5 9.5h1.5M11 9.5h1.5M7.5 12.5h1.5M11 12.5h1.5M9 17v-2h2v2" />
    </svg>
  );
}

function AlertIcon(): React.ReactNode {
  return (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M10 2.5 17.5 15.5h-15L10 2.5Z" strokeLinejoin="round" />
      <path d="M10 7.5v3.5M10 13.2v.1" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon(): React.ReactNode {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
      <path d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7" />
    </svg>
  );
}
