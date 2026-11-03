import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../App';
import ProjectPage from './ProjectPage';
import { type ProjectDetail, type ProjectTask } from './api';

const task: ProjectTask = {
  id: 3,
  projectId: 1,
  title: 'First task',
  notes: 'Remember',
  status: 'To do',
};
const project: ProjectDetail = { id: 1, name: 'Example', description: 'Description', tasks: [] };
const ok = (value: unknown) => ({ ok: true, json: () => value });
const problem = (field: string, message: string) => ({
  ok: false,
  status: 400,
  json: () => ({ errors: { [field]: [message] } }),
});
const openProject = () => render(<ProjectPage projectId="1" />);
afterEach(() => window.history.replaceState(null, '', '/'));

test('project links navigate to a bookmarkable detail page and back to the refreshed list', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok([{ id: 1, name: 'Example' }]))
    .mockResolvedValueOnce(ok(project))
    .mockResolvedValueOnce(ok([{ id: 1, name: 'Example' }]));
  vi.stubGlobal('fetch', fetchMock);
  render(<App />);
  const link = await screen.findByRole('link', { name: 'Example' });
  expect(link).toHaveAttribute('href', '#/projects/1');
  await user.click(link);
  expect(await screen.findByRole('heading', { name: 'Example' })).toBeVisible();
  expect(window.location.hash).toBe('#/projects/1');
  await user.click(screen.getByRole('link', { name: 'Back to projects' }));
  expect(await screen.findByRole('heading', { name: 'Projects' })).toBeVisible();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects',
    expect.objectContaining({ signal: expect.any(AbortSignal) as AbortSignal }),
  );
});

test('direct links load the project and unknown routes provide a way back', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(project)));
  window.history.replaceState(null, '', '/#/projects/1');
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Example' })).toBeVisible();
  await act(async () => {
    window.location.hash = '#/unknown';
    await Promise.resolve();
  });
  expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Back to projects' })).toHaveAttribute('href', '#/');
});

test('loading, empty state, project save and server-trimmed fields', async () => {
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
  openProject();
  expect(screen.getByRole('status')).toHaveTextContent('Loading project…');
  expect(screen.queryByRole('button', { name: 'Save project' })).not.toBeInTheDocument();
  await act(async () => {
    finishLoad(ok({ ...project, description: null }));
    await Promise.resolve();
  });
  expect(screen.getByText('No tasks yet. Add your first task below.')).toBeVisible();
  expect(screen.getByText('0 of 0 tasks complete.')).toBeVisible();
  await user.clear(screen.getByLabelText('Project name'));
  await user.type(screen.getByLabelText('Project name'), ' Renamed ');
  await user.type(screen.getByLabelText('Description (optional)'), 'New description');
  await user.click(screen.getByRole('button', { name: 'Save project' }));
  expect(screen.getByRole('button', { name: 'Saving project…' })).toBeDisabled();
  expect(screen.getByLabelText('Project name')).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Saving project…' }));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/1', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: ' Renamed ', description: 'New description' }),
  });
  await act(async () => {
    finishSave(ok({ id: 1, name: 'Renamed', description: 'New description' }));
    await Promise.resolve();
  });
  expect(screen.getByRole('heading', { name: 'Renamed' })).toBeVisible();
  expect(screen.getByLabelText('Project name')).toHaveValue('Renamed');
  expect(screen.getByText('Project saved.')).toBeVisible();
  await user.type(screen.getByLabelText('Description (optional)'), '!');
  expect(screen.queryByText('Project saved.')).not.toBeInTheDocument();
});

