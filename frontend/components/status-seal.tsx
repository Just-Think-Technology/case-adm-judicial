const STYLES: Record<string, string> = {
  'Em análise': 'bg-amber-100 text-amber-800 ring-amber-200',
  Deferido: 'bg-green-100 text-green-800 ring-green-200',
  Indeferido: 'bg-red-100 text-red-800 ring-red-200',
};

// Analysis status seal — the creditor's tracking indicator (§4.11). Shown on
// the creditor's own documents; visitors never reach this component.
export function StatusSeal({ status }: { status: string }): React.ReactNode {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLES[status] ?? 'bg-mist-50 text-navy-950/60 ring-navy-950/10'}`}
    >
      {status}
    </span>
  );
}
