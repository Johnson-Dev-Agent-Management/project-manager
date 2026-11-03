import { useEffect, useId, useRef, useState } from 'react';
import { errorMessage, jsonRequest, request, type ProjectTask } from '../projects/api';
import { useLocalDay } from './dates';
import SelectionButton from './SelectionButton';
import TaskMeta from './TaskMeta';

import { updatePlan, type TodayTask, type TodayPlan } from './plan';
export type { TodayPlan } from './plan';

type StatusEdit = { status: ProjectTask['status'] | null; saving: boolean; error: string };
const untouched: StatusEdit = { status: null, saving: false, error: '' };

function TodayRow({
  item,
  day,
  selected,
  onSelectionSaved,
  edit,
  onStatusChange,
  onSaveStatus,
}: {
  item: TodayTask;
  day: string;
  selected: boolean;
  onSelectionSaved: (selected: boolean) => void;
  edit: StatusEdit;
  onStatusChange: (status: ProjectTask['status']) => void;
  onSaveStatus: () => void;
}) {
  const id = useId();
  const { task, projectName } = item;
  return (
    <li className="today-task" aria-label={task.title}>
      <h3>{task.title}</h3>
      <a href={`#/projects/${task.projectId}`}>{projectName}</a>
      <TaskMeta task={task} day={day} />
      <p>Status: {task.status}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSaveStatus();
        }}
      >
        <fieldset disabled={edit.saving}>
          <legend>Change status</legend>
          <label htmlFor={id}>Status for {task.title}</label>
          <select
            id={id}
            value={edit.status ?? task.status}
            onChange={(event) => onStatusChange(event.target.value as ProjectTask['status'])}
          >
            <option>To do</option>
            <option>In progress</option>
            <option>Done</option>
          </select>
          <button>{edit.saving ? 'Saving status…' : 'Save status'}</button>
        </fieldset>
        {edit.error && <p role="alert">{edit.error}</p>}
      </form>
      <SelectionButton
        taskId={task.id}
        day={day}
        selected={selected}
        onSaved={onSelectionSaved}
        disabled={edit.saving}
      />
    </li>
  );
}

function DailyPlan({ day }: { day: string }) {
  // A task's editor belongs to the day, not a section or a particular server snapshot.
  // Rows may move between sections while their drafts or requests are still active.
  const [edits, setEdits] = useState<Record<number, StatusEdit>>({});
  const requestVersion = useRef(0);
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    requestVersion.current += 1;
    setLoading(true);
    setError('');
    setAttempt((value) => value + 1);
  };
  function updateEdit(taskId: number, change: Partial<StatusEdit>) {
    setEdits((current) => ({
      ...current,
      [taskId]: { ...untouched, ...current[taskId], ...change },
    }));
  }
  function selectionSaved(taskId: number, selected: boolean) {
    setPlan((current) => current && updatePlan(current, day, taskId, { selected }));
    reload();
  }
  async function saveStatus(task: ProjectTask) {
    const status = edits[task.id]?.status ?? task.status;
    updateEdit(task.id, { status, saving: true, error: '' });
    try {
      const result = await request<ProjectTask>(
        `/api/tasks/${task.id}/status`,
        'Could not save status.',
        jsonRequest('PUT', { status }),
      );
      setPlan((current) => current && updatePlan(current, day, task.id, { task: result }));
      updateEdit(task.id, { status: null, saving: false });
      reload();
    } catch (reason) {
      updateEdit(task.id, { saving: false, error: errorMessage(reason, 'Could not save status.') });
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    const version = requestVersion.current;
    const isCurrent = () => !controller.signal.aborted && version === requestVersion.current;
    void request<TodayPlan>(`/api/today/${day}`, 'Could not load today.', {
      signal: controller.signal,
    })
      .then((value) => {
        if (isCurrent()) {
          setPlan(value);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (isCurrent()) setError(errorMessage(reason, 'Could not load today.'));
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
    return () => controller.abort();
  }, [day, attempt]);
  const sections = [
    {
      key: 'selected',
      title: 'Selected for today',
      empty: 'Nothing selected yet. Add tasks from a project or from Due now below.',
    },
    { key: 'due', title: 'Due now', empty: 'No other incomplete tasks are overdue or due today.' },
    {
      key: 'completed',
      title: 'Completed today',
      empty: 'Selected tasks you complete today will stay here. You can reopen them.',
    },
  ] as const;
  return (
    <>
      {loading && <p role="status">{plan ? 'Refreshing today…' : 'Loading today…'}</p>}
      {error && (
        <div>
          <p role="alert">{error}</p>
          <button onClick={reload}>Try again</button>
        </div>
      )}
      {plan &&
        sections.map(({ key, title, empty }) => (
          <section key={key} aria-labelledby={`${key}-heading`}>
            <h2 id={`${key}-heading`}>{title}</h2>
            {plan[key].length === 0 ? (
              <p>{empty}</p>
            ) : (
              <ul className="task-list">
                {plan[key].map((item) => (
                  <TodayRow
                    key={item.task.id}
                    item={item}
                    day={day}
                    selected={key !== 'due'}
                    onSelectionSaved={(selected) => selectionSaved(item.task.id, selected)}
                    edit={edits[item.task.id] ?? untouched}
                    onStatusChange={(status) => updateEdit(item.task.id, { status })}
                    onSaveStatus={() => void saveStatus(item.task)}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
    </>
  );
}

export default function TodayPage() {
  const day = useLocalDay();
  return (
    <main>
      <h1>Today</h1>
      <p>
        <time dateTime={day}>{day}</time> · Your local calendar day
      </p>
      <p>
        Choose your focus across projects. Selections reset at local midnight; tasks keep their
        status, priority and due date.
      </p>
      <p>
        Selected tasks: highest priority first, then due date. Due now: earliest due date first.
        Ties use task creation order.
      </p>
      <DailyPlan key={day} day={day} />
    </main>
  );
}
