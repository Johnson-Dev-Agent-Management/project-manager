import { useEffect, useState, type FormEvent } from 'react';
type Project = { id: number; name: string };
export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    void fetch('/api/projects', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load projects.');
        setProjects((await response.json()) as Project[]);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(reason instanceof Error ? reason.message : 'Could not load projects.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
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
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not create project.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <main>
      <h1>Projects</h1>
      <form
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <label htmlFor="project-name">Project name</label>
        <input id="project-name" value={name} onChange={(event) => setName(event.target.value)} />
        <button disabled={loading || saving}>{saving ? 'Creating…' : 'Create project'}</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <p role="status">Loading projects…</p>
      ) : projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <ul>
          {projects.map((project) => (
            <li key={project.id}>{project.name}</li>
          ))}
        </ul>
      )}
    </main>
  );
}
