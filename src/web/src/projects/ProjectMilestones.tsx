import { useRef, useState } from 'react';
import { errorMessage, request, type ProjectMilestone, type ProjectTask } from './api';
import MilestoneForm from './MilestoneForm';

export default function ProjectMilestones({
  projectId,
  milestones,
  tasks,
  disabled,
  onSavingChange,
  onSaved,
  onRemoved,
  onInspect,
}: {
  projectId: string;
  milestones: ProjectMilestone[];
  tasks: ProjectTask[];
  disabled: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: (milestone: ProjectMilestone) => void;
  onRemoved: (id: number) => void;
  onInspect: (id: number) => void;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  async function remove(milestone: ProjectMilestone) {
    if (disabled || busy.current) return;
    const origin = document.activeElement;
    busy.current = true;
    setSaving(true);
    onSavingChange(true);
    setError('');
    setFeedback('');
    try {
      await request<{ id: number }>(
        `/api/projects/${projectId}/milestones/${milestone.id}`,
        'Could not remove milestone. Please try again.',
        { method: 'DELETE' },
        'This milestone no longer exists. Reload the project to refresh milestones.',
      );
      onRemoved(milestone.id);
      setRemovingId(null);
      setFeedback(`Removed “${milestone.title}”. Its tasks remain in this project.`);
      if (document.activeElement === origin || document.activeElement === document.body)
        heading.current?.focus();
    } catch (reason) {
      setError(errorMessage(reason, 'Could not remove milestone. Please try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  }
  function saved(milestone: ProjectMilestone) {
    onSaved(milestone);
    setFeedback(`Milestone “${milestone.title}” saved.`);
  }
  return (
    <section aria-labelledby="milestones-heading">
      <h2 id="milestones-heading" ref={heading} tabIndex={-1}>
        Milestones
      </h2>
      <p>Group tasks around an outcome. Target dates do not change task due dates.</p>
      {milestones.length === 0 && <p>No milestones yet. Create an outcome to work toward.</p>}
      <div className="milestones">
        {milestones.map((milestone) => {
          const assigned = tasks.filter((task) => task.milestoneId === milestone.id);
          const completed = assigned.filter((task) => task.status === 'Done').length;
          const complete = assigned.length > 0 && completed === assigned.length;
          return (
            <section
              key={milestone.id}
              aria-label={`Milestone: ${milestone.title}`}
              className="milestone-card"
            >
              <h3>{milestone.title}</h3>
              {milestone.description && <p className="item-notes">{milestone.description}</p>}
              <p>
                {milestone.targetDate ? (
                  <>
                    Target <time dateTime={milestone.targetDate}>{milestone.targetDate}</time>
                  </>
                ) : (
                  'No target date'
                )}
              </p>
              <p role="status">
                {assigned.length === 0
                  ? 'No tasks assigned'
                  : `${completed} of ${assigned.length} tasks complete`}
                {complete && ' · Complete'}
              </p>
              <progress
                aria-label={`Progress for ${milestone.title}`}
                max={assigned.length || 1}
                value={completed}
              />
              <div className="milestone-actions">
                <button disabled={disabled} onClick={() => onInspect(milestone.id)}>
                  View tasks
                </button>
                <button
                  disabled={disabled}
                  aria-expanded={editingId === milestone.id}
                  onClick={() => {
                    setEditingId(editingId === milestone.id ? null : milestone.id);
                    setRemovingId(null);
                    setError('');
                    setFeedback('');
                  }}
                >
                  Edit milestone
                </button>
                <button
                  disabled={disabled}
                  aria-expanded={removingId === milestone.id}
                  onClick={() => {
                    setRemovingId(removingId === milestone.id ? null : milestone.id);
                    setEditingId(null);
                    setError('');
                    setFeedback('');
                  }}
                >
                  Remove milestone
                </button>
              </div>
              {editingId === milestone.id && (
                <MilestoneForm
                  projectId={projectId}
                  milestone={milestone}
                  disabled={disabled}
                  onSavingChange={onSavingChange}
                  onSaved={(value) => {
                    saved(value);
                    setEditingId(null);
                    if (
                      document.activeElement === document.body ||
                      document.activeElement?.closest('form')?.getAttribute('aria-label') ===
                        `Edit milestone: ${milestone.title}`
                    )
                      heading.current?.focus();
                  }}
                  onCancel={() => setEditingId(null)}
                />
              )}
              {removingId === milestone.id && (
                <div role="group" aria-label={`Remove milestone: ${milestone.title}`}>
                  <p>
                    Remove “{milestone.title}”? Its tasks will be preserved in this project with no
                    milestone. This cannot be undone.
                  </p>
                  <button disabled={disabled || saving} onClick={() => void remove(milestone)}>
                    {saving ? 'Removing milestone…' : 'Confirm removal'}
                  </button>{' '}
                  <button
                    disabled={disabled || saving}
                    onClick={() => {
                      setRemovingId(null);
                      setError('');
                    }}
                  >
                    Keep milestone
                  </button>
                  {error && <p role="alert">{error}</p>}
                </div>
              )}
            </section>
          );
        })}
      </div>
      <details>
        <summary>Create milestone</summary>
        <MilestoneForm
          projectId={projectId}
          disabled={disabled}
          onSavingChange={onSavingChange}
          onSaved={saved}
        />
      </details>
      {feedback && <p role="status">{feedback}</p>}
    </section>
  );
}
