import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import App from '../App';
import ProjectPage from './ProjectPage';
import { type ProjectDetail, type ProjectMilestone, type ProjectTask } from './api';

const milestone: ProjectMilestone = {
  id: 2,
  projectId: 1,
  title: 'First usable version',
  description: 'An outcome',
  targetDate: '2028-02-29',
};
const task: ProjectTask = {
  id: 3,
  projectId: 1,
  title: 'Deliver',
  notes: 'Keep notes',
  status: 'To do',
  priority: 'High',
  dueDate: '2026-11-03',
  milestoneId: 2,
};
const project: ProjectDetail = {
  id: 1,
  name: 'Work',
  description: null,
  tasks: [task],
  selectedTaskIds: [3],
  milestones: [milestone],
};
const ok = (value: unknown) => ({ ok: true, json: () => value });
const region = (title = milestone.title) =>
  within(screen.getByRole('region', { name: `Milestone: ${title}` }));
const taskForm = () => within(screen.getByRole('form', { name: 'Edit task: Deliver' }));
afterEach(() => window.history.replaceState(null, '', '/'));

test('loads an empty project, preserves failed creation drafts, prevents duplicate saves and shows an empty milestone as incomplete', async () => {
  const user = userEvent.setup();
  let load!: (value: unknown) => void;
  let save!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          load = resolve;
        }),
    )
    .mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => ({ errors: { title: ['Milestone title is required.'] } }),
    })
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          save = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  expect(screen.getByText('Loading project…')).toBeVisible();
  expect(screen.queryByText('Create milestone')).not.toBeInTheDocument();
  await act(async () => {
    load(ok({ ...project, tasks: [], milestones: [] }));
    await Promise.resolve();
  });
  expect(screen.getByText('No milestones yet. Create an outcome to work toward.')).toBeVisible();
  await user.click(screen.getByText('Create milestone'));
  const form = within(screen.getByRole('form', { name: 'New milestone' }));
  expect(form.getByLabelText('Milestone title')).toBeRequired();
  await user.type(form.getByLabelText('Milestone title'), '   ');
  await user.click(form.getByRole('button', { name: 'Add milestone' }));
  expect(await form.findByRole('alert')).toHaveTextContent('Milestone title is required.');
  expect(form.getByLabelText('Milestone title')).toHaveValue('   ');
  await user.clear(form.getByLabelText('Milestone title'));
  await user.type(form.getByLabelText('Milestone title'), ' First usable version ');
  await user.type(form.getByLabelText('Milestone description (optional)'), 'An outcome');
  fireEvent.change(form.getByLabelText('Target date (optional)'), {
    target: { value: '2028-02-29' },
  });
  await user.click(form.getByRole('button', { name: 'Add milestone' }));
  expect(form.getByRole('button', { name: 'Saving milestone…' })).toBeDisabled();
  expect(form.getByLabelText('Milestone title')).toBeDisabled();
  fireEvent.submit(screen.getByRole('form', { name: 'New milestone' }));
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/1/milestones',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        title: ' First usable version ',
        description: 'An outcome',
        targetDate: '2028-02-29',
      }),
    }),
  );
  await act(async () => {
    save(ok(milestone));
    await Promise.resolve();
  });
  expect(region().getByText('No tasks assigned')).toBeVisible();
  expect(region().queryByText(/· Complete/)).not.toBeInTheDocument();
  expect(region().getByRole('progressbar')).toHaveAttribute('value', '0');
  expect(region().getByRole('progressbar')).toHaveAttribute('max', '1');
  expect(form.getByLabelText('Milestone title')).toHaveValue('');
  expect(form.queryByRole('alert')).not.toBeInTheDocument();
  expect(screen.getByText('Milestone “First usable version” saved.')).toBeVisible();
});

