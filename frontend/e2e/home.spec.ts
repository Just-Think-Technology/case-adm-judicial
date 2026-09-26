import { test, expect } from '@playwright/test';

test.describe('landing page', () => {
  test('renders Portal do Credor heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Portal do Credor/i })).toBeVisible();
  });

  test('shows API contract links', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('/api/v1')).toBeVisible();
    await expect(page.getByText('/health')).toBeVisible();
  });
});
