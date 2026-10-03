// Shared pictograms — one home per icon (second-use rule): the first
// duplicate extracts here instead of a third copy somewhere else.

export function TrashIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6 5.5l1 11h6l1-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UserIcon(): React.ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="10" cy="6.5" r="3" />
      <path d="M3.5 16.5c1-3.2 3.5-4.5 6.5-4.5s5.5 1.3 6.5 4.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon(): React.ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M8 3.5H4.5v13H8M13 6.5l3.5 3.5-3.5 3.5M16 10H8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spinner(): React.ReactNode {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden className="animate-spin">
      <path d="M10 2.5a7.5 7.5 0 1 0 7.5 7.5" strokeLinecap="round" />
    </svg>
  );
}