test('edits and clears milestone fields, handles missing saves and cancels without touching task due dates', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockResolvedValueOnce(
      ok({ ...milestone, title: 'Release', description: null, targetDate: null }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  await user.click(await screen.findByRole('button', { name: 'Edit milestone' }));
  let edit = within(screen.getByRole('form', { name: `Edit milestone: ${milestone.title}` }));
  await user.clear(edit.getByLabelText('Milestone title'));
  await user.type(edit.getByLabelText('Milestone title'), 'Release');
  await user.click(edit.getByRole('button', { name: 'Cancel edit' }));
  expect(region().getByRole('heading')).toHaveTextContent(milestone.title);
  await user.click(region().getByRole('button', { name: 'Edit milestone' }));
  edit = within(screen.getByRole('form', { name: `Edit milestone: ${milestone.title}` }));
  expect(edit.getByLabelText('Milestone title')).toHaveValue(milestone.title);
  await user.clear(edit.getByLabelText('Milestone title'));
  await user.type(edit.getByLabelText('Milestone title'), ' Release ');
  await user.clear(edit.getByLabelText('Milestone description (optional)'));
  await user.click(edit.getByRole('button', { name: 'Clear target date' }));
  expect(edit.getByRole('button', { name: 'Clear target date' })).toBeDisabled();
  await user.click(edit.getByRole('button', { name: 'Save milestone' }));
  expect(await edit.findByRole('alert')).toHaveTextContent(
    'This milestone no longer exists. Reload the project to refresh milestones.',
  );
  expect(edit.getByLabelText('Milestone title')).toHaveValue(' Release ');
  await user.click(edit.getByRole('button', { name: 'Save milestone' }));
  expect(region('Release').getByText('No target date')).toBeVisible();
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/1/milestones/2',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ title: ' Release ', description: '', targetDate: null }),
    }),
  );
  expect(taskForm().getByLabelText('Due date (optional)')).toHaveValue(task.dueDate);
  expect(screen.getByText('Milestone: Release')).toBeVisible();
});

test('assignment, reassignment, clearing and task creation update saved progress while retaining all task fields and Today selection', async () => {
  const user = userEvent.setup();
  const second = { ...milestone, id: 4, title: 'Follow-up' };
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      ok({ ...project, tasks: [{ ...task, milestoneId: null }], milestones: [milestone, second] }),
    )
    .mockResolvedValueOnce(ok(task))
    .mockResolvedValueOnce(ok({ ...task, milestoneId: 4 }))
    .mockResolvedValueOnce(ok({ ...task, milestoneId: null }))
    .mockResolvedValueOnce(
      ok({ ...task, id: 5, title: 'New work', notes: '', priority: 'None', dueDate: null }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  await screen.findByRole('heading', { name: 'Work' });
  const form = taskForm();
  for (const [choice, savedId] of [
    ['2', 2],
    ['4', 4],
    ['', null],
  ] as const) {
    await user.selectOptions(form.getByLabelText('Milestone (optional)'), choice);
    await user.click(form.getByRole('button', { name: 'Save task' }));
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/projects/1/tasks/3',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          title: task.title,
          notes: task.notes,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          milestoneId: savedId,
        }),
      }),
    );
    expect(region().getByRole('status')).toHaveTextContent(
      savedId === 2 ? '0 of 1 tasks complete' : 'No tasks assigned',
    );
    expect(region('Follow-up').getByRole('status')).toHaveTextContent(
      savedId === 4 ? '0 of 1 tasks complete' : 'No tasks assigned',
    );
    expect(screen.getByRole('button', { name: 'Remove from today' })).toBeVisible();
    expect(form.getByLabelText('Notes (optional)')).toHaveValue(task.notes);
    expect(form.getByLabelText('Due date (optional)')).toHaveValue(task.dueDate);
  }
  const create = within(screen.getByRole('form', { name: 'New task' }));
  await user.type(create.getByLabelText('Task title'), 'New work');
  await user.selectOptions(create.getByLabelText('Milestone (optional)'), '2');
  await user.click(create.getByRole('button', { name: 'Add task' }));
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/1/tasks',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        title: 'New work',
        notes: '',
        priority: 'None',
        dueDate: null,
        milestoneId: 2,
      }),
    }),
  );
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  expect(create.getByLabelText('Milestone (optional)')).toHaveValue('');
});

