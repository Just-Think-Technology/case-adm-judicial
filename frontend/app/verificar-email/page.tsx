import Link from 'next/link';
import { AuthCard } from '@/components/auth-card';
import { backendFetch } from '@/lib/backend';

export const metadata = { title: 'Verificar e-mail — Portal do Credor' };

// Landing of the mailed confirmation link (§4.3): valid links confirm the
// account and point at login, anything else explains the link is not valid.
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}): Promise<React.ReactNode> {
  const { token } = await searchParams;
  let verified = false;
  if (token) {
    try {
      const upstream = await backendFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
      verified = upstream.ok;
    } catch {
      verified = false;
    }
  }
  if (!verified) {
    return (
      <AuthCard title="Link inválido">
        <p role="alert" className="text-navy-950/80">
          O link de verificação não é válido.
        </p>
      </AuthCard>
    );
  }
  return (
    <AuthCard title="E-mail verificado com sucesso!">
      <p role="status" className="text-navy-950/80">
        Sua conta está ativa. Entre com seu e-mail e senha — se esta página abriu em outra
        aba, ela já pode ser fechada.
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
