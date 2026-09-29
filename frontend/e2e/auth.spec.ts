import { test, expect } from '@playwright/test';

test.describe('signup', () => {
  test('creates the account and points back to login', async ({ page }) => {
    await page.goto('/cadastro');
    const submit = page.getByRole('button', { name: 'CADASTRAR' });
    await expect(submit).toBeDisabled();
    await page.getByLabel('Nome').fill('Maria Silva');
    await page.getByLabel('E-mail').fill('maria@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
    await page.getByLabel('Confirmar senha').fill('Segura@123');
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page).toHaveURL(/\/login\?cadastrado=1$/);
    await expect(page.getByText(/verifique seu e-mail para ativar a conta/i)).toBeVisible();
  });

  test('shows the taken-e-mail error without leaving the form', async ({ page }) => {
    await page.goto('/cadastro');
    await page.getByLabel('Nome').fill('Maria Silva');
    await page.getByLabel('E-mail').fill('usada@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
    await page.getByLabel('Confirmar senha').fill('Segura@123');
    await page.getByRole('button', { name: 'CADASTRAR' }).click();
    await expect(page.getByText(/já está cadastrado/i)).toBeVisible();
  });
});

test.describe('login', () => {
  test('verified accounts land on the panel showing their name', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('credor@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
    await page.getByRole('button', { name: 'ENTRAR' }).click();
    await expect(page).toHaveURL(/\/painel$/);
    await expect(page.getByRole('banner').getByText('Credor Teste')).toBeVisible();
  });

  test('wrong credentials stay on login with the message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('credor@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('errada');
    await page.getByRole('button', { name: 'ENTRAR' }).click();
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('unverified accounts get the warning plus a prefilled resend', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('novo@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
    await page.getByRole('button', { name: 'ENTRAR' }).click();
    await expect(page.getByText(/necessário validar o e-mail/i)).toBeVisible();
    await page.getByRole('button', { name: /reenviar e-mail/i }).click();
    await expect(page.getByText(/verifique também a caixa de spam/i)).toBeVisible();
  });

  test('logout returns to the visitor header', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('credor@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
    await page.getByRole('button', { name: 'ENTRAR' }).click();
    await expect(page).toHaveURL(/\/painel$/);
    await page.getByRole('banner').getByText('Credor Teste').click();
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('banner').getByRole('link', { name: 'Entrar' })).toBeVisible();
  });

  test('signed-in visitors are forwarded from the landing to the panel', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-mail').fill('credor@case.com');
    await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
    await page.getByRole('button', { name: 'ENTRAR' }).click();
    await expect(page).toHaveURL(/\/painel$/);
    await page.goto('/');
    await expect(page).toHaveURL(/\/painel$/);
  });
});

test.describe('recovery', () => {
  test('known and unknown addresses get their respective messages', async ({ page }) => {
    await page.goto('/esqueci-senha');
    await page.getByLabel('E-mail').fill('credor@case.com');
    await page.getByRole('button', { name: /enviar link/i }).click();
    await expect(page.getByRole('status')).toContainText(/redefinição enviado/i);
    await page.getByLabel('E-mail').fill('ninguem@case.com');
    await page.getByRole('button', { name: /enviar link/i }).click();
    await expect(page.getByRole('status')).toContainText(/não foi encontrado usuário/i);
  });

  test('valid reset links show the readonly address and finish at login', async ({ page }) => {
    await page.goto('/redefinir-senha?token=valido');
    const address = page.getByLabel('E-mail');
    await expect(address).toHaveValue('credor@case.com');
    await expect(address).toHaveAttribute('readonly', '');
    await page.getByLabel('Nova senha', { exact: true }).fill('Nova@456');
    await page.getByLabel('Confirmar nova senha').fill('Nova@456');
    await page.getByRole('button', { name: 'REDEFINIR' }).click();
    await expect(page).toHaveURL(/\/login\?redefinida=1$/);
    await expect(page.getByRole('status')).toContainText(/senha redefinida com sucesso/i);
  });

  test('forged reset links explain and offer a new one', async ({ page }) => {
    await page.goto('/redefinir-senha?token=forjado');
    await expect(page.getByText(/não é válido ou já foi utilizado/i)).toBeVisible();
  });

  test('verification links confirm or explain', async ({ page }) => {
    await page.goto('/verificar-email?token=valido');
    await expect(page.getByRole('heading', { name: /verificado com sucesso/i })).toBeVisible();
    await expect(page.getByText(/pode ser fechada/i)).toBeVisible();
    await page.goto('/verificar-email?token=forjado');
    await expect(page.getByText(/não é válido/i).first()).toBeVisible();
  });
});
