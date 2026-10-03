import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('E-mail').fill('credor@case.com');
  await page.getByLabel('Senha', { exact: true }).fill('Segura@123');
  await page.getByRole('button', { name: 'ENTRAR' }).click();
  await expect(page).toHaveURL(/\/painel$/);
}

async function control(request: APIRequestContext, body: unknown): Promise<void> {
  await request.post('http://127.0.0.1:3000/__control', { data: body });
}

test.describe('creditor documents', () => {
  test.beforeEach(async ({ request }) => {
    await control(request, { failUpload: false, resetDocuments: true });
  });

  test('filters by scope with status on the creditor documents', async ({ page }) => {
    await login(page);
    await page.goto('/empresas/c1');
    await expect(page.getByText('Petição inicial.pdf')).toBeVisible();
    await page.getByRole('button', { name: 'Meus documentos' }).click();
    await expect(page.getByText('Petição inicial.pdf')).toBeVisible();
    await expect(page.getByText('Lista de credores.xlsx')).not.toBeVisible();
    await expect(page.getByText('Em análise')).toBeVisible();
    await page.getByRole('button', { name: 'Documentos dos administradores' }).click();
    await expect(page.getByText('Lista de credores.xlsx')).toBeVisible();
    await expect(page.getByText('Petição inicial.pdf')).not.toBeVisible();
  });

  test('upload sends two documents and returns to the company', async ({ page }) => {
    await login(page);
    await page.goto('/empresas/c1');
    await page.getByRole('link', { name: /enviar documentos/i }).click();
    await expect(page).toHaveURL(/\/empresas\/c1\/enviar$/);
    await expect(page.getByRole('article', { name: 'Documento 1' })).toBeVisible();
    await page.getByRole('button', { name: 'Novo documento' }).click();
    for (const index of [0, 1]) {
      const article = page.getByRole('article', { name: `Documento ${index + 1}` });
      await article.getByLabel('Nome do documento').fill(`Comprovante ${index + 1}`);
      await article.getByLabel('Descrição do documento').fill('Comprovante de crédito');
      await article
        .getByLabel(/arquivo/i)
        .setInputFiles({ name: `doc${index}.pdf`, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-stub') });
    }
    await page.getByRole('button', { name: 'ENVIAR TODOS' }).click();
    await expect(page).toHaveURL(/\/empresas\/c1$/);
  });

  test('failed uploads stay on screen for a new attempt', async ({ page, request }) => {
    await login(page);
    await control(request, { failUpload: true });
    await page.goto('/empresas/c1/enviar');
    const article = page.getByRole('article', { name: 'Documento 1' });
    await article.getByLabel('Nome do documento').fill('Comprovante');
    await article.getByLabel('Descrição do documento').fill('Comprovante de crédito');
    await article
      .getByLabel(/arquivo/i)
      .setInputFiles({ name: 'doc.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-stub') });
    await page.getByRole('button', { name: 'ENVIAR TODOS' }).click();
    await expect(page.getByText(/0 de 1 documentos enviados com sucesso/i)).toBeVisible();
    await expect(page).toHaveURL(/\/enviar$/);
    await expect(article.getByText('Comprovante')).toBeVisible();
    await control(request, { failUpload: false });
    await page.getByRole('button', { name: 'ENVIAR TODOS' }).click();
    await expect(page).toHaveURL(/\/empresas\/c1$/);
  });

  test('visitors are sent to login from the upload and account pages', async ({ page }) => {
    await page.goto('/empresas/c1/enviar');
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/conta');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('account menu', () => {
  test('updates name and e-mail and greets with the new name', async ({ page }) => {
    await login(page);
    await page.getByRole('banner').getByText('Credor Teste').click();
    await page.getByRole('menuitem', { name: 'Minha conta' }).click();
    await expect(page).toHaveURL(/\/conta$/);
    const save = page.getByRole('button', { name: 'Salvar' }).first();
    await expect(save).toBeDisabled();
    await page.getByLabel('Nome', { exact: true }).fill('Credora Atualizada');
    await expect(save).toBeEnabled();
    await save.click();
    await expect(page.getByText('Dados atualizados!')).toBeVisible();
    await expect(page.getByRole('banner').getByText('Credora Atualizada')).toBeVisible();
  });

  test('changes the password and complains about the wrong current one', async ({ page }) => {
    await login(page);
    await page.goto('/conta');
    await page.getByLabel('Senha atual').fill('errada');
    await page.getByLabel('Nova senha', { exact: true }).fill('Nova@456');
    await page.getByLabel('Confirmar nova senha').fill('Nova@456');
    await page.getByRole('button', { name: 'Salvar' }).nth(1).click();
    await expect(page.getByText('Senha atual incorreta.')).toBeVisible();
    await page.getByLabel('Senha atual').fill('Segura@123');
    await page.getByRole('button', { name: 'Salvar' }).nth(1).click();
    await expect(page.getByText('Senha alterada com sucesso!')).toBeVisible();
  });
});
