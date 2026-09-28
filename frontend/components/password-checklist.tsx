import type { PasswordCheck } from '@/lib/password-rules';

// Live rule list: each requirement flips between met and unmet while typing,
// and the submit button stays disabled until every rule passes (§4.2).
export function PasswordChecklist({ checks }: { checks: PasswordCheck[] }): React.ReactNode {
  return (
    <ul aria-label="Requisitos da senha" className="mt-3 space-y-1.5 text-sm">
      {checks.map((check) => (
        <li key={check.id} className={check.passes ? 'text-navy-950' : 'text-navy-950/50'}>
          <span
            aria-hidden
            className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
              check.passes ? 'bg-navy-950 text-gold-500' : 'bg-navy-950/10 text-navy-950/40'
            }`}
          >
            {check.passes ? '✓' : '○'}
          </span>
          {check.label}
        </li>
      ))}
    </ul>
  );
}