test('only saved Done tasks count; list, board, filtering and reopening share progress without resetting hidden drafts', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      ok({ ...project, tasks: [task, { ...task, id: 5, title: 'Backlog', milestoneId: null }] }),
    )
    .mockResolvedValueOnce(ok({ ...task, status: 'Done' }))
    .mockResolvedValueOnce(ok({ ...task, status: 'In progress' }))
    .mockResolvedValueOnce(ok({ ...task, id: 6, title: 'Additional', status: 'To do' }));
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  await screen.findByRole('heading', { name: 'Work' });
  await user.type(
    within(screen.getByRole('form', { name: 'Edit task: Backlog' })).getByLabelText(
      'Notes (optional)',
    ),
    ' draft',
  );
  await user.click(region().getByRole('button', { name: 'View tasks' }));
  expect(screen.getByLabelText('Filter tasks by milestone')).toHaveFocus();
  expect(screen.queryByRole('form', { name: 'Edit task: Backlog' })).not.toBeInTheDocument();
  expect(screen.getByText('0 of 2 tasks complete.')).toBeVisible();
  const form = taskForm();
  await user.selectOptions(form.getByLabelText('Status'), 'Done');
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  await user.click(form.getByRole('button', { name: 'Save task' }));
  expect(region().getByRole('status')).toHaveTextContent('1 of 1 tasks complete · Complete');
  expect(region().getByRole('progressbar')).toHaveAttribute('value', '1');
  await user.type(form.getByLabelText('Notes (optional)'), ' unsaved');
  await user.click(screen.getByRole('button', { name: 'Board' }));
  expect(
    within(screen.getByRole('listitem', { name: task.title })).getByText(
      `Milestone: ${milestone.title}`,
    ),
  ).toBeVisible();
  await user.selectOptions(screen.getByLabelText('Status for Deliver'), 'In progress');
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  expect(region().queryByText(/· Complete/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit task: Deliver' }));
  expect(form.getByLabelText('Notes (optional)')).toHaveValue('Keep notes unsaved');
  expect(form.getByLabelText('Status')).toHaveValue('In progress');
  await user.selectOptions(screen.getByLabelText('Filter tasks by milestone'), 'all');
  expect(
    within(screen.getByRole('form', { name: 'Edit task: Backlog' })).getByLabelText(
      'Notes (optional)',
    ),
  ).toHaveValue('Keep notes draft');
  await user.selectOptions(screen.getByLabelText('Filter tasks by milestone'), 'none');
  expect(screen.queryByRole('form', { name: 'Edit task: Deliver' })).not.toBeInTheDocument();
  expect(screen.getByRole('form', { name: 'Edit task: Backlog' })).toBeVisible();
});

test('adding incomplete work reopens a complete milestone and empty filters remain usable', async () => {
  const user = userEvent.setup();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(
        ok({
          ...project,
          tasks: [{ ...task, status: 'Done' }],
          milestones: [milestone, { ...milestone, id: 4, title: 'Empty' }],
        }),
      )
      .mockResolvedValueOnce(ok({ ...task, id: 5, title: 'More work' })),
  );
  render(<ProjectPage projectId="1" />);
  await screen.findByRole('heading', { name: 'Work' });
  expect(region().getByRole('status')).toHaveTextContent('1 of 1 tasks complete · Complete');
  await user.click(region('Empty').getByRole('button', { name: 'View tasks' }));
  expect(
    screen.getByText(
      'No tasks match this milestone filter. Assign tasks using their Milestone control.',
    ),
  ).toBeVisible();
  const form = within(screen.getByRole('form', { name: 'New task' }));
  await user.type(form.getByLabelText('Task title'), 'More work');
  await user.selectOptions(form.getByLabelText('Milestone (optional)'), '2');
  await user.click(form.getByRole('button', { name: 'Add task' }));
  expect(region().getByRole('status')).toHaveTextContent('1 of 2 tasks complete');
  expect(region().queryByText(/· Complete/)).not.toBeInTheDocument();
  expect(region().getByRole('progressbar')).toHaveAttribute('max', '2');
  expect(region('Empty').getByRole('status')).toHaveTextContent('No tasks assigned');
});

