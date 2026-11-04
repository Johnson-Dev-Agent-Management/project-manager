import { useEffect, useRef } from 'react';
import type useQuickCapture from './useQuickCapture';

export default function QuickCapture({ draft }: { draft: ReturnType<typeof useQuickCapture> }) {
  const { title, saving, error, confirmation, capture, changeTitle } = draft;
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!saving && confirmation) input.current?.focus();
  }, [saving, confirmation]);

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
            onChange={(event) => changeTitle(event.target.value)}
            aria-describedby="capture-hint"
          />
          <button type="submit">{saving ? 'Capturing…' : 'Capture'}</button>
        </div>
        <small id="capture-hint">Just a title. Choose a project later in Inbox.</small>
      </fieldset>
      <a className="capture-inbox-link" href="#/inbox">
        Open Inbox
      </a>
      {error && <p role="alert">{error}</p>}
      {confirmation && <p role="status">{confirmation}</p>}
    </form>
  );
}
