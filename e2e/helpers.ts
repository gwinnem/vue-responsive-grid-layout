import { expect, type Locator } from '@playwright/test';

/**
 * Waits for an element's bounding box to stop changing before treating it
 * as a stable baseline.
 *
 * Found necessary while adding new e2e tests, then confirmed to be a
 * pre-existing, project-wide issue (not something the new tests
 * introduced) by finding it also affects `drag-and-resize.spec.ts`'s own,
 * previously-passing tests once run enough times / under different
 * timing conditions: capturing a `boundingBox()` immediately after the
 * `.vue-draggable` class check (the wait condition several existing
 * tests already rely on) can still land mid-settle. The class appearing
 * confirms interact.js's own drag/resize setup has run — it does not
 * confirm the container's own width measurement (which `colWidth`, and
 * so every item's actual pixel position, depends on) has also finished.
 * That measurement can resolve across more than one render pass after
 * mount or a view switch.
 *
 * Requires 3 consecutive identical reads, not fewer — a short-lived
 * plateau in the container-width measurement can otherwise look
 * "stable" for one comparison and then still shift again afterward
 * (confirmed directly: an earlier 2-read version of this check still
 * produced an intermittently-flaky result on a *static* item, one that
 * never actually moves, purely from measuring it mid-settle).
 */
export async function stableBoundingBox(locator: Locator): ReturnType<Locator['boundingBox']> {
  await locator.page().waitForTimeout(300);
  let consecutiveStable = 0;
  let previous = await locator.boundingBox();
  await expect.poll(async () => {
    const current = await locator.boundingBox();
    const stable = previous !== null && current !== null && current.x === previous.x && current.width === previous.width;
    consecutiveStable = stable ? consecutiveStable + 1 : 0;
    previous = current;
    return consecutiveStable;
  }).toBeGreaterThanOrEqual(3);
  return locator.boundingBox();
}
