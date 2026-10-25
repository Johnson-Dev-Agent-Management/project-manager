import { act, render, screen } from '@testing-library/react';
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
  expect(screen.getByRole('button')).toBeDisabled();
  await act(async () => {
    finishLoad({ ok: true, json: () => [] });
    await Promise.resolve();
  });
  expect(screen.getByText('No projects yet.')).toBeVisible();
  await user.type(screen.getByLabelText('Project name'), ' Example ');
  await user.click(screen.getByRole('button', { name: 'Create project' }));
  expect(screen.getByRole('button', { name: 'Creating…' })).toBeDisabled();
  await user.click(screen.getByRole('button'));
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
  expect(screen.getByRole('button')).toBeEnabled();
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
  await user.type(screen.getByLabelText('Project name'), 'Third');
  await user.click(screen.getByRole('button'));
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
    await user.type(screen.getByLabelText('Project name'), 'Retry');
    await user.click(screen.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(screen.getByLabelText('Project name')).toHaveValue('Retry');
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button')).toBeEnabled();
    await user.click(screen.getByRole('button'));
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
  await user.type(screen.getByLabelText('Project name'), 'Keep me');
  await user.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByLabelText('Project name')).toHaveValue('Keep me');
  expect(screen.getByRole('button')).toBeEnabled();
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
});
