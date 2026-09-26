import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal do Credor — Case Administração Judicial',
  description:
    'Envio e acompanhamento de documentos para processos de Recuperação Judicial e Falência.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