test('creates tasks only after saving, edits fields, and counts only saved Done statuses', async () => {
  const user = userEvent.setup();
  let finishSave!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    )
    .mockResolvedValueOnce(
      ok({ ...task, title: 'Edited', notes: 'New notes', status: 'In progress' }),
    )
    .mockResolvedValueOnce(ok({ ...task, title: 'Edited', notes: 'New notes', status: 'Done' }))
    .mockResolvedValueOnce(ok({ ...task, title: 'Edited', notes: 'New notes', status: 'To do' }))
    .mockResolvedValueOnce(ok({ ...task, id: 4, title: 'Second', notes: null }));
  vi.stubGlobal('fetch', fetchMock);
  openProject();
  await screen.findByRole('heading', { name: 'Example' });
  const create = within(screen.getByRole('form', { name: 'New task' }));
  await user.type(create.getByLabelText('Task title'), ' First task ');
  await user.type(create.getByLabelText('Notes (optional)'), 'Remember');
  await user.click(create.getByRole('button', { name: 'Add task' }));
  expect(create.getByRole('button', { name: 'Saving task…' })).toBeDisabled();
  expect(create.getByLabelText('Task title')).toBeDisabled();
  expect(screen.getByText('0 of 0 tasks complete.')).toBeVisible();
  await user.click(create.getByRole('button'));
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/1/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: ' First task ', notes: 'Remember' }),
  });
  await act(async () => {
    finishSave(ok(task));
    await Promise.resolve();
  });
  expect(create.getByLabelText('Task title')).toHaveValue('');
  expect(create.getByLabelText('Notes (optional)')).toHaveValue('');
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
  const edit = within(screen.getByRole('form', { name: 'Edit task: First task' }));
  expect(edit.getAllByRole('option').map((item) => item.textContent)).toEqual([
    'To do',
    'In progress',
    'Done',
  ]);
  expect(edit.getByLabelText('Status')).toHaveValue('To do');
  await user.clear(edit.getByLabelText('Task title'));
  await user.type(edit.getByLabelText('Task title'), 'Edited');
  await user.clear(edit.getByLabelText('Notes (optional)'));
  await user.type(edit.getByLabelText('Notes (optional)'), 'New notes');
  for (const status of ['In progress', 'Done', 'To do']) {
    await user.selectOptions(edit.getByLabelText('Status'), status);
    await user.click(edit.getByRole('button', { name: 'Save task' }));
    await within(screen.getByRole('form', { name: 'Edit task: Edited' })).findByText('Task saved.');
    expect(screen.getByText(`${status === 'Done' ? 1 : 0} of 1 tasks complete.`)).toBeVisible();
  }
  expect(fetchMock).toHaveBeenLastCalledWith('/api/projects/1/tasks/3', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Edited', notes: 'New notes', status: 'To do' }),
  });
  await user.type(create.getByLabelText('Task title'), 'Second');
  await user.click(create.getByRole('button', { name: 'Add task' }));
  expect(await screen.findByText('0 of 2 tasks complete.')).toBeVisible();
});

