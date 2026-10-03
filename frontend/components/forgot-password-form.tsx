'use client';

import { useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { bffPost } from '@/lib/bff-client';
import { notifyToast } from '@/lib/toast';
import { Spinner } from '@/components/icons';

// Password recovery request (§4.5): known addresses get the link, unknown
// ones are told so — the distinction comes from the backend message itself.
export function ForgotPasswordForm(): React.ReactNode {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (email.trim() === '' || sending) return;
    setSending(true);
    const result = await bffPost('/bff/auth/forgot-password', { email: email.trim() });
    setSending(false);
    notifyToast(result.status === 200 ? 'info' : 'error', result.message);
  }

  return (
    <AuthCard title="Esqueci minha senha" subtitle="Informe o e-mail cadastrado para receber o link.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-semibold text-navy-950">
            E-mail
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-navy-950/15 bg-canvas px-3 py-2 text-navy-950 focus:border-gold-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={sending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-40"
        >
          {sending ? (<><Spinner /> Enviando…</>) : 'ENVIAR LINK'}
        </button>
      </form>
    </AuthCard>
  );
}
