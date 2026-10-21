import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ThemeToggle from './ThemeToggle';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  document.documentElement.style.removeProperty('color-scheme');
});

test('switches both ways and remembers the selected theme', () => {
  document.documentElement.dataset.theme = 'light';
  render(<ThemeToggle />);

  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  expect(localStorage.getItem('project-manager-theme')).toBe('dark');

  fireEvent.click(screen.getByRole('button', { name: 'Switch to light mode' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(document.documentElement.style.colorScheme).toBe('light');
  expect(localStorage.getItem('project-manager-theme')).toBe('light');
});

test('reflects the dark theme selected before React loads', () => {
  document.documentElement.dataset.theme = 'dark';
  render(<ThemeToggle />);
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeEnabled();
});

test('can still switch themes when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage unavailable', 'SecurityError');
  });
  render(<ThemeToggle />);
  fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeEnabled();
});
