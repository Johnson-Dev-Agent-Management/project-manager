import { type ProjectTask } from '../projects/api';

export default function TaskMeta({ task, day }: { task: ProjectTask; day: string }) {
  const due = task.dueDate;
  return (
    <p>
      Priority: {task.priority} ·{' '}
      {due ? (
        <>
          Due <time dateTime={due}>{due}</time>
          {task.status !== 'Done' && due <= day && (
            <strong> — {due === day ? 'Due today' : 'Overdue'}</strong>
          )}
        </>
      ) : (
        'No due date'
      )}
    </p>
  );
}
