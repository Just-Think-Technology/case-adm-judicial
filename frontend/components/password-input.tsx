'use client';

import { useState } from 'react';

// Password field with the eye toggle from §4.4 — show or hide what was typed.
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}): React.ReactNode {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-navy-950">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-lg border border-navy-950/15 bg-paper-50 px-3 py-2 pr-11 text-navy-950 focus:border-gold-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-navy-950/50 hover:text-navy-950"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

function EyeIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function EyeOffIcon(): React.ReactNode {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 4l12 12M7 5.5A9.6 9.6 0 0 1 10 4.5c5 0 8 5.5 8 5.5a17 17 0 0 1-3 3.4M6 7A16 16 0 0 0 2 10s3 5.5 8 5.5c1 0 2-.2 2.8-.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
