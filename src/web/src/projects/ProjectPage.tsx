import { useEffect, useState } from 'react';
import {
  errorMessage,
  jsonRequest,
  request,
  type Project,
  type ProjectDetail,
  type ProjectTask,
} from './api';
import TaskForm from './TaskForm';

export default function ProjectPage({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const url = `/api/projects/${projectId}`;
  useEffect(() => {
    const controller = new AbortController();
    void request<ProjectDetail>(url, 'Could not load project.', { signal: controller.signal })
      .then((value) => {
        if (controller.signal.aborted) return;
        setProject(value);
        setName(value.name);
        setDescription(value.description ?? '');
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(errorMessage(reason, 'Could not load project.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [url, attempt]);

  async function saveProject() {
    setSaving(true);
    setSaveError('');
    setSaved(false);
    try {
      const value = await request<Project>(
        url,
        'Could not save project.',
        jsonRequest('PUT', { name, description }),
      );
      setProject((current) => current && { ...current, ...value });
      setName(value.name);
      setDescription(value.description ?? '');
      setSaved(true);
    } catch (reason) {
      setSaveError(errorMessage(reason, 'Could not save project.'));
    } finally {
      setSaving(false);
    }
  }

  function taskSaved(task: ProjectTask) {
    setProject(
      (current) =>
        current && {
          ...current,
          tasks: current.tasks.some((item) => item.id === task.id)
            ? current.tasks.map((item) => (item.id === task.id ? task : item))
            : [...current.tasks, task],
        },
    );
  }

  return (
    <main>
      <a href="#/">Back to projects</a>
      {loading ? (
        <p role="status">Loading project…</p>
      ) : loadError ? (
        <>
          <h1>Project unavailable</h1>
          <p role="alert">{loadError}</p>
          <button
            onClick={() => {
              setLoadError('');
              setLoading(true);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </button>
        </>
      ) : (
        project && (
          <>
            <h1>{project.name}</h1>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void saveProject();
              }}
            >
              <fieldset disabled={saving}>
                <legend>Project details</legend>
                <label htmlFor="project-name">Project name</label>
                <input
                  id="project-name"
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setSaved(false);
                  }}
                />
                <label htmlFor="project-description">Description (optional)</label>
                <textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setSaved(false);
                  }}
                />
                <button>{saving ? 'Saving project…' : 'Save project'}</button>
              </fieldset>
              {saveError && <p role="alert">{saveError}</p>}
              {saved && <p role="status">Project saved.</p>}
            </form>
            <section aria-labelledby="tasks-heading">
              <h2 id="tasks-heading">Tasks</h2>
              <p role="status">
                {project.tasks.filter((task) => task.status === 'Done').length} of{' '}
                {project.tasks.length} tasks complete.
              </p>
              {project.tasks.length === 0 ? (
                <p>No tasks yet. Add your first task below.</p>
              ) : (
                <ul className="task-list">
                  {project.tasks.map((task) => (
                    <li key={task.id}>
                      <TaskForm projectId={projectId} task={task} onSaved={taskSaved} />
                    </li>
                  ))}
                </ul>
              )}
              <TaskForm projectId={projectId} onSaved={taskSaved} />
            </section>
          </>
        )
      )}
    </main>
  );
}
