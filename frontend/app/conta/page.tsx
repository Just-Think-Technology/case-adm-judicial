import { redirect } from 'next/navigation';
import { AccountForms } from '@/components/account-forms';
import { getSession } from '@/lib/session';

export const metadata = { title: 'Minha conta — Portal do Credor' };

// Account menu (§4.6): profile and password cards for signed-in accounts.
export default async function AccountPage(): Promise<React.ReactNode> {
  const session = await getSession();
  if (!session) redirect('/login');
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-navy-950">Menu</h1>
      <p className="mt-2 text-navy-950/60">Seus dados junto à Administração Judicial.</p>
      <div className="mt-6">
        <AccountForms session={session} />
      </div>
    </div>
  );
}
