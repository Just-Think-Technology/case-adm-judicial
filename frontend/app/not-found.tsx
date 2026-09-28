import Link from 'next/link';

// Branded 404 (§4.18): the office mark lives in the header/footer shell, the
// page offers the way back to the panel.
export default function NotFound(): React.ReactNode {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-display text-6xl font-semibold text-navy-950/20">404</p>
      <h1 className="font-display mt-4 text-2xl font-semibold text-navy-950">Página não encontrada</h1>
      <p className="mt-2 text-navy-950/60">
        O endereço não existe ou o registro foi removido.
      </p>
      <Link
        href="/painel"
        className="mt-6 inline-block rounded-lg bg-navy-950 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
