import { test, expect, type Page } from '@playwright/test';

async function pendingCreation(page: Page, succeeds: boolean) {
  let finish: (() => Promise<void>) | undefined;
  let submissions = 0;
  await page.route('**/api/projects', (route) => {
    if (route.request().method() !== 'POST') return route.fulfill({ json: [] });
    submissions += 1;
    finish = () =>
      route.fulfill(
        succeeds
          ? { status: 201, json: { id: 101, name: 'Next project' } }
          : { status: 400, json: { errors: { name: ['Project name is required.'] } } },
      );
  });
  await page.route('**/api/inbox', (route) => route.fulfill({ json: [] }));
  await page.goto('/');
  await expect(page.getByText('No projects yet.')).toBeVisible();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  const name = page.getByLabel('Project name');
  const draft = succeeds ? 'Next project' : '   ';
  await name.fill(draft);
  await name.press('Enter');
  await expect(name).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Creating…' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Hide form' })).toBeDisabled();
  // Chromium blurs a disabled fieldset's focused input; jsdom can miss this.
  await expect(page.locator('body')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('form', { name: 'New project' })).toBeVisible();
  await expect.poll(() => submissions).toBe(1);
  return {
    name,
    draft,
    settle: async () => {
      if (!finish) throw new Error('Create request was not intercepted');
      const response = page.waitForResponse(
        (value) => value.url().endsWith('/api/projects') && value.request().method() === 'POST',
      );
      await finish();
      await (await response).finished();
    },
  };
}

for (const succeeds of [false, true]) {
  const outcome = succeeds ? 'success' : 'validation failure';
  test(`project Enter submission restores editing and Escape after ${outcome}`, async ({
    page,
  }) => {
    const { name, draft, settle } = await pendingCreation(page, succeeds);
    await settle();
    await expect(name).toBeEnabled();
    await expect(name).toHaveValue(succeeds ? '' : draft);
    await expect(name).toBeFocused();
    const form = page.getByRole('form', { name: 'New project' });
    await expect(form.getByRole(succeeds ? 'status' : 'alert')).toHaveText(
      succeeds ? 'Created “Next project”.' : 'Project name is required.',
    );
    await page.keyboard.type('Edited');
    await expect(name).toHaveValue(`${succeeds ? '' : draft}Edited`);
    await page.keyboard.press('Escape');
    await expect(form).toBeHidden();
    await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(name).toHaveValue(`${succeeds ? '' : draft}Edited`);
    await expect(name).toBeFocused();
  });

  for (const destination of ['another control', 'another control then body', 'Inbox']) {
    test(`project ${outcome} respects focus moved to ${destination}`, async ({ page }) => {
      const { name, draft, settle } = await pendingCreation(page, succeeds);
      const capture = page.getByLabel('Capture title');
      const inbox = page.getByRole('link', { name: 'Inbox', exact: true });
      if (destination === 'Inbox') {
        await inbox.click();
        await expect(page.getByRole('heading', { name: 'Inbox', exact: true })).toBeVisible();
        await expect(name).toHaveCount(0);
      } else {
        await capture.click();
        await page.keyboard.type('Keep this idea');
        await expect(capture).toBeFocused();
        if (destination === 'another control then body') {
          await page.getByRole('heading', { name: 'Projects', exact: true }).click();
          await expect(page.locator('body')).toBeFocused();
        }
      }
      await settle();
      if (destination === 'Inbox') {
        // Let completion render before checking the surviving navigation control.
        await page.evaluate(
          () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
        );
        await expect(inbox).toBeFocused();
        await expect(name).toHaveCount(0);
      } else {
        await expect(name).toBeEnabled();
        await expect(name).toHaveValue(succeeds ? '' : draft);
        await expect(capture).toHaveValue('Keep this idea');
        await expect(
          destination === 'another control' ? capture : page.locator('body'),
        ).toBeFocused();
      }
    });
  }
}
