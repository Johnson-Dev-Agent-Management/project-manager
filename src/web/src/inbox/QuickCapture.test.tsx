import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../App';
import QuickCapture from './QuickCapture';
import useQuickCapture from './useQuickCapture';

function CaptureHarness({ onCaptured }: { onCaptured: () => void }) {
  const draft = useQuickCapture(onCaptured);
  return <QuickCapture draft={draft} />;
}

const item = { id: 1, title: 'Thought', notes: null, capturedAt: '2026-11-03T10:00:00Z' };
const ok = (value: unknown) => ({ ok: true, json: () => value });
afterEach(() => window.history.replaceState(null, '', '/'));

test('Enter captures only a title, guards duplicate submits, confirms and focuses the next capture', async () => {
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(ok({ ...item, id: 2, title: 'Another' }));
  vi.stubGlobal('fetch', fetchMock);
  const captured = vi.fn();
  render(<CaptureHarness onCaptured={captured} />);
  const title = screen.getByLabelText('Capture title');
  await user.type(title, ' Thought {Enter}');
  expect(screen.getByRole('button', { name: 'Capturing…' })).toBeDisabled();
  expect(title).toBeDisabled();
  fireEvent.submit(screen.getByRole('form'));
  await user.click(screen.getByRole('button'));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock).toHaveBeenCalledWith('/api/inbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: ' Thought ' }),
  });
  await act(async () => {
    finish(ok(item));
    await Promise.resolve();
  });
  expect(screen.getByRole('status')).toHaveTextContent('Captured “Thought” in Inbox.');
  expect(title).toHaveValue('');
  expect(title).toHaveFocus();
  expect(captured).toHaveBeenCalledOnce();
  await user.type(title, 'Another{Enter}');
  expect(await screen.findByRole('status')).toHaveTextContent('Captured “Another”');
  expect(captured).toHaveBeenCalledTimes(2);
});

test.each([
  [
    'validation',
    { ok: false, status: 400, json: () => ({ errors: { title: ['Item title is required.'] } }) },
    'Item title is required.',
  ],
  [
    'server',
    {
      ok: false,
      status: 500,
      json: () => {
        throw new Error('Not JSON');
      },
    },
    'Could not capture item. Your text is still here; try again.',
  ],
])('preserves entered text after %s failure and retries', async (_, response, message) => {
  const user = userEvent.setup();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response).mockResolvedValueOnce(ok(item)));
  render(<CaptureHarness onCaptured={vi.fn()} />);
  const title = screen.getByLabelText('Capture title');
  await user.type(title, '   {Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(title).toHaveValue('   ');
  expect(screen.getByRole('button', { name: 'Capture' })).toBeEnabled();
  await user.clear(title);
  await user.type(title, 'Thought{Enter}');
  expect(await screen.findByRole('status')).toHaveTextContent('Captured “Thought”');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test.each([new Error('Offline'), 'offline'])(
  'network errors preserve the draft: %s',
  async (reason) => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(reason));
    render(<CaptureHarness onCaptured={vi.fn()} />);
    await user.type(screen.getByLabelText('Capture title'), 'Keep me{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      reason instanceof Error ? 'Offline' : 'Could not capture item. Please try again.',
    );
    expect(screen.getByLabelText('Capture title')).toHaveValue('Keep me');
  },
);

