import { useEffect, useId, useState } from 'react';
import { errorMessage, jsonRequest, request, type ProjectTask } from '../projects/api';
import { useLocalDay } from './dates';
import SelectionButton from './SelectionButton';
import TaskMeta from './TaskMeta';

type TodayTask = { task: ProjectTask; projectName: string };
export type TodayPlan = { selected: TodayTask[]; due: TodayTask[]; completed: TodayTask[] };

function TodayRow({
  item,
  day,
  selected,
  reload,
}: {
  item: TodayTask;
  day: string;
  selected: boolean;
  reload: () => void;
}) {
  const id = useId();
  const { task, projectName } = item;
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function saveStatus() {
    setSaving(true);
    setError('');
    try {
      await request<ProjectTask>(
        `/api/tasks/${task.id}/status`,
        'Could not save status.',
        jsonRequest('PUT', { status }),
      );
      reload();
    } catch (reason) {
      setError(errorMessage(reason, 'Could not save status.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <li className="today-task" aria-label={task.title}>
      <h3>{task.title}</h3>
      <a href={`#/projects/${task.projectId}`}>{projectName}</a>
      <TaskMeta task={task} day={day} />
      <p>Status: {task.status}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveStatus();
        }}
      >
        <fieldset disabled={saving}>
          <legend>Change status</legend>
          <label htmlFor={id}>Status for {task.title}</label>
          <select
            id={id}
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectTask['status'])}
          >
            <option>To do</option>
            <option>In progress</option>
            <option>Done</option>
          </select>
          <button>{saving ? 'Saving status…' : 'Save status'}</button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </form>
      <SelectionButton
        taskId={task.id}
        day={day}
        selected={selected}
        onSaved={reload}
        disabled={saving}
      />
    </li>
  );
}

function DailyPlan({ day }: { day: string }) {
  const [plan, setPlan] = useState<TodayPlan | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const reload = () => {
    setLoading(true);
    setAttempt((value) => value + 1);
  };
  useEffect(() => {
    const controller = new AbortController();
    void request<TodayPlan>(`/api/today/${day}`, 'Could not load today.', {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          setPlan(value);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason, 'Could not load today.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [day, attempt]);
  if (loading) return <p role="status">Loading today…</p>;
  if (error)
    return (
      <>
        <p role="alert">{error}</p>
        <button onClick={reload}>Try again</button>
      </>
    );
  if (!plan) return null;
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
  return sections.map(({ key, title, empty }) => (
    <section key={key} aria-labelledby={`${key}-heading`}>
      <h2 id={`${key}-heading`}>{title}</h2>
      {plan[key].length === 0 ? (
        <p>{empty}</p>
      ) : (
        <ul className="task-list">
          {plan[key].map((item) => (
            <TodayRow
              key={`${item.task.id}-${item.task.status}`}
              item={item}
              day={day}
              selected={key !== 'due'}
              reload={reload}
            />
          ))}
        </ul>
      )}
    </section>
  ));
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
