import { useEffect, useRef, useState } from 'react';
import {
  errorMessage,
  jsonRequest,
  request,
  type Project,
  type ProjectDetail,
  type ProjectTask,
} from './api';
import ProjectTasks from './ProjectTasks';
import { localDay, useLocalDay } from '../today/dates';

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
  const initialized = useRef(false);
  // A read started before any successful mutation is no longer authoritative.
  const mutationVersion = useRef(0);
  const day = useLocalDay();
  const [loadedDay, setLoadedDay] = useState('');
  const url = `/api/projects/${projectId}`;
  useEffect(() => {
    const controller = new AbortController();
    const version = mutationVersion.current;
    void request<ProjectDetail>(`${url}?day=${day}`, 'Could not load project.', {
      signal: controller.signal,
    })
      .then((value) => {
        if (controller.signal.aborted) return;
        if (version !== mutationVersion.current) {
          // Keep saved data and drafts visible; fetch a snapshot taken after the save.
          setLoading(true);
          setAttempt((value) => value + 1);
          return;
        }
        setProject(value);
        setLoadError('');
        setLoading(false);
        setLoadedDay(day);
        if (!initialized.current) {
          setName(value.name);
          setDescription(value.description ?? '');
          initialized.current = true;
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setLoadError(errorMessage(reason, 'Could not load project.'));
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [url, day, attempt]);

  function retryLoad() {
    setLoadError('');
    setLoading(true);
    setAttempt((value) => value + 1);
  }

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
      mutationVersion.current += 1;
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
    mutationVersion.current += 1;
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
      {project && loadError && (
        <div>
          <p role="alert">Could not refresh this project. Your edits are still here. {loadError}</p>
          <button data-variant="secondary" onClick={retryLoad}>
            Try again
          </button>
        </div>
      )}
      {project && !loadError && (loading || loadedDay !== day) && (
        <p role="status">Refreshing today's selections…</p>
      )}
      {!project && loading ? (
        <p role="status">Loading project…</p>
      ) : !project && loadError ? (
        <>
          <h1>Project unavailable</h1>
          <p role="alert">{loadError}</p>
          <button data-variant="secondary" onClick={retryLoad}>
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
            <ProjectTasks
              projectId={projectId}
              tasks={project.tasks}
              milestones={project.milestones}
              onMilestoneSaved={(milestone) => {
                mutationVersion.current += 1;
                setProject(
                  (current) =>
                    current && {
                      ...current,
                      milestones: current.milestones.some((item) => item.id === milestone.id)
                        ? current.milestones.map((item) =>
                            item.id === milestone.id ? milestone : item,
                          )
                        : [...current.milestones, milestone],
                    },
                );
              }}
              onMilestoneRemoved={(id) => {
                mutationVersion.current += 1;
                setProject(
                  (current) =>
                    current && {
                      ...current,
                      milestones: current.milestones.filter((item) => item.id !== id),
                      tasks: current.tasks.map((task) =>
                        task.milestoneId === id ? { ...task, milestoneId: null } : task,
                      ),
                    },
                );
              }}
              selectedTaskIds={project.selectedTaskIds}
              day={day}
              selectionsReady={loadedDay === day}
              onTaskSaved={taskSaved}
              onSelectionSaved={(taskId, selected) => {
                if (day !== localDay()) return;
                mutationVersion.current += 1;
                setProject(
                  (current) =>
                    current && {
                      ...current,
                      selectedTaskIds: selected
                        ? [...current.selectedTaskIds.filter((id) => id !== taskId), taskId]
                        : current.selectedTaskIds.filter((id) => id !== taskId),
                    },
                );
              }}
            />
          </>
        )
      )}
    </main>
  );
}
