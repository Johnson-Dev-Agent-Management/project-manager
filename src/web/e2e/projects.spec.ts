import { test, expect } from '@playwright/test';

test('project pages and scoped tasks persist through UI reload and API restart', async ({
  page,
}, info) => {
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
    await page.getByRole('link', { name: 'Cloud persistence project', exact: true }).click();
    await expect(page.getByText('0 of 0 tasks complete.')).toBeVisible();
    await expect(page.getByText('No tasks yet. Add your first task below.')).toBeVisible();
    await page.getByLabel('Project name').fill('   ');
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByRole('alert')).toHaveText('Project name is required.');
    await page.getByLabel('Project name').fill('  Cloud persistence project — planned  ');
    await page.getByLabel('Description (optional)').fill('A small project\nSaved across restarts.');
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByText('Project saved.')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Cloud persistence project — planned' }),
    ).toBeVisible();
    const create = page.getByRole('form', { name: 'New task' });
    await create.getByLabel('Task title').fill('   ');
    await create.getByRole('button', { name: 'Add task' }).click();
    await expect(create.getByRole('alert')).toHaveText('Task title is required.');
    await expect(page.getByText('0 of 0 tasks complete.')).toBeVisible();
    await create.getByLabel('Task title').fill('  Draft outline  ');
    await create.getByLabel('Notes (optional)').fill('Initial notes');
    await create.getByRole('button', { name: 'Add task' }).click();
    const first = page.getByRole('form', { name: 'Edit task: Draft outline', exact: true });
    await expect(first.getByLabel('Status')).toHaveValue('To do');
    await expect(create.getByLabel('Task title')).toHaveValue('');
    await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
    await first.getByLabel('Task title').fill('  Draft outline revised  ');
    await first.getByLabel('Notes (optional)').fill('Saved notes\nSecond line');
    await first.getByLabel('Status').selectOption('In progress');
    await first.getByRole('button', { name: 'Save task' }).click();
    const edited = page.getByRole('form', { name: 'Edit task: Draft outline revised' });
    await expect(edited.getByText('Task saved.')).toBeVisible();
    await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
    await edited.getByLabel('Status').selectOption('Done');
    await edited.getByRole('button', { name: 'Save task' }).click();
    await expect(page.getByText('1 of 1 tasks complete.')).toBeVisible();
    await edited.getByLabel('Status').selectOption('To do');
    await edited.getByRole('button', { name: 'Save task' }).click();
    await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
    await edited.getByLabel('Status').selectOption('Done');
    await edited.getByRole('button', { name: 'Save task' }).click();
    await expect(page.getByText('1 of 1 tasks complete.')).toBeVisible();
    await create.getByLabel('Task title').fill('Check outline');
    await create.getByRole('button', { name: 'Add task' }).click();
    await expect(page.getByText('1 of 2 tasks complete.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('1 of 2 tasks complete.')).toBeVisible();
    await page.getByRole('link', { name: 'Back to projects' }).click();
    // Both pages have a Project name field; wait for the destination before filling it.
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
    await page.getByLabel('Project name').fill('Separate project');
    await page.getByRole('button', { name: 'Create project' }).click();
    await page.getByRole('link', { name: 'Separate project' }).click();
    await expect(page.getByText('0 of 0 tasks complete.')).toBeVisible();
    await expect(page.getByRole('form', { name: /Edit task:/ })).toHaveCount(0);
    await create.getByLabel('Task title').fill('Other project task');
    await create.getByRole('button', { name: 'Add task' }).click();
    await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
    await page.getByRole('link', { name: 'Back to projects' }).click();
  }
  await expect(page.getByRole('listitem')).toHaveText([
    'Cloud persistence project — planned',
    'Separate project',
  ]);
  await page.getByRole('link', { name: 'Cloud persistence project — planned' }).click();
  await expect(page.getByLabel('Project name')).toHaveValue('Cloud persistence project — planned');
  await expect(page.getByLabel('Description (optional)')).toHaveValue(
    'A small project\nSaved across restarts.',
  );
  await expect(page.getByText('1 of 2 tasks complete.')).toBeVisible();
  const persisted = page.getByRole('form', { name: 'Edit task: Draft outline revised' });
  await expect(persisted.getByLabel('Task title')).toHaveValue('Draft outline revised');
  await expect(persisted.getByLabel('Notes (optional)')).toHaveValue('Saved notes\nSecond line');
  await expect(persisted.getByLabel('Status')).toHaveValue('Done');
  await expect(
    page.getByRole('form', { name: 'Edit task: Check outline' }).getByLabel('Status'),
  ).toHaveValue('To do');
  await expect(page.getByRole('form', { name: 'Edit task: Other project task' })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath(`${process.env.E2E_PHASE ?? 'invalid'}-persistence.png`),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Back to projects' }).click();
  await page.getByRole('link', { name: 'Separate project' }).click();
  await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
  await expect(page.getByRole('form', { name: /Edit task:/ })).toHaveCount(1);
  await expect(page.getByRole('form', { name: 'Edit task: Other project task' })).toBeVisible();
  await page.goto('/#/projects/999999');
  await expect(page.getByRole('alert')).toContainText('could not be found');
  await page.getByRole('link', { name: 'Back to projects' }).click();
  await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
});
