import { useEffect, useRef, useState } from 'react';
import { type ProjectTask, type ProjectMilestone } from './api';
import TaskForm from './TaskForm';
import ProjectBoard from './ProjectBoard';
import TaskMeta from '../today/TaskMeta';
import SelectionButton from '../today/SelectionButton';
import ProjectMilestones from './ProjectMilestones';
import MilestoneMembership from './MilestoneMembership';

export default function ProjectTasks({
  projectId,
  tasks,
  selectedTaskIds,
  day,
  selectionsReady,
  onTaskSaved,
  onSelectionSaved,
  milestones = [],
  onMilestoneSaved,
  onMilestoneRemoved,
}: {
  milestones: ProjectMilestone[];
  onMilestoneSaved: (milestone: ProjectMilestone) => void;
  onMilestoneRemoved: (id: number) => void;
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
  const [milestoneBusy, setMilestoneBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const filterControl = useRef<HTMLSelectElement>(null);
  const activeFilter =
    filter === 'none' || milestones.some((item) => String(item.id) === filter) ? filter : 'all';
  const matches = (task: ProjectTask) =>
    activeFilter === 'all' ||
    (activeFilter === 'none'
      ? task.milestoneId == null
      : String(task.milestoneId) === activeFilter);
  const visibleTasks = tasks.filter(matches);
  const lockedIds = milestoneBusy ? tasks.map((task) => task.id) : busyIds;
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
          disabled={!selectionsReady || milestoneBusy || busyIds.includes(task.id)}
          onSavingChange={(saving) => savingChanged(task.id, saving)}
          onSaved={(value) => onSelectionSaved(task.id, value)}
        />
      )
    );
  }

  return (
    <>
      <ProjectMilestones
        projectId={projectId}
        milestones={milestones}
        tasks={tasks}
        disabled={milestoneBusy || busyIds.length > 0}
        onSavingChange={setMilestoneBusy}
        onSaved={onMilestoneSaved}
        onRemoved={onMilestoneRemoved}
        onInspect={(id) => {
          setFilter(String(id));
          setView('list');
          setEditingId(null);
          filterControl.current?.focus();
        }}
      />
      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading">Tasks</h2>
        <p role="status">
          {tasks.filter((task) => task.status === 'Done').length} of {tasks.length} tasks complete.
        </p>
        <label htmlFor="milestone-filter">Filter tasks by milestone</label>
        <select
          id="milestone-filter"
          ref={filterControl}
          value={activeFilter}
          disabled={milestoneBusy || busyIds.length > 0}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All tasks</option>
          <option value="none">No milestone</option>
          {milestones.map((milestone) => (
            <option key={milestone.id} value={milestone.id}>
              {milestone.title}
            </option>
          ))}
        </select>
        {activeFilter !== 'all' && (
          <p role="status">
            Showing {visibleTasks.length} assigned {visibleTasks.length === 1 ? 'task' : 'tasks'}.
            Project completion above includes all tasks.
          </p>
        )}
        <div role="group" aria-label="Task view" className="view-switch">
          <button
            type="button"
            aria-pressed={view === 'list'}
            disabled={milestoneBusy || busyIds.length > 0}
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
            disabled={milestoneBusy || busyIds.length > 0}
            onClick={() => {
              setEditingId(null);
              setView('board');
            }}
          >
            Board
          </button>
        </div>
        {tasks.length === 0 && <p>No tasks yet. Add your first task below.</p>}
        {tasks.length > 0 && visibleTasks.length === 0 && (
          <p>No tasks match this milestone filter. Assign tasks using their Milestone control.</p>
        )}
        {/* Keep the list mounted so switching views never discards task drafts. */}
        <ul ref={list} className="task-list" hidden={view !== 'list'}>
          {tasks.map((task) => (
            <li key={task.id} data-task-id={task.id} hidden={!matches(task)}>
              <TaskMeta task={task} day={day} />
              <MilestoneMembership task={task} milestones={milestones} />
              {selection(task)}
              <TaskForm
                projectId={projectId}
                task={task}
                milestones={milestones}
                disabled={milestoneBusy || busyIds.includes(task.id)}
                onSavingChange={(saving) => savingChanged(task.id, saving)}
                onSaved={onTaskSaved}
              />
            </li>
          ))}
        </ul>
        {view === 'board' && (
          <ProjectBoard
            tasks={visibleTasks}
            milestones={milestones}
            day={day}
            busyIds={lockedIds}
            onSavingChange={savingChanged}
            onSaved={onTaskSaved}
            selection={selection}
            onEdit={(taskId) => {
              setEditingId(taskId);
              setView('list');
            }}
          />
        )}
        <TaskForm
          projectId={projectId}
          milestones={milestones}
          disabled={milestoneBusy}
          onSavingChange={(saving) => savingChanged(0, saving)}
          onSaved={onTaskSaved}
        />
      </section>
    </>
  );
}
