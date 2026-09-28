import Image from 'next/image';
import Link from 'next/link';

// Public header: light surface with the dark CASE logo. Authenticated slices
// will extend this with the user menu; the visitor variant only offers login.
export function SiteHeader(): React.ReactNode {
  return (
    <header className="sticky top-0 z-10 border-b border-navy-950/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="Portal do Credor — início">
          <Image src="/img/logo-header.png" alt="Case Administração Judicial" width={180} height={40} priority />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navegação principal">
          <Link href="/painel" className="rounded px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-mist-50">
            Painel de documentos
          </Link>
          <Link
            href="/login"
            className="rounded bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
