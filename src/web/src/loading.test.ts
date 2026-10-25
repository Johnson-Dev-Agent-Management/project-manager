import { createElement } from 'react';
import { act, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';

test.each([
  ['HTTP failure', () => Promise.resolve({ ok: false }), 'Could not load projects.'],
  ['network error', () => Promise.reject(new Error('Network unavailable')), 'Network unavailable'],
  ['non-Error rejection', vi.fn().mockRejectedValue('offline'), 'Could not load projects.'],
])('loading %s ends loading and presents a useful error', async (_, fetchResult, message) => {
  vi.stubGlobal('fetch', vi.fn(fetchResult));
  render(createElement(App));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByRole('button')).toBeEnabled();
});

test.each(['resolve', 'reject'])(
  'unmount aborts pending load before it can %s',
  async (outcome) => {
    let resolve!: (value: unknown) => void;
    let reject!: (reason: unknown) => void;
    const fetchMock = vi.fn((_url: string, options: RequestInit) => {
      expect(options.signal?.aborted).toBe(false);
      return new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const view = render(createElement(App));
    view.unmount();
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
    await act(async () => {
      if (outcome === 'reject') reject(new Error('aborted'));
      else resolve({ ok: true, json: () => [] });
      await Promise.resolve();
    });
    expect(view.container).toBeEmptyDOMElement();
  },
);
