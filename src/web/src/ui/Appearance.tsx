import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

type Accent = 'blue' | 'teal';
const preferenceKey = 'project-manager-accent';

function savedAccent(): Accent {
  try {
    return localStorage.getItem(preferenceKey) === 'teal' ? 'teal' : 'blue';
  } catch {
    return 'blue';
  }
}

export default function Appearance() {
  const [accent, setAccent] = useState(savedAccent);
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && details.current) {
      details.current.open = false;
      summary.current?.focus();
    }
  }

  return (
    <details className="appearance-settings" ref={details}>
      <summary ref={summary} onKeyDown={closeOnEscape}>
        Appearance
      </summary>
      <div className="appearance-panel">
        <label htmlFor="accent-color">Accent color</label>
        <select
          id="accent-color"
          value={accent}
          onKeyDown={closeOnEscape}
          onChange={(event) => {
            const value = event.target.value === 'teal' ? 'teal' : 'blue';
            setAccent(value);
            try {
              localStorage.setItem(preferenceKey, value);
            } catch {
              // The choice still works for this session when storage is unavailable.
            }
          }}
        >
          <option value="blue">Blue</option>
          <option value="teal">Teal</option>
        </select>
      </div>
    </details>
  );
}
