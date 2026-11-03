import { useState } from 'react';
import { errorMessage, jsonRequest, request } from '../projects/api';
import { localDay } from './dates';

export default function SelectionButton({
  taskId,
  day,
  selected,
  onSaved,
  disabled = false,
}: {
  taskId: number;
  day: string;
  selected: boolean;
  onSaved: (selected: boolean) => void;
  disabled?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    if (day !== localDay()) {
      window.dispatchEvent(new Event('focus'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await request<{ selected: boolean }>(
        `/api/today/${day}/tasks/${taskId}`,
        'Could not update today. Try again.',
        jsonRequest('PUT', { selected: !selected }),
      );
      onSaved(result.selected);
    } catch (reason) {
      setError(errorMessage(reason, 'Could not update today. Try again.'));
    } finally {
      setSaving(false);
    }
  }
  return (
    <div>
      <button type="button" disabled={saving || disabled} onClick={() => void save()}>
        {saving ? 'Updating today…' : selected ? 'Remove from today' : 'Add to today'}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
