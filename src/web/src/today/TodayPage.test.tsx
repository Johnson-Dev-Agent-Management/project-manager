import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../App';
import ProjectPage from '../projects/ProjectPage';
import { type ProjectTask } from '../projects/api';
import TodayPage, { type TodayPlan } from './TodayPage';
import { localDay, useLocalDay } from './dates';
import SelectionButton from './SelectionButton';

const task: ProjectTask = {
  milestoneId: null,
  id: 1,
  projectId: 7,
  title: 'Plan release',
  notes: null,
  status: 'To do',
  priority: 'High',
  dueDate: '2026-11-03',
};
const item = { task, projectName: 'Work' };
const empty: TodayPlan = { selected: [], due: [], completed: [] };
const ok = (value: unknown) => ({ ok: true, json: () => value });
const day = '2026-11-03';
const clock = () => vi.setSystemTime(new Date(2026, 10, 3, 12));
afterEach(() => {
  vi.useRealTimers();
  window.history.replaceState(null, '', '/');
});

// Mock only Date here so user events and request scheduling use real timers.
function freezeDay() {
  vi.useFakeTimers({ toFake: ['Date'] });
  clock();
}

test('Today navigation, loading, helpful empty sections and project navigation', async () => {
  freezeDay();
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(ok([]))
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
  );
  render(<App />);
  await screen.findByRole('heading', { name: 'Projects' });
  await user.click(screen.getByRole('link', { name: 'Today' }));
  expect(await screen.findByText('Loading today…')).toBeVisible();
  await act(async () => {
    finish(ok(empty));
    await Promise.resolve();
  });
  expect(screen.getByText(/Nothing selected yet/)).toBeVisible();
  expect(screen.getByText(/No other incomplete tasks/)).toBeVisible();
  expect(screen.getByText(/Selected tasks you complete/)).toBeVisible();
  expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '#/');
  expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute('aria-current', 'page');
});

test('cross-project rows show text metadata, add/remove, complete and reopen with narrow requests', async () => {
  freezeDay();
  const user = userEvent.setup();
  const other = {
    task: {
      ...task,
      id: 2,
      projectId: 8,
      title: 'Buy supplies',
      priority: 'None' as const,
      dueDate: null,
      milestoneId: null,
    },
    projectName: 'Home',
  };
  const done = { ...item, task: { ...task, status: 'Done' as const } };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok({ ...empty, selected: [other], due: [item] }))
    .mockResolvedValueOnce(ok({ selected: true }))
    .mockResolvedValueOnce(ok({ ...empty, selected: [item, other] }))
    .mockResolvedValueOnce(ok(done.task))
    .mockResolvedValueOnce(ok({ ...empty, selected: [other], completed: [done] }))
    .mockResolvedValueOnce(ok(task))
    .mockResolvedValueOnce(ok({ ...empty, selected: [item, other] }))
    .mockResolvedValueOnce(ok({ selected: false }))
    .mockResolvedValueOnce(ok({ ...empty, selected: [other], due: [item] }));
  vi.stubGlobal('fetch', fetchMock);
  render(<TodayPage />);
  const dueSection = await screen.findByRole('region', { name: 'Due now' });
  expect(within(dueSection).getByText('Due today', { exact: false })).toBeVisible();
  expect(screen.getByText('Priority: None · No due date')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '#/projects/7');
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '#/projects/8');
  await user.click(within(dueSection).getByRole('button', { name: 'Add to today' }));
  let selected = within(await screen.findByRole('region', { name: 'Selected for today' }));
  expect(
    selected.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
  ).toEqual(['Plan release', 'Buy supplies']);
  expect(screen.getAllByRole('listitem', { name: task.title })).toHaveLength(1);
  let row = within(selected.getByRole('listitem', { name: task.title }));
  await user.selectOptions(row.getByLabelText('Status for Plan release'), 'Done');
  await user.click(row.getByRole('button', { name: 'Save status' }));
  const completed = within(await screen.findByRole('region', { name: 'Completed today' }));
  expect(completed.getByText('Status: Done')).toBeVisible();
  expect(completed.queryByText(/Due today/)).not.toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/tasks/1/status',
    expect.objectContaining({ body: JSON.stringify({ status: 'Done' }) }),
  );
  await user.selectOptions(completed.getByLabelText('Status for Plan release'), 'In progress');
  await user.click(completed.getByRole('button', { name: 'Save status' }));
  selected = within(await screen.findByRole('region', { name: 'Selected for today' }));
  row = within(selected.getByRole('listitem', { name: task.title }));
  await user.click(row.getByRole('button', { name: 'Remove from today' }));
  expect(
    within(await screen.findByRole('region', { name: 'Due now' })).getByRole('listitem', {
      name: task.title,
    }),
  ).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith(
    `/api/today/${day}/tasks/1`,
    expect.objectContaining({ body: JSON.stringify({ selected: false }) }),
  );
});

