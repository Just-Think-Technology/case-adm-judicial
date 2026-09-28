'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { bffPost } from '@/lib/bff-client';
import { checkPassword, passwordValid } from '@/lib/password-rules';

const inputClass =
  'mt-1 w-full rounded-lg border border-navy-950/15 bg-white px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none';

// Signup (§4.2): the account is created unverified and nobody is logged in —
// success points back to login with the spam-folder warning.
export function SignupForm(): React.ReactNode {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const checks = useMemo(() => checkPassword(password, confirmation), [password, confirmation]);
  const ready =
    name.trim() !== '' && email.trim() !== '' && passwordValid(checks) && !sending;

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!ready) return;
    setSending(true);
    setError('');
    const result = await bffPost('/bff/auth/register', {
      name: name.trim(),
      email: email.trim(),
      password,
      passwordConfirmation: confirmation,
    });
    setSending(false);
    if (result.status === 201) {
      setDone(true);
    } else {
      setError(result.message);
    }
  }

  if (done) {
    return (
      <AuthCard title="Cadastro realizado!">
        <p role="status" className="text-navy-950/80">
          Verifique seu e-mail para ativar a conta — inclusive a caixa de spam.
        </p>
        <Link
          href="/login"
          className="mt-6 block rounded-lg bg-navy-950 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-navy-800"
        >
          Ir para o login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Criar cadastro" subtitle="Conta de credor — o acesso é liberado após confirmar o e-mail.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="signup-name" className="block text-sm font-semibold text-navy-950">
            Nome
          </label>
          <input
            id="signup-name"
            value={name}
            autoComplete="name"
            minLength={5}
            maxLength={20}
            onChange={(event) => setName(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="block text-sm font-semibold text-navy-950">
            E-mail
          </label>
          <input
            id="signup-email"
            type="email"
            value={email}
            autoComplete="email"
            maxLength={255}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>
        <PasswordInput id="signup-password" label="Senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordInput id="signup-confirmation" label="Confirmar senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
        <PasswordChecklist checks={checks} />
        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!ready}
          className="w-full rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? 'Enviando…' : 'CADASTRAR'}
        </button>
      </form>
    </AuthCard>
  );
}
