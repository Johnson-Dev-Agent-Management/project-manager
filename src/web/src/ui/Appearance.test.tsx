import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import Appearance from './Appearance';

const preferenceKey = 'project-manager-accent';
afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(preferenceKey);
  delete document.documentElement.dataset.accent;
});

test.each([
  ['blue', 'blue'],
  ['teal', 'teal'],
  ['unknown', 'blue'],
])('loads the stored %s preference as %s', async (stored, expected) => {
  localStorage.setItem(preferenceKey, stored);
  render(<Appearance />);
  await userEvent.setup().click(screen.getByText('Appearance'));
  expect(screen.getByRole('combobox', { name: 'Accent color' })).toHaveValue(expected);
});

test('defaults to Blue, switches instantly, remembers the choice, and closes with Escape', async () => {
  const user = userEvent.setup();
  const view = render(<Appearance />);
  expect(screen.getByRole('combobox')).not.toBeVisible();
  await user.click(screen.getByText('Appearance'));
  const choice = screen.getByRole('combobox', { name: 'Accent color' });
  expect(choice).toHaveValue('blue');
  await user.selectOptions(choice, 'teal');
  expect(choice).toHaveValue('teal');
  expect(localStorage.getItem(preferenceKey)).toBe('teal');
  await user.keyboard('{Escape}');
  expect(screen.getByRole('combobox')).not.toBeVisible();
  expect(screen.getByText('Appearance')).toHaveFocus();
  view.unmount();
  render(<Appearance />);
  await user.click(screen.getByText('Appearance'));
  expect(screen.getByRole('combobox')).toHaveValue('teal');
  await user.selectOptions(screen.getByRole('combobox'), 'blue');
  expect(localStorage.getItem(preferenceKey)).toBe('blue');
});

test('unavailable browser storage still allows changing the accent for this session', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Blocked');
  });
  const user = userEvent.setup();
  render(<Appearance />);
  await user.click(screen.getByText('Appearance'));
  const choice = screen.getByRole('combobox', { name: 'Accent color' });
  expect(choice).toHaveValue('blue');
  await user.selectOptions(choice, 'teal');
  expect(choice).toHaveValue('teal');
  await user.keyboard('{Escape}');
  await user.click(screen.getByText('Appearance'));
  expect(screen.getByRole('combobox')).toHaveValue('teal');
});
