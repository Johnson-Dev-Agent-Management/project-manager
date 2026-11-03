import { type ProjectTask } from '../projects/api';

export type TodayTask = { task: ProjectTask; projectName: string };
export type TodayPlan = { selected: TodayTask[]; due: TodayTask[]; completed: TodayTask[] };
const priorityRank = { High: 0, Medium: 1, Low: 2, None: 3 };
const compareDate = (a: TodayTask, b: TodayTask) => {
  const first = a.task.dueDate ?? '9999-99-99';
  const second = b.task.dueDate ?? '9999-99-99';
  return first < second ? -1 : first > second ? 1 : 0;
};
const comparePriority = (a: TodayTask, b: TodayTask) =>
  priorityRank[a.task.priority] - priorityRank[b.task.priority];

// Reflect only confirmed mutations while the authoritative refresh is pending.
// Match the API's section membership and deterministic ordering in the meantime.
export function updatePlan(
  plan: TodayPlan,
  day: string,
  taskId: number,
  change: { task?: ProjectTask; selected?: boolean },
): TodayPlan {
  const selectedIds = new Set([...plan.selected, ...plan.completed].map((item) => item.task.id));
  if (change.selected === true) selectedIds.add(taskId);
  if (change.selected === false) selectedIds.delete(taskId);
  const items = [...plan.selected, ...plan.due, ...plan.completed].map((item) =>
    item.task.id === taskId && change.task ? { ...item, task: change.task } : item,
  );
  const selected = items
    .filter((item) => selectedIds.has(item.task.id))
    .sort((a, b) => comparePriority(a, b) || compareDate(a, b) || a.task.id - b.task.id);
  return {
    selected: selected.filter((item) => item.task.status !== 'Done'),
    completed: selected.filter((item) => item.task.status === 'Done'),
    due: items
      .filter(
        (item) =>
          !selectedIds.has(item.task.id) &&
          item.task.status !== 'Done' &&
          item.task.dueDate !== null &&
          item.task.dueDate <= day,
      )
      .sort((a, b) => compareDate(a, b) || comparePriority(a, b) || a.task.id - b.task.id),
  };
}
