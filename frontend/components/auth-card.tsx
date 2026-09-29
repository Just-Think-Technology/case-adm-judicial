import Link from 'next/link';
import { BackButton } from '@/components/back-button';

// Card shell for the public auth screens (signup, login, recovery): roomy and
// centered in the viewport, never glued to the top.
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
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-4 py-14 sm:px-6">
      <BackButton href="/" label="INÍCIO" />
      <div className="mt-4 rounded-2xl border border-navy-950/10 bg-white p-7 shadow-sm sm:p-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-navy-950">{title}</h1>
        {subtitle ? <p className="mt-2 text-navy-950/60">{subtitle}</p> : null}
        <div className="mt-7">{children}</div>
      </div>
      <p className="mt-5 text-center text-sm text-navy-950/60">
        <Link href="/painel" className="underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600">
          Ver documentos públicos sem entrar
        </Link>
      </p>
    </div>
  );
}
