import { useEffect, useRef, useState } from 'react';
import { type ProjectTask } from './api';
import TaskForm from './TaskForm';
import ProjectBoard from './ProjectBoard';
import TaskMeta from '../today/TaskMeta';
import SelectionButton from '../today/SelectionButton';

export default function ProjectTasks({
  projectId,
  tasks,
  selectedTaskIds,
  day,
  selectionsReady,
  onTaskSaved,
  onSelectionSaved,
}: {
  projectId: string;
  tasks: ProjectTask[];
  selectedTaskIds: number[];
  day: string;
  selectionsReady: boolean;
  onTaskSaved: (task: ProjectTask) => void;
  onSelectionSaved: (taskId: number, selected: boolean) => void;
}) {
  const [view, setView] = useState<'list' | 'board'>('list');
  const [busyIds, setBusyIds] = useState<number[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const list = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (view === 'list' && editingId !== null)
      list.current?.querySelector<HTMLInputElement>(`[data-task-id="${editingId}"] input`)?.focus();
  }, [view, editingId]);

  function savingChanged(taskId: number, saving: boolean) {
    setBusyIds((ids) => (saving ? [...ids, taskId] : ids.filter((id) => id !== taskId)));
  }

  function selection(task: ProjectTask) {
    const selected = selectedTaskIds.includes(task.id);
    return (
      (task.status !== 'Done' || selected) && (
        <SelectionButton
          key={day}
          taskId={task.id}
          day={day}
          selected={selected}
          disabled={!selectionsReady || busyIds.includes(task.id)}
          onSavingChange={(saving) => savingChanged(task.id, saving)}
          onSaved={(value) => onSelectionSaved(task.id, value)}
        />
      )
    );
  }

  return (
    <section aria-labelledby="tasks-heading">
      <h2 id="tasks-heading">Tasks</h2>
      <p role="status">
        {tasks.filter((task) => task.status === 'Done').length} of {tasks.length} tasks complete.
      </p>
      <div role="group" aria-label="Task view" className="view-switch">
        <button
          type="button"
          aria-pressed={view === 'list'}
          disabled={busyIds.length > 0}
          onClick={() => {
            setEditingId(null);
            setView('list');
          }}
        >
          List
        </button>
        <button
          type="button"
          aria-pressed={view === 'board'}
          disabled={busyIds.length > 0}
          onClick={() => {
            setEditingId(null);
            setView('board');
          }}
        >
          Board
        </button>
      </div>
      {tasks.length === 0 && <p>No tasks yet. Add your first task below.</p>}
      {/* Keep the list mounted so switching views never discards task drafts. */}
      <ul ref={list} className="task-list" hidden={view !== 'list'}>
        {tasks.map((task) => (
          <li key={task.id} data-task-id={task.id}>
            <TaskMeta task={task} day={day} />
            {selection(task)}
            <TaskForm
              projectId={projectId}
              task={task}
              disabled={busyIds.includes(task.id)}
              onSavingChange={(saving) => savingChanged(task.id, saving)}
              onSaved={onTaskSaved}
            />
          </li>
        ))}
      </ul>
      {view === 'board' && (
        <ProjectBoard
          tasks={tasks}
          day={day}
          busyIds={busyIds}
          onSavingChange={savingChanged}
          onSaved={onTaskSaved}
          selection={selection}
          onEdit={(taskId) => {
            setEditingId(taskId);
            setView('list');
          }}
        />
      )}
      <TaskForm projectId={projectId} onSaved={onTaskSaved} />
    </section>
  );
}
