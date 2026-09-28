import { test, expect } from '@playwright/test';

test.describe('landing page', () => {
  test('welcomes to the Portal do Credor with the four tasks', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Portal do Credor/i })).toBeVisible();
    for (const task of [/rápida e segura/, /andamento das suas solicitações/, /dados atualizados/, /Assembleia Geral/]) {
      await expect(page.getByText(task).first()).toBeVisible();
    }
  });

  test('shortcuts reach the panel, signup and login', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: /painel de documentos/i })).toHaveAttribute('href', '/painel');
    await expect(main.getByRole('link', { name: /criar cadastro/i })).toHaveAttribute('href', '/cadastro');
  });

  test('shows the office contact channels', async ({ page }) => {
    await page.goto('/');
    const main = page.getByRole('main');
    await expect(main.getByText('(65) 3358-4126')).toBeVisible();
    await expect(main.getByText('contato@caseadmjudicial.com.br')).toBeVisible();
  });
});
