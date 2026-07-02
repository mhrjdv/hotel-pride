import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Hotel Pride.
 *
 * The app runs against the REAL Supabase project (env in `.env.local`). Tests
 * authenticate with a dedicated admin account and tag every row they create so
 * the global setup/teardown can delete exactly those rows — the cloud project is
 * never polluted. `npm run dev` (or a dev server already on :3000) is required.
 *
 *   - globalSetup:    deletes leftover E2ETEST rows from a prior/crashed run.
 *   - globalTeardown: deletes all rows created during the run (FK-safe order).
 *
 * Two projects exercise the same specs at the two viewports the UI is built for:
 *   - desktop: 1440x900  (sidebar nav, desktop tables)
 *   - mobile:  390x844   (hamburger nav, card layouts)
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  /* Run files in parallel but tests within a file serially (some specs mutate
     the shared mock DB, so per-file isolation keeps things predictable). */
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
