import { AuthCard } from '@/components/auth-card';
import { ResetPasswordForm } from '@/components/reset-password-form';
import { backendFetch } from '@/lib/backend';

export const metadata = { title: 'Redefinir senha | Portal do Credor' };

// Resolves the mailed token server-side: a valid link renders the readonly
// address plus the form, anything else the invalid-link message (§4.5).
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactNode> {
  const { token } = await searchParams;
  let email: string | null = null;
  if (token) {
    try {
      const upstream = await backendFetch(`/auth/reset-password?token=${encodeURIComponent(token)}`);
      if (upstream.ok) email = ((await upstream.json()) as { email: string }).email;
    } catch {
      email = null;
    }
  }
  if (!email || !token) {
    return (
      <AuthCard title="Link inválido">
        <p role="alert" className="text-navy-950/80">
          O link de redefinição não é válido ou já foi utilizado. Peça um novo link para
          continuar.
        </p>
      </AuthCard>
    );
  }
  return <ResetPasswordForm email={email} token={token} />;
}
