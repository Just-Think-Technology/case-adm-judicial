'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-navy-950/15 bg-canvas px-3 py-2.5 text-navy-950 focus:border-gold-600 focus:outline-none';

// Multi-document upload (§4.9): the company arrives fixed from the page of
// origin. One form is always present, Novo documento adds more, Enviar Todos
// ships them three at a time with per-document status. Failures stay on
// screen for a new attempt; full success returns to the company page.
export function UploadWizard({ companyId, companyName }: { companyId: string; companyName: string }): React.ReactNode {
  const router = useRouter();
  const keyCounter = useRef(1);
  const [forms, setForms] = useState<UploadForm[]>(() => [BLANK(1)]);
  const [sendingAll, setSendingAll] = useState(false);

  const patch = (key: number, update: Partial<UploadForm>): void => {
    setForms((current) => current.map((form) => (form.key === key ? { ...form, ...update } : form)));
  };

  function addForm(): void {
    keyCounter.current += 1;
    setForms((current) => [...current, BLANK(keyCounter.current)]);
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
      notifyToast('success', `Concluído: ${succeeded} de ${total} documentos enviados com sucesso!`);
      router.push(`/empresas/${encodeURIComponent(companyId)}`);
    } else {
      notifyToast(
        'error',
        `Concluído: ${succeeded} de ${total} documentos enviados com sucesso! ` +
          `${total - succeeded} não puderam ser enviados. Confira e tente novamente.`,
      );
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link href={`/empresas/${companyId}`} className="text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700">
        ← VOLTAR
      </Link>
      <p className="mt-4 text-xs font-bold tracking-[0.2em] text-gold-700 uppercase">Novo envio</p>
      <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight text-navy-950">Adicionar documento</h1>
      <p className="mt-2 text-navy-950/60">
        Empresa: <strong className="text-navy-950">{companyName}</strong>
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={addForm}
          className="rounded-lg border border-navy-950/20 px-5 py-2.5 text-sm font-semibold text-navy-950 hover:border-gold-600"
        >
          Novo documento
        </button>
      </div>

      <section aria-label="Documentos" className="mt-6">
        <div className="mt-4 space-y-5">
            {forms.map((form, index) => (
              <article
                key={form.key}
                aria-label={`Documento ${index + 1}`}
                className={`rounded-2xl border bg-paper-50 p-6 shadow-sm sm:p-7 ${
                  form.status === 'done'
                    ? 'border-green-200'
                    : form.status === 'error'
                      ? 'border-red-200'
                      : 'border-navy-950/10'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-display text-xl font-semibold text-navy-950">Documento {index + 1}</h3>
                  {form.status === 'sending' ? (
                    <span className="animate-pulse text-sm font-semibold text-gold-700">Enviando…</span>
                  ) : form.status === 'done' ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">✓ Enviado</span>
                  ) : form.status === 'error' ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">✗ Falhou</span>
                  ) : null}
                </div>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`type-${form.key}`} className="block text-sm font-semibold text-navy-950">
                      Tipo de documento
                    </label>
                    <select
                      id={`type-${form.key}`}
                      value={form.type}
                      disabled={form.status === 'done'}
                      onChange={(event) => patch(form.key, { type: event.target.value })}
                      className={fieldClass}
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
                        className={fieldClass}
                      />
                    </div>
                  ) : (
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
                        className={fieldClass}
                      />
                    </div>
                  )}
                  {form.type === 'Outros' ? (
                    <div className="sm:col-span-2">
                      <label htmlFor={`name-${form.key}`} className="block text-sm font-semibold text-navy-950">
                        Nome do documento
                      </label>
                      <input
                        id={`name-${form.key}`}
                        value={form.name}
                        maxLength={255}
                        disabled={form.status === 'done'}
                        onChange={(event) => patch(form.key, { name: event.target.value })}
                        className={fieldClass}
                      />
                    </div>
                  ) : null}
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
                      className={fieldClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <span id={`file-label-${form.key}`} className="block text-sm font-semibold text-navy-950">
                      Arquivo
                    </span>
                    <label
                      htmlFor={`file-${form.key}`}
                      className={`mt-1.5 flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition ${
                        form.file
                          ? 'border-gold-600 bg-gold-100/40 text-navy-950'
                          : 'border-navy-950/20 bg-paper-50 text-navy-950/60 hover:border-gold-600'
                      } ${form.status === 'done' ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      <span className="truncate font-medium">
                        {form.file ? form.file.name : 'Escolher PDF, JPEG, JPG, PNG, DOCX ou XLSX'}
                      </span>
                      <span className="shrink-0 rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-bold text-white">
                        {form.file ? 'Trocar' : 'Procurar'}
                      </span>
                    </label>
                    <input
                      id={`file-${form.key}`}
                      aria-labelledby={`file-label-${form.key}`}
                      type="file"
                      accept={ACCEPT_ATTR}
                      disabled={form.status === 'done'}
                      onChange={(event) => patch(form.key, { file: event.target.files?.[0] ?? null })}
                      className="sr-only"
                    />
                  </div>
                </div>
                {form.message && form.status !== 'done' ? (
                  <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                    {form.message}
                  </p>
                ) : null}
                {form.status === 'done' ? (
                  <button
                    type="button"
                    onClick={() => patch(form.key, { ...BLANK(form.key), key: form.key })}
                    className="mt-4 text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700"
                  >
                    Preparar outro arquivo neste formulário
                  </button>
                ) : null}
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={sendAll}
            disabled={sendingAll}
            className="mt-6 w-full rounded-lg bg-navy-950 px-4 py-3 text-sm font-bold tracking-wide text-white hover:bg-navy-800 disabled:opacity-40 sm:w-auto sm:px-10"
          >
            {sendingAll ? 'Enviando…' : 'ENVIAR TODOS'}
          </button>
        </section>
    </div>
  );
}
