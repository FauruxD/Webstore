import { defineConfig, devices } from '@playwright/test';

// Deliberately not 3000. Another local Next app often holds it, and combined with
// `reuseExistingServer` the suite silently runs against that other project: every
// test fails on markup it has never seen, which reads as 35 broken features rather
// than one wrong port. A dedicated port makes the reuse safe. Override with PW_PORT.
const PORT = process.env.PW_PORT ?? '3311';
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Defaults to Playwright's bundled Chromium. Set PW_CHANNEL=msedge or
        // =chrome to run against a locally installed browser instead.
        ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
