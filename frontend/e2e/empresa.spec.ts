import { test, expect } from '@playwright/test';

test.describe('company page', () => {
  test('shows case data and public documents', async ({ page }) => {
    await page.goto('/empresas/c1');
    await expect(page.getByRole('heading', { name: 'Alvorada Alimentos Ltda' })).toBeVisible();
    await expect(page.getByText('1001234-56.2026.8.11.0001').first()).toBeVisible();
    await expect(page.getByText('Assembleia marcada para outubro.')).toBeVisible();
    await expect(page.getByText('Petição inicial.pdf')).toBeVisible();
    await expect(page.getByText('Lista de credores.xlsx')).toBeVisible();
  });

  test('falls back to Não informado and Nenhum aviso disponível', async ({ page }) => {
    await page.goto('/empresas/c2');
    await expect(page.getByText('Nenhum aviso disponível.')).toBeVisible();
    await expect(page.getByText('Nenhum documento encontrado para essa empresa.')).toBeVisible();
  });

  test('VOLTAR returns to the panel and ENVIAR DOCUMENTOS asks for login', async ({ page }) => {
    await page.goto('/empresas/c1');
    await expect(page.getByRole('link', { name: /voltar/i })).toHaveAttribute('href', '/painel');
    await expect(page.getByRole('link', { name: /enviar documentos/i })).toHaveAttribute('href', '/login');
  });

  test('unknown company renders the branded 404', async ({ page }) => {
    await page.goto('/empresas/inexistente');
    await expect(page.getByRole('heading', { name: /página não encontrada/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /voltar ao painel/i })).toBeVisible();
  });
});
