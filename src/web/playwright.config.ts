import { defineConfig } from '@playwright/test';
const phase = process.env.E2E_PHASE ?? 'manual';
export default defineConfig({ testDir: './e2e', workers: 1,
  outputDir: `../../.artifacts/e2e/${phase}/test-results`,
  use: { baseURL: 'http://127.0.0.1:5174', headless: true,
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } },
  reporter: [['list'], ['junit', { outputFile: `../../.artifacts/e2e/${phase}/junit.xml` }],
    ['html', { outputFolder: `../../.artifacts/e2e/${phase}/html`, open: 'never' }]],
});
