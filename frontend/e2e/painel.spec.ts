import { test, expect, type APIRequestContext } from '@playwright/test';

async function setStubFailure(request: APIRequestContext, body: unknown): Promise<void> {
  await request.post('http://127.0.0.1:3000/__control', { data: body });
}

test.describe('corporate panel', () => {
  // Serial on purpose: the outage test mutates shared stub state, and
  // fullyParallel would leak failCompanies=true into the sibling tests.
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(async ({ request }) => {
    await setStubFailure(request, { failCompanies: false });
  });

  test('lists RJ companies first and switches to Falência', async ({ page }) => {
    await page.goto('/painel');
    await expect(page.getByRole('heading', { name: /painel corporativo/i })).toBeVisible();
    await expect(page.getByText('Alvorada Alimentos Ltda')).toBeVisible();
    await expect(page.getByText('Pantanal Transportes SA')).not.toBeVisible();
    await page.getByRole('tab', { name: 'Falência' }).click();
    await expect(page.getByText('Pantanal Transportes SA')).toBeVisible();
    await expect(page.getByText('Alvorada Alimentos Ltda')).not.toBeVisible();
  });

  test('searches instantly by name and process number', async ({ page }) => {
    await page.goto('/painel');
    const search = page.getByPlaceholder(/buscar por empresa ou processo/i);
    await search.fill('alvorada');
    await expect(page.getByText('Alvorada Alimentos Ltda')).toBeVisible();
    await search.fill('1001234');
    await expect(page.getByText('Alvorada Alimentos Ltda')).toBeVisible();
    await search.fill('inexistente');
    await expect(page.getByText(/tente buscar por outro termo/i)).toBeVisible();
  });

  test('sorts by name and by creation date', async ({ page }) => {
    await page.goto('/painel');
    await page.getByRole('tab', { name: 'Falência' }).click();
    const cards = page.getByTestId('company-card');
    await expect(cards.nth(0)).toContainText('Pantanal Transportes SA');
    await page.getByLabel('Ordenar por nome').selectOption('az');
    await expect(cards.nth(0)).toContainText('Aruana Logística Ltda');
    await page.getByLabel('Ordenar por data de criação').selectOption('old');
    await expect(cards.nth(0)).toContainText('Aruana Logística Ltda');
    await page.getByLabel('Ordenar por data de criação').selectOption('new');
    await expect(cards.nth(0)).toContainText('Pantanal Transportes SA');
  });

  test('opens the company page from ACESSAR', async ({ page }) => {
    await page.goto('/painel');
    await page.getByRole('link', { name: 'ACESSAR' }).first().click();
    await expect(page).toHaveURL(/\/empresas\/c1$/);
    await expect(page.getByRole('heading', { name: 'Alvorada Alimentos Ltda' })).toBeVisible();
  });

  test('shows a friendly message when the backend is down', async ({ page, request }) => {
    await setStubFailure(request, { failCompanies: true });
    await page.goto('/painel');
    await expect(page.getByRole('alert')).toContainText(/não foi possível carregar/i);
  });
});
