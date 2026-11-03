export type ProjectTask = {
  id: number;
  projectId: number;
  title: string;
  notes: string | null;
  status: 'To do' | 'In progress' | 'Done';
};
export type Project = { id: number; name: string; description: string | null };
export type ProjectDetail = Project & { tasks: ProjectTask[] };

export async function request<T>(url: string, fallback: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    if (response.status === 404)
      throw new Error('This project or task could not be found. Return to projects to continue.');
    let message = fallback;
    try {
      const problem = (await response.json()) as { errors?: Record<string, string[]> } | null;
      message =
        Object.values(problem?.errors ?? {})
          .flat()
          .join(' ') || fallback;
    } catch {
      // A proxy or server failure may return no JSON body.
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export function jsonRequest(method: 'POST' | 'PUT', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}
