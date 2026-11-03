import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ProjectPage from '../projects/ProjectPage';
import { type ProjectDetail, type ProjectTask } from '../projects/api';
import TodayPage, { type TodayPlan } from './TodayPage';

const task: ProjectTask = {
  id: 1,
  projectId: 7,
  title: 'Task A',
  notes: 'Saved notes',
  status: 'To do',
  priority: 'Low',
  dueDate: '2026-11-03',
};
const other = { ...task, id: 2, title: 'Task B' };
const item = (value: ProjectTask) => ({ task: value, projectName: 'Work' });
const plan: TodayPlan = { selected: [item(task), item(other)], due: [], completed: [] };
const project: ProjectDetail = {
  id: 7,
  name: 'Work',
  description: 'Saved description',
  tasks: [task],
  selectedTaskIds: [1],
};
const ok = (value: unknown) => ({ ok: true, json: () => value });
function deferred() {
  let resolve!: (value: unknown) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function finish(response: ReturnType<typeof deferred>, value: unknown) {
  await act(async () => {
    response.resolve(ok(value));
    await Promise.resolve();
  });
}
function midnight() {
  vi.setSystemTime(new Date(2026, 10, 4));
  act(() => {
    window.dispatchEvent(new Event('focus'));
  });
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 3, 23, 59));
});
afterEach(() => vi.useRealTimers());

test('changing A’s Today selection preserves B’s unsaved status through refresh and section moves', async () => {
  const user = userEvent.setup();
  const refresh = deferred();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(plan))
    .mockResolvedValueOnce(ok({ selected: false }))
    .mockReturnValueOnce(refresh.promise)
    .mockResolvedValueOnce(ok({ selected: false }))
    .mockResolvedValueOnce(ok({ ...plan, selected: [], due: [item(task), item(other)] }));
  vi.stubGlobal('fetch', fetchMock);
  render(<TodayPage />);
  const input = await screen.findByLabelText('Status for Task B');
  await user.selectOptions(input, 'Done');
  await user.click(
    within(screen.getByRole('listitem', { name: 'Task A' })).getByRole('button', {
      name: 'Remove from today',
    }),
  );
  expect(screen.getByLabelText('Status for Task B')).toHaveValue('Done');
  expect(input).toBeVisible();
  await finish(refresh, { ...plan, selected: [item(other)], due: [item(task)] });
  expect(screen.getByLabelText('Status for Task B')).toHaveValue('Done');
  const b = within(screen.getByRole('listitem', { name: 'Task B' }));
  await user.click(b.getByRole('button', { name: 'Remove from today' }));
  const moved = within(screen.getByRole('region', { name: 'Due now' }));
  expect(moved.getByLabelText('Status for Task B')).toHaveValue('Done');
  expect(
    within(moved.getByRole('listitem', { name: 'Task B' })).getByText('Status: To do'),
  ).toBeVisible();
});

