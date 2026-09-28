import type { Metadata } from 'next';
import { Jost, Open_Sans } from 'next/font/google';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import './globals.css';

// Self-hosted at build time: no runtime CDN, CSP font-src 'self' stays intact.
const display = Jost({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const body = Open_Sans({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Portal do Credor — Case Administração Judicial',
  description:
    'Envio e acompanhamento de documentos para processos de Recuperação Judicial e Falência.',
  icons: { icon: '/img/favicon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col font-sans text-navy-950 antialiased">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
