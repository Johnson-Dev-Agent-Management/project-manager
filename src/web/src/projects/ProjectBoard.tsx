import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { errorMessage, jsonRequest, request, type ProjectTask } from './api';
import TaskMeta from '../today/TaskMeta';

const statuses: ProjectTask['status'][] = ['To do', 'In progress', 'Done'];
type MoveFocus = { id: number; origin: Element | null };

export default function ProjectBoard({
  tasks,
  day,
  busyIds,
  onSavingChange,
  onSaved,
  onEdit,
  selection,
}: {
  tasks: ProjectTask[];
  day: string;
  busyIds: number[];
  onSavingChange: (taskId: number, saving: boolean) => void;
  onSaved: (task: ProjectTask) => void;
  onEdit: (taskId: number) => void;
  selection: (task: ProjectTask) => ReactNode;
}) {
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [target, setTarget] = useState<ProjectTask['status'] | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const pending = useRef(new Set<number>());
  const focusOwner = useRef<MoveFocus | null>(null);
  const focusAfterMove = useRef<MoveFocus | null>(null);
  const board = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const relinquishFocus = (event: FocusEvent) => {
      // Disabling a selector can blur it to body. A later real focus destination
      // revokes this request's claim permanently, even if that control also blurs.
      if (event.target !== document.body) focusOwner.current = null;
    };
    document.addEventListener('focusin', relinquishFocus);
    return () => document.removeEventListener('focusin', relinquishFocus);
  }, []);
  useLayoutEffect(() => {
    const focus = focusAfterMove.current;
    if (!focus) return;
    focusAfterMove.current = null;
    if (focusOwner.current !== focus) return;
    focusOwner.current = null;
    // Body is a valid fallback only for the request that still owns focus.
    if (document.activeElement === focus.origin || document.activeElement === document.body)
      board.current?.querySelector<HTMLSelectElement>(`#board-status-${focus.id}`)?.focus();
  }, [feedback, error]);

  async function move(task: ProjectTask, status: ProjectTask['status']) {
    if (task.status === status || busyIds.includes(task.id) || pending.current.has(task.id)) return;
    pending.current.add(task.id);
    const focus = { id: task.id, origin: document.activeElement };
    focusOwner.current = focus;
    onSavingChange(task.id, true);
    setError('');
    setFeedback(`Moving “${task.title}” to ${status}…`);
    try {
      const saved = await request<ProjectTask>(
        `/api/tasks/${task.id}/status`,
        'Could not move task. Try again.',
        jsonRequest('PUT', { status }),
      );
      onSaved(saved);
      setFeedback(`Moved “${saved.title}” to ${saved.status}.`);
    } catch (reason) {
      setFeedback('');
      setError(
        `“${task.title}” remains in ${task.status}. ${errorMessage(reason, 'Could not move task. Try again.')}`,
      );
    } finally {
      pending.current.delete(task.id);
      onSavingChange(task.id, false);
      // An older completion must not replace the current owner's queued restore.
      if (focusOwner.current === focus) focusAfterMove.current = focus;
    }
  }

  return (
    <div ref={board}>
      <p id="board-help">
        Drag a task to another column, or use its Status control. Edits open in List view.
      </p>
      <p role="status" aria-atomic="true">
        {feedback}
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="project-board" aria-label="Project board">
        {statuses.map((status) => {
          const column = tasks.filter((task) => task.status === status).sort((a, b) => a.id - b.id);
          return (
            <section
              key={status}
              aria-label={status}
              className={`board-column${target === status ? ' drop-target' : ''}`}
              onDragOver={(event) => {
                if (draggedId === null || busyIds.includes(draggedId)) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setTarget(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                  setTarget(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const task = tasks.find((item) => item.id === draggedId);
                setDraggedId(null);
                setTarget(null);
                if (task) void move(task, status);
              }}
            >
              <h3>
                {status} <span className="column-count">({column.length})</span>
              </h3>
              {column.length === 0 && <p className="empty-column">No tasks</p>}
              <ul className="task-list">
                {column.map((task) => (
                  <li
                    key={task.id}
                    aria-label={task.title}
                    className="board-card"
                    draggable={!busyIds.includes(task.id)}
                    onDragStart={(event) => {
                      // Text fields/buttons keep their normal pointer interactions.
                      if (
                        busyIds.includes(task.id) ||
                        (event.target as HTMLElement).closest('button, select')
                      ) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.setData('text/plain', String(task.id));
                      event.dataTransfer.effectAllowed = 'move';
                      setDraggedId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggedId(null);
                      setTarget(null);
                    }}
                  >
                    <h4>{task.title}</h4>
                    <TaskMeta task={task} day={day} />
                    <label htmlFor={`board-status-${task.id}`}>Status for {task.title}</label>
                    <select
                      id={`board-status-${task.id}`}
                      value={task.status}
                      disabled={busyIds.includes(task.id)}
                      aria-describedby="board-help"
                      onChange={(event) =>
                        void move(task, event.target.value as ProjectTask['status'])
                      }
                    >
                      {statuses.map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                    {selection(task)}
                    <button
                      type="button"
                      disabled={busyIds.length > 0}
                      onClick={() => onEdit(task.id)}
                    >
                      Edit task: {task.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
