'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const REDIRECT_AFTER_MS = 4000;

// Lets the confirmation land before moving on: after a short pause the same
// tab goes to login by itself — no click, no second tab.
export function AutoRedirect({ to }: { to: string }): React.ReactNode {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => router.push(to), REDIRECT_AFTER_MS);
    return () => window.clearTimeout(timer);
  }, [router, to]);
  return null;
}
