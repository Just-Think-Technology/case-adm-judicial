'use client';

import { useCallback, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { TrashIcon } from '@/components/icons';
import { PublicDocumentRow } from '@/components/public-document-row';
import { StatusSeal } from '@/components/status-seal';
import { bffSend } from '@/lib/bff-client';
import { formatDate } from '@/lib/format';
import { notifyToast } from '@/lib/toast';

interface ListedDocument {
  id: string;
  name: string;
  type: string;
  customType: string | null;
  status?: string;
  uploadedBy?: string;
  createdAt?: string;
}

const SCOPES = [
  { id: 'all', label: 'Todos os documentos' },
  { id: 'mine', label: 'Meus documentos' },
  { id: 'admin', label: 'Documentos dos administradores' },
] as const;

type Scope = (typeof SCOPES)[number]['id'];

// Document list of a company (§4.8d/§4.10). Visitors see public documents with
// no filter; creditors switch scope, and their own documents carry the status
// seal for tracking (§4.11). The backend owns who-may-see-what — the scope is
// a view preference, never an authorization decision. In the personal scope
// every row is owned by the viewer, so deletion is offered there; anywhere
// else the backend stays the only judge.
export function CompanyDocuments({
  companyId,
  authed,
}: {
  companyId: string;
  authed: boolean;
}): React.ReactNode {
  const [scope, setScope] = useState<Scope>('all');
  const [documents, setDocuments] = useState<ListedDocument[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<ListedDocument | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    try {
      const response = await fetch(
        `/bff/companies/${encodeURIComponent(companyId)}/documents${authed ? `?scope=${scope}` : ''}`,
      );
      if (!response.ok) {
        setDocuments(null);
        setFailed(true);
        return;
      }
      setDocuments((await response.json()) as ListedDocument[]);
    } catch {
      setDocuments(null);
      setFailed(true);
    }
  }, [companyId, scope, authed]);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(): Promise<void> {
    if (!confirmingDelete) return;
    setBusy(true);
    const result = await bffSend('DELETE', `/bff/documents/${confirmingDelete.id}`);
    setBusy(false);
    if (result.status === 204) {
      setConfirmingDelete(null);
      notifyToast('success', 'Documento excluído com sucesso!');
      await load();
    } else {
      notifyToast('error', result.message);
    }
  }

  return (
    <section aria-label={authed ? 'Documentos' : 'Documentos públicos'} className="rounded-2xl border border-navy-950/10 bg-white p-5 shadow-sm sm:p-6">
      {authed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-navy-950">Documentos</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtro de documentos">
            {SCOPES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={scope === option.id}
                onClick={() => setScope(option.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                  scope === option.id
                    ? 'bg-navy-950 text-white'
                    : 'bg-white text-navy-950 ring-1 ring-navy-950/15 hover:ring-gold-500'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <h2 className="font-display text-xl font-semibold text-navy-950">Documentos públicos</h2>
      )}
      {failed ? (
        <p role="alert" className="mt-4 rounded-xl border border-navy-950/10 bg-paper-50 p-6 text-navy-950/70">
          Não foi possível carregar os documentos agora. Tente novamente em instantes.
        </p>
      ) : documents === null ? (
        <p className="mt-4 rounded-xl border border-navy-950/10 bg-paper-50 p-6 text-center text-navy-950/50">
          Carregando documentos…
        </p>
      ) : documents.length > 0 ? (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {documents.map((document) => (
            <li
              key={document.id}
              data-testid="company-document"
              className="flex items-center gap-3 rounded-lg border border-navy-950/10 bg-paper-50 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <PublicDocumentRow document={document} bare />
                {document.uploadedBy || document.createdAt ? (
                  <p className="mt-1 truncate pl-12 text-xs text-navy-950/55">
                    {document.createdAt ? formatDate(document.createdAt) : null}
                    {document.createdAt && document.uploadedBy ? ' · ' : null}
                    {document.uploadedBy ? `por ${document.uploadedBy}` : null}
                  </p>
                ) : null}
              </div>
              {authed && scope === 'mine' && document.status ? (
                <StatusSeal status={document.status} />
              ) : null}
              {authed && scope === 'mine' ? (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(document)}
                  aria-label={`Excluir ${document.name}`}
                  className="shrink-0 rounded p-1.5 text-navy-950/60 hover:bg-red-50 hover:text-red-700"
                >
                  <TrashIcon />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="mt-4 rounded-xl border border-dashed border-navy-950/20 bg-paper-50 p-6 text-center text-navy-950/60">
          {authed && scope !== 'all'
            ? 'Nenhum documento encontrado para o filtro selecionado.'
            : 'Nenhum documento encontrado para essa empresa.'}
        </p>
      )}
      {confirmingDelete ? (
        <ConfirmDialog
          title="Excluir documento"
          message={`Deseja excluir '${confirmingDelete.name}'? O arquivo é removido junto e a ação não pode ser desfeita.`}
          confirmLabel="EXCLUIR"
          busy={busy}
          onConfirm={() => void remove()}
          onCancel={() => setConfirmingDelete(null)}
        />
      ) : null}
    </section>
  );
}
