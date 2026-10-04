import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'seo.spec.ts', workers: 1, outputDir: 'test-results/seo',
  use: { baseURL: 'http://127.0.0.1:4175', channel: 'chrome', headless: true },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4175', url: 'http://127.0.0.1:4175', reuseExistingServer: false },
});
