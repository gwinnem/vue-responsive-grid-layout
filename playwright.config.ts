import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for vue-ts-responsive-grid-layout.
 *
 * Tests run against the demo app (./demo), which imports the library
 * directly from src/ so tests always exercise current, uncompiled source.
 *
 * Run with:
 *   npx playwright install        (first time only, downloads browsers)
 *   npm run test:e2e
 *
 * `visual-regression.spec.ts` is excluded from the default run — it has no
 * baseline screenshots committed yet, so running it as-is would just fail
 * every time rather than provide signal. See docs/VISUAL_REGRESSION.md
 * before enabling it. Run it explicitly with `npm run test:e2e:visual`.
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: process.env.RUN_VISUAL_REGRESSION ? undefined : '**/visual-regression.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run demo',
    url: 'http://localhost:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
