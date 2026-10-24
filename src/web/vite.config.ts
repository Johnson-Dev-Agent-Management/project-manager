import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { proxy: { '/api': process.env.API_URL ?? 'http://127.0.0.1:5000' } }, test: { environment: 'jsdom', setupFiles: './src/test-setup.ts', include: ['src/**/*.test.tsx'], coverage: {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: ['src/**/*.test.{ts,tsx}', 'src/test-setup.ts', 'src/**/*.d.ts'],
  reportsDirectory: '../../.artifacts/frontend/coverage',
  reporter: ['text', 'json-summary', 'cobertura', 'html'],
} } });
