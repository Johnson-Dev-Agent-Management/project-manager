import { useId, useRef, useState } from 'react';
import { errorMessage, jsonRequest, request, type ProjectMilestone } from './api';

export default function MilestoneForm({
  projectId,
  milestone,
  disabled,
  onSavingChange,
  onSaved,
  onCancel,
}: {
  projectId: string;
  milestone?: ProjectMilestone;
  disabled: boolean;
  onSavingChange: (saving: boolean) => void;
  onSaved: (milestone: ProjectMilestone) => void;
  onCancel?: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(milestone?.title ?? '');
  const [description, setDescription] = useState(milestone?.description ?? '');
  const [targetDate, setTargetDate] = useState(milestone?.targetDate ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  async function save() {
    if (busy.current || disabled) return;
    busy.current = true;
    setSaving(true);
    onSavingChange(true);
    setError('');
    try {
      const saved = await request<ProjectMilestone>(
        `/api/projects/${projectId}/milestones${milestone ? `/${milestone.id}` : ''}`,
        'Could not save milestone. Please try again.',
        jsonRequest(milestone ? 'PUT' : 'POST', {
          title,
          description,
          targetDate: targetDate || null,
        }),
        'This milestone no longer exists. Reload the project to refresh milestones.',
      );
      onSaved(saved);
      if (!milestone) {
        setTitle('');
        setDescription('');
        setTargetDate('');
      }
    } catch (reason) {
      setError(errorMessage(reason, 'Could not save milestone. Please try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
      onSavingChange(false);
    }
  }
  return (
    <form
      aria-label={milestone ? `Edit milestone: ${milestone.title}` : 'New milestone'}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <fieldset disabled={disabled || saving}>
        <legend>{milestone ? 'Edit milestone' : 'New milestone'}</legend>
        <label htmlFor={`${id}-title`}>Milestone title</label>
        <input
          id={`${id}-title`}
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label htmlFor={`${id}-description`}>Milestone description (optional)</label>
        <textarea
          id={`${id}-description`}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <label htmlFor={`${id}-target`}>Target date (optional)</label>
        <input
          id={`${id}-target`}
          type="date"
          min="0001-01-01"
          max="9999-12-31"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
        />
        <button type="button" disabled={!targetDate} onClick={() => setTargetDate('')}>
          Clear target date
        </button>{' '}
        <button>
          {saving ? 'Saving milestone…' : milestone ? 'Save milestone' : 'Add milestone'}
        </button>{' '}
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel edit
          </button>
        )}
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
