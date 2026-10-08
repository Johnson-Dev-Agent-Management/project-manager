import { test, expect } from '@playwright/test';
test('project persists through UI reload and API restart', async ({ page }) => {
  await page.goto('/');
  if (process.env.E2E_PHASE === 'create') {
    await expect(page.getByText('No projects yet.')).toBeVisible();
    await page.getByLabel('Project name').fill('   ');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('alert')).toHaveText('Project name is required.');
    await page.getByLabel('Project name').fill('Cloud persistence project');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('listitem')).toHaveText('Cloud persistence project');
    await page.reload();
  }
  await expect(page.getByRole('listitem')).toHaveText('Cloud persistence project');
});
