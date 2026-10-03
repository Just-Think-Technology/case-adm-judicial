'use client';

import { useState } from 'react';

const EMPTY_TEXT = 'Nenhum aviso disponível.';

// Long notices clamp to three lines with a "show more" that opens the full
// text in a dialog — long unbroken strings wrap instead of scrolling sideways.
export function ObservationsBox({ text }: { text: string | null }): React.ReactNode {
  const [open, setOpen] = useState(false);
  const content = text?.trim() ? text : null;
  return (
    <div className="mt-4 rounded-lg bg-gold-100 p-4">
      <p className="text-xs font-semibold tracking-wide text-gold-700 uppercase">OBS/AVISOS</p>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-navy-950">
        {content ?? EMPTY_TEXT}
      </p>
      {content ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1 text-sm font-semibold text-navy-950 underline decoration-gold-500 decoration-2 underline-offset-4 hover:text-gold-700"
        >
          Mostrar mais…
        </button>
      ) : null}
      {open && content ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Observações completas"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-display text-xl font-semibold text-navy-950">OBS/AVISOS</h2>
            <p className="mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-navy-950">{content}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 rounded-lg bg-navy-950 px-6 py-2 text-sm font-semibold text-white hover:bg-navy-800"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
