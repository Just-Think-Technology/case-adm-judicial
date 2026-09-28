'use client';

import { useRouter } from 'next/navigation';

// Ends the session through the BFF and returns to the login screen (§4.4).
export function LogoutButton(): React.ReactNode {
  const router = useRouter();
  async function logout(): Promise<void> {
    await fetch('/bff/auth/logout', { method: 'POST' }).catch(() => null);
    router.push('/login');
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      className="block w-full rounded px-3 py-2 text-left text-sm text-navy-950 hover:bg-mist-50"
    >
      Sair
    </button>
  );
}
