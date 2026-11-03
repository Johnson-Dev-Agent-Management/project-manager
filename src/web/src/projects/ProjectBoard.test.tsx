import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../App';
import ProjectPage from './ProjectPage';
import { type ProjectTask } from './api';
import { localDay } from '../today/dates';

const task: ProjectTask = {
  id: 3,
  projectId: 1,
  title: 'Plan work',
  notes: 'Keep notes',
  status: 'To do',
  priority: 'High',
  dueDate: localDay(),
};
const project = { id: 1, name: 'Work', description: null, tasks: [task], selectedTaskIds: [3] };
const ok = (value: unknown) => ({ ok: true, json: () => value });
const column = (status: string) => within(screen.getByRole('region', { name: status }));
const card = () => screen.getByRole('listitem', { name: task.title });
async function openBoard() {
  const user = userEvent.setup();
  render(<ProjectPage projectId="1" />);
  await user.click(await screen.findByRole('button', { name: 'Board' }));
  return user;
}
function dragTo(status: string) {
  const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };
  fireEvent.dragStart(card(), { dataTransfer });
  fireEvent.dragOver(screen.getByRole('region', { name: status }), { dataTransfer });
  fireEvent.drop(screen.getByRole('region', { name: status }), { dataTransfer });
  fireEvent.dragEnd(card(), { dataTransfer });
}
afterEach(() => window.history.replaceState(null, '', '/'));

test('groups every saved task once in ID order with counts, metadata and empty columns', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      ok({
        ...project,
        tasks: [
          { ...task, id: 9, title: 'Later', dueDate: null },
          { ...task, id: 6, title: 'Finished', status: 'Done', dueDate: '2000-01-01' },
          { ...task, id: 2, title: 'Earlier', dueDate: '2000-01-01' },
          task,
        ],
      }),
    ),
  );
  const user = await openBoard();
  expect(
    column('To do')
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('aria-label')),
  ).toEqual(['Earlier', 'Plan work', 'Later']);
  expect(column('To do').getByRole('heading', { name: 'To do (3)' })).toBeVisible();
  expect(column('In progress').getByRole('heading', { name: 'In progress (0)' })).toBeVisible();
  expect(column('In progress').getByText('No tasks')).toBeVisible();
  expect(column('Done').getByRole('heading', { name: 'Done (1)' })).toBeVisible();
  expect(screen.getAllByRole('listitem')).toHaveLength(4);
  expect(within(card()).getByText(/Priority: High/)).toHaveTextContent('Due today');
  expect(column('To do').getByText(/Overdue/)).toBeVisible();
  expect(column('Done').queryByText(/Overdue/)).not.toBeInTheDocument();
  expect(screen.getByText('1 of 4 tasks complete.')).toBeVisible();
  expect(screen.getByRole('form', { name: 'New task' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: 'List' }));
  expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('form', { name: 'Edit task: Plan work' })).toBeVisible();
});

test('an empty project has all three columns and can create a task from the board', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(ok({ ...project, tasks: [] }))
      .mockResolvedValueOnce(ok(task)),
  );
  const user = await openBoard();
  for (const status of ['To do', 'In progress', 'Done'])
    expect(column(status).getByRole('heading', { name: `${status} (0)` })).toBeVisible();
  const form = within(screen.getByRole('form', { name: 'New task' }));
  await user.type(form.getByLabelText('Task title'), task.title);
  await user.click(form.getByRole('button', { name: 'Add task' }));
  expect(await screen.findByRole('listitem', { name: task.title })).toBeVisible();
  expect(column('To do').getByRole('heading', { name: 'To do (1)' })).toBeVisible();
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
});

test('accessible movement saves only status, restores focus, reopens Done and synchronizes the list without losing drafts', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(ok(project));
  for (const status of ['In progress', 'Done', 'To do'])
    fetchMock.mockResolvedValueOnce(ok({ ...task, status }));
  vi.stubGlobal('fetch', fetchMock);
  const user = userEvent.setup();
  render(<ProjectPage projectId="1" />);
  const edit = within(await screen.findByRole('form', { name: 'Edit task: Plan work' }));
  await user.type(edit.getByLabelText('Notes (optional)'), ' draft');
  const create = within(screen.getByRole('form', { name: 'New task' }));
  await user.type(create.getByLabelText('Task title'), 'New draft');
  await user.click(screen.getByRole('button', { name: 'Board' }));
  for (const status of ['In progress', 'Done', 'To do']) {
    const select = within(card()).getByRole('combobox', { name: 'Status for Plan work' });
    select.focus();
    await user.selectOptions(select, status);
    expect(await screen.findByText(`Moved “Plan work” to ${status}.`)).toBeVisible();
    expect(column(status).getByRole('listitem', { name: task.title })).toBeVisible();
    expect(within(card()).getByRole('combobox')).toHaveFocus();
    expect(screen.getByText(`${status === 'Done' ? 1 : 0} of 1 tasks complete.`)).toBeVisible();
    expect(within(card()).getByRole('button', { name: 'Remove from today' })).toBeVisible();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/tasks/3/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  }
  await user.click(within(card()).getByRole('button', { name: 'Edit task: Plan work' }));
  expect(edit.getByLabelText('Task title')).toHaveFocus();
  expect(edit.getByLabelText('Notes (optional)')).toHaveValue('Keep notes draft');
  expect(edit.getByLabelText('Status')).toHaveValue('To do');
  expect(edit.getByLabelText('Priority')).toHaveValue('High');
  expect(edit.getByLabelText('Due date (optional)')).toHaveValue(task.dueDate);
  expect(create.getByLabelText('Task title')).toHaveValue('New draft');
});

