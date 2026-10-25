import { test, expect } from '@playwright/test';
test('project persists through UI reload and API restart', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('script[type="module"]')).toHaveAttribute('src', /^\/assets\/.+\.js$/);
  const health = await page.request.get('/api/health');
  expect(health.ok()).toBe(true);
  expect(await health.json()).toEqual({ status: 'ok' });
  if (process.env.E2E_PHASE === 'create') {
    await expect(page.getByText('No projects yet.')).toBeVisible();
    await page.getByLabel('Project name').fill('   ');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('alert')).toHaveText('Project name is required.');
    await page.screenshot({ path: info.outputPath('validation.png') });
    await page.getByLabel('Project name').fill('  Cloud persistence project  ');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('listitem')).toHaveText('Cloud persistence project');
    await expect(page.getByLabel('Project name')).toHaveValue('');
    await page.reload();
  }
  await expect(page.getByRole('listitem')).toHaveText('Cloud persistence project');
  await page.screenshot({
    path: info.outputPath(`${process.env.E2E_PHASE ?? 'invalid'}-persistence.png`),
  });
});
