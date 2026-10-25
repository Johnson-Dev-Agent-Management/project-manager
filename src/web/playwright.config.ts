import { defineConfig } from '@playwright/test';
const phase = process.env.E2E_PHASE;
if (phase !== 'create' && phase !== 'restart') {
  throw new Error('E2E_PHASE must be create or restart. Use bash scripts/e2e.sh.');
}
const artifacts = process.env.E2E_ARTIFACT_DIR;
if (!artifacts) throw new Error('E2E_ARTIFACT_DIR is required. Use bash scripts/e2e.sh.');
export default defineConfig({
  testDir: './e2e',
  workers: 1,
  retries: 0,
  forbidOnly: true,
  outputDir: `${artifacts}/${phase}/test-results`,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
  },
  reporter: [
    ['list'],
    ['junit', { outputFile: `${artifacts}/${phase}/junit.xml` }],
    ['html', { outputFolder: `${artifacts}/${phase}/html`, open: 'never' }],
  ],
});
