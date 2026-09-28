import { cache } from 'react';
import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';

export interface Session {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Resolves the current visitor once per request: the Profile behind GET
// /account, or null when no session cookie answers. Every server component
// reads auth state through here — never through its own fetch.
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieHeader = (await cookies()).toString();
  if (!cookieHeader) return null;
  try {
    const upstream = await backendFetch('/account', { cookie: cookieHeader });
    if (!upstream.ok) return null;
    return (await upstream.json()) as Session;
  } catch {
    return null;
  }
});
