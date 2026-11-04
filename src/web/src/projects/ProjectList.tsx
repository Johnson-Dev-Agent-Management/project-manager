import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
type Project = { id: number; name: string };
export default function ProjectList({ capture }: { capture: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [createError, setCreateError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [creating, setCreating] = useState(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const createButton = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  useEffect(() => {
    if (creating) nameInput.current?.focus();
  }, [creating]);
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/projects', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load projects.');
        const value = (await response.json()) as Project[];
        if (!controller.signal.aborted) setProjects(value);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setLoadError(reason instanceof Error ? reason.message : 'Could not load projects.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current || loading || loadError) return;
    busy.current = true;
    setSaving(true);
    setCreateError('');
    setNotice('');
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) {
        const problem = (await response.json()) as { errors?: { name?: string[] } };
        throw new Error(problem.errors?.name?.[0] ?? 'Could not create project.');
      }
      const project = (await response.json()) as Project;
      setProjects((current) => [...current, project]);
      setName('');
      setNotice(`Created “${project.name}”.`);
    } catch (reason) {
      setCreateError(reason instanceof Error ? reason.message : 'Could not create project.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  function hideOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && !saving) {
      setCreating(false);
      createButton.current?.focus();
    }
  }
  return (
    <main className="projects-page">
      <header className="page-heading">
        <h1>Projects</h1>
        <p>A home for your work and ideas.</p>
      </header>
      {capture}
      <section aria-labelledby="projects-heading">
        <div className="collection-heading">
          <h2 id="projects-heading">Your projects</h2>
          <button
            type="button"
            data-variant="secondary"
            ref={createButton}
            onKeyDown={hideOnEscape}
            aria-expanded={creating}
            aria-controls="new-project"
            disabled={saving}
            onClick={() => setCreating((value) => !value)}
          >
            {creating ? 'Hide form' : 'New project'}
          </button>
        </div>
        <form
          id="new-project"
          className="project-create"
          aria-label="New project"
          hidden={!creating}
          onSubmit={(event) => {
            void submit(event);
          }}
        >
          <fieldset disabled={saving}>
            <legend>New project</legend>
            <label htmlFor="project-name">Project name</label>
            <input
              id="project-name"
              ref={nameInput}
              onKeyDown={hideOnEscape}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={createError ? true : undefined}
              aria-describedby={createError ? 'project-create-error' : undefined}
            />
            <button
              type="submit"
              onKeyDown={hideOnEscape}
              disabled={loading || !!loadError || saving}
            >
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </fieldset>
          {createError && (
            <p id="project-create-error" role="alert">
              {createError}
            </p>
          )}
          {notice && <p role="status">{notice}</p>}
        </form>
        {loading ? (
          <p role="status" className="collection-state">
            Loading projects…
          </p>
        ) : loadError ? (
          <div className="collection-state">
            <p role="alert">{loadError}</p>
            <button
              type="button"
              data-variant="secondary"
              onClick={() => {
                setLoading(true);
                setLoadError('');
                setAttempt((value) => value + 1);
              }}
            >
              Retry projects
            </button>
          </div>
        ) : projects.length === 0 ? (
          <div className="collection-state">
            <p>No projects yet.</p>
            <p className="collection-hint">
              Start a project when you’re ready. Loose ideas can stay in Inbox.
            </p>
          </div>
        ) : (
          <ul className="project-collection">
            {projects.map((project) => (
              <li key={project.id}>
                <a className="project-link" href={`#/projects/${project.id}`}>
                  <span>{project.name}</span>
                  <span className="project-arrow" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
