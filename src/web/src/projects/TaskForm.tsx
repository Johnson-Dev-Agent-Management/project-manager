import { useId, useState } from 'react';
import { errorMessage, jsonRequest, request, type ProjectTask } from './api';

export default function TaskForm({
  projectId,
  task,
  onSaved,
}: {
  projectId: string;
  task?: ProjectTask;
  onSaved: (task: ProjectTask) => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [status, setStatus] = useState(task?.status ?? 'To do');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    const fallback = task ? 'Could not save task.' : 'Could not create task.';
    try {
      const result = await request<ProjectTask>(
        `/api/projects/${projectId}/tasks${task ? `/${task.id}` : ''}`,
        fallback,
        jsonRequest(task ? 'PUT' : 'POST', task ? { title, notes, status } : { title, notes }),
      );
      onSaved(result);
      setTitle(task ? result.title : '');
      setNotes(task ? (result.notes ?? '') : '');
      setStatus(result.status);
      setSaved(true);
    } catch (reason) {
      setError(errorMessage(reason, fallback));
    } finally {
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
      <fieldset disabled={saving}>
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
        <button>{saving ? 'Saving task…' : task ? 'Save task' : 'Add task'}</button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">{task ? 'Task saved.' : 'Task added.'}</p>}
    </form>
  );
}
