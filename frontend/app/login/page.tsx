import { LoginForm } from '@/components/login-form';

export const metadata = { title: 'Entrar — Portal do Credor' };

// Carries the post-reset confirmation (§4.5 step 7): after redefining the
// password the user lands here with the success message waiting.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redefinida?: string }>;
}): Promise<React.ReactNode> {
  const { redefinida } = await searchParams;
  return <LoginForm notice={redefinida ? 'Senha redefinida com sucesso!' : undefined} />;
}