test('capture is only on Projects and keeps its draft across project, Today, Inbox and unknown routes', async () => {
  const user = userEvent.setup();
  let captured = false;
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST') {
        captured = true;
        return Promise.resolve(ok(item));
      }
      if (url === '/api/projects') return Promise.resolve(ok([{ id: 1, name: 'Project' }]));
      if (url.startsWith('/api/projects/1'))
        return Promise.resolve(
          ok({ id: 1, name: 'Project', description: null, tasks: [], selectedTaskIds: [] }),
        );
      if (url.startsWith('/api/today'))
        return Promise.resolve(ok({ selected: [], due: [], completed: [] }));
      return Promise.resolve(ok(captured ? [item] : []));
    }),
  );
  render(<App />);
  await screen.findByRole('link', { name: 'Project' });
  await user.type(screen.getByLabelText('Capture title'), 'Thought');
  await user.click(screen.getByRole('link', { name: 'Project' }));
  await screen.findByRole('heading', { name: 'Project' });
  expect(screen.queryByRole('form', { name: 'Quick capture' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Today' }));
  await screen.findByText('No other incomplete tasks are overdue or due today.');
  expect(screen.queryByRole('form', { name: 'Quick capture' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Inbox' }));
  await screen.findByRole('link', { name: 'Capture on Projects' });
  expect(screen.queryByRole('form', { name: 'Quick capture' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Inbox' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current');
  await act(async () => {
    window.location.hash = '#/missing';
    await Promise.resolve();
  });
  await screen.findByRole('heading', { name: 'Page not found' });
  expect(screen.queryByRole('form', { name: 'Quick capture' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('link', { name: 'Back to projects' }));
  expect(await screen.findByLabelText('Capture title')).toHaveValue('Thought');
  await user.click(screen.getByRole('button', { name: 'Capture' }));
  await screen.findByText(/Captured “Thought”/);
  await user.click(screen.getByRole('link', { name: 'Inbox' }));
  expect(await screen.findByRole('heading', { name: 'Thought' })).toBeVisible();
});

test('a capture completing in Inbox refreshes its contents without stealing navigation focus', async () => {
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  let saved = false;
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string, options?: RequestInit) => {
      if (options?.method === 'POST')
        return new Promise((resolve) => {
          finish = resolve;
        });
      return Promise.resolve(ok(url === '/api/inbox' && saved ? [item] : []));
    }),
  );
  render(<App />);
  await user.type(screen.getByLabelText('Capture title'), 'Thought{Enter}');
  expect(screen.getByRole('button', { name: 'Capturing…' })).toBeDisabled();
  await user.click(screen.getByRole('link', { name: 'Inbox' }));
  await screen.findByRole('link', { name: 'Capture on Projects' });
  expect(screen.queryByRole('form', { name: 'Quick capture' })).not.toBeInTheDocument();
  await act(async () => {
    saved = true;
    finish(ok(item));
    await Promise.resolve();
  });
  expect(await screen.findByRole('heading', { name: 'Thought' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Inbox' })).toHaveFocus();
  await user.click(screen.getByRole('link', { name: 'Projects' }));
  expect(await screen.findByLabelText('Capture title')).toHaveValue('');
  expect(screen.getByRole('status')).toHaveTextContent('Captured “Thought”');
});

test('a failed capture retains its text and error after leaving and returning to Projects', async () => {
  const user = userEvent.setup();
  let fail!: (reason: unknown) => void;
  const post = vi.fn(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      }),
  );
  vi.stubGlobal(
    'fetch',
    vi.fn((_: string, options?: RequestInit) =>
      options?.method === 'POST' ? post() : Promise.resolve(ok([])),
    ),
  );
  render(<App />);
  await user.type(screen.getByLabelText('Capture title'), 'Keep this draft{Enter}');
  await user.click(screen.getByRole('link', { name: 'Inbox' }));
  await screen.findByRole('link', { name: 'Capture on Projects' });
  await user.click(screen.getByRole('link', { name: 'Capture on Projects' }));
  expect(await screen.findByLabelText('Capture title')).toBeDisabled();
  expect(screen.getByLabelText('Capture title')).toHaveValue('Keep this draft');
  await user.click(screen.getByRole('link', { name: 'Inbox' }));
  await act(async () => {
    fail(new Error('Offline'));
    await Promise.resolve();
  });
  await user.click(screen.getByRole('link', { name: 'Projects' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  expect(screen.getByLabelText('Capture title')).toHaveValue('Keep this draft');
  expect(screen.getByRole('button', { name: 'Capture' })).toBeEnabled();
  expect(post).toHaveBeenCalledOnce();
});
