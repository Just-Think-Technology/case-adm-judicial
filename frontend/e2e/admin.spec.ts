import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

async function fillCompany(page: Parameters<typeof loginAs>[0], name: string): Promise<void> {
  await page.getByLabel('Nome da empresa').fill(name);
  await page.getByLabel('Administrador Judicial').fill('Case Administração Judicial');
  await page.getByLabel('Juiz de direito').fill('Juíza Exemplar');
  await page.getByLabel('Natureza').selectOption('Falência');
  await page.getByLabel('Número do processo').fill('1001111-22.2026.8.11.0003');
  await page.getByLabel('Protocolo').fill('2026-09-25');
  await page.getByLabel('Autor').fill('Autor Exemplar');
  await page.getByLabel('Comarca / Escrivania').fill('Vara Exemplar');
  await page.getByLabel('Observações').fill('Observação de teste');
}

test.describe('admin panel', () => {
  test('shows the Clientes and Nova empresa panel actions and the card menus', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await expect(page.getByRole('banner').getByRole('link', { name: 'Nova empresa' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Nova empresa' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Clientes' })).toBeVisible();
        await expect(page.locator('summary[aria-label="Opções de Alvorada Alimentos Ltda"]')).toBeVisible();
  });

  test('creates a company and confirms', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/empresas/nova');
    await fillCompany(page, 'Nova Empresa SA');
    await page.getByRole('button', { name: 'ADICIONAR' }).click();
    await expect(page.getByRole('status')).toContainText('Empresa cadastrada com sucesso!');
  });

  test('edits a company prefilled and confirms', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/empresas/c1/editar');
    await expect(page.getByLabel('Nome da empresa')).toHaveValue('Alvorada Alimentos Ltda');
    await page.getByLabel('Nome da empresa').fill('Alvorada Renomeada Ltda');
    await page.getByRole('button', { name: 'SALVAR' }).click();
    await expect(page.getByRole('status')).toContainText('Empresa atualizada com sucesso!');
  });

  test('removes a company with confirmation and a notice', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/painel');
    await page.locator('summary[aria-label="Opções de Alvorada Alimentos Ltda"]').click();
    await page.getByRole('button', { name: 'REMOVER' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('Tem certeza que deseja remover');
    await page.getByRole('alertdialog').getByRole('button', { name: 'REMOVER' }).click();
    await expect(page.getByRole('heading', { name: 'Alvorada Alimentos Ltda' })).toHaveCount(0);
    await expect(page.getByText("Empresa 'Alvorada Alimentos Ltda' foi removido(a) com sucesso!")).toBeVisible();
  });

  test('visitors go to login and creditors to 403 on company forms', async ({ page }) => {
    await page.goto('/empresas/nova');
    await expect(page).toHaveURL(/\/login$/);
    await loginAs(page, 'credor@case.com');
    await page.goto('/empresas/nova');
    await expect(page.getByRole('heading', { name: /acesso proibido/i })).toBeVisible();
    await expect(page.getByRole('banner').getByRole('link', { name: 'Nova empresa' })).not.toBeVisible();
  });
});

test.describe('admin clients', () => {
  test('searches clients and opens their documents with stats', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/clientes');
    await expect(page.getByText('Credor Teste')).toBeVisible();
    await page.getByPlaceholder(/nome ou e-mail/i).fill('outro@case.com');
    await expect(page.getByText('Outro Credor')).toBeVisible();
    await expect(page.getByText('Credor Teste')).not.toBeVisible();
    await page.getByPlaceholder(/nome ou e-mail/i).fill('');
    await page.getByPlaceholder(/nome da empresa/i).fill('pantanal');
    await expect(page.getByText('Outro Credor')).toBeVisible();
    await page.getByPlaceholder(/nome da empresa/i).fill('');
    await page.getByRole('link', { name: 'ACESSAR' }).first().click();
    await expect(page).toHaveURL(/\/clientes\/u1$/);
    await expect(page.getByRole('heading', { name: 'Credor Teste' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Petição inicial.pdf' })).toBeVisible();
  });

  test('shows stats and document cards without a table', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/clientes/u1');
    await expect(page.getByText('Total')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Petição inicial.pdf' })).toBeVisible();
    await expect(page.getByText('Em análise').first()).toBeVisible();
  });

  test('removes a client with confirmation, sparing its own card', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/clientes');
    await expect(page.locator('summary[aria-label="Opções de Admin Teste"]')).toHaveCount(0);
    await page.locator('summary[aria-label="Opções de Credor Teste"]').click();
    await page.getByRole('button', { name: 'REMOVER' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('remover');
    await page.getByRole('alertdialog').getByRole('button', { name: 'REMOVER' }).click();
    await expect(page.getByText("Cliente 'Credor Teste' foi removido(a) com sucesso!")).toBeVisible();
  });

  test('creditors get 403 on client documents', async ({ page }) => {
    await loginAs(page, 'credor@case.com');
    await page.goto('/clientes/u1');
    await expect(page.getByRole('heading', { name: /acesso proibido/i })).toBeVisible();
  });
});

test.describe('admin company documents', () => {
  test('manages status, visibility and deletion with confirmation', async ({ page }) => {
    await loginAs(page, 'admin@case.com');
    await page.goto('/empresas/c1');
    await expect(page.getByText('Adicionado por Credor Teste')).toBeVisible();
    await expect(page.getByText('Público').first()).toBeVisible();
    await page.getByLabel('Status de Petição inicial.pdf').selectOption('Deferido');
    await expect(page.getByText(/marcado como Deferido/i)).toBeVisible();
    await page.getByRole('button', { name: /tornar privado/i }).click();
    await expect(page.getByRole('alertdialog')).toContainText('restringir');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'agora é privado' })).toBeVisible();
    await expect(page.getByRole('button', { name: /tornar público: petição inicial/i })).toBeVisible();
    await page.getByRole('button', { name: /excluir lista de credores/i }).click();
    await expect(page.getByRole('alertdialog')).toContainText('não pode ser desfeita');
    await page.getByRole('button', { name: 'EXCLUIR', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'foi removido' })).toBeVisible();
  });
});
