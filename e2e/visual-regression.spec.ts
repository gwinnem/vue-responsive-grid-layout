import { expect, test } from '@playwright/test';

/**
 * Visual regression tests — Phase 3 from docs/REFACTOR_STRATEGY.md.
 *
 * Functional e2e tests (basic-grid.spec.ts, drag-and-resize.spec.ts, etc.)
 * verify *behavior*: an item moved, a class was applied, a bounding box
 * changed. None of them would catch a misapplied transform, a broken
 * border-radius, a missing resize handle cursor, or any other purely
 * visual regression — the DOM structure and computed positions can be
 * entirely correct while the grid looks wrong. Screenshot comparison is
 * the only one of the three test layers that would catch that class of bug.
 *
 * Each grid is screenshotted in a known, static state (before any
 * interaction) with a fixed viewport, so runs are deterministic —
 * anything that introduces real randomness (timestamps, animation
 * mid-transition) would make these flaky, which defeats the point.
 *
 * FIRST RUN: there are no baseline images committed yet. Generate them
 * once, in an environment with real Playwright browsers installed
 * (`npx playwright install`), by running:
 *
 *   npx playwright test visual-regression --update-snapshots
 *
 * ...and commit the resulting `visual-regression.spec.ts-snapshots/`
 * directory. Every run after that compares against those baselines;
 * regenerate deliberately (same command) whenever a visual change is
 * intentional, and review the diff in the PR like any other change.
 */
test.describe('Visual regression', () => {
  test.beforeEach(async ({ page }) => {
    // A fixed viewport matters most for the responsive view (its whole
    // point is changing appearance by width), but applying it to every
    // view keeps all seven screenshots comparable across different
    // machines/CI runners regardless of default viewport differences.
    await page.setViewportSize({ height: 900, width: 1280 });
    await page.goto('/');
  });

  test('basic grid', async ({ page }) => {
    await page.getByTestId('nav-basic').click();
    const grid = page.getByTestId('basic-grid-wrap');
    await expect(grid).toBeVisible();

    await expect(grid).toHaveScreenshot('basic-grid.png');
  });

  test('drag & resize (initial state, before any interaction)', async ({ page }) => {
    await page.getByTestId('nav-drag-resize').click();
    const grid = page.getByTestId('drag-resize-grid');
    await expect(grid).toBeVisible();

    await expect(grid).toHaveScreenshot('drag-resize-grid.png');
  });

  test('add / remove items (initial state)', async ({ page }) => {
    await page.getByTestId('nav-dynamic').click();
    const grid = page.getByTestId('dynamic-grid');
    await expect(grid).toBeVisible();

    await expect(grid).toHaveScreenshot('dynamic-items-grid.png');
  });

  test('responsive breakpoints at a fixed (desktop) viewport', async ({ page }) => {
    await page.getByTestId('nav-responsive').click();
    const grid = page.getByTestId('responsive-grid');
    await expect(grid).toBeVisible();
    // The 1280px viewport set in beforeEach resolves to the "lg" breakpoint
    // under the library's default thresholds — assert that explicitly so a
    // future change to the default breakpoints (which would silently
    // change what this screenshot is actually of) fails loudly here
    // instead of just producing a confusing image diff.
    await expect(page.getByTestId('current-breakpoint')).toContainText('lg');

    await expect(grid).toHaveScreenshot('responsive-grid-desktop.png');
  });

  test('cross-grid drag/drop (initial state, before any interaction)', async ({ page }) => {
    // Screenshots the shared wrapper around both grids (data-testid added
    // to CrossGridView.vue specifically for this — neither grid alone
    // represents "the view," and the previous four tests all screenshot
    // a single element per view, so this keeps that same one-screenshot-
    // per-view shape rather than two separate images for one view).
    await page.getByTestId('nav-cross-grid').click();
    const view = page.getByTestId('cross-grid-view-wrap');
    await expect(view).toBeVisible();

    await expect(view).toHaveScreenshot('cross-grid-view.png');
  });

  test('per-item overrides (initial state)', async ({ page }) => {
    await page.getByTestId('nav-item-overrides').click();
    const grid = page.getByTestId('item-overrides-grid');
    await expect(grid).toBeVisible();

    await expect(grid).toHaveScreenshot('item-overrides-grid.png');
  });

  test('drag from outside, multi-grid (initial state, before any interaction)', async ({ page }) => {
    // Same shared-wrapper reasoning as the cross-grid test above —
    // ExternalDropView.vue also renders two grids side by side.
    await page.getByTestId('nav-external-drop').click();
    const view = page.getByTestId('external-drop-view-wrap');
    await expect(view).toBeVisible();

    await expect(view).toHaveScreenshot('external-drop-view.png');
  });
});
