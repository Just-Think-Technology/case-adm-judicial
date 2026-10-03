'use client';

import { useRouter } from 'next/navigation';
import { LogoutIcon } from '@/components/icons';

// Ends the session through the BFF and returns to the home page. Lives only
// inside the account menu, so it owns its menu-item look and tells the menu
// when it fired.
export function LogoutButton({ onDone }: { onDone?: () => void }): React.ReactNode {
  const router = useRouter();
  async function logout(): Promise<void> {
    await fetch('/bff/auth/logout', { method: 'POST' }).catch(() => null);
    onDone?.();
    router.push('/');
    router.refresh();
  }
  return (
    <button
      type="button"
      role="menuitem"
      onClick={logout}
      className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-navy-950 hover:bg-mist-50"
    >
      <LogoutIcon />
      Sair
    </button>
  );
}