test.each(['selected', 'due', 'completed'] as const)(
  'B’s pending status, failure and retry survive A’s refresh with B in %s',
  async (section) => {
    const user = userEvent.setup();
    const save = deferred();
    const refresh = deferred();
    const refreshed: TodayPlan = { selected: [], due: [item(task)], completed: [] };
    refreshed[section].push(item({ ...other, status: section === 'completed' ? 'Done' : 'To do' }));
    const saved: TodayPlan = { selected: [], due: [item(task)], completed: [] };
    saved[section === 'due' ? 'due' : 'selected'].push(item({ ...other, status: 'In progress' }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(plan))
      .mockReturnValueOnce(save.promise)
      .mockResolvedValueOnce(ok({ selected: false }))
      .mockReturnValueOnce(refresh.promise)
      .mockResolvedValueOnce(ok({ ...other, status: 'In progress' }))
      .mockResolvedValueOnce(ok(saved));
    vi.stubGlobal('fetch', fetchMock);
    render(<TodayPage />);
    await user.selectOptions(await screen.findByLabelText('Status for Task B'), 'In progress');
    await user.click(
      within(screen.getByRole('listitem', { name: 'Task B' })).getByRole('button', {
        name: 'Save status',
      }),
    );
    await user.click(
      within(screen.getByRole('listitem', { name: 'Task A' })).getByRole('button', {
        name: 'Remove from today',
      }),
    );
    expect(screen.getByLabelText('Status for Task B')).toBeDisabled();
    await finish(refresh, refreshed);
    expect(screen.getByLabelText('Status for Task B')).toHaveValue('In progress');
    expect(screen.getByRole('button', { name: 'Saving status…' })).toBeDisabled();
    await act(async () => {
      save.reject(new Error('Status save failed'));
      await Promise.resolve();
    });
    const b = within(screen.getByRole('listitem', { name: 'Task B' }));
    expect(b.getByRole('alert')).toHaveTextContent('Status save failed');
    expect(b.getByLabelText('Status for Task B')).toHaveValue('In progress');
    expect(b.getByLabelText('Status for Task B')).toBeEnabled();
    await user.click(b.getByRole('button', { name: 'Save status' }));
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/tasks/2/status',
      expect.objectContaining({ body: JSON.stringify({ status: 'In progress' }) }),
    );
    expect(
      within(await screen.findByRole('listitem', { name: 'Task B' })).getByText(
        'Status: In progress',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

test('a failed Today background refresh and its retry retain row drafts and errors', async () => {
  const user = userEvent.setup();
  const retry = deferred();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(ok(plan))
      .mockRejectedValueOnce(new Error('B status failed'))
      .mockResolvedValueOnce(ok({ selected: false }))
      .mockRejectedValueOnce(new Error('Refresh offline'))
      .mockReturnValueOnce(retry.promise),
  );
  render(<TodayPage />);
  await user.selectOptions(await screen.findByLabelText('Status for Task B'), 'Done');
  await user.click(
    within(screen.getByRole('listitem', { name: 'Task B' })).getByRole('button', {
      name: 'Save status',
    }),
  );
  await user.click(
    within(screen.getByRole('listitem', { name: 'Task A' })).getByRole('button', {
      name: 'Remove from today',
    }),
  );
  expect(await screen.findByText('Refresh offline')).toBeVisible();
  expect(screen.getByLabelText('Status for Task B')).toHaveValue('Done');
  expect(screen.getByText('B status failed')).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(screen.getByLabelText('Status for Task B')).toHaveValue('Done');
  await finish(retry, { ...plan, selected: [item(other)], due: [item(task)] });
  expect(screen.getByText('B status failed')).toBeVisible();
  expect(screen.queryByText('Refresh offline')).not.toBeInTheDocument();
});

test('existing task and new task drafts survive a failed midnight refresh and retry', async () => {
  const user = userEvent.setup();
  const refresh = deferred();
  const retry = deferred();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockReturnValueOnce(refresh.promise)
    .mockReturnValueOnce(retry.promise);
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="7" />);
  const editElement = await screen.findByRole('form', { name: 'Edit task: Task A' });
  const edit = within(editElement);
  const createElement = screen.getByRole('form', { name: 'New task' });
  const create = within(createElement);
  await user.clear(edit.getByLabelText('Task title'));
  await user.type(edit.getByLabelText('Task title'), 'Unsaved edit');
  await user.selectOptions(edit.getByLabelText('Status'), 'Done');
  await user.selectOptions(edit.getByLabelText('Priority'), 'High');
  await user.type(create.getByLabelText('Task title'), 'Unsaved new task');
  await user.type(create.getByLabelText('Notes (optional)'), 'Draft notes');
  fireEvent.change(create.getByLabelText('Due date (optional)'), {
    target: { value: '2026-11-05' },
  });
  midnight();
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeDisabled();
  await act(async () => {
    refresh.reject(new Error('Refresh offline'));
    await Promise.resolve();
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Refresh offline');
  expect(editElement).toBeVisible();
  expect(createElement).toBeVisible();
  expect(screen.queryByText('Project unavailable')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Remove from today' }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(editElement).toBeVisible();
  expect(createElement).toBeVisible();
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeDisabled();
  await finish(retry, { ...project, selectedTaskIds: [] });
  expect(edit.getByLabelText('Task title')).toHaveValue('Unsaved edit');
  expect(edit.getByLabelText('Status')).toHaveValue('Done');
  expect(edit.getByLabelText('Priority')).toHaveValue('High');
  expect(create.getByLabelText('Task title')).toHaveValue('Unsaved new task');
  expect(create.getByLabelText('Notes (optional)')).toHaveValue('Draft notes');
  expect(create.getByLabelText('Due date (optional)')).toHaveValue('2026-11-05');
  expect(screen.getByRole('button', { name: 'Add to today' })).toBeEnabled();
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test.each(['creation', 'task edit', 'project edit'])(
  'an older midnight response cannot undo a successful %s',
  async (mutation) => {
    const user = userEvent.setup();
    const refresh = deferred();
    const fresh = deferred();
    const changed = {
      ...task,
      id: mutation === 'creation' ? 3 : 1,
      title: 'Saved task',
      priority: 'High' as const,
      dueDate: '2026-11-05',
      status: mutation === 'creation' ? ('To do' as const) : ('Done' as const),
    };
    const editedProject = { id: 7, name: 'Saved project', description: 'Saved new description' };
    const current: ProjectDetail = {
      ...project,
      ...(mutation === 'project edit' ? editedProject : {}),
      tasks:
        mutation === 'project edit'
          ? [task]
          : mutation === 'creation'
            ? [task, changed]
            : [changed],
      selectedTaskIds: [],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(project))
      .mockReturnValueOnce(refresh.promise)
      .mockResolvedValueOnce(ok(mutation === 'project edit' ? editedProject : changed))
      .mockReturnValueOnce(fresh.promise);
    vi.stubGlobal('fetch', fetchMock);
    render(<ProjectPage projectId="7" />);
    await screen.findByRole('heading', { name: 'Work' });
    midnight();
    if (mutation === 'project edit') {
      await user.clear(screen.getByLabelText('Project name'));
      await user.type(screen.getByLabelText('Project name'), 'Saved project');
      await user.clear(screen.getByLabelText('Description (optional)'));
      await user.type(screen.getByLabelText('Description (optional)'), 'Saved new description');
      await user.click(screen.getByRole('button', { name: 'Save project' }));
      await screen.findByText('Project saved.');
    } else {
      const form = within(
        screen.getByRole('form', {
          name: mutation === 'creation' ? 'New task' : 'Edit task: Task A',
        }),
      );
      await user.clear(form.getByLabelText('Task title'));
      await user.type(form.getByLabelText('Task title'), changed.title);
      await user.selectOptions(form.getByLabelText('Priority'), 'High');
      fireEvent.change(form.getByLabelText('Due date (optional)'), {
        target: { value: changed.dueDate },
      });
      if (mutation === 'task edit') await user.selectOptions(form.getByLabelText('Status'), 'Done');
      await user.click(
        form.getByRole('button', { name: mutation === 'creation' ? 'Add task' : 'Save task' }),
      );
      await screen.findByText(mutation === 'creation' ? 'Task added.' : 'Task saved.');
    }
    await finish(refresh, { ...project, selectedTaskIds: [] });
    if (mutation === 'project edit') {
      expect(screen.getByRole('heading', { name: 'Saved project' })).toBeVisible();
      expect(screen.getByLabelText('Project name')).toHaveValue('Saved project');
      expect(screen.getByLabelText('Description (optional)')).toHaveValue('Saved new description');
    } else {
      expect(screen.getByRole('form', { name: 'Edit task: Saved task' })).toBeVisible();
      expect(screen.getByText(/Priority: High/)).toHaveTextContent('2026-11-05');
    }
    const count =
      mutation === 'creation' ? '0 of 2' : mutation === 'task edit' ? '1 of 1' : '0 of 1';
    expect(screen.getByText(`${count} tasks complete.`)).toBeVisible();
    await finish(fresh, current);
    expect(screen.getByText(`${count} tasks complete.`)).toBeVisible();
    if (mutation !== 'project edit')
      expect(screen.getByRole('form', { name: 'Edit task: Saved task' })).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

test('confirmed Today status and selection changes survive failed follow-up reads', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(plan))
    .mockResolvedValueOnce(ok({ ...other, status: 'Done' }))
    .mockRejectedValueOnce(new Error('Refresh offline'))
    .mockResolvedValueOnce(ok({ selected: false }))
    .mockRejectedValueOnce(new Error('Still offline'));
  vi.stubGlobal('fetch', fetchMock);
  render(<TodayPage />);
  await user.selectOptions(await screen.findByLabelText('Status for Task B'), 'Done');
  await user.click(
    within(screen.getByRole('listitem', { name: 'Task B' })).getByRole('button', {
      name: 'Save status',
    }),
  );
  expect(await screen.findByText('Refresh offline')).toBeVisible();
  const completed = within(screen.getByRole('region', { name: 'Completed today' }));
  expect(completed.getByText('Status: Done')).toBeVisible();
  expect(completed.getByLabelText('Status for Task B')).toHaveValue('Done');
  await user.click(
    within(screen.getByRole('listitem', { name: 'Task A' })).getByRole('button', {
      name: 'Remove from today',
    }),
  );
  expect(await screen.findByText('Still offline')).toBeVisible();
  expect(
    within(screen.getByRole('region', { name: 'Due now' })).getByRole('listitem', {
      name: 'Task A',
    }),
  ).toBeVisible();
  expect(screen.getAllByRole('listitem', { name: 'Task A' })).toHaveLength(1);
  expect(completed.getByText('Status: Done')).toBeVisible();
});

test('a delayed Today read cannot roll back a status saved while that read was pending', async () => {
  const user = userEvent.setup();
  const oldRead = deferred();
  const fresh = deferred();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(plan))
    .mockResolvedValueOnce(ok({ selected: false }))
    .mockReturnValueOnce(oldRead.promise)
    .mockResolvedValueOnce(ok({ ...other, status: 'Done' }))
    .mockReturnValueOnce(fresh.promise);
  vi.stubGlobal('fetch', fetchMock);
  render(<TodayPage />);
  await user.click(
    within(await screen.findByRole('listitem', { name: 'Task A' })).getByRole('button', {
      name: 'Remove from today',
    }),
  );
  await user.selectOptions(screen.getByLabelText('Status for Task B'), 'Done');
  await user.click(
    within(screen.getByRole('listitem', { name: 'Task B' })).getByRole('button', {
      name: 'Save status',
    }),
  );
  await finish(fresh, {
    selected: [],
    due: [item(task)],
    completed: [item({ ...other, status: 'Done' })],
  });
  await finish(oldRead, plan);
  expect(
    within(screen.getByRole('region', { name: 'Completed today' })).getByText('Status: Done'),
  ).toBeVisible();
  expect(
    within(screen.getByRole('region', { name: 'Selected for today' })).queryByRole('listitem'),
  ).not.toBeInTheDocument();
});
