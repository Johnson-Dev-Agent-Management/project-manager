import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import App from './App';
test('loads empty state and creates a project', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [] }).mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, name: 'Example' }) });
  vi.stubGlobal('fetch', fetchMock); render(<App />);
  expect(screen.getByRole('status')).toHaveTextContent('Loading');
  await screen.findByText('No projects yet.');
  fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Example' } });
  fireEvent.click(screen.getByRole('button'));
  await screen.findByText('Example');
  expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ name: 'Example' }));
});
test('shows server validation failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: true, json: async () => [] }).mockResolvedValueOnce({ ok: false, json: async () => ({ errors: { name: ['Project name is required.'] } }) }));
  render(<App />); await screen.findByText('No projects yet.'); fireEvent.click(screen.getByRole('button'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Project name is required.');
});
test('shows a loading error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network unavailable')));
  render(<App />); expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
});
