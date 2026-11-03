import { useEffect, useRef, useState } from 'react';
import { errorMessage, request, type ProjectTask } from '../projects/api';
import { inboxRequest, type Destination, type InboxItem } from './api';
import InboxRow from './InboxRow';

export default function InboxPage({ captureVersion }: { captureVersion: number }) {
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [projects, setProjects] = useState<Destination[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const mutationVersion = useRef(0);
  const [notice, setNotice] = useState<{ text: string; projectId?: number } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const version = mutationVersion.current;
    void inboxRequest<InboxItem[]>('/api/inbox', 'Could not load Inbox.', {
      signal: controller.signal,
    })
      .then((value) => {
        if (controller.signal.aborted) return;
        if (version !== mutationVersion.current) {
          setAttempt((current) => current + 1);
          return;
        }
        setItems(value);
        setError('');
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(reason, 'Could not load Inbox.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [captureVersion, attempt]);
  useEffect(() => {
    const controller = new AbortController();
    void request<Destination[]>('/api/projects', 'Could not load destination projects.', {
      signal: controller.signal,
    })
      .then((value) => {
        if (!controller.signal.aborted) {
          setProjects(value);
          setProjectError('');
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setProjectError(errorMessage(reason, 'Could not load destination projects.'));
      });
    return () => controller.abort();
  }, [attempt]);
  function removed(item: InboxItem, task?: ProjectTask) {
    mutationVersion.current += 1;
    setItems((current) => current && current.filter((value) => value.id !== item.id));
    setNotice(
      task
        ? { text: `Moved “${item.title}” to its project.`, projectId: task.projectId }
        : { text: `Discarded “${item.title}”.` },
    );
  }
  return (
    <main>
      <h1>Inbox</h1>
      <p>
        Capture now, organize later. Newest captures appear first. Move an item into a project to
        use it in Today.
      </p>
      {notice && (
        <p role="status">
          {notice.text}{' '}
          {notice.projectId && (
            <a href={`#/projects/${notice.projectId}`}>Open destination project</a>
          )}
        </p>
      )}
      {loading && <p role="status">Loading Inbox…</p>}
      {error && <p role="alert">{error}</p>}
      {projectError && <p role="alert">{projectError} Your captured items are still here.</p>}
      {(error || projectError) && (
        <button
          onClick={() => {
            setLoading(true);
            setAttempt((value) => value + 1);
          }}
        >
          Try again
        </button>
      )}
      {!projects && !projectError && <p role="status">Loading destination projects…</p>}
      {projects?.length === 0 && (
        <p>
          No projects yet. <a href="#/">Create a project</a>, then return to Inbox. Your captured
          items will stay here.
        </p>
      )}
      {items?.length === 0 && <p>Your inbox is clear. Use Quick capture to save a task or idea.</p>}
      {items && (
        <ul className="task-list">
          {items.map((item) => (
            <InboxRow
              key={item.id}
              item={item}
              projects={projects}
              onRemoved={removed}
              onSaved={(value) => {
                mutationVersion.current += 1;
                setItems(
                  (current) =>
                    current &&
                    current.map((existing) => (existing.id === value.id ? value : existing)),
                );
              }}
            />
          ))}
        </ul>
      )}
    </main>
  );
}
