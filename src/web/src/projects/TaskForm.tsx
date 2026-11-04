import { useId, useRef, useState } from 'react';
import { errorMessage, jsonRequest, request, type ProjectTask, type ProjectMilestone } from './api';

export default function TaskForm({
  projectId,
  task,
  onSaved,
  disabled = false,
  onSavingChange,
  milestones = [],
}: {
  milestones?: ProjectMilestone[];
  disabled?: boolean;
  onSavingChange?: (saving: boolean) => void;
  projectId: string;
  task?: ProjectTask;
  onSaved: (task: ProjectTask) => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [status, setStatus] = useState(task?.status ?? 'To do');
  const [priority, setPriority] = useState<ProjectTask['priority']>(task?.priority ?? 'None');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [milestoneId, setMilestoneId] = useState(task?.milestoneId ?? null);
  const [savedMilestoneId, setSavedMilestoneId] = useState(task?.milestoneId);
  // Follow saved changes only for an unedited selection; preserve draft reassignments.
  // The option check below still clears a selection whose milestone was removed.
  if (task?.milestoneId !== savedMilestoneId) {
    setSavedMilestoneId(task?.milestoneId);
    if (milestoneId === (savedMilestoneId ?? null)) setMilestoneId(task?.milestoneId ?? null);
  }
  const selectedMilestoneId = milestones.some((item) => item.id === milestoneId)
    ? milestoneId
    : null;
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  const [savedStatus, setSavedStatus] = useState(task?.status);
  // A saved board move updates only the status draft; preserve all other edits.
  if (task?.status !== savedStatus) {
    setSavedStatus(task?.status);
    setStatus(task?.status ?? 'To do');
  }
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function save() {
    if (busy.current || disabled) return;
    busy.current = true;
    onSavingChange?.(true);
    setSaving(true);
    setError('');
    setSaved(false);
    const fallback = task ? 'Could not save task.' : 'Could not create task.';
    try {
      const result = await request<ProjectTask>(
        `/api/projects/${projectId}/tasks${task ? `/${task.id}` : ''}`,
        fallback,
        jsonRequest(task ? 'PUT' : 'POST', {
          title,
          notes,
          ...(task ? { status } : {}),
          priority,
          dueDate: dueDate || null,
          milestoneId: selectedMilestoneId,
        }),
      );
      onSaved(result);
      setTitle(task ? result.title : '');
      setNotes(task ? (result.notes ?? '') : '');
      setStatus(result.status);
      setPriority(task ? result.priority : 'None');
      setDueDate(task ? (result.dueDate ?? '') : '');
      setMilestoneId(task ? result.milestoneId : null);
      setSaved(true);
    } catch (reason) {
      setError(errorMessage(reason, fallback));
    } finally {
      busy.current = false;
      onSavingChange?.(false);
      setSaving(false);
    }
  }
  return (
    <form
      aria-label={task ? `Edit task: ${task.title}` : 'New task'}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onChange={() => setSaved(false)}
    >
      <fieldset disabled={saving || disabled}>
        <legend>{task ? task.title : 'New task'}</legend>
        <label htmlFor={`${id}-title`}>Task title</label>
        <input
          id={`${id}-title`}
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label htmlFor={`${id}-notes`}>Notes (optional)</label>
        <textarea
          id={`${id}-notes`}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {task && (
          <>
            <label htmlFor={`${id}-status`}>Status</label>
            <select
              id={`${id}-status`}
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectTask['status'])}
            >
              <option>To do</option>
              <option>In progress</option>
              <option>Done</option>
            </select>
          </>
        )}
        <label htmlFor={`${id}-priority`}>Priority</label>
        <select
          id={`${id}-priority`}
          value={priority}
          onChange={(event) => setPriority(event.target.value as ProjectTask['priority'])}
        >
          <option>None</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <label htmlFor={`${id}-due`}>Due date (optional)</label>
        <input
          id={`${id}-due`}
          type="date"
          min="0001-01-01"
          max="9999-12-31"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
        <button
          data-variant="quiet"
          type="button"
          disabled={!dueDate}
          onClick={() => {
            setDueDate('');
            setSaved(false);
          }}
        >
          Clear due date
        </button>
        <label htmlFor={`${id}-milestone`}>Milestone (optional)</label>
        <select
          id={`${id}-milestone`}
          value={selectedMilestoneId ?? ''}
          onChange={(event) =>
            setMilestoneId(event.target.value ? Number(event.target.value) : null)
          }
        >
          <option value="">No milestone</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </select>
        <button>{saving ? 'Saving task…' : task ? 'Save task' : 'Add task'}</button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">{task ? 'Task saved.' : 'Task added.'}</p>}
    </form>
  );
}
