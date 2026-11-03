import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import InboxPage from './InboxPage';
import { type InboxItem } from './api';

const item: InboxItem = {
  id: 3,
  title: 'A thought',
  notes: 'Remember\nthis',
  capturedAt: '2026-11-03T10:00:00Z',
};
const projects = [{ id: 7, name: 'Destination' }];
const task = {
  id: 8,
  projectId: 7,
  title: item.title,
  notes: item.notes,
  status: 'To do',
  priority: 'None',
  dueDate: null,
};
const ok = (value: unknown) => ({ ok: true, json: () => value });
const problem = (message: string, field = 'title') => ({
  ok: false,
  status: 400,
  json: () => ({ errors: { [field]: [message] } }),
});
function setup(items: InboxItem[] = [item], destinations: typeof projects = projects) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(items))
    .mockResolvedValueOnce(ok(destinations));
  vi.stubGlobal('fetch', fetchMock);
  const view = render(<InboxPage captureVersion={0} />);
  return { fetchMock, ...view };
}

test('loading, empty Inbox and no-project guidance preserve the capture workflow', async () => {
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(ok([]));
  vi.stubGlobal('fetch', fetchMock);
  render(<InboxPage captureVersion={0} />);
  expect(screen.getByText('Loading Inbox…')).toBeVisible();
  expect(screen.getByText('Loading destination projects…')).toBeVisible();
  await act(async () => {
    finish(ok([]));
    await Promise.resolve();
  });
  expect(
    screen.getByText('Your inbox is clear. Use Quick capture to save a task or idea.'),
  ).toBeVisible();
  expect(screen.getByRole('link', { name: 'Create a project' })).toHaveAttribute('href', '#/');
});

test('server order and capture dates remain visible, editing trims only after save and preserves notes', async () => {
  const user = userEvent.setup();
  const { fetchMock } = setup([{ ...item, id: 4, title: 'Newest', notes: null }, item]);
  await screen.findByRole('heading', { name: item.title });
  expect(
    screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
  ).toEqual(['Newest', 'A thought']);
  const row = within(screen.getByRole('listitem', { name: item.title }));
  expect(row.getByText(new Date(item.capturedAt).toLocaleString())).toHaveAttribute(
    'datetime',
    item.capturedAt,
  );
  expect(row.getByText('Remember this')).toBeVisible();
  await user.click(row.getByRole('button', { name: 'Edit item' }));
  expect(row.queryByRole('button', { name: 'Move to project' })).not.toBeInTheDocument();
  await user.clear(row.getByLabelText('Item title'));
  await user.type(row.getByLabelText('Item title'), '  Changed  ');
  await user.clear(row.getByLabelText('Notes (optional)'));
  await user.type(row.getByLabelText('Notes (optional)'), 'New notes\nSecond line');
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(row.getByRole('button', { name: 'Save item' }));
  expect(row.getByRole('button', { name: 'Saving item…' })).toBeDisabled();
  expect(row.getByRole('button', { name: 'Cancel edit' })).toBeDisabled();
  fireEvent.submit(row.getByRole('form'));
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/inbox/3', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '  Changed  ', notes: 'New notes\nSecond line' }),
  });
  await act(async () => {
    finish(ok({ ...item, title: 'Changed', notes: 'New notes\nSecond line' }));
    await Promise.resolve();
  });
  expect(screen.getByRole('heading', { name: 'Changed' })).toBeVisible();
  expect(screen.getByText('Item saved.')).toBeVisible();
  const updated = within(screen.getByRole('listitem', { name: 'Changed' }));
  await user.click(updated.getByRole('button', { name: 'Edit item' }));
  expect(updated.getByLabelText('Item title')).toHaveValue('Changed');
  await user.type(updated.getByLabelText('Item title'), ' unsaved');
  await user.click(updated.getByRole('button', { name: 'Cancel edit' }));
  expect(screen.getByRole('heading', { name: 'Changed' })).toBeVisible();
  await user.click(updated.getByRole('button', { name: 'Edit item' }));
  expect(updated.getByLabelText('Item title')).toHaveValue('Changed');
});