test('removal confirms task preservation, retries failure, coordinates saves, and clears assignments without losing task drafts or project-details focus', async () => {
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockRejectedValueOnce(new Error('Offline'))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState(null, '', '/#/projects/1');
  render(<App />);
  await screen.findByRole('heading', { name: 'Work' });
  const form = taskForm();
  await user.type(form.getByLabelText('Notes (optional)'), ' draft');
  await user.click(region().getByRole('button', { name: 'Remove milestone' }));
  expect(region().getByText(/Its tasks will be preserved/)).toBeVisible();
  await user.click(region().getByRole('button', { name: 'Keep milestone' }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await user.click(region().getByRole('button', { name: 'View tasks' }));
  await user.click(region().getByRole('button', { name: 'Remove milestone' }));
  await user.click(region().getByRole('button', { name: 'Confirm removal' }));
  expect(await region().findByRole('alert')).toHaveTextContent('Offline');
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  await user.click(region().getByRole('button', { name: 'Confirm removal' }));
  expect(region().getByRole('button', { name: 'Removing milestone…' })).toBeDisabled();
  expect(form.getByRole('button', { name: 'Save task' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled();
  await user.type(screen.getByLabelText('Project name'), 'A thought');
  expect(screen.getByLabelText('Project name')).toHaveFocus();
  expect(screen.getByLabelText('Project name')).toBeEnabled();
  // Finishing a background removal must not pull focus away from project details.
  await act(async () => {
    finish(ok({ id: 2 }));
    await Promise.resolve();
  });
  expect(
    screen.queryByRole('region', { name: `Milestone: ${milestone.title}` }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Filter tasks by milestone')).toHaveValue('all');
  expect(form.getByLabelText('Milestone (optional)')).toHaveValue('');
  expect(form.getByLabelText('Notes (optional)')).toHaveValue('Keep notes draft');
  expect(form.getByLabelText('Priority')).toHaveValue('High');
  expect(form.getByLabelText('Due date (optional)')).toHaveValue(task.dueDate);
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeVisible();
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();
  expect(screen.getByText(/Removed “First usable version”/)).toBeVisible();
  expect(screen.getByLabelText('Project name')).toHaveFocus();
  expect(screen.getByLabelText('Project name')).toHaveValue('WorkA thought');
});

test('removing the saved milestone preserves a draft reassignment and submits it before changing progress', async () => {
  const user = userEvent.setup();
  const nextMilestone = { ...milestone, id: 4, title: 'Next outcome' };
  const draft = {
    title: 'Deliver revised',
    notes: 'Keep notes and this draft',
    status: 'Done' as const,
    priority: 'Medium' as const,
    dueDate: '2026-11-04',
    milestoneId: nextMilestone.id,
  };
  let finishSave!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok({ ...project, milestones: [milestone, nextMilestone] }))
    .mockResolvedValueOnce(ok({ id: milestone.id }))
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishSave = resolve;
        }),
    );
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  await screen.findByRole('heading', { name: 'Work' });
  const form = taskForm();
  await user.selectOptions(form.getByLabelText('Milestone (optional)'), String(nextMilestone.id));
  await user.clear(form.getByLabelText('Task title'));
  await user.type(form.getByLabelText('Task title'), draft.title);
  await user.type(form.getByLabelText('Notes (optional)'), ' and this draft');
  await user.selectOptions(form.getByLabelText('Status'), draft.status);
  await user.selectOptions(form.getByLabelText('Priority'), draft.priority);
  fireEvent.change(form.getByLabelText('Due date (optional)'), {
    target: { value: draft.dueDate },
  });
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  expect(region(nextMilestone.title).getByRole('status')).toHaveTextContent('No tasks assigned');

  await user.click(region().getByRole('button', { name: 'Remove milestone' }));
  await user.click(region().getByRole('button', { name: 'Confirm removal' }));
  expect(
    screen.queryByRole('region', { name: `Milestone: ${milestone.title}` }),
  ).not.toBeInTheDocument();
  expect(form.getByLabelText('Milestone (optional)')).toHaveValue(String(nextMilestone.id));
  expect(form.getByLabelText('Task title')).toHaveValue(draft.title);
  expect(form.getByLabelText('Notes (optional)')).toHaveValue(draft.notes);
  expect(form.getByLabelText('Status')).toHaveValue(draft.status);
  expect(form.getByLabelText('Priority')).toHaveValue(draft.priority);
  expect(form.getByLabelText('Due date (optional)')).toHaveValue(draft.dueDate);
  expect(screen.getByRole('button', { name: 'Remove from today' })).toBeVisible();
  expect(region(nextMilestone.title).getByRole('status')).toHaveTextContent('No tasks assigned');
  expect(screen.getByText('0 of 1 tasks complete.')).toBeVisible();

  await user.click(form.getByRole('button', { name: 'Save task' }));
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/projects/1/tasks/3',
    expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify(draft),
    }),
  );
  expect(region(nextMilestone.title).getByRole('status')).toHaveTextContent('No tasks assigned');
  await act(async () => {
    finishSave(ok({ ...task, ...draft }));
    await Promise.resolve();
  });
  expect(region(nextMilestone.title).getByRole('status')).toHaveTextContent(
    '1 of 1 tasks complete · Complete',
  );
  expect(screen.getByText('1 of 1 tasks complete.')).toBeVisible();
});

