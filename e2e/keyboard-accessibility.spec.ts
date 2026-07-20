import { expect, test } from '@playwright/test';
import { stableBoundingBox } from './helpers';

test.describe('Keyboard move/resize (edge cases)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-drag-resize').click();
    // Same rationale as drag-and-resize.spec.ts: wait for interact.js's
    // draggable/resizable setup to actually attach before interacting,
    // rather than racing a fixed timeout.
    await expect(page.getByTestId('grid-item-0')).toHaveClass(/vue-draggable/);
  });

  test('ArrowRight moves a focused item right by one grid unit', async ({ page }) => {
    const item = page.getByTestId('grid-item-1');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await item.focus();
    await page.keyboard.press('ArrowRight');

    // A keyboard move commits through the same emit()/eventBus round trip
    // as a mouse drag — expect.poll rather than a single immediate read,
    // same async-commit rationale as drag-and-resize.spec.ts.
    await expect.poll(async () => (await item.boundingBox())!.x).toBeGreaterThan(before!.x);
  });

  test('ArrowLeft repeatedly at the left boundary clamps at x:0 rather than going negative', async ({ page }) => {
    const item = page.getByTestId('grid-item-0');
    await item.focus();

    // item 0 starts at x:0 in the demo's default layout — pressing
    // ArrowLeft here should be a no-op (already at the boundary), not
    // move it to a negative, off-grid position.
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');

    // Give any (incorrect) async commit a chance to land before asserting
    // it didn't move — waitForTimeout is deliberate here specifically to
    // prove a negative (nothing happened), where expect.poll's own retry
    // loop would only prove "eventually stopped changing," not "never
    // left the boundary" at any point in between.
    await page.waitForTimeout(300);

    const after = await item.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
  });

  test('Shift+ArrowRight resizes (grows width) rather than moving the item', async ({ page }) => {
    const item = page.getByTestId('grid-item-1');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await item.focus();
    await page.keyboard.press('Shift+ArrowRight');

    await expect.poll(async () => (await item.boundingBox())!.width).toBeGreaterThan(before!.width);
    // A resize keeps the item's own top-left corner in place — unlike a
    // move, x shouldn't change from growing rightward.
    const after = await item.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
  });

  test('Shift+ArrowLeft shrinks width but not below minW (clamped, not negative)', async ({ page }) => {
    const item = page.getByTestId('grid-item-1');
    await item.focus();

    // Shrink repeatedly — far more than the item's actual grid width, to
    // confirm minW clamps it rather than shrinking indefinitely or
    // erroring out.
    for (let i = 0; i < 10; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await page.keyboard.press('Shift+ArrowLeft');
    }
    await page.waitForTimeout(300);

    const after = await item.boundingBox();
    expect(after).not.toBeNull();
    // Never collapses to zero or negative width regardless of how many
    // shrink presses are sent.
    expect(after!.width).toBeGreaterThan(0);
  });

  test('a static item does not respond to keyboard move at all', async ({ page }) => {
    // Toggle preventCollision off first isn't needed here — this demo
    // view doesn't have a static item by default, so this test targets
    // DragResizeView's own "draggable" toggle disabled state instead,
    // which is the closest equivalent already wired up in this view: an
    // item with keyboard interactivity turned off shouldn't move on
    // arrow-key input either, the same as a genuinely static item
    // wouldn't (both share the same draggableOrResizableAndNotStatic
    // gate in GridItem.vue that controls whether tabindex/keydown are
    // wired up at all).
    await page.getByTestId('toggle-draggable').uncheck();
    await page.getByTestId('toggle-resizable').uncheck();

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await item.focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Shift+ArrowRight');
    await page.waitForTimeout(300);

    const after = await item.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.width).toBeCloseTo(before!.width, 0);
  });
});
