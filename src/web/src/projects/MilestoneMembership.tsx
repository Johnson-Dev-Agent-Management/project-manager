import { type ProjectMilestone, type ProjectTask } from './api';

export default function MilestoneMembership({
  task,
  milestones,
}: {
  task: ProjectTask;
  milestones: ProjectMilestone[];
}) {
  const milestone = milestones.find((item) => item.id === task.milestoneId);
  return (
    <p className="milestone-membership">
      {milestone ? `Milestone: ${milestone.title}` : 'No milestone'}
    </p>
  );
}