test('project validation preserves edits and tasks and clears after retry', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(ok({ ...project, tasks: [task] }))
      .mockResolvedValueOnce(problem('name', 'Project name is required.'))
      .mockResolvedValueOnce(ok({ id: 1, name: 'Retry', description: null })),
  );
  openProject();
  await screen.findByRole('heading', { name: 'Example' });
  await user.clear(screen.getByLabelText('Project name'));
  await user.type(screen.getByLabelText('Project name'), '   ');
  await user.click(screen.getByRole('button', { name: 'Save project' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Project name is required.');
  expect(screen.getByRole('heading', { name: 'Example' })).toBeVisible();
  expect(screen.getByLabelText('Project name')).toHaveValue('   ');
  await user.clear(screen.getByLabelText('Project name'));
  await user.type(screen.getByLabelText('Project name'), 'Retry');
  await user.click(screen.getByRole('button', { name: 'Save project' }));
  expect(await screen.findByText('Project saved.')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Description (optional)')).toHaveValue('');
  expect(screen.getByRole('form', { name: 'Edit task: First task' })).toBeVisible();
});

test('failed task edits retain drafts and saved completion count until successful retry', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(ok({ ...project, tasks: [task] }))
      .mockResolvedValueOnce(problem('title', 'Task title is required.'))
      .mockResolvedValueOnce(ok({ ...task, title: 'Retry', status: 'Done', notes: null })),
  );
  openProject();
  const edit = within(await screen.findByRole('form', { name: 'Edit task: First task' }));
  await user.clear(edit.getByLabelText('Task title'));
  await user.type(edit.getByLabelText('Task title'), '   ');
  await user.selectOptions(edit.getByLabelText('Status'), 'Done');
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
  await user.click(edit.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Task title is required.');
  expect(edit.getByLabelText('Task title')).toHaveValue('   ');
  expect(edit.getByLabelText('Status')).toHaveValue('Done');
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
  await user.clear(edit.getByLabelText('Task title'));
  await user.type(edit.getByLabelText('Task title'), 'Retry');
  await user.click(edit.getByRole('button'));
  expect(await screen.findByText('1 of 1 tasks complete.')).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(edit.getByLabelText('Notes (optional)')).toHaveValue('');
});

test.each([
  [
    'validation',
    () => Promise.resolve(problem('title', 'Task title is required.')),
    'Task title is required.',
  ],
  [
    'empty errors',
    () => Promise.resolve({ ok: false, json: () => ({ errors: { title: [] } }) }),
    'Could not create task.',
  ],
  [
    'missing errors',
    () => Promise.resolve({ ok: false, json: () => ({}) }),
    'Could not create task.',
  ],
  [
    'null problem',
    () => Promise.resolve({ ok: false, json: () => null }),
    'Could not create task.',
  ],
  [
    'non-JSON response',
    () =>
      Promise.resolve({
        ok: false,
        json: () => {
          throw new Error('HTML');
        },
      }),
    'Could not create task.',
  ],
  ['network Error', () => Promise.reject(new Error('Offline')), 'Offline'],
  ['non-Error rejection', vi.fn().mockRejectedValue('offline'), 'Could not create task.'],
])(
  'task creation handles %s and allows retry without losing drafts',
  async (_, result, message) => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(ok(project))
        .mockImplementationOnce(result)
        .mockResolvedValueOnce(ok(task)),
    );
    openProject();
    const create = within(await screen.findByRole('form', { name: 'New task' }));
    await user.type(create.getByLabelText('Task title'), '   ');
    await user.type(create.getByLabelText('Notes (optional)'), 'Keep notes');
    await user.click(create.getByRole('button'));
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(create.getByLabelText('Task title')).toHaveValue('   ');
    expect(create.getByLabelText('Notes (optional)')).toHaveValue('Keep notes');
    expect(screen.getByText('0 of 0 tasks complete.')).toBeVisible();
    await user.clear(create.getByLabelText('Task title'));
    await user.type(create.getByLabelText('Task title'), 'First task');
    await user.click(create.getByRole('button'));
    expect(await screen.findByText('0 of 1 tasks complete.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

test.each([
  [
    'missing project',
    () => Promise.resolve({ ok: false, status: 404 }),
    'This project or task could not be found.',
  ],
  [
    'server failure',
    () => Promise.resolve({ ok: false, json: () => ({}) }),
    'Could not load project.',
  ],
  ['network failure', () => Promise.reject(new Error('Offline')), 'Offline'],
  ['unknown failure', vi.fn().mockRejectedValue('offline'), 'Could not load project.'],
])('load %s offers navigation and retry', async (_, result, message) => {
  const user = userEvent.setup();
  vi.stubGlobal('fetch', vi.fn().mockImplementationOnce(result).mockResolvedValueOnce(ok(project)));
  openProject();
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getByRole('link', { name: 'Back to projects' })).toBeVisible();
  expect(screen.queryByRole('form')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('heading', { name: 'Example' })).toBeVisible();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test.each(['resolve', 'reject'])(
  'navigation aborts loading and ignores late %s',
  async (outcome) => {
    let resolve!: (value: unknown) => void;
    let reject!: (reason: unknown) => void;
    const fetchMock = vi.fn((url: string, options: RequestInit) => {
      expect(url).toBe('/api/projects/1');
      expect(options.signal?.aborted).toBe(false);
      return new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const view = openProject();
    view.unmount();
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
    await act(async () => {
      if (outcome === 'reject') reject(new Error('aborted'));
      else resolve(ok(project));
      await Promise.resolve();
    });
    expect(view.container).toBeEmptyDOMElement();
  },
);
