// Slim navy footer: the mark, the contact channels, and the centered rights
// notice — nothing else.
import { SITE_CONTACT } from '@/lib/site';

export function SiteFooter(): React.ReactNode {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <img src="/img/logo-white.png" alt="Case Administração Judicial" width={400} height={61} />
        <address className="text-sm not-italic text-white/80 sm:text-right">
          <p>
            <a className="hover:text-gold-500" href={`tel:${SITE_CONTACT.phone.replace(/\D/g, '')}`}>
              {SITE_CONTACT.phone}
            </a>
            {' · '}
            <a className="hover:text-gold-500" href={`mailto:${SITE_CONTACT.email}`}>
              {SITE_CONTACT.email}
            </a>
          </p>
          <p className="mt-1 text-white/60">{SITE_CONTACT.address}</p>
        </address>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-3 text-center text-xs text-white/60 sm:px-6">
          © {new Date().getFullYear()} Case Administração Judicial. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
