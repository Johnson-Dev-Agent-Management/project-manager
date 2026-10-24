import { expect, test } from 'vitest';

test('Phase A controlled failure probe: CI and aggregate gate must reject this commit', () => {
  expect(true).toBe(false);
});
