import { test, expect } from '@playwright/test';

const projects = [
  { id: 101, name: 'Plan a quieter workspace' },
  { id: 102, name: 'Ideas for a small garden — research, planting, and the next season' },
  { id: 103, name: 'AProjectNameWithoutAnySpaces'.repeat(4) },
];

for (const [width, scale] of [
  [1440, 100],
  [390, 100],
  [320, 100],
  [390, 200],
  [320, 200],
]) {
  test(`Projects pilot supports long names and creation at ${width}px / ${scale}% text`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    let finishCreate: (() => Promise<void>) | undefined;
    await page.route('**/api/projects', (route) => {
      if (route.request().method() === 'POST') {
        finishCreate = () =>
          route.fulfill({ status: 201, json: { id: 104, name: 'Next project' } });
        return;
      }
      return route.fulfill({ json: projects });
    });
    await page.goto('/');
    await page.evaluate((value) => {
      document.documentElement.style.fontSize = `${value}%`;
    }, scale);
    const collection = page.getByRole('region', { name: 'Your projects' });
    await expect(collection.getByRole('listitem')).toHaveCount(3);
    await expect(page.getByRole('form', { name: 'New project' })).toBeHidden();
    const input = page.getByLabel('Capture title');
    await input.fill('Keep this idea');
    await page.getByRole('button', { name: 'New project', exact: true }).click();
    const name = page.getByLabel('Project name');
    await expect(name).toBeFocused();
    await name.fill('Next project');
    await name.press('Escape');
    await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(name).toHaveValue('Next project');
    await name.press('Enter');
    await expect(page.getByRole('button', { name: 'Creating…' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Hide form' })).toBeDisabled();
    await expect(input).toHaveValue('Keep this idea');
    const geometry = await page.locator('main').evaluate((main) => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      controls: Array.from(main.querySelectorAll('input, button, .project-link')).map((control) => {
        const box = control.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          height: box.height,
          scrollWidth: control.scrollWidth,
          clientWidth: control.clientWidth,
        };
      }),
    }));
    expect(geometry.document).toBeLessThanOrEqual(geometry.viewport);
    for (const box of geometry.controls) {
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(geometry.viewport);
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.scrollWidth).toBeLessThanOrEqual(box.clientWidth);
    }
    await info.attach('layout-measurements', {
      body: JSON.stringify(geometry, null, 2),
      contentType: 'application/json',
    });
    await page.screenshot({ path: info.outputPath('projects-creating.png'), fullPage: true });
    await expect.poll(() => typeof finishCreate).toBe('function');
    if (!finishCreate) throw new Error('Create request was not intercepted');
    await finishCreate();
    await expect(collection.getByRole('listitem')).toHaveCount(4);
    await expect(collection.getByRole('status')).toHaveText('Created “Next project”.');
    await expect(name).toHaveValue('');
    await expect(input).toHaveValue('Keep this idea');
  });
}

test('Projects load failure retries into a true empty state and keeps create failures local', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let rejectLoad: (() => Promise<void>) | undefined;
  await page.route('**/api/projects', (route) => {
    rejectLoad = () => route.fulfill({ status: 500, json: {} });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toHaveText('Loading projects…');
  await page.getByLabel('Capture title').fill('A thought while waiting');
  await expect.poll(() => typeof rejectLoad).toBe('function');
  if (!rejectLoad) throw new Error('Project load was not intercepted');
  await rejectLoad();
  await expect(page.getByRole('alert')).toHaveText('Could not load projects.');
  await expect(page.getByText('No projects yet.')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('projects-load-error.png'), fullPage: true });
  await page.unroute('**/api/projects');
  await page.route('**/api/projects', (route) =>
    route.fulfill(
      route.request().method() === 'POST'
        ? { status: 400, json: { errors: { name: ['Project name is required.'] } } }
        : { json: [] },
    ),
  );
  await page.getByRole('button', { name: 'Retry projects' }).click();
  await expect(page.getByText('No projects yet.')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Project name').fill('   ');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('form', { name: 'New project' }).getByRole('alert')).toHaveText(
    'Project name is required.',
  );
  await expect(page.getByLabel('Project name')).toHaveValue('   ');
  await expect(page.getByLabel('Capture title')).toHaveValue('A thought while waiting');
  await expect(page.getByRole('button', { name: 'Retry projects' })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath('projects-create-error.png'), fullPage: true });
});

test('a capture draft returns from Today and Inbox and a pending save completes away from Projects', async ({
  page,
}) => {
  await page.goto('/');
  const capture = page.getByRole('form', { name: 'Quick capture' });
  await capture.getByLabel('Capture title').fill('Keep this thought');
  await page.getByRole('link', { name: 'Today', exact: true }).click();
  await expect(capture).toHaveCount(0);
  await page.getByRole('link', { name: 'Inbox', exact: true }).click();
  await expect(capture).toHaveCount(0);
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(capture.getByLabel('Capture title')).toHaveValue('Keep this thought');
  let rejectCapture: (() => Promise<void>) | undefined;
  await page.route('**/api/inbox', (route) => {
    if (route.request().method() === 'POST') {
      rejectCapture = () => route.fulfill({ status: 500, json: {} });
      return;
    }
    return route.continue();
  });
  await capture.getByLabel('Capture title').press('Enter');
  await expect(capture.getByRole('button', { name: 'Capturing…' })).toBeDisabled();
  await page.getByRole('link', { name: 'Inbox', exact: true }).click();
  await expect(capture).toHaveCount(0);
  await expect.poll(() => typeof rejectCapture).toBe('function');
  if (!rejectCapture) throw new Error('Capture request was not intercepted');
  await rejectCapture();
  await expect(page.getByRole('link', { name: 'Inbox', exact: true })).toBeFocused();
  await page.getByRole('link', { name: 'Projects', exact: true }).click();
  await expect(capture.getByRole('alert')).toBeVisible();
  await expect(capture.getByLabel('Capture title')).toHaveValue('Keep this thought');
  await expect(capture.getByRole('button', { name: 'Capture', exact: true })).toBeEnabled();
});
