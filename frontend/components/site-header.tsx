import Link from 'next/link';
import { UserMenu } from '@/components/user-menu';
import { getSession } from '@/lib/session';

// Fixed header (§8): office mark, navigation links, and the user menu. The
// visitor variant only offers login; sessions resolve server-side per request.
export async function SiteHeader(): Promise<React.ReactNode> {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-10 border-b border-navy-950/15 bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center" aria-label="Portal do Credor: início">
          <img src="/img/logo-header.png" alt="Case Administração Judicial" width={200} height={29} />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navegação principal">
          <Link href="/painel" className="rounded-lg bg-navy-950/[0.06] px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-navy-950/[0.1]">
            Painel de documentos
          </Link>
          {session ? (
            <UserMenu name={session.name} />
          ) : (
            <>
              <Link
                href="/cadastro"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-950 hover:bg-paper-100"
              >
                Criar conta
              </Link>
              <Link
                href="/login"
                className="rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Entrar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
