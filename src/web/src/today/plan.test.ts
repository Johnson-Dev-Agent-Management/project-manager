import { expect, test } from 'vitest';
import { type ProjectTask } from '../projects/api';
import { updatePlan, type TodayPlan, type TodayTask } from './plan';

function task(
  id: number,
  priority: ProjectTask['priority'],
  dueDate: string | null,
  status: ProjectTask['status'] = 'To do',
): TodayTask {
  return {
    task: {
      id,
      projectId: 1,
      milestoneId: null,
      title: `Task ${id}`,
      notes: null,
      status,
      priority,
      dueDate,
    },
    projectName: 'Work',
  };
}

test('confirmed updates keep priority/date/ID order, exclude undated or future unselected tasks, and move completed rows once', () => {
  const day = '2026-11-03';
  const input: TodayPlan = {
    selected: [task(3, 'High', '2026-11-04'), task(4, 'High', null), task(8, 'None', null)],
    due: [
      task(5, 'Low', '2026-10-01'),
      task(1, 'High', '2026-11-02'),
      task(2, 'High', '2026-11-02'),
    ],
    completed: [task(6, 'Medium', null, 'Done')],
  };
  let plan = updatePlan(input, day, 2, { selected: true });
  plan = updatePlan(plan, day, 1, { selected: true });
  expect(plan.selected.map((item) => item.task.id)).toEqual([1, 2, 3, 4, 8]);
  expect(plan.due.map((item) => item.task.id)).toEqual([5]);
  const completed = { ...plan.selected[0].task, status: 'Done' as const };
  plan = updatePlan(plan, day, 1, { task: completed });
  expect(plan.completed.map((item) => item.task.id)).toEqual([1, 6]);
  expect(plan.selected.map((item) => item.task.id)).toEqual([2, 3, 4, 8]);
  plan = updatePlan(plan, day, 1, { task: { ...completed, status: 'In progress' } });
  expect(plan.selected[0].task.status).toBe('In progress');
  expect(plan.selected[0].projectName).toBe('Work');
  for (const id of [1, 2, 3, 4, 8, 6]) plan = updatePlan(plan, day, id, { selected: false });
  expect(plan.selected).toEqual([]);
  expect(plan.completed).toEqual([]);
  expect(plan.due.map((item) => item.task.id)).toEqual([5, 1, 2]);
  // Updating a returned plan must leave the prior server snapshot untouched.
  expect(input.selected.map((item) => item.task.id)).toEqual([3, 4, 8]);
});
