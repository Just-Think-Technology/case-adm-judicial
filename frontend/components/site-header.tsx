import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';
import { getSession } from '@/lib/session';

// Fixed header (§8): office mark, navigation links, and the user menu. The
// visitor variant only offers login; sessions resolve server-side per request.
export async function SiteHeader(): Promise<React.ReactNode> {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-10 border-b border-navy-950/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="Portal do Credor — início">
          <img src="/img/logo-header.png" alt="Case Administração Judicial" width={180} height={40} />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navegação principal">
          <Link href="/painel" className="rounded px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-mist-50">
            Painel de documentos
          </Link>
          {session?.role === 'ADMIN' ? (
            <Link href="/empresas/nova" className="rounded px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-mist-50">
              Empresas
            </Link>
          ) : null}
          {session ? (
            <details className="relative">
              <summary className="cursor-pointer list-none rounded bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800">
                {session.name}
              </summary>
              <div className="absolute right-0 mt-2 w-44 rounded-lg border border-navy-950/10 bg-white p-1 shadow-lg">
                <Link
                  href="/conta"
                  className="block rounded px-3 py-2 text-sm text-navy-950 hover:bg-mist-50"
                >
                  Menu
                </Link>
                <LogoutButton />
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="rounded bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
