import { LoginForm } from '@/components/login-form';


// Carries arrival confirmations: post-signup (§4.2) and post-reset (§4.5) land
// here with the message waiting as a toast.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redefinida?: string; cadastrado?: string }>;
}): Promise<React.ReactNode> {
  const { redefinida, cadastrado } = await searchParams;
  const notice = cadastrado
    ? 'Cadastro realizado com sucesso! Verifique seu e-mail para ativar a conta, inclusive a caixa de spam.'
    : redefinida
      ? 'Senha redefinida com sucesso!'
      : undefined;
  return <LoginForm notice={notice} />;
}
