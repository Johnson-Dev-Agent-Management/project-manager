import { test, expect } from '@playwright/test';

test.use({ timezoneId: 'America/Los_Angeles' });

test('project pages and scoped tasks persist through UI reload and API restart', async ({
  page,
}, info) => {
  // Nov 3 in Los Angeles, Nov 4 in UTC: both API-process phases use the local day.
  await page.clock.setFixedTime(new Date('2026-11-04T01:30:00Z'));
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
    await create.getByLabel('Priority').selectOption('Low');
    await create.getByLabel('Due date (optional)').fill('2026-11-02');
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
    ...(process.env.E2E_PHASE === 'restart' ? ['Captured work'] : []),
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
  if (process.env.E2E_PHASE === 'create') {
    await page
      .getByRole('link', { name: 'Cloud persistence project — planned', exact: true })
      .click();
    const check = page.getByRole('form', { name: 'Edit task: Check outline' });
    await check.getByLabel('Priority').selectOption('High');
    await check.getByLabel('Due date (optional)').fill('2026-11-03');
    await check.getByRole('button', { name: 'Save task' }).click();
    await expect(check.getByText('Task saved.')).toBeVisible();
    const checkRow = page.getByRole('listitem').filter({ has: check });
    await expect(checkRow.getByText(/Due today/)).toBeVisible();
    await checkRow.getByRole('button', { name: 'Add to today' }).click();
    await expect(checkRow.getByRole('button', { name: 'Remove from today' })).toBeVisible();
    // A selected task completed today remains available after reload and API restart.
    await persisted.getByLabel('Status').selectOption('To do');
    await persisted.getByRole('button', { name: 'Save task' }).click();
    await expect(page.getByText('0 of 2 tasks complete.')).toBeVisible();
    const draftRow = page.getByRole('listitem').filter({ has: persisted });
    await draftRow.getByRole('button', { name: 'Add to today' }).click();
    await expect(draftRow.getByRole('button', { name: 'Remove from today' })).toBeVisible();
    await persisted.getByLabel('Status').selectOption('Done');
    await persisted.getByRole('button', { name: 'Save task' }).click();
    await expect(page.getByText('1 of 2 tasks complete.')).toBeVisible();
    await page.getByRole('link', { name: 'Back to projects' }).click();
    await page.getByRole('link', { name: 'Separate project', exact: true }).click();
    const other = page.getByRole('form', { name: 'Edit task: Other project task' });
    await other.getByLabel('Priority').selectOption('Medium');
    await other.getByLabel('Due date (optional)').fill('2026-11-02');
    await other.getByRole('button', { name: 'Save task' }).click();
    await expect(other.getByText('Task saved.')).toBeVisible();
    await page.getByRole('link', { name: 'Today', exact: true }).click();
    const dueNow = page.getByRole('region', { name: 'Due now' });
    await expect(dueNow.getByRole('listitem')).toHaveCount(1);
    await expect(dueNow.getByText(/Overdue/)).toBeVisible();
    await dueNow.getByRole('button', { name: 'Add to today' }).click();
    const selected = page.getByRole('region', { name: 'Selected for today' });
    await expect(selected.getByRole('heading', { level: 3 })).toHaveText([
      'Check outline',
      'Other project task',
    ]);
    await expect(page.getByRole('listitem', { name: 'Other project task' })).toHaveCount(1);
    const selectedCheck = selected.getByRole('listitem', { name: 'Check outline' });
    await selectedCheck.getByLabel('Status for Check outline').selectOption('Done');
    await selectedCheck.getByRole('button', { name: 'Save status' }).click();
    const completedCheck = page
      .getByRole('region', { name: 'Completed today' })
      .getByRole('listitem', { name: 'Check outline' });
    await expect(completedCheck.getByText('Status: Done')).toBeVisible();
    await completedCheck.getByRole('link', { name: 'Cloud persistence project — planned' }).click();
    await expect(page.getByText('2 of 2 tasks complete.')).toBeVisible();
    await page.getByRole('link', { name: 'Today', exact: true }).click();
    await completedCheck.getByLabel('Status for Check outline').selectOption('To do');
    await completedCheck.getByRole('button', { name: 'Save status' }).click();
    await expect(selectedCheck).toBeVisible();
    await selectedCheck.getByRole('button', { name: 'Remove from today' }).click();
    await expect(dueNow.getByRole('listitem', { name: 'Check outline' })).toBeVisible();
    await dueNow.getByRole('button', { name: 'Add to today' }).click();
    await expect(selectedCheck).toBeVisible();
    await page.reload();
  } else {
    await page.getByRole('link', { name: 'Today', exact: true }).click();
  }
  const selectedToday = page.getByRole('region', { name: 'Selected for today' });
  await expect(selectedToday.getByRole('heading', { level: 3 })).toHaveText([
    'Check outline',
    'Other project task',
  ]);
  await expect(selectedToday.getByText('Priority: High', { exact: false })).toBeVisible();
  await expect(selectedToday.getByText('Due today', { exact: false })).toBeVisible();
  await expect(selectedToday.getByText('Overdue', { exact: false })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Due now' }).getByRole('listitem')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Completed today' }).getByRole('heading', { level: 3 }),
  ).toHaveText(['Draft outline revised']);
  // Refreshing A's selection must leave B's unsaved status in place.
  const otherDraft = selectedToday.getByLabel('Status for Other project task');
  await otherDraft.selectOption('In progress');
  const checkToday = selectedToday.getByRole('listitem', { name: 'Check outline' });
  await checkToday.getByRole('button', { name: 'Remove from today' }).click();
  const dueCheck = page
    .getByRole('region', { name: 'Due now' })
    .getByRole('listitem', { name: 'Check outline' });
  await expect(dueCheck).toBeVisible();
  await expect(otherDraft).toHaveValue('In progress');
  await dueCheck.getByRole('button', { name: 'Add to today' }).click();
  await expect(checkToday).toBeVisible();
  await expect(otherDraft).toHaveValue('In progress');
  await otherDraft.selectOption('To do');
  await page.screenshot({
    path: info.outputPath(`${process.env.E2E_PHASE ?? 'invalid'}-today.png`),
    fullPage: true,
  });
  await selectedToday.getByRole('link', { name: 'Separate project' }).click();
  const otherSaved = page.getByRole('form', { name: 'Edit task: Other project task' });
  await expect(otherSaved.getByLabel('Priority')).toHaveValue('Medium');
  await expect(otherSaved.getByLabel('Due date (optional)')).toHaveValue('2026-11-02');
  await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
});

