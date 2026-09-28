'use client';

// Blocking confirmation for destructive admin actions (removals, visibility
// flips): states the consequence and requires an explicit confirm — there is
// no undo, so there is no one-click delete anywhere.
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}): React.ReactNode {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-navy-950/50 p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-display text-xl font-semibold text-navy-950">{title}</h2>
        <p className="mt-2 text-sm text-navy-950/70">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-navy-950/20 px-4 py-2 text-sm font-semibold text-navy-950 hover:border-gold-500 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-40"
          >
            {busy ? 'Removendo…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
