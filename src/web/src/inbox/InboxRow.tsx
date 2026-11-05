import { useId, useRef, useState } from 'react';
import { errorMessage, jsonRequest, type ProjectTask } from '../projects/api';
import { inboxRequest, type Destination, type InboxItem } from './api';

export default function InboxRow({
  item,
  projects,
  onSaved,
  onRemoved,
}: {
  item: InboxItem;
  projects: Destination[] | null;
  onSaved: (item: InboxItem) => void;
  onRemoved: (item: InboxItem, task?: ProjectTask) => void;
}) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [projectId, setProjectId] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const busy = useRef(false);
  async function mutate(action: 'save' | 'move' | 'discard') {
    if (busy.current) return;
    busy.current = true;
    setSaving(action);
    setError('');
    setSaved(false);
    const fallback = `Could not ${action} item. Please try again.`;
    const url = `/api/inbox/${item.id}`;
    try {
      if (action === 'save') {
        const result = await inboxRequest<InboxItem>(
          url,
          fallback,
          jsonRequest('PUT', { title, notes }),
        );
        onSaved(result);
        setEditing(false);
        setSaved(true);
      } else if (action === 'move') {
        const task = await inboxRequest<ProjectTask>(
          `${url}/move`,
          fallback,
          jsonRequest('POST', { projectId: projectId ? Number(projectId) : null }),
        );
        onRemoved(item, task);
      } else {
        await inboxRequest<{ id: number }>(url, fallback, { method: 'DELETE' });
        onRemoved(item);
      }
    } catch (reason) {
      setError(errorMessage(reason, fallback));
    } finally {
      busy.current = false;
      setSaving('');
    }
  }
  return (
    <li className="inbox-item" aria-label={item.title}>
      <h2>{item.title}</h2>
      <p>
        Captured{' '}
        <time dateTime={item.capturedAt}>{new Date(item.capturedAt).toLocaleString()}</time>
      </p>
      {editing ? (
        <form
          aria-label={`Edit inbox item: ${item.title}`}
          onSubmit={(event) => {
            event.preventDefault();
            void mutate('save');
          }}
        >
          <fieldset disabled={!!saving}>
            <legend>Edit item</legend>
            <label htmlFor={`${id}-title`}>Item title</label>
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
            <button>{saving ? 'Saving item…' : 'Save item'}</button>{' '}
            <button
              data-variant="secondary"
              type="button"
              onClick={() => {
                setEditing(false);
                setError('');
              }}
            >
              Cancel edit
            </button>
          </fieldset>
        </form>
      ) : (
        <>
          {item.notes && <p className="item-notes">{item.notes}</p>}
          <button
            data-variant="secondary"
            disabled={!!saving}
            onClick={() => {
              setTitle(item.title);
              setNotes(item.notes ?? '');
              setEditing(true);
              setConfirmDiscard(false);
              setError('');
              setSaved(false);
            }}
          >
            Edit item
          </button>
          {projects && projects.length > 0 && (
            <form
              aria-label={`Move item: ${item.title}`}
              onSubmit={(event) => {
                event.preventDefault();
                void mutate('move');
              }}
            >
              <fieldset disabled={!!saving}>
                <legend>Move into a project</legend>
                <label htmlFor={`${id}-project`}>Destination project</label>
                <select
                  id={`${id}-project`}
                  required
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  <option value="">Choose a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <button>{saving === 'move' ? 'Moving item…' : 'Move to project'}</button>
              </fieldset>
            </form>
          )}
          {confirmDiscard ? (
            <div role="group" aria-label={`Discard ${item.title}?`}>
              <p>Discard this item? This cannot be undone.</p>
              <button
                data-variant="danger"
                disabled={!!saving}
                onClick={() => void mutate('discard')}
              >
                {saving === 'discard' ? 'Discarding…' : 'Confirm discard'}
              </button>{' '}
              <button
                data-variant="secondary"
                disabled={!!saving}
                onClick={() => {
                  setConfirmDiscard(false);
                  setError('');
                }}
              >
                Keep item
              </button>
            </div>
          ) : (
            <button
              data-variant="quiet"
              disabled={!!saving}
              onClick={() => setConfirmDiscard(true)}
            >
              Discard item
            </button>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
      {saved && <p role="status">Item saved.</p>}
    </li>
  );
}
