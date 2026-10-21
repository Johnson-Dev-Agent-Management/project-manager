import { test, expect } from '@playwright/test';

test.use({ colorScheme: 'light' });

test('switches with the keyboard and keeps the preference after reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
  await page.keyboard.press('Tab');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('color', 'rgb(241, 245, 249)');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('uses the device dark theme on a first visit', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
  await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(17, 24, 39)');
});

for (const theme of ['light', 'dark'] as const) {
  test(`applies a saved ${theme} theme before the app loads`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme === 'light' ? 'dark' : 'light' });
    await page.addInitScript(savedTheme => {
      localStorage.setItem('project-manager-theme', savedTheme);
    }, theme);
    await page.route('**/src/main.tsx', route => route.abort());
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('html')).toHaveCSS('color-scheme', theme);
    await expect(page.getByRole('main')).toHaveCount(0);
  });
}

test('ignores an invalid saved preference', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => localStorage.setItem('project-manager-theme', 'invalid'));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible();
});

test('works when browser storage is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.addInitScript(() => {
    for (const method of ['getItem', 'setItem']) {
      Object.defineProperty(Storage.prototype, method, { value() {
        throw new DOMException('Storage unavailable', 'SecurityError');
      } });
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.getByLabel('Project name')).toBeVisible();
  expect(errors).toEqual([]);
});

test('keeps the square button in the top right on a small screen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
  await expect(toggle).toBeVisible();
  const bounds = await toggle.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds?.width).toBe(44);
  expect(bounds?.height).toBe(44);
  expect(bounds?.x).toBeGreaterThan(250);
  expect(bounds?.y).toBeLessThan(40);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});
