'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { PasswordInput } from '@/components/password-input';
import { bffPost } from '@/lib/bff-client';
import { notifyToast } from '@/lib/toast';
import { Spinner } from '@/components/icons';

const UNVERIFIED = 'Necessário validar o e-mail.';

// Login (§4.4): verified accounts land on the panel; unverified ones get the
// warning plus a prefilled resend button instead of a dead end.
export function LoginForm({ notice }: { notice?: string }): React.ReactNode {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [sending, setSending] = useState(false);
  const announced = useRef(false);

  // Arrival notices (post-signup, post-reset) toast once on mount.
  useEffect(() => {
    if (notice && !announced.current) {
      announced.current = true;
      notifyToast('success', notice);
    }
  }, [notice]);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (email.trim() === '' || password === '' || sending) return;
    setSending(true);
    setNeedsVerification(false);
    const result = await bffPost('/bff/auth/login', { email: email.trim(), password });
    setSending(false);
    if (result.status === 200) {
      router.push('/painel');
      router.refresh();
    } else if (result.message === UNVERIFIED) {
      setNeedsVerification(true);
    } else {
      notifyToast('error', result.message);
    }
  }

  async function resend(): Promise<void> {
    setSending(true);
    const result = await bffPost('/bff/auth/verification-notification', { email: email.trim() });
    setSending(false);
    if (result.status === 200) {
      notifyToast('success', 'E-mail reenviado. Verifique também a caixa de spam.');
      setNeedsVerification(false);
    } else {
      notifyToast('error', result.message);
    }
  }

  return (
    <AuthCard title="Entrar" subtitle="Acesso com e-mail verificado.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-semibold text-navy-950">
            E-mail
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-950/15 bg-canvas px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
          />
        </div>
        <PasswordInput id="login-password" label="Senha" value={password} onChange={setPassword} autoComplete="current-password" />
        {needsVerification ? (
          <div role="alert" className="rounded-lg bg-gold-100 px-3 py-2 text-sm text-navy-950">
            <p>{UNVERIFIED}</p>
            <button
              type="button"
              onClick={resend}
              disabled={sending}
              className="mt-2 rounded bg-navy-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-40"
            >
              REENVIAR E-MAIL
            </button>
          </div>
        ) : null}
        <button
          type="submit"
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40"
        >
          {sending ? (<><Spinner /> Entrando…</>) : 'ENTRAR'}
        </button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/esqueci-senha" className="text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
          Esqueceu sua senha?
        </Link>
        <Link href="/cadastro" className="font-semibold text-navy-950 hover:text-gold-600">
          Criar cadastro
        </Link>
      </div>
    </AuthCard>
  );
}
