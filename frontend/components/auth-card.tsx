import Link from 'next/link';

// Centered card shell for the public auth screens (signup, login, recovery).
export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-navy-950/10 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="font-display text-2xl font-semibold text-navy-950">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-navy-950/60">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-4 text-center text-sm text-navy-950/60">
        <Link href="/painel" className="underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
          Ver documentos públicos sem entrar
        </Link>
      </p>
    </div>
  );
}
