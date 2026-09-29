import Link from 'next/link';

// Uniform way back for every screen: an understated gold-underlined link.
// Screens pass their own destination (usually the panel).
export function BackButton({ href, label = 'VOLTAR' }: { href: string; label?: string }): React.ReactNode {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700"
    >
      ← {label}
    </Link>
  );
}
