'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { AuthCard } from '@/components/auth-card';
import { PasswordChecklist } from '@/components/password-checklist';
import { PasswordInput } from '@/components/password-input';
import { bffPost } from '@/lib/bff-client';
import { checkPassword, passwordValid } from '@/lib/password-rules';

// New password behind the mailed link (§4.5): the address resolves
// server-side and arrives readonly; the button unlocks on valid rules.
export function ResetPasswordForm({ email, token }: { email: string; token: string }): React.ReactNode {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const checks = useMemo(() => checkPassword(password, confirmation), [password, confirmation]);
  const ready = passwordValid(checks) && !sending;

  async function submit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!ready) return;
    setSending(true);
    setError('');
    const result = await bffPost('/bff/auth/reset-password', {
      token,
      password,
      passwordConfirmation: confirmation,
    });
    setSending(false);
    if (result.status === 200) {
      router.push('/login?redefinida=1');
      router.refresh();
    } else {
      setError(result.message);
    }
  }

  return (
    <AuthCard title="Redefinir senha">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="block text-sm font-semibold text-navy-950">
            E-mail
          </label>
          <input
            id="reset-email"
            value={email}
            readOnly
            tabIndex={-1}
            aria-readonly
            className="mt-1 w-full rounded-lg border border-navy-950/10 bg-mist-50 px-3 py-2 text-navy-950/60"
          />
        </div>
        <PasswordInput id="reset-password" label="Nova senha" value={password} onChange={setPassword} autoComplete="new-password" />
        <PasswordInput id="reset-confirmation" label="Confirmar nova senha" value={confirmation} onChange={setConfirmation} autoComplete="new-password" />
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
          {sending ? 'Redefinindo…' : 'REDEFINIR'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link href="/esqueci-senha" className="text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
          Pedir um novo link
        </Link>
      </p>
    </AuthCard>
  );
}
