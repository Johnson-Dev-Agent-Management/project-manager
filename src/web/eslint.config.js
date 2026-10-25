import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import hooks from 'eslint-plugin-react-hooks';
import a11y from 'eslint-plugin-jsx-a11y';
import vitest from '@vitest/eslint-plugin';
import playwright from 'eslint-plugin-playwright';
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  {
    files: ['src/**/*.test.{ts,tsx}'],
    plugins: { vitest },
    rules: { 'vitest/no-focused-tests': 'error', 'vitest/no-disabled-tests': 'error' },
  },
  {
    files: ['e2e/**/*.ts'],
    plugins: { playwright },
    rules: {
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'error',
      'playwright/missing-playwright-await': 'error',
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { process: 'readonly' },
    },
    plugins: { 'react-hooks': hooks, 'jsx-a11y': a11y },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      ...a11y.flatConfigs.recommended.rules,
    },
  },
);
