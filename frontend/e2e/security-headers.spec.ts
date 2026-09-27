import { test, expect } from '@playwright/test';

test.describe('security headers', () => {
  test('serves the documented policy on every page', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("object-src 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('never allows unsafe-eval in script-src', async ({ page }) => {
    const response = await page.goto('/');
    const policy = response?.headers()['content-security-policy'] ?? '';
    const scriptSrc = policy.split(';').find((d) => d.trim().startsWith('script-src'));

    expect(scriptSrc).toBeDefined();
    expect(scriptSrc).not.toContain('unsafe-eval');
  });

  test('hydrates under the policy — no blocked scripts, no React hydration error', async ({ page }) => {
    // A blocked inline script does not degrade the page, it breaks it: React
    // throws #412 and client-side navigation dies. Collecting the violations is
    // what makes this a real assertion rather than a rendering check.
    const violations: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (message) => {
      if (message.text().includes('Content Security Policy')) {
        violations.push(message.text());
      }
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/', { waitUntil: 'networkidle' });

    expect(violations).toEqual([]);
    expect(pageErrors.filter((e) => e.includes('#412'))).toEqual([]);
  });
});