test('failed load and save preserve retry paths; saving disables duplicate changes', async () => {
  freezeDay();
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(ok({ ...empty, selected: [item] }))
    .mockRejectedValueOnce(new Error('Status unavailable'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(
      ok({ ...empty, completed: [{ ...item, task: { ...task, status: 'Done' } }] }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<TodayPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Offline');
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  await user.selectOptions(await screen.findByLabelText('Status for Plan release'), 'Done');
  await user.click(screen.getByRole('button', { name: 'Save status' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Status unavailable');
  expect(screen.getByText('Status: To do')).toBeVisible();
  expect(screen.getByLabelText('Status for Plan release')).toHaveValue('Done');
  await user.click(screen.getByRole('button', { name: 'Save status' }));
  expect(screen.getByRole('button', { name: 'Saving status…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Saving status…' }));
  expect(fetchMock).toHaveBeenCalledTimes(4);
  await act(async () => {
    finish(ok(task));
    await Promise.resolve();
  });
  expect(await screen.findByText('Status: Done')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('selection errors can be retried and midnight blocks actions on yesterday’s controls', async () => {
  freezeDay();
  const user = userEvent.setup();
  const onSaved = vi.fn();
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockRejectedValueOnce('offline')
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<SelectionButton taskId={1} day={day} selected={false} onSaved={onSaved} />);
  await user.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not update today. Try again.');
  await user.click(screen.getByRole('button'));
  expect(screen.getByRole('button', { name: 'Updating today…' })).toBeDisabled();
  await user.click(screen.getByRole('button'));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await act(async () => {
    finish(ok({ selected: true }));
    await Promise.resolve();
  });
  expect(onSaved).toHaveBeenCalledWith(true);
  vi.setSystemTime(new Date(2026, 10, 4));
  await user.click(screen.getByRole('button'));
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('calendar dates use local fields at UTC offsets, leap day and year boundaries', () => {
  // Local accessors are deliberately different from UTC here, independently of the test runner timezone.
  const local = new Date('2027-01-01T01:00:00Z');
  vi.spyOn(local, 'getFullYear').mockReturnValue(2026);
  vi.spyOn(local, 'getMonth').mockReturnValue(11);
  vi.spyOn(local, 'getDate').mockReturnValue(31);
  expect(localDay(local)).toBe('2026-12-31');
  expect(localDay(new Date(2028, 1, 29, 23, 59))).toBe('2028-02-29');
  expect(localDay(new Date(2027, 0, 1))).toBe('2027-01-01');
});

test('an open Today page rolls at midnight and ignores the aborted yesterday response', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));
  let yesterday!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          yesterday = resolve;
        }),
    )
    .mockResolvedValueOnce(
      ok({ ...empty, due: [{ ...item, task: { ...task, dueDate: '2026-12-31' } }] }),
    );
  vi.stubGlobal('fetch', fetchMock);
  const view = render(<TodayPage />);
  const oldSignal = (fetchMock.mock.calls[0][1] as RequestInit).signal;
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(oldSignal?.aborted).toBe(true);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/today/2027-01-01', expect.anything());
  expect(screen.getByText(/Overdue/)).toBeVisible();
  await act(async () => {
    yesterday(ok({ ...empty, selected: [item] }));
    await Promise.resolve();
  });
  expect(screen.getByText(/Nothing selected yet/)).toBeVisible();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('focus and visibility resynchronize a sleeping tab or a changed local clock', () => {
  vi.useFakeTimers();
  clock();
  function Clock() {
    return <p>{useLocalDay()}</p>;
  }
  const view = render(<Clock />);
  vi.setSystemTime(new Date(2026, 10, 4, 10));
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
  expect(screen.getByText('2026-11-04')).toBeVisible();
  vi.setSystemTime(new Date(2026, 10, 5, 10));
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(screen.getByText('2026-11-05')).toBeVisible();
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('project task priorities/dates can be created, edited and cleared; selection persists independently', async () => {
  freezeDay();
  const user = userEvent.setup();
  const detail = { id: 7, name: 'Work', description: null, tasks: [], selectedTaskIds: [] };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(detail))
    .mockResolvedValueOnce(ok(task))
    .mockResolvedValueOnce(ok({ selected: true }))
    .mockResolvedValueOnce(ok({ ...task, priority: 'Low', dueDate: '2026-11-02' }))
    .mockResolvedValueOnce(ok({ ...task, priority: 'None', dueDate: null }));
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="7" />);
  const create = within(await screen.findByRole('form', { name: 'New task' }));
  expect(create.getByLabelText('Priority')).toHaveValue('None');
  expect(create.getByLabelText('Due date (optional)')).toHaveValue('');
  await user.type(create.getByLabelText('Task title'), task.title);
  await user.selectOptions(create.getByLabelText('Priority'), 'High');
  fireEvent.change(create.getByLabelText('Due date (optional)'), { target: { value: day } });
  await user.click(create.getByRole('button', { name: 'Add task' }));
  const edit = within(await screen.findByRole('form', { name: `Edit task: ${task.title}` }));
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/projects/7/tasks',
    expect.objectContaining({
      body: JSON.stringify({
        title: task.title,
        notes: '',
        priority: 'High',
        dueDate: day,
        milestoneId: null,
      }),
    }),
  );
  expect(create.getByLabelText('Priority')).toHaveValue('None');
  expect(create.getByLabelText('Due date (optional)')).toHaveValue('');
  expect(screen.getByText(/Due today/)).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Add to today' }));
  expect(await screen.findByRole('button', { name: 'Remove from today' })).toBeVisible();
  await user.selectOptions(edit.getByLabelText('Priority'), 'Low');
  fireEvent.change(edit.getByLabelText('Due date (optional)'), { target: { value: '2026-11-02' } });
  await user.click(edit.getByRole('button', { name: 'Save task' }));
  expect(await screen.findByText(/Overdue/)).toBeVisible();
  await user.selectOptions(edit.getByLabelText('Priority'), 'None');
  await user.click(edit.getByRole('button', { name: 'Clear due date' }));
  await user.click(edit.getByRole('button', { name: 'Save task' }));
  expect(await screen.findByText('Priority: None · No due date')).toBeVisible();
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeVisible();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/7/tasks/1',
    expect.objectContaining({
      body: JSON.stringify({
        title: task.title,
        notes: '',
        status: 'To do',
        priority: 'None',
        dueDate: null,
        milestoneId: null,
      }),
    }),
  );
});

test('a reloaded project recognizes selected completed tasks and can remove them', async () => {
  freezeDay();
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        ok({
          id: 7,
          name: 'Work',
          description: null,
          tasks: [{ ...task, status: 'Done' }],
          selectedTaskIds: [1],
        }),
      )
      .mockResolvedValueOnce(ok({ selected: false })),
  );
  render(<ProjectPage projectId="7" />);
  await user.click(await screen.findByRole('button', { name: 'Remove from today' }));
  expect(screen.queryByRole('button', { name: 'Add to today' })).not.toBeInTheDocument();
  expect(screen.getByText('1 of 1 tasks complete.')).toBeVisible();
  expect(screen.queryByText(/Due today/)).not.toBeInTheDocument();
});

test('project selections refresh at midnight while unsaved task and project fields stay in place', async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));
  const detail = { id: 7, name: 'Work', description: null, tasks: [task], selectedTaskIds: [1] };
  let tomorrow!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(detail))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          tomorrow = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="7" />);
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Unsaved project' } });
  const form = within(screen.getByRole('form', { name: `Edit task: ${task.title}` }));
  fireEvent.change(form.getByLabelText('Priority'), { target: { value: 'Medium' } });
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeDisabled();
  expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/7?day=2027-01-01', expect.anything());
  await act(async () => {
    tomorrow(ok({ ...detail, selectedTaskIds: [] }));
    await Promise.resolve();
  });
  expect(screen.getByRole('button', { name: 'Add to today' })).toBeEnabled();
  expect(screen.getByLabelText('Project name')).toHaveValue('Unsaved project');
  expect(form.getByLabelText('Priority')).toHaveValue('Medium');
});
