import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import ProjectList from './ProjectList';

async function pendingCreation(draft = '   ') {
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, json: () => [] })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  const view = render(
    <ProjectList
      capture={
        <label>
          Capture title
          <input />
        </label>
      }
    />,
  );
  await screen.findByText('No projects yet.');
  await user.click(screen.getByRole('button', { name: 'New project' }));
  const name = screen.getByLabelText('Project name');
  await user.type(name, `${draft}{Enter}`);
  expect(name).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Hide form' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'New project' }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  return {
    user,
    name,
    ...view,
    settle: async (succeeds = false) => {
      await act(async () => {
        finish(
          succeeds
            ? { ok: true, json: () => ({ id: 1, name: 'Saved project' }) }
            : { ok: false, json: () => ({ errors: { name: ['Project name is required.'] } }) },
        );
        await Promise.resolve();
      });
    },
  };
}

test.each([false, true])(
  'creation restores editing after native blur (success: %s)',
  async (succeeds) => {
    const { user, name, settle } = await pendingCreation(succeeds ? 'Saved project' : '   ');
    // jsdom retains focus on disabled inputs, unlike Chromium. Model its native
    // fallback here; Playwright separately exercises the real disabling behavior.
    document.body.tabIndex = -1;
    document.body.focus();
    document.body.removeAttribute('tabindex');
    expect(document.body).toHaveFocus();
    await settle(succeeds);
    expect(name).toBeEnabled();
    expect(name).toHaveFocus();
    expect(name).toHaveValue(succeeds ? '' : '   ');
    await user.keyboard('Edited{Escape}');
    expect(screen.queryByRole('form', { name: 'New project' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New project' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(name).toHaveValue(succeeds ? 'Edited' : '   Edited');
  },
);

test.each([false, true])(
  'creation respects another focus destination (later blurred: %s)',
  async (blur) => {
    const { user, name, settle } = await pendingCreation();
    const capture = screen.getByLabelText('Capture title');
    await user.type(capture, 'Keep this idea');
    if (blur) capture.blur();
    await settle();
    expect(name).toBeEnabled();
    expect(name).toHaveValue('   ');
    expect(capture).toHaveValue('Keep this idea');
    expect(blur ? document.body : capture).toHaveFocus();
  },
);

test('a pending creation cannot restore focus after its form unmounts', async () => {
  const { unmount, settle } = await pendingCreation();
  unmount();
  const user = userEvent.setup();
  render(<button type="button">Another destination</button>);
  const destination = screen.getByRole('button', { name: 'Another destination' });
  await user.click(destination);
  await settle();
  expect(destination).toHaveFocus();
  expect(screen.queryByLabelText('Project name')).not.toBeInTheDocument();
});
