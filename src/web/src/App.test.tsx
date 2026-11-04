import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import App from './App';

test('loading disables submission; empty state becomes a saved project and clears the input', async () => {
  const user = userEvent.setup();
  let finishLoad!: (value: unknown) => void;
  let finishSave!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishLoad = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading projects…');
  expect(screen.queryByRole('form', { name: 'New project' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'New project' }));
  expect(screen.getByRole('button', { name: /Create project|Creating…/ })).toBeDisabled();
  await act(async () => {
    finishLoad({ ok: true, json: () => [] });
    await Promise.resolve();
  });
  expect(screen.getByText('No projects yet.')).toBeVisible();
  await user.type(screen.getByLabelText('Project name'), ' Example ');
  await user.click(screen.getByRole('button', { name: 'Create project' }));
  expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'New project' }));
  await user.click(screen.getByRole('button', { name: /Create project|Creating…/ }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: ' Example ' }),
  });
  await act(async () => {
    finishSave({ ok: true, json: () => ({ id: 7, name: 'Example' }) });
    await Promise.resolve();
  });
  expect(screen.getByRole('listitem')).toHaveTextContent('Example');
  expect(screen.getByLabelText('Project name')).toHaveValue('');
  expect(screen.getByRole('button', { name: /Create project|Creating…/ })).toBeEnabled();
  expect(screen.queryByText('No projects yet.')).not.toBeInTheDocument();
});

test('loads existing projects in server order and appends a successful creation', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => [
          { id: 2, name: 'First' },
          { id: 4, name: 'Second' },
        ],
      })
      .mockResolvedValueOnce({ ok: true, json: () => ({ id: 9, name: 'Third' }) }),
  );
  render(<App />);
  await screen.findByText('Second');
  await user.click(screen.getByRole('button', { name: 'New project' }));
  await user.type(screen.getByLabelText('Project name'), 'Third');
  await user.click(screen.getByRole('button', { name: /Create project|Creating…/ }));
  await screen.findByText('Third');
  expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'First',
    'Second',
    'Third',
  ]);
});

test.each([
  [
    'server validation',
    { ok: false, json: () => ({ errors: { name: ['Project name is required.'] } }) },
    'Project name is required.',
  ],
  [
    'HTTP problem without name',
    { ok: false, json: () => ({ errors: {} }) },
    'Could not create project.',
  ],
  ['HTTP problem without errors', { ok: false, json: () => ({}) }, 'Could not create project.'],
  [
    'HTTP problem with empty name errors',
    { ok: false, json: () => ({ errors: { name: [] } }) },
    'Could not create project.',
  ],
])(
  'shows %s, preserves input and list, and allows a successful retry',
  async (_, response, message) => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: () => [{ id: 1, name: 'Existing' }] })
        .mockResolvedValueOnce(response)
        .mockResolvedValueOnce({ ok: true, json: () => ({ id: 2, name: 'Retry' }) }),
    );
    render(<App />);
    await screen.findByText('Existing');
    await user.click(screen.getByRole('button', { name: 'New project' }));
    await user.type(screen.getByLabelText('Project name'), 'Retry');
    await user.click(screen.getByRole('button', { name: /Create project|Creating…/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText('Project name')).toHaveValue('Retry');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Create project|Creating…/ })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /Create project|Creating…/ }));
    await screen.findByText('Retry');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  },
);

test.each([
  [new Error('Network unavailable'), 'Network unavailable'],
  ['disconnected', 'Could not create project.'],
])('handles creation network rejection %s', async (reason, message) => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => [] })
      .mockRejectedValueOnce(reason),
  );
  render(<App />);
  await screen.findByText('No projects yet.');
  await user.click(screen.getByRole('button', { name: 'New project' }));
  await user.type(screen.getByLabelText('Project name'), 'Keep me');
  await user.click(screen.getByRole('button', { name: /Create project|Creating…/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByLabelText('Project name')).toHaveValue('Keep me');
  expect(screen.getByRole('button', { name: /Create project|Creating…/ })).toBeEnabled();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
});

test.each([
  ['HTTP failure', { ok: false }, 'Could not load projects.'],
  ['network error', new Error('Offline'), 'Offline'],
  ['unknown rejection', 'offline', 'Could not load projects.'],
])(
  'load %s never shows an empty collection and can retry without losing drafts',
  async (_, failure, message) => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    if (typeof failure === 'object' && !(failure instanceof Error)) {
      fetchMock.mockResolvedValueOnce(failure);
    } else {
      fetchMock.mockRejectedValueOnce(failure);
    }
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => [] });
    vi.stubGlobal('fetch', fetchMock);
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByText('No projects yet.')).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('Capture title'), 'An idea');
    await user.click(screen.getByRole('button', { name: 'New project' }));
    await user.type(screen.getByLabelText('Project name'), 'A project');
    expect(screen.getByRole('button', { name: 'Create project' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Retry projects' }));
    expect(await screen.findByText('No projects yet.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Capture title')).toHaveValue('An idea');
    expect(screen.getByLabelText('Project name')).toHaveValue('A project');
    expect(screen.getByRole('button', { name: 'Create project' })).toBeEnabled();
  },
);

test('project disclosure focuses the field, preserves its draft, and returns focus on Escape', async () => {
  const user = userEvent.setup();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => [] }));
  render(<App />);
  await screen.findByText('No projects yet.');
  await user.type(screen.getByLabelText('Capture title'), 'Keep this idea');
  await user.click(screen.getByRole('button', { name: 'New project' }));
  const name = screen.getByLabelText('Project name');
  expect(name).toHaveFocus();
  await user.type(name, 'Keep this project{Escape}');
  expect(screen.queryByRole('form', { name: 'New project' })).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'New project' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(name).toHaveValue('Keep this project');
  expect(name).toHaveFocus();
  await user.click(screen.getByRole('button', { name: 'Hide form' }));
  expect(screen.getByLabelText('Capture title')).toHaveValue('Keep this idea');
});

test('unmount aborts a pending project list read and ignores a late response', async () => {
  let resolve!: (value: unknown) => void;
  let signal: AbortSignal | null | undefined;
  vi.stubGlobal(
    'fetch',
    vi.fn((_: string, options: RequestInit) => {
      signal = options.signal;
      return new Promise((finish) => {
        resolve = finish;
      });
    }),
  );
  const view = render(<App />);
  view.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => {
    resolve({ ok: true, json: () => [{ id: 1, name: 'Late project' }] });
    await Promise.resolve();
  });
  expect(screen.queryByText('Late project')).not.toBeInTheDocument();
});
