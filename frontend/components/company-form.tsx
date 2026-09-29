'use client';

import Link from 'next/link';
import { useState } from 'react';
import { bffSend } from '@/lib/bff-client';
import { notifyToast } from '@/lib/toast';
import type { CompanyDetails, CompanyInput } from '@/lib/types';

const NATURES = ['Recuperação Judicial', 'Falência'] as const;

const EMPTY: CompanyInput = {
  name: '',
  judicialAdmin: '',
  judge: '',
  nature: 'Recuperação Judicial',
  processNumber: '',
  protocolDate: '',
  author: '',
  comarca: '',
  observations: '',
};

const inputClass =
  'mt-1 w-full rounded-lg border border-navy-950/15 bg-white px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none';

// Company form (§4.8a/b): the same fields for create and edit, every one
// required. Typed data survives validation errors (client state), and backend
// messages list the offending fields verbatim.
export function CompanyForm({ initial }: { initial?: CompanyDetails }): React.ReactNode {
  const editing = initial !== undefined;
  const [values, setValues] = useState<CompanyInput>(() =>
    initial
      ? {
          name: initial.name,
          judicialAdmin: initial.judicialAdmin,
          judge: initial.judge,
          nature: initial.nature,
          processNumber: initial.processNumber,
          protocolDate: initial.protocolDate,
          author: initial.author,
          comarca: initial.comarca,
          observations: initial.observations ?? '',
        }
      : EMPTY,
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function set<Key extends keyof CompanyInput>(key: Key, value: string): void {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    const result = editing
      ? await bffSend('PUT', `/bff/companies/${initial.id}`, values)
      : await bffSend('POST', '/bff/companies', values);
    setSaving(false);
    if (result.status === 201 || result.status === 200) {
      notifyToast('success', editing ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!');
      setSaved(true);
    } else {
      notifyToast('error', result.message);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-navy-950/10 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-navy-950">
          Nome da empresa
          <input value={values.name} maxLength={300} onChange={(event) => set('name', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Administrador Judicial
          <input value={values.judicialAdmin} maxLength={300} onChange={(event) => set('judicialAdmin', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Juiz de direito
          <input value={values.judge} maxLength={300} onChange={(event) => set('judge', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Natureza
          <select value={values.nature} onChange={(event) => set('nature', event.target.value)} className={inputClass}>
            {NATURES.map((nature) => (
              <option key={nature} value={nature}>
                {nature}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Número do processo
          <input value={values.processNumber} maxLength={50} onChange={(event) => set('processNumber', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Protocolo
          <input type="date" value={values.protocolDate} onChange={(event) => set('protocolDate', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Autor
          <input value={values.author} maxLength={300} onChange={(event) => set('author', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950">
          Comarca / Escrivania
          <input value={values.comarca} maxLength={300} onChange={(event) => set('comarca', event.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm font-semibold text-navy-950 sm:col-span-2">
          Observações
          <textarea value={values.observations} maxLength={300} rows={3} onChange={(event) => set('observations', event.target.value)} className={inputClass} />
        </label>
      </div>
      {saved ? (
        <p className="mt-4 text-sm">
          <Link href="/painel" className="font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700">
            Voltar ao painel
          </Link>
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="mt-6 rounded-lg bg-navy-950 px-8 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40"
      >
        {saving ? 'Salvando…' : editing ? 'SALVAR' : 'ADICIONAR'}
      </button>
    </form>
  );
}
