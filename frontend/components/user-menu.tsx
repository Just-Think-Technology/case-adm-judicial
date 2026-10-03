'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { UserIcon } from '@/components/icons';
import { LogoutButton } from '@/components/logout-button';

// Account menu: opens on the name, closes on the name again, on Escape, or on
// any click outside — a <details> alone never closes on outside clicks.
export function UserMenu({ name }: { name: string }): React.ReactNode {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent): void {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open ]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        title={open ? 'Fechar o menu da conta' : 'Abrir o menu da conta'}
        onClick={() => setOpen((current) => !current)}
        className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg bg-navy-950 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800 hover:ring-2 hover:ring-gold-500"
      >
        {name}
        <span aria-hidden className={`text-gold-500 transition ${open ? 'rotate-180' : ''}`}>
          <ChevronIcon />
        </span>
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-10 mt-2 w-44 rounded-lg border border-navy-950/10 bg-white p-1 shadow-lg">
          <Link
            href="/conta"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded px-3 py-2 text-sm text-navy-950 hover:bg-mist-50"
          >
            <UserIcon />
            Minha conta
          </Link>
          <LogoutButton onDone={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon(): React.ReactNode {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="m5 7.5 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
