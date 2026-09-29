'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { notifyToast } from '@/lib/toast';

const DOCUMENT_TYPES = [
  'Habilitação de crédito',
  'Divergência de crédito',
  'Habilitação ACG',
  'Outros',
] as const;

const ACCEPTED_EXTENSIONS = ['pdf', 'jpeg', 'jpg', 'png', 'docx', 'xlsx'] as const;
const ACCEPT_ATTR = '.pdf,.jpeg,.jpg,.png,.docx,.xlsx';
const CONCURRENCY = 3;

type FormStatus = 'idle' | 'sending' | 'done' | 'error';

interface UploadForm {
  key: number;
  type: string;
  customType: string;
  name: string;
  description: string;
  file: File | null;
  status: FormStatus;
  message: string;
}

const BLANK = (key: number): UploadForm => ({
  key,
  type: DOCUMENT_TYPES[0],
  customType: '',
  name: '',
  description: '',
  file: null,
  status: 'idle',
  message: '',
});

// Multi-document upload (§4.9): the company arrives fixed from the page of
// origin, forms are added by quantity, and Enviar Todos ships them in groups
// of three with batch progress and per-document status. Failures stay on
// screen for a new attempt; full success clears the forms.
export function UploadWizard({ companyId, companyName }: { companyId: string; companyName: string }): React.ReactNode {
  const [quantity, setQuantity] = useState('1');
  const [forms, setForms] = useState<UploadForm[]>([]);
  const [sendingAll, setSendingAll] = useState(false);
  const [finished, setFinished] = useState(false);
  const keyCounter = useRef(0);

  const patch = (key: number, update: Partial<UploadForm>): void => {
    setForms((current) => current.map((form) => (form.key === key ? { ...form, ...update } : form)));
  };

  function addForms(): void {
    const count = Math.max(1, Math.floor(Number(quantity) || 1));
    setForms((current) => {
      const next = [...current];
      for (let index = 0; index < count; index += 1) {
        keyCounter.current += 1;
        next.push(BLANK(keyCounter.current));
      }
      return next;
    });
    setFinished(false);
  }

  function formError(form: UploadForm): string {
    if (!form.file) return 'O arquivo é obrigatório.';
    const extension = form.file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(extension)) {
      return 'Formato de arquivo não aceito. Envie PDF, JPEG, JPG, PNG, DOCX ou XLSX.';
    }
    if (form.name.trim() === '') return 'O nome do documento é obrigatório.';
    if (form.name.trim().length > 255) return 'O nome do documento deve ter no máximo 255 caracteres.';
    if (form.description.trim() === '') return 'A descrição do documento é obrigatória.';
    if (form.description.trim().length > 1000) {
      return 'A descrição deve ter no máximo 1000 caracteres.';
    }
    if (form.type === 'Outros' && form.customType.trim() === '') {
      return 'A especificação do tipo é obrigatória quando o tipo é Outros.';
    }
    return '';
  }

  async function sendOne(form: UploadForm): Promise<boolean> {
    const localError = formError(form);
    if (localError) {
      patch(form.key, { status: 'error', message: localError });
      return false;
    }
    patch(form.key, { status: 'sending', message: '' });
    const payload = new FormData();
    payload.append('type', form.type);
    if (form.type === 'Outros') payload.append('customType', form.customType.trim());
    payload.append('name', form.name.trim());
    payload.append('description', form.description.trim());
    payload.append('file', form.file as File);
    try {
      const response = await fetch(`/bff/companies/${encodeURIComponent(companyId)}/documents`, {
        method: 'POST',
        body: payload,
      });
      if (response.status === 201) {
        patch(form.key, { status: 'done', message: 'Enviado com sucesso!' });
        return true;
      }
      const data = (await response.json().catch(() => null)) as { message?: unknown } | null;
      const message =
        typeof data?.message === 'string' && data.message !== ''
          ? data.message
          : 'Não foi possível enviar este documento.';
      patch(form.key, { status: 'error', message });
      return false;
    } catch {
      patch(form.key, { status: 'error', message: 'Serviço indisponível. Tente novamente.' });
      return false;
    }
  }

  async function sendAll(): Promise<void> {
    const pending = forms.filter((form) => form.status !== 'done');
    if (pending.length === 0 || sendingAll) return;
    setSendingAll(true);
    const total = pending.length;
    let succeeded = 0;
    const queue = [...pending];
    const workers = Array.from(
      { length: Math.min(CONCURRENCY, queue.length) },
      async () => {
        while (queue.length > 0) {
          const form = queue.shift();
          if (!form) return;
          if (await sendOne(form)) succeeded += 1;
        }
      },
    );
    await Promise.all(workers);
    setSendingAll(false);
    if (succeeded === total) {
      setForms([]);
      setFinished(true);
      notifyToast('success', `Concluído: ${succeeded} de ${total} documentos enviados com sucesso!`);
    } else {
      notifyToast(
        'error',
        `Concluído: ${succeeded} de ${total} documentos enviados com sucesso! ` +
          `${total - succeeded} não puderam ser enviados. Confira e tente novamente.`,
      );
    }
  }

  const finishedCount = forms.filter((form) => form.status === 'done').length;
  const progress = forms.length > 0 ? Math.round((finishedCount / forms.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href={`/empresas/${companyId}`} className="text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
        ← VOLTAR
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold text-navy-950">Adicionar documento</h1>
      <p className="mt-2 text-navy-950/60">
        Empresa: <strong className="text-navy-950">{companyName}</strong>
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="upload-quantity" className="block text-sm font-semibold text-navy-950">
            Quantidade de documentos
          </label>
          <input
            id="upload-quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="mt-1 w-28 rounded-lg border border-navy-950/15 px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={addForms}
          className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-500"
        >
          Adicionar
        </button>
      </div>

      {forms.length > 0 ? (
        <div className="mt-6 space-y-4">
          {forms.map((form, index) => (
            <article key={form.key} className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm" aria-label={`Documento ${index + 1}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-navy-950">Documento {index + 1}</h2>
                {form.status === 'sending' ? (
                  <span className="animate-pulse text-sm font-semibold text-gold-600">Enviando…</span>
                ) : form.status === 'done' ? (
                  <span className="text-sm font-semibold text-green-700">✓ Enviado</span>
                ) : form.status === 'error' ? (
                  <span className="text-sm font-semibold text-red-700">✗ Falhou</span>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor={`type-${form.key}`} className="block text-sm font-semibold text-navy-950">
                    Tipo de documento
                  </label>
                  <select
                    id={`type-${form.key}`}
                    value={form.type}
                    disabled={form.status === 'done'}
                    onChange={(event) => patch(form.key, { type: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-navy-950/15 bg-white px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                {form.type === 'Outros' ? (
                  <div>
                    <label htmlFor={`custom-${form.key}`} className="block text-sm font-semibold text-navy-950">
                      Especificação do tipo
                    </label>
                    <input
                      id={`custom-${form.key}`}
                      value={form.customType}
                      disabled={form.status === 'done'}
                      onChange={(event) => patch(form.key, { customType: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-navy-950/15 px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
                    />
                  </div>
                ) : null}
                <div>
                  <label htmlFor={`name-${form.key}`} className="block text-sm font-semibold text-navy-950">
                    Nome do documento
                  </label>
                  <input
                    id={`name-${form.key}`}
                    value={form.name}
                    maxLength={255}
                    disabled={form.status === 'done'}
                    onChange={(event) => patch(form.key, { name: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-navy-950/15 px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor={`file-${form.key}`} className="block text-sm font-semibold text-navy-950">
                    Arquivo (PDF, JPEG, JPG, PNG, DOCX, XLSX)
                  </label>
                  <input
                    id={`file-${form.key}`}
                    type="file"
                    accept={ACCEPT_ATTR}
                    disabled={form.status === 'done'}
                    onChange={(event) => patch(form.key, { file: event.target.files?.[0] ?? null })}
                    className="mt-1 w-full text-sm text-navy-950/70 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-navy-800"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor={`description-${form.key}`} className="block text-sm font-semibold text-navy-950">
                    Descrição do documento
                  </label>
                  <textarea
                    id={`description-${form.key}`}
                    value={form.description}
                    maxLength={1000}
                    rows={2}
                    disabled={form.status === 'done'}
                    onChange={(event) => patch(form.key, { description: event.target.value })}
                    className="mt-1 w-full rounded-lg border border-navy-950/15 px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>
              {form.message && form.status !== 'done' ? (
                <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {form.message}
                </p>
              ) : null}
              {form.status === 'done' ? (
                <button
                  type="button"
                  onClick={() => patch(form.key, { ...BLANK(form.key), key: form.key })}
                  className="mt-3 text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600"
                >
                  Preparar outro arquivo neste formulário
                </button>
              ) : null}
            </article>
          ))}

          <div className="rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-navy-950">
              <span>Progresso do envio</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-mist-50" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progresso do envio">
              <div
                className={`h-full rounded-full bg-gold-500 transition-all ${sendingAll ? 'animate-pulse' : ''}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={sendAll}
              disabled={sendingAll}
              className="mt-4 w-full rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40 sm:w-auto sm:px-8"
            >
              {sendingAll ? 'Enviando…' : 'ENVIAR TODOS'}
            </button>
          </div>
        </div>
      ) : null}

      {finished ? (
        <p className="mt-6 text-center text-sm">
          <Link href={`/empresas/${companyId}`} className="font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700">
            Voltar à empresa
          </Link>
        </p>
      ) : null}
    </div>
  );
}
