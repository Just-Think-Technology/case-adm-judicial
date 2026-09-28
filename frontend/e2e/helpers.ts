import { expect, type Page } from '@playwright/test';

export async function loginAs(page: Page, email: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page).toHaveURL(/\/painel$/);
}
