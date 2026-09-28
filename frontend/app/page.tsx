import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';
import { getSession } from '@/lib/session';

// Presentation page (§4.1): visitors see the landing, signed-in accounts are
// forwarded to the corporate panel instead.
export default async function Home(): Promise<React.ReactNode> {
  if (await getSession()) redirect('/painel');
  return <LandingPage />;
}
