'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { bffPatch } from '@/lib/bff-client';
import { checkPassword, passwordValid } from '@/lib/password-rules';
import { notifyToast } from '@/lib/toast';
import type { Session } from '@/lib/session';
import { Spinner } from '@/components/icons';

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/;

// Account menu (§4.6): two cards — name/e-mail, then password with its
// requirement popup. Each Save unlocks only on changed, filled, valid input.
export function AccountForms({ session }: { session: Session }): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState(session.name);
  const [email, setEmail] = useState(session.email);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const checks = useMemo(() => checkPassword(password, confirmation), [password, confirmation]);
  const profileChanged = name.trim() !== session.name || email.trim().toLowerCase() !== session.email.toLowerCase();
  const profileReady =
    profileChanged &&
    name.trim().length >= 5 &&
    name.trim().length <= 20 &&
    NAME_PATTERN.test(name.trim()) &&
    /.+@.+\..+/.test(email.trim()) &&
    !savingProfile;
  const passwordReady =
    currentPassword !== '' && passwordValid(checks) && password !== currentPassword && !savingPassword;

  async function saveProfile(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!profileReady) return;
    setSavingProfile(true);
    const result = await bffPatch('/bff/account', { name: name.trim(), email: email.trim() });
    setSavingProfile(false);
    if (result.status === 200) {
      notifyToast('success', 'Dados atualizados!');
      router.refresh();
    } else {
      notifyToast('error', result.message);
    }
  }

  async function savePassword(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!passwordReady) return;
    setSavingPassword(true);
    const result = await bffPatch('/bff/account/password', {
      currentPassword,
      password,
      passwordConfirmation: confirmation,
    });
    setSavingPassword(false);
    if (result.status === 200) {
      notifyToast('success', 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setPassword('');
      setConfirmation('');
    } else {
      notifyToast('error', result.message);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section aria-label="Nome e e-mail" className="h-fit rounded-xl border border-navy-950/10 bg-paper-50 p-6 shadow-sm">
        <h2 className="font-display text-xl font-semibold text-navy-950">Nome e e-mail</h2>
        <form onSubmit={saveProfile} className="mt-4 space-y-4">
          <div>
            <label htmlFor="account-name" className="block text-sm font-semibold text-navy-950">
              Nome
            </label>
            <input
              id="account-name"
              value={name}
              autoComplete="name"
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-950/15 px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="account-email" className="block text-sm font-semibold text-navy-950">
              E-mail
            </label>
            <input
              id="account-email"
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-navy-950/15 px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!profileReady}
            className="flex items-center justify-center gap-2 rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingProfile ? (<><Spinner /> Salvando…</>) : 'Salvar'}
          </button>
        </form>
      </section>

      <section aria-label="Senha" className="h-fit rounded-xl border border-navy-950/10 bg-paper-50 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-xl font-semibold text-navy-950">Senha</h2>
          <details className="relative">
            <summary aria-label="Ver requisitos da senha" className="cursor-pointer list-none rounded-full bg-mist-50 px-2 py-0.5 text-sm font-bold text-navy-950 hover:text-gold-600">
              i
            </summary>
            <div className="absolute left-0 z-10 mt-2 w-64 rounded-lg border border-navy-950/10 bg-white p-4 text-sm text-navy-950 shadow-lg">
              Mínimo de 8 caracteres, uma maiúscula, uma minúscula, um número, um caractere
              especial e confirmação igual. A nova senha não pode ser igual à atual.
            </div>
          </details>
        </div>
        <form onSubmit={savePassword} className="mt-4 space-y-4">
          <PasswordInput id="account-current" label="Senha atual" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordInput id="account-new" label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
          <PasswordInput id="account-confirm" label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
          <PasswordChecklist checks={checks} />
          {password !== '' && password === currentPassword ? (
            <p className="text-sm text-navy-950/60">A nova senha não pode ser igual à senha atual.</p>
          ) : null}
          <button
            type="submit"
            disabled={!passwordReady}
            className="flex items-center justify-center gap-2 rounded-lg bg-navy-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {savingPassword ? (<><Spinner /> Salvando…</>) : 'Salvar'}
          </button>
        </form>
      </section>
    </div>
  );
}
