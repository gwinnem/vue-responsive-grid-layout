import { expect, test } from '@playwright/test';
import { stableBoundingBox } from './helpers';

test.describe('Per-item overrides (edge cases)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-item-overrides').click();
    await expect(page.getByTestId('grid-item-0')).toHaveClass(/vue-draggable/);
  });

  test('dragging a corner resize handle changes both width and height at once', async ({ page }) => {
    // The one gesture type missing from drag-and-resize.spec.ts's own
    // coverage: that file uses the edge handles (`s`/`w`) specifically
    // to avoid a real, confirmed issue where two horizontally-adjacent
    // items' 10x10px corner handles can overlap by several pixels at a
    // small item margin (see docs/REFACTORING.md #76). Checked directly
    // here first (via stableBoundingBox + elementFromPoint) that this
    // demo's own item spacing doesn't have that overlap, so a genuine
    // two-dimensional corner drag can be tested without that ambiguity.
    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    const handle = item.locator('.vue-resize-hint--se');
    await handle.hover();
    await page.mouse.down();
    const handleBox = await handle.boundingBox();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 100, handleBox!.y + handleBox!.height / 2 + 60, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await item.boundingBox())!.width).toBeGreaterThan(before!.width);
    const after = await item.boundingBox();
    expect(after!.height).toBeGreaterThan(before!.height);
  });

  test('preserveAspectRatio grows height proportionally when only the right edge is dragged', async ({ page }) => {
    await page.getByTestId('toggle-preserve-aspect-ratio').check();

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();
    const startRatio = before!.width / before!.height;

    const handle = item.locator('.vue-resize-hint--e');
    await handle.hover();
    await page.mouse.down();
    const handleBox = await handle.boundingBox();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2 + 150, handleBox!.y + handleBox!.height / 2, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await item.boundingBox())!.width).toBeGreaterThan(before!.width);
    const after = await item.boundingBox();
    // Height should have grown too, even though only the right (width-only)
    // edge was dragged — and the resulting ratio should still be close to
    // the original, not left unchanged the way a non-aspect-locked resize
    // would (which would only grow width, changing the ratio outright).
    expect(after!.height).toBeGreaterThan(before!.height);
    const afterRatio = after!.width / after!.height;
    expect(Math.abs(afterRatio - startRatio)).toBeLessThan(0.35);
  });

  test('setting isResizable to false via the tri-state select removes every resize-hint span', async ({ page }) => {
    await page.getByTestId('select-is-resizable').selectOption(`false`);

    const item = page.getByTestId('grid-item-0');
    await expect(item).not.toHaveClass(/vue-resizable/);
    for (const edgeClass of [`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`]) {
      await expect(item.locator(`.vue-resize-hint--${edgeClass}`)).toHaveCount(0);
    }
  });

  test('setting isDraggable to false via the tri-state select prevents movement', async ({ page }) => {
    await page.getByTestId('select-is-draggable').selectOption(`false`);

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    const box = (await item.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2 + 60, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const after = await item.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);
  });

  test('dragIgnoreFrom prevents a drag from starting on the inner button, but the item itself still drags', async ({ page }) => {
    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    const button = item.locator(`.item-inner-button`);
    await button.hover();
    await page.mouse.down();
    const buttonBox = await button.boundingBox();
    await page.mouse.move(buttonBox!.x + 100, buttonBox!.y + 60, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const afterIgnoredDrag = await item.boundingBox();
    expect(afterIgnoredDrag!.x).toBeCloseTo(before!.x, 0);
    expect(afterIgnoredDrag!.y).toBeCloseTo(before!.y, 0);

    // The item itself (outside the ignored button) should still drag
    // normally — dragIgnoreFrom excludes one specific descendant, not
    // the whole item. Clicking a point in the item's lower area, clear
    // of both the inner button (near the top, inline with the "Item X"
    // text) and any resize-hint span at the edges/corners.
    const box = (await item.boundingBox())!;
    const clickX = box.x + box.width * 0.3;
    const clickY = box.y + box.height * 0.75;
    await page.mouse.move(clickX, clickY);
    await page.mouse.down();
    await page.mouse.move(clickX + 100, clickY + 30, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await item.boundingBox())!.x).toBeGreaterThan(before!.x);
  });

  test('dragAllowFrom set to a button handle works even with the default dragIgnoreFrom="a, button" still in place', async ({ page }) => {
    // Regression test for a real bug: dragIgnoreFrom's default value
    // ("a, button") used to be checked unconditionally, before
    // dragAllowFrom — so restricting dragging to a specific handle via
    // dragAllowFrom silently didn't work if that handle happened to be
    // a <button>, with no error at all. This broke the library's own
    // exported CustomDragElement component out of the box, since its
    // handle is a <button> internally. See docs/REFACTORING.md.
    await page.getByTestId('input-drag-allow-from').fill('.item-inner-button');

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    const button = item.locator('.item-inner-button');
    await button.hover();
    await page.mouse.down();
    const buttonBox = await button.boundingBox();
    await page.mouse.move(buttonBox!.x + 100, buttonBox!.y + 60, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await item.boundingBox())!.x).toBeGreaterThan(before!.x);
  });

  test('autoScroll actually scrolls the scroll area when dragging item "0" toward its bottom edge', async ({ page }) => {
    // Every other autoScroll test in this project (unit and e2e alike)
    // only verifies that starting/stopping it doesn't throw, or checks
    // the isolated tick/edge-proximity math with fake timers — this is
    // the one place a real drag, in a real browser, against a real
    // scrollable container, confirms it actually scrolls.
    await page.getByTestId('toggle-auto-scroll').check();

    const scrollArea = page.getByTestId('item-overrides-scroll-area');
    const scrollTopBefore = await scrollArea.evaluate((el) => el.scrollTop);
    expect(scrollTopBefore).toBe(0);

    const item = page.getByTestId('grid-item-0');
    const box = await stableBoundingBox(item);
    expect(box).not.toBeNull();
    const scrollAreaBox = (await scrollArea.boundingBox())!;

    // Drag toward the scroll area's own bottom edge and hold there —
    // autoScroll's own tick loop should keep scrolling for as long as
    // the pointer stays near the edge, not just once.
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2, scrollAreaBox.y + scrollAreaBox.height - 5, { steps: 10 });
    await page.waitForTimeout(600);
    await page.mouse.up();

    const scrollTopAfter = await scrollArea.evaluate((el) => el.scrollTop);
    expect(scrollTopAfter).toBeGreaterThan(scrollTopBefore);
  });

  test('resizeIgnoreFrom matching a specific resize-hint class disables just that handle', async ({ page }) => {
    await page.getByTestId('input-resize-ignore-from').fill(`.vue-resize-hint--se`);

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    const seHandle = item.locator('.vue-resize-hint--se');
    await seHandle.hover();
    await page.mouse.down();
    const seBox = await seHandle.boundingBox();
    await page.mouse.move(seBox!.x + seBox!.width / 2 + 100, seBox!.y + seBox!.height / 2 + 60, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const afterIgnored = await item.boundingBox();
    expect(afterIgnored!.width).toBe(before!.width);
    expect(afterIgnored!.height).toBe(before!.height);

    // A different handle, not matched by resizeIgnoreFrom, should still work.
    const sHandle = item.locator('.vue-resize-hint--s');
    await sHandle.hover();
    await page.mouse.down();
    const sBox = await sHandle.boundingBox();
    await page.mouse.move(sBox!.x + sBox!.width / 2, sBox!.y + sBox!.height / 2 + 60, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await item.boundingBox())!.height).toBeGreaterThan(before!.height);
  });
});
