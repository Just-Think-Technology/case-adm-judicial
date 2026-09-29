import Link from 'next/link';

export interface FeaturedCase {
  id: string;
  name: string;
  processNumber: string;
  nature: string;
  documentCount: number;
}

const CREDITOR_TASKS = [
  'Enviar documentos de forma rápida e segura',
  'Acompanhar o andamento das suas solicitações',
  'Manter seus dados atualizados junto à Administração Judicial',
  'Habilitar-se para participar da Assembleia Geral de Credores (AGC)',
] as const;

// Visitor variant of the presentation page (§4.1): thesis first — the cases
// themselves, with a live featured file beside the headline — then what the
// creditor can do. Contact lives only in the footer; this stays a pure
// component so unit tests never cross next/headers.
export function LandingPage({ featured }: { featured?: FeaturedCase }): React.ReactNode {
  return (
    <>
      <section>
        <div className="mx-auto grid max-w-6xl gap-10 border-b border-navy-950/15 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-gold-700 uppercase">
              Case Administração Judicial
            </p>
            <h1 className="font-display mt-4 text-5xl leading-[1.02] font-semibold tracking-tight text-navy-950 sm:text-6xl">
              Portal do Credor
            </h1>
            <div aria-hidden className="mt-5 h-1 w-24 bg-gold-500" />
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-950/70">
              Espaço para envio e gestão de documentos ligados a processos de divergência e
              habilitação de crédito, procurações e demais informações necessárias à
              Administração Judicial.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/painel"
                className="rounded-lg bg-navy-950 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800"
              >
                Ver painel de documentos
              </Link>
              <Link
                href="/cadastro"
                className="rounded-lg border border-navy-950/25 bg-transparent px-6 py-3 text-sm font-semibold text-navy-950 hover:border-gold-600"
              >
                Criar cadastro
              </Link>
              <Link
                href="/login"
                className="rounded-lg px-4 py-3 text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
          {featured ? (
            <aside
              aria-label="Processo em destaque"
              className="rounded-2xl bg-navy-950 p-7 text-white shadow-xl sm:p-8"
            >
              <p className="text-xs font-bold tracking-[0.2em] text-gold-500 uppercase">
                Processo em destaque
              </p>
              <p className="font-display mt-3 text-2xl leading-snug font-semibold">{featured.name}</p>
              <p className="mt-2 text-sm text-white/60">{featured.processNumber}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white/10 px-3 py-1">{featured.nature}</span>
                <span className="rounded-full bg-white/10 px-3 py-1">
                  {featured.documentCount} {featured.documentCount === 1 ? 'documento público' : 'documentos públicos'}
                </span>
              </div>
              <Link
                href={`/empresas/${featured.id}`}
                className="mt-6 block rounded-lg bg-gold-500 px-4 py-2.5 text-center text-sm font-bold tracking-wide text-navy-950 hover:bg-gold-600"
              >
                ABRIR O PROCESSO
              </Link>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16" aria-labelledby="tasks-title">
        <p className="text-xs font-bold tracking-[0.2em] text-gold-700 uppercase">Do credor</p>
        <h2 id="tasks-title" className="font-display mt-2 text-3xl font-semibold tracking-tight text-navy-950">
          O que você pode fazer no portal
        </h2>
        <ul className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {CREDITOR_TASKS.map((task) => (
            <li
              key={task}
              className="flex items-start gap-4 border-t-2 border-navy-950/10 pt-4"
            >
              <span
                aria-hidden
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] bg-gold-500/20 text-xs font-bold text-gold-700"
              >
                ✓
              </span>
              <span className="text-[17px] leading-relaxed font-medium text-navy-950/85">{task}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
