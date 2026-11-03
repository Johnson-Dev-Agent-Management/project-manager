import { useRef, useState } from 'react';
import { errorMessage, jsonRequest, request } from '../projects/api';
import { localDay } from './dates';

export default function SelectionButton({
  taskId,
  day,
  selected,
  onSaved,
  disabled = false,
  onSavingChange,
}: {
  taskId: number;
  day: string;
  selected: boolean;
  onSaved: (selected: boolean) => void;
  disabled?: boolean;
  onSavingChange?: (saving: boolean) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  async function save() {
    if (busy.current || disabled) return;
    if (day !== localDay()) {
      window.dispatchEvent(new Event('focus'));
      return;
    }
    busy.current = true;
    onSavingChange?.(true);
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
      busy.current = false;
      onSavingChange?.(false);
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
