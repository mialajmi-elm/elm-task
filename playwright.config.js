import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node scripts/serve.js',
    url: 'http://127.0.0.1:3100/api/health',
    env: { PORT: '3100', DB_PATH: ':memory:' },
    reuseExistingServer: false,
    timeout: 60000,
  },
});
