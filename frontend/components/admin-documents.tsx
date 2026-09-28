'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { StatusSeal } from '@/components/status-seal';
import { bffSend } from '@/lib/bff-client';
import type { AdminDocument } from '@/lib/types';

// Admin document management on the company page (§4.8d): status, author, type
// and visibility per row, with eye-toggle and delete — both confirmed, the
// delete explicitly irreversible. The backend decides which rows an admin may
// see; this renders whatever answers.
export function AdminDocuments({ companyId }: { companyId: string }): React.ReactNode {
  const [documents, setDocuments] = useState<AdminDocument[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmingVisibility, setConfirmingVisibility] = useState<AdminDocument | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<AdminDocument | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const response = await fetch(`/bff/companies/${encodeURIComponent(companyId)}/documents`);
      if (!response.ok) {
        setDocuments(null);
        setFailed(true);
        return;
      }
      setDocuments((await response.json()) as AdminDocument[]);
    } catch {
      setDocuments(null);
      setFailed(true);
    }
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function flipVisibility(): Promise<void> {
    if (!confirmingVisibility) return;
    setBusy(true);
    const next = confirmingVisibility.visibility === 'PUBLICO' ? 'PRIVADO' : 'PUBLICO';
    const result = await bffSend('PATCH', `/bff/documents/${confirmingVisibility.id}/visibility`, {
      visibility: next,
    });
    setBusy(false);
    if (result.status === 200) {
      setConfirmingVisibility(null);
      setNotice(
        next === 'PUBLICO'
          ? `Documento '${confirmingVisibility.name}' agora é público.`
          : `Documento '${confirmingVisibility.name}' agora é privado.`,
      );
      void load();
    }
  }

  async function remove(): Promise<void> {
    if (!confirmingDelete) return;
    setBusy(true);
    const result = await bffSend('DELETE', `/bff/documents/${confirmingDelete.id}`);
    setBusy(false);
    if (result.status === 204) {
      setNotice(`Documento '${confirmingDelete.name}' foi removido.`);
      setConfirmingDelete(null);
      void load();
    }
  }

  return (
    <section aria-label="Documentos">
      <h2 className="font-display text-xl font-semibold text-navy-950">Documentos</h2>
      {notice ? (
        <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
          {notice}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="mt-4 rounded-xl border border-navy-950/10 bg-white p-6 text-navy-950/70">
          Não foi possível carregar os documentos agora. Tente novamente em instantes.
        </p>
      ) : documents === null ? (
        <p className="mt-4 rounded-xl border border-navy-950/10 bg-white p-6 text-center text-navy-950/50">
          Carregando documentos…
        </p>
      ) : documents.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {documents.map((document) => (
            <li
              key={document.id}
              data-testid="admin-document"
              className="rounded-lg border border-navy-950/10 bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <a
                    href={`/bff/documents/${document.id}/content`}
                    className="block truncate font-semibold text-navy-950 hover:text-gold-600 hover:underline"
                    title={document.name}
                  >
                    {document.name}
                  </a>
                  <p className="truncate text-xs text-navy-950/60">
                    {document.customType ?? document.type} · Adicionado por {document.uploadedBy}
                  </p>
                </div>
                <StatusSeal status={document.status} />
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                    document.visibility === 'PUBLICO'
                      ? 'bg-navy-950 text-gold-500 ring-navy-950'
                      : 'bg-mist-50 text-navy-950/70 ring-navy-950/10'
                  }`}
                >
                  {document.visibility === 'PUBLICO' ? <GlobeIcon /> : <LockIcon />}
                  {document.visibility === 'PUBLICO' ? 'Público' : 'Privado'}
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmingVisibility(document)}
                  aria-label={`${document.visibility === 'PUBLICO' ? 'Tornar privado' : 'Tornar público'}: ${document.name}`}
                  className="rounded p-1.5 text-navy-950/60 hover:bg-mist-50 hover:text-navy-950"
                >
                  <EyeIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(document)}
                  aria-label={`Excluir ${document.name}`}
                  className="rounded p-1.5 text-navy-950/60 hover:bg-red-50 hover:text-red-700"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-navy-950/20 bg-white p-6 text-center text-navy-950/60">
          Nenhum documento encontrado para essa empresa.
        </p>
      )}
      {confirmingVisibility ? (
        <ConfirmDialog
          title={confirmingVisibility.visibility === 'PUBLICO' ? 'Tornar privado' : 'Tornar público'}
          message={`Deseja ${confirmingVisibility.visibility === 'PUBLICO' ? 'restringir' : 'liberar para qualquer visitante'} o documento '${confirmingVisibility.name}'? A mudança vale imediatamente para todas as listagens.`}
          confirmLabel="Confirmar"
          busy={busy}
          onConfirm={flipVisibility}
          onCancel={() => setConfirmingVisibility(null)}
        />
      ) : null}
      {confirmingDelete ? (
        <ConfirmDialog
          title="Excluir documento"
          message={`Deseja excluir '${confirmingDelete.name}'? O arquivo é removido junto e a ação não pode ser desfeita.`}
          confirmLabel="EXCLUIR"
          busy={busy}
          onConfirm={remove}
          onCancel={() => setConfirmingDelete(null)}
        />
      ) : null}
    </section>
  );
}

function GlobeIcon(): React.ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M2.5 10h15M10 2.5c-4.5 4.5-4.5 10.5 0 15 4.5-4.5 4.5-10.5 0-15Z" />
    </svg>
  );
}

function LockIcon(): React.ReactNode {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4.5" y="9" width="11" height="8" rx="1.5" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

function EyeIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function TrashIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6 5.5l1 11h6l1-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
