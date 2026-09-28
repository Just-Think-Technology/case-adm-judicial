import Image from 'next/image';
import { MAPS_SEARCH_URL, SITE_CONTACT } from '@/lib/site';

// Navy footer with the white logo, contact channels and rights notice.
export function SiteFooter(): React.ReactNode {
  return (
    <footer className="bg-navy-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6">
        <div>
          <Image src="/img/logo-white.png" alt="Case Administração Judicial" width={200} height={44} />
          <p className="mt-4 max-w-sm text-sm text-white/70">
            Portal do Credor — envio e acompanhamento de documentos para processos de Recuperação
            Judicial e Falência.
          </p>
        </div>
        <address className="text-sm not-italic text-white/80">
          <p className="font-display text-base font-semibold text-white">Atendimento</p>
          <p className="mt-2">
            <a className="hover:text-gold-500" href={`tel:${SITE_CONTACT.phone.replace(/\D/g, '')}`}>
              {SITE_CONTACT.phone}
            </a>
          </p>
          <p className="mt-1">
            <a className="hover:text-gold-500" href={`mailto:${SITE_CONTACT.email}`}>
              {SITE_CONTACT.email}
            </a>
          </p>
          <p className="mt-1">{SITE_CONTACT.address}</p>
          <p className="mt-1">
            <a className="hover:text-gold-500" href={MAPS_SEARCH_URL} target="_blank" rel="noreferrer">
              Ver no mapa
            </a>
          </p>
        </address>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-white/60 sm:px-6">
          © {new Date().getFullYear()} Case Administração Judicial — Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