test.each(['server', 'network'])(
  '%s failure keeps the last saved column/count and permits retry while pending moves block conflicting actions',
  async (failure) => {
    let finish!: (value: unknown) => void;
    let reject!: (reason: unknown) => void;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(project))
      .mockImplementationOnce(
        () =>
          new Promise((yes, no) => {
            finish = yes;
            reject = no;
          }),
      )
      .mockResolvedValueOnce(ok({ ...task, status: 'Done' }));
    vi.stubGlobal('fetch', fetchMock);
    const user = await openBoard();
    dragTo('Done');
    expect(column('To do').getByRole('listitem', { name: task.title })).toBeVisible();
    expect(within(card()).getByRole('combobox')).toBeDisabled();
    expect(within(card()).getByRole('button', { name: 'Remove from today' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'List' })).toBeDisabled();
    expect(card()).toHaveAttribute('draggable', 'false');
    dragTo('In progress');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await act(async () => {
      if (failure === 'server') finish({ ok: false, json: () => ({}) });
      else reject('offline');
      await Promise.resolve();
    });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '“Plan work” remains in To do. Could not move task. Try again.',
    );
    expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
    expect(column('Done').getByRole('heading', { name: 'Done (0)' })).toBeVisible();
    await user.selectOptions(within(card()).getByRole('combobox'), 'Done');
    expect(await screen.findByText('Moved “Plan work” to Done.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(column('Done').getByRole('heading', { name: 'Done (1)' })).toBeVisible();
  },
);

test('dragging uses the same status API; same-column, cancelled and external drags do not submit', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockResolvedValueOnce(ok({ ...task, status: 'In progress' }));
  vi.stubGlobal('fetch', fetchMock);
  await openBoard();
  dragTo('To do');
  fireEvent.dragOver(screen.getByRole('region', { name: 'Done' }));
  fireEvent.drop(screen.getByRole('region', { name: 'Done' }));
  fireEvent.dragStart(card(), { dataTransfer: { setData: vi.fn() } });
  fireEvent.dragLeave(screen.getByRole('region', { name: 'To do' }));
  fireEvent.dragEnd(card());
  expect(fetchMock).toHaveBeenCalledTimes(1);
  dragTo('In progress');
  expect(await screen.findByText('Moved “Plan work” to In progress.')).toBeVisible();
  expect(column('In progress').getByRole('listitem', { name: task.title })).toBeVisible();
});

test('quick capture stays usable during a move and keeps its input focus after the move finishes', async () => {
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(ok({ id: 1, title: 'Idea' }));
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState(null, '', '/#/projects/1');
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Board' }));
  await user.selectOptions(within(card()).getByRole('combobox'), 'Done');
  const capture = screen.getByLabelText('Capture title');
  await user.type(capture, 'Idea{Enter}');
  expect(await screen.findByText(/Captured “Idea”/)).toBeVisible();
  expect(capture).toHaveFocus();
  await act(async () => {
    finish(ok({ ...task, status: 'Done' }));
    await Promise.resolve();
  });
  expect(await screen.findByText('Moved “Plan work” to Done.')).toBeVisible();
  expect(capture).toHaveFocus();
});

test('a saved board status survives later detail edits and Today selection serializes with moves', async () => {
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockResolvedValueOnce(ok({ ...task, status: 'In progress' }))
    .mockResolvedValueOnce(ok({ ...task, status: 'In progress', notes: 'Keep notes draft' }))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  const user = await openBoard();
  await user.selectOptions(within(card()).getByRole('combobox'), 'In progress');
  await screen.findByText('Moved “Plan work” to In progress.');
  await user.click(within(card()).getByRole('button', { name: 'Edit task: Plan work' }));
  const edit = within(screen.getByRole('form', { name: 'Edit task: Plan work' }));
  await user.type(edit.getByLabelText('Notes (optional)'), ' draft');
  await user.click(edit.getByRole('button', { name: 'Save task' }));
  expect(await edit.findByText('Task saved.')).toBeVisible();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/1/tasks/3',
    expect.objectContaining({
      body: JSON.stringify({
        title: task.title,
        notes: 'Keep notes draft',
        status: 'In progress',
        priority: 'High',
        dueDate: task.dueDate,
      }),
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Board' }));
  expect(column('In progress').getByRole('listitem', { name: task.title })).toBeVisible();
  await user.click(within(card()).getByRole('button', { name: 'Remove from today' }));
  expect(within(card()).getByRole('combobox')).toBeDisabled();
  dragTo('Done');
  expect(fetchMock).toHaveBeenCalledTimes(4);
  await act(async () => {
    finish(ok({ selected: false }));
    await Promise.resolve();
  });
  expect(within(card()).getByRole('button', { name: 'Add to today' })).toBeVisible();
  expect(within(card()).getByRole('combobox')).toBeEnabled();
});
