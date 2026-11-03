import { useEffect, useRef, useState } from 'react';
import { errorMessage, jsonRequest } from '../projects/api';
import { inboxRequest, type InboxItem } from './api';

export default function QuickCapture({ onCaptured }: { onCaptured: () => void }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const busy = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!saving && confirmation) input.current?.focus();
  }, [saving, confirmation]);

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
  return (
    <form
      className="quick-capture"
      aria-label="Quick capture"
      onSubmit={(event) => {
        event.preventDefault();
        void capture();
      }}
    >
      <fieldset disabled={saving}>
        <legend>Quick capture</legend>
        <label htmlFor="capture-title">Capture title</label>
        <div className="capture-controls">
          <input
            id="capture-title"
            ref={input}
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setConfirmation('');
            }}
          />
          <button>{saving ? 'Capturing…' : 'Capture'}</button>
        </div>
        <small>Just a title. Choose a project later in Inbox.</small>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {confirmation && <p role="status">{confirmation}</p>}
    </form>
  );
}