test('quick capture, Inbox edits and atomic filing preserve content across reload and API restart', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-04T01:30:00Z'));
  await page.goto('/');
  const capture = page.getByRole('form', { name: 'Quick capture' });
  const inbox = page.getByRole('link', { name: 'Inbox', exact: true });
  const filedTitle = 'Plan captured work';
  const notes = 'Keep this idea\nIncluding the second line.';
  if (process.env.E2E_PHASE === 'create') {
    await capture.getByLabel('Capture title').fill('   ');
    await capture.getByLabel('Capture title').press('Enter');
    await expect(capture.getByRole('alert')).toHaveText('Item title is required.');
    await expect(capture.getByLabel('Capture title')).toHaveValue('   ');
    await capture.getByLabel('Capture title').fill('  Captured idea  ');
    await capture.getByLabel('Capture title').press('Enter');
    await expect(capture.getByRole('status')).toContainText('Captured “Captured idea” in Inbox.');
    await expect(capture.getByLabel('Capture title')).toBeFocused();
    await expect(capture.getByLabel('Capture title')).toHaveValue('');
    await inbox.click();
    const row = page.getByRole('listitem', { name: 'Captured idea', exact: true });
    await expect(row.getByText(/Captured/).filter({ has: page.locator('time') })).toBeVisible();
    await row.getByRole('button', { name: 'Edit item', exact: true }).click();
    await row.getByLabel('Item title').fill('   ');
    await row.getByRole('button', { name: 'Save item' }).click();
    await expect(row.getByRole('alert')).toHaveText('Item title is required.');
    await row.getByLabel('Item title').fill(`  ${filedTitle}  `);
    await row.getByLabel('Notes (optional)').fill(notes);
    await row.getByRole('button', { name: 'Save item' }).click();
    await expect(page.getByText('Item saved.')).toBeVisible();
    await page.reload();
    const edited = page.getByRole('listitem', { name: filedTitle, exact: true });
    await expect(edited.getByText(notes)).toBeVisible();
    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await page.getByLabel('Project name').fill('Captured work');
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(page.getByRole('link', { name: 'Captured work', exact: true })).toBeVisible();
    await inbox.click();
    await edited.getByLabel('Destination project').selectOption({ label: 'Captured work' });
    // A failed move leaves the captured content and choice available for retry.
    await page.route('**/api/inbox/*/move', async (route) => {
      await route.fulfill({ status: 500, contentType: 'application/problem+json', body: '{}' });
    });
    await edited.getByRole('button', { name: 'Move to project' }).click();
    await expect(edited.getByRole('alert')).toHaveText('Could not move item. Please try again.');
    await expect(edited.getByText(notes)).toBeVisible();
    await page.unroute('**/api/inbox/*/move');
    await edited.getByRole('button', { name: 'Move to project' }).click();
    await expect(edited).toHaveCount(0);
    await page.getByRole('link', { name: 'Open destination project' }).click();
    await expect(page.getByRole('heading', { name: 'Captured work' })).toBeVisible();
    await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
    // Capture also works from project details; discard remains scoped to Inbox.
    await capture.getByLabel('Capture title').fill('Discard this thought');
    await capture.getByLabel('Capture title').press('Enter');
    await expect(capture.getByRole('status')).toContainText('Captured “Discard this thought”');
    await page.getByRole('link', { name: 'Today', exact: true }).click();
    await capture.getByLabel('Capture title').fill('Review later');
    await capture.getByLabel('Capture title').press('Enter');
    await expect(capture.getByRole('status')).toContainText('Captured “Review later”');
    await expect(page.getByRole('listitem', { name: 'Review later' })).toHaveCount(0);
    await inbox.click();
    const discard = page.getByRole('listitem', { name: 'Discard this thought' });
    await discard.getByRole('button', { name: 'Discard item' }).click();
    await discard.getByRole('button', { name: 'Keep item' }).click();
    await expect(discard).toBeVisible();
    await discard.getByRole('button', { name: 'Discard item' }).click();
    await discard.getByRole('button', { name: 'Confirm discard' }).click();
    await expect(discard).toHaveCount(0);
    const pending = page.getByRole('listitem', { name: 'Review later' });
    await pending.getByRole('button', { name: 'Edit item' }).click();
    await pending.getByLabel('Notes (optional)').fill('Still in Inbox after restart.');
    await pending.getByRole('button', { name: 'Save item' }).click();
    await expect(pending.getByText('Item saved.')).toBeVisible();
  } else {
    await inbox.click();
  }
  await page.reload();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  const pending = page.getByRole('listitem', { name: 'Review later' });
  await expect(pending.getByText('Still in Inbox after restart.')).toBeVisible();
  await expect(pending.locator('time')).toHaveAttribute('datetime', /Z$/);
  await page.screenshot({
    path: info.outputPath(`${process.env.E2E_PHASE ?? 'invalid'}-inbox.png`),
    fullPage: true,
  });
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await page.getByRole('link', { name: 'Captured work', exact: true }).click();
  await expect(page.getByText('0 of 1 tasks complete.')).toBeVisible();
  await expect(page.getByRole('form', { name: /Edit task:/ })).toHaveCount(1);
  const task = page.getByRole('form', { name: `Edit task: ${filedTitle}` });
  await expect(task.getByLabel('Task title')).toHaveValue(filedTitle);
  await expect(task.getByLabel('Notes (optional)')).toHaveValue(notes);
  await expect(task.getByLabel('Status')).toHaveValue('To do');
  await expect(task.getByLabel('Priority')).toHaveValue('None');
  await expect(task.getByLabel('Due date (optional)')).toHaveValue('');
  await page.screenshot({
    path: info.outputPath(`${process.env.E2E_PHASE ?? 'invalid'}-filed-task.png`),
    fullPage: true,
  });
  if (process.env.E2E_PHASE === 'restart') {
    await task.getByLabel('Priority').selectOption('High');
    await task.getByLabel('Due date (optional)').fill('2026-11-03');
    await task.getByRole('button', { name: 'Save task' }).click();
    await expect(task.getByText('Task saved.')).toBeVisible();
    await page.getByRole('button', { name: 'Add to today' }).click();
    await expect(page.getByRole('button', { name: 'Remove from today' })).toBeVisible();
    await page.getByRole('link', { name: 'Today', exact: true }).click();
    const selected = page
      .getByRole('region', { name: 'Selected for today' })
      .getByRole('listitem', { name: filedTitle });
    await expect(selected.getByText(/Priority: High/)).toBeVisible();
    await expect(selected.getByText(/Due today/)).toBeVisible();
    await selected.getByLabel(`Status for ${filedTitle}`).selectOption('Done');
    await selected.getByRole('button', { name: 'Save status' }).click();
    const completed = page
      .getByRole('region', { name: 'Completed today' })
      .getByRole('listitem', { name: filedTitle });
    await expect(completed.getByText('Status: Done')).toBeVisible();
    await completed.getByRole('link', { name: 'Captured work' }).click();
    await expect(page.getByText('1 of 1 tasks complete.')).toBeVisible();
    await expect(task.getByLabel('Notes (optional)')).toHaveValue(notes);
    await page.reload();
    await expect(page.getByText('1 of 1 tasks complete.')).toBeVisible();
    await expect(task.getByLabel('Priority')).toHaveValue('High');
    await expect(task.getByLabel('Due date (optional)')).toHaveValue('2026-11-03');
  }
});