test('failed membership saves retain task drafts and progress; pending task writes prevent milestone removal', async () => {
  const user = userEvent.setup();
  let finish!: (value: unknown) => void;
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(
      ok({ ...project, milestones: [milestone, { ...milestone, id: 4, title: 'Other outcome' }] }),
    )
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce(ok({ ...task, milestoneId: null }));
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  await screen.findByRole('heading', { name: 'Work' });
  const form = taskForm();
  await user.selectOptions(form.getByLabelText('Milestone (optional)'), '4');
  await user.click(form.getByRole('button', { name: 'Save task' }));
  expect(region().getByRole('button', { name: 'Remove milestone' })).toBeDisabled();
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  await act(async () => {
    finish({
      ok: false,
      status: 400,
      json: () => ({
        errors: { milestoneId: ['Choose an existing milestone in this project, or no milestone.'] },
      }),
    });
    await Promise.resolve();
  });
  expect(form.getByRole('alert')).toHaveTextContent(
    'Choose an existing milestone in this project, or no milestone.',
  );
  expect(form.getByLabelText('Milestone (optional)')).toHaveValue('4');
  expect(form.getByLabelText('Notes (optional)')).toHaveValue('Keep notes');
  expect(region().getByRole('status')).toHaveTextContent('0 of 1 tasks complete');
  expect(region('Other outcome').getByRole('status')).toHaveTextContent('No tasks assigned');
  await user.selectOptions(form.getByLabelText('Milestone (optional)'), '');
  await user.click(form.getByRole('button', { name: 'Save task' }));
  expect(form.queryByRole('alert')).not.toBeInTheDocument();
  expect(region().getByRole('status')).toHaveTextContent('No tasks assigned');
  expect(region().getByRole('button', { name: 'Remove milestone' })).toBeEnabled();
});

test('network and missing-removal failures keep milestones usable for retry', async () => {
  const user = userEvent.setup();
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(ok(project))
    .mockRejectedValueOnce(null)
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockRejectedValueOnce(null)
    .mockResolvedValueOnce(ok({ id: 2 }));
  vi.stubGlobal('fetch', fetchMock);
  render(<ProjectPage projectId="1" />);
  await screen.findByRole('heading', { name: 'Work' });
  await user.click(screen.getByText('Create milestone'));
  const form = within(screen.getByRole('form', { name: 'New milestone' }));
  await user.type(form.getByLabelText('Milestone title'), 'Keep draft');
  await user.click(form.getByRole('button', { name: 'Add milestone' }));
  expect(await form.findByRole('alert')).toHaveTextContent(
    'Could not save milestone. Please try again.',
  );
  expect(form.getByLabelText('Milestone title')).toHaveValue('Keep draft');
  await user.click(region().getByRole('button', { name: 'Remove milestone' }));
  await user.click(region().getByRole('button', { name: 'Confirm removal' }));
  expect(await region().findByRole('alert')).toHaveTextContent(
    'This milestone no longer exists. Reload the project to refresh milestones.',
  );
  await user.click(region().getByRole('button', { name: 'Confirm removal' }));
  expect(await region().findByRole('alert')).toHaveTextContent(
    'Could not remove milestone. Please try again.',
  );
  await user.click(region().getByRole('button', { name: 'Confirm removal' }));
  expect(
    screen.queryByRole('region', { name: `Milestone: ${milestone.title}` }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Milestones' })).toHaveFocus();
  expect(form.getByLabelText('Milestone title')).toHaveValue('Keep draft');
});
