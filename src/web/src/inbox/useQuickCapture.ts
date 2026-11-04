import { useRef, useState } from 'react';
import { errorMessage, jsonRequest } from '../projects/api';
import { inboxRequest, type InboxItem } from './api';

// Owned by the app so navigating away never discards a draft or interrupts a save.
export default function useQuickCapture(onCaptured: () => void) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const busy = useRef(false);

  async function capture() {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setError('');
    setConfirmation('');
    try {
      const item = await inboxRequest<InboxItem>(
        '/api/inbox',
        'Could not capture item. Your text is still here; try again.',
        jsonRequest('POST', { title }),
      );
      setTitle('');
      setConfirmation(`Captured “${item.title}” in Inbox. Add another whenever you’re ready.`);
      onCaptured();
    } catch (reason) {
      setError(errorMessage(reason, 'Could not capture item. Please try again.'));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return {
    title,
    saving,
    error,
    confirmation,
    capture,
    changeTitle: (value: string) => {
      setTitle(value);
      setConfirmation('');
    },
  };
}
