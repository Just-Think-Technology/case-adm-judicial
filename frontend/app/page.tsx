import Link from 'next/link';
import { MAPS_SEARCH_URL, SITE_CONTACT } from '@/lib/site';

const CREDITOR_TASKS = [
  'Enviar documentos de forma rápida e segura',
  'Acompanhar o andamento das suas solicitações',
  'Manter seus dados atualizados junto à Administração Judicial',
  'Habilitar-se para participar da Assembleia Geral de Credores (AGC)',
] as const;

// Presentation page (§4.1): welcome, what the creditor can do, shortcuts and
// contact channels. Authenticated visitors are redirected inside by later
// slices; this slice serves the visitor variant.
export default function LandingPage(): React.ReactNode {
  return (
    <>
      <section className="border-b border-navy-950/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-sm font-semibold tracking-widest text-gold-600 uppercase">
            Case Administração Judicial
          </p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl font-semibold text-navy-950 sm:text-5xl">
            Portal do Credor
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-navy-950/70">
            Espaço para envio e gestão de documentos ligados a processos de divergência e
            habilitação de crédito, procurações e demais informações necessárias à Administração
            Judicial.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/painel"
              className="rounded-lg bg-navy-950 px-6 py-3 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Ver painel de documentos
            </Link>
            <Link
              href="/cadastro"
              className="rounded-lg border border-navy-950/20 bg-white px-6 py-3 text-sm font-semibold text-navy-950 hover:border-gold-500"
            >
              Criar cadastro
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-6 py-3 text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-600"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="tasks-title">
        <h2 id="tasks-title" className="font-display text-2xl font-semibold text-navy-950">
          O que você pode fazer no portal
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {CREDITOR_TASKS.map((task) => (
            <li
              key={task}
              className="flex items-start gap-3 rounded-xl border border-navy-950/10 bg-white p-5 shadow-sm"
            >
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-950 text-sm font-bold text-gold-500"
              >
                ✓
              </span>
              <span className="text-navy-950/80">{task}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-navy-950/10 bg-white" aria-labelledby="contact-title">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 id="contact-title" className="font-display text-2xl font-semibold text-navy-950">
            Canais de atendimento
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <a
              href={`tel:${SITE_CONTACT.phone.replace(/\D/g, '')}`}
              className="rounded-xl border border-navy-950/10 p-5 shadow-sm hover:border-gold-500"
            >
              <p className="text-sm font-semibold tracking-wide text-navy-950/60 uppercase">Telefone</p>
              <p className="font-display mt-1 text-lg font-semibold text-navy-950">{SITE_CONTACT.phone}</p>
            </a>
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="rounded-xl border border-navy-950/10 p-5 shadow-sm hover:border-gold-500"
            >
              <p className="text-sm font-semibold tracking-wide text-navy-950/60 uppercase">E-mail</p>
              <p className="font-display mt-1 text-lg font-semibold break-all text-navy-950">
                {SITE_CONTACT.email}
              </p>
            </a>
            <a
              href={MAPS_SEARCH_URL}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-navy-950/10 p-5 shadow-sm hover:border-gold-500"
            >
              <p className="text-sm font-semibold tracking-wide text-navy-950/60 uppercase">Endereço</p>
              <p className="mt-1 text-sm text-navy-950/80">{SITE_CONTACT.address}</p>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