test('validation leaves title and notes drafts intact, then retry saves', async () => {
  const user = userEvent.setup();
  const { fetchMock } = setup();
  await user.click(await screen.findByRole('button', { name: 'Edit item' }));
  await user.clear(screen.getByLabelText('Item title'));
  await user.type(screen.getByLabelText('Item title'), '   ');
  await user.type(screen.getByLabelText('Notes (optional)'), ' draft');
  fetchMock
    .mockResolvedValueOnce(problem('Item title is required.'))
    .mockResolvedValueOnce(ok({ ...item, title: 'Fixed', notes: 'Remember\nthis draft' }));
  await user.click(screen.getByRole('button', { name: 'Save item' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Item title is required.');
  expect(screen.getByLabelText('Item title')).toHaveValue('   ');
  expect(screen.getByLabelText('Notes (optional)')).toHaveValue('Remember\nthis draft');
  await user.clear(screen.getByLabelText('Item title'));
  await user.type(screen.getByLabelText('Item title'), 'Fixed');
  await user.click(screen.getByRole('button', { name: 'Save item' }));
  expect(await screen.findByText('Item saved.')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('discard requires confirmation, supports cancelling, and retains the item on failure', async () => {
  const user = userEvent.setup();
  const { fetchMock } = setup();
  await user.click(await screen.findByRole('button', { name: 'Discard item' }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole('button', { name: 'Keep item' }));
  expect(screen.queryByRole('button', { name: 'Confirm discard' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Discard item' }));
  fetchMock.mockRejectedValueOnce('offline');
  await user.click(screen.getByRole('button', { name: 'Confirm discard' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not discard item. Please try again.',
  );
  expect(screen.getByRole('heading', { name: item.title })).toBeVisible();
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(screen.getByRole('button', { name: 'Confirm discard' }));
  expect(screen.getByRole('button', { name: 'Discarding…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Keep item' })).toBeDisabled();
  expect(fetchMock).toHaveBeenLastCalledWith('/api/inbox/3', { method: 'DELETE' });
  await act(async () => {
    finish(ok({ id: 3 }));
    await Promise.resolve();
  });
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Discarded “A thought”.');
});

test('failed move keeps content and destination, then a guarded retry removes it and links to the project', async () => {
  const user = userEvent.setup();
  const { fetchMock } = setup();
  await screen.findByRole('button', { name: 'Move to project' });
  await user.click(screen.getByRole('button', { name: 'Move to project' }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await user.selectOptions(screen.getByLabelText('Destination project'), '7');
  fetchMock.mockResolvedValueOnce(problem('Destination no longer exists.', 'projectId'));
  await user.click(screen.getByRole('button', { name: 'Move to project' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Destination no longer exists.');
  expect(screen.getByRole('heading', { name: item.title })).toBeVisible();
  expect(screen.getByText('Remember this')).toBeVisible();
  expect(screen.getByLabelText('Destination project')).toHaveValue('7');
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(screen.getByRole('button', { name: 'Move to project' }));
  expect(screen.getByRole('button', { name: 'Moving item…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Discard item' })).toBeDisabled();
  fireEvent.submit(screen.getByRole('form'));
  expect(fetchMock).toHaveBeenCalledTimes(4);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/inbox/3/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: 7 }),
  });
  await act(async () => {
    finish(ok(task));
    await Promise.resolve();
  });
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Moved “A thought”');
  expect(screen.getByRole('link', { name: 'Open destination project' })).toHaveAttribute(
    'href',
    '#/projects/7',
  );
});

test('a missing inbox item explains recovery without removing its local content', async () => {
  const user = userEvent.setup();
  const { fetchMock } = setup();
  await user.selectOptions(await screen.findByLabelText('Destination project'), '7');
  fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
  await user.click(screen.getByRole('button', { name: 'Move to project' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'It may have been moved or discarded.',
  );
  expect(screen.getByRole('heading', { name: item.title })).toBeVisible();
});

test.each([new Error('Offline'), 'offline'])(
  'load failures can retry both Inbox and projects: %s',
  async (reason) => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(reason)
      .mockRejectedValueOnce(reason)
      .mockResolvedValueOnce(ok([item]))
      .mockResolvedValueOnce(ok(projects));
    vi.stubGlobal('fetch', fetchMock);
    render(<InboxPage captureVersion={0} />);
    expect(await screen.findAllByRole('alert')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: item.title })).toBeVisible();
    expect(screen.getByLabelText('Destination project')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

test('project loading failure still allows editing and no projects offers creation without losing items', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok([item]))
    .mockResolvedValueOnce({ ok: false, status: 500, json: () => ({}) })
    .mockResolvedValueOnce(ok([item]))
    .mockResolvedValueOnce(ok([]));
  vi.stubGlobal('fetch', fetchMock);
  render(<InboxPage captureVersion={0} />);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Could not load destination projects. Your captured items are still here.',
  );
  expect(screen.getByRole('button', { name: 'Edit item' })).toBeEnabled();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('link', { name: 'Create a project' })).toHaveAttribute(
    'href',
    '#/',
  );
  expect(screen.getByRole('heading', { name: item.title })).toBeVisible();
});

test('capture refresh preserves editing drafts and rejects a stale snapshot after a successful save', async () => {
  const user = userEvent.setup();
  const { fetchMock, rerender } = setup();
  await user.click(await screen.findByRole('button', { name: 'Edit item' }));
  await user.type(screen.getByLabelText('Item title'), ' revised');
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  rerender(<InboxPage captureVersion={1} />);
  expect(screen.getByLabelText('Item title')).toHaveValue('A thought revised');
  const changed = { ...item, title: 'A thought revised' };
  fetchMock.mockResolvedValueOnce(ok(changed));
  await user.click(screen.getByRole('button', { name: 'Save item' }));
  expect(await screen.findByRole('heading', { name: changed.title })).toBeVisible();
  fetchMock.mockResolvedValueOnce(ok([changed])).mockResolvedValueOnce(ok(projects));
  await act(async () => {
    finish(ok([item]));
    await Promise.resolve();
  });
  expect(screen.getByRole('heading', { name: changed.title })).toBeVisible();
  expect(screen.queryByRole('heading', { name: item.title })).not.toBeInTheDocument();
});

test('unmount aborts outstanding Inbox and destination reads', () => {
  const fetchMock = vi.fn().mockReturnValue(new Promise(() => undefined));
  vi.stubGlobal('fetch', fetchMock);
  const { unmount } = render(<InboxPage captureVersion={0} />);
  const signals = fetchMock.mock.calls.map((call) => (call[1] as RequestInit).signal);
  unmount();
  expect(signals).toHaveLength(2);
  expect(signals.every((signal) => signal?.aborted)).toBe(true);
});
