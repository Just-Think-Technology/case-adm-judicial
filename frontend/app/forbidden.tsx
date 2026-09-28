import Link from 'next/link';

// Branded 403 (§4.18): restricted corners (company forms, client documents)
// refuse non-administrators here instead of leaking the layout.
export default function Forbidden(): React.ReactNode {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="font-display text-6xl font-semibold text-navy-950/20">403</p>
      <h1 className="font-display mt-4 text-2xl font-semibold text-navy-950">Acesso proibido</h1>
      <p className="mt-2 text-navy-950/60">
        Esta área é restrita à equipe da administração judicial.
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
