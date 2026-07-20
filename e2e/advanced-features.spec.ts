import { expect, test } from '@playwright/test';
import { stableBoundingBox } from './helpers';

test.describe('Layout tools & feedback (edge cases)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-advanced-features').click();
    // Waiting for the grid container itself isn't enough — it's visible
    // (an empty box) before its GridItem children have actually rendered
    // and been positioned. Waiting for a specific item's own
    // vue-draggable class (same signal drag-and-resize.spec.ts already
    // relies on) is what actually confirms interact.js's setup — and so
    // the item's real position — is in place.
    await expect(page.getByTestId('grid-item-0')).toHaveClass(/vue-draggable/);
  });

  test('dragging item "0" onto the static "wall" item is blocked when preventCollision is on, and fires the feedback event', async ({ page }) => {
    await page.getByTestId('toggle-prevent-collision').check();

    const item = page.getByTestId('grid-item-0');
    const wall = page.getByTestId('grid-item-wall');
    const itemBefore = await stableBoundingBox(item);
    const wallBox = await stableBoundingBox(wall);
    expect(itemBefore).not.toBeNull();
    expect(wallBox).not.toBeNull();

    // Drag item "0" directly on top of the static "wall" item.
    await page.mouse.move(itemBefore!.x + itemBefore!.width / 2, itemBefore!.y + itemBefore!.height / 2);
    await page.mouse.down();
    await page.mouse.move(wallBox!.x + wallBox!.width / 2, wallBox!.y + wallBox!.height / 2, { steps: 12 });
    await page.mouse.up();

    // Blocked — item "0" should not have actually landed on the wall's position.
    await page.waitForTimeout(300);
    const itemAfter = await item.boundingBox();
    expect(itemAfter!.x).not.toBeCloseTo(wallBox!.x, 0);

    // The MOVE_BLOCKED_BY_COLLISION feedback event fired at least once,
    // surfaced in this demo as a running count.
    await expect(page.getByTestId('blocked-feedback')).toContainText('last: "0"');
    await expect(page.getByTestId('blocked-feedback')).not.toContainText('Blocked moves: 0');
  });

  test('compactor prop: a custom compactor replaces the built-in logic entirely — items settle downward instead of up', async ({ page }) => {
    await page.getByTestId('toggle-custom-compactor').check();

    const item0 = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item0);
    expect(before).not.toBeNull();

    await page.getByTestId('compact-now').click();

    // The built-in compactor would leave item "0" exactly where it is
    // (already at y:0, nothing above it to close a gap toward) — the
    // custom "downward" compactor should instead push it down toward
    // the grid's lower bound, a clearly different, only-explicable-by-
    // the-custom-compactor-actually-running outcome.
    await expect.poll(async () => (await item0.boundingBox())!.y).toBeGreaterThan(before!.y);
  });

  test('undo()/redo(): dragging an item, then undo, restores its pre-drag position; redo restores the drag', async ({ page }) => {
    const item0 = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item0);
    expect(before).not.toBeNull();

    await expect(page.getByTestId('undo-button')).toBeDisabled();

    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(before!.x + before!.width / 2 + 150, before!.y + before!.height / 2, { steps: 12 });
    await page.mouse.up();

    await expect.poll(async () => (await item0.boundingBox())!.x).toBeGreaterThan(before!.x);
    const afterDrag = await stableBoundingBox(item0);
    expect(afterDrag).not.toBeNull();

    await expect(page.getByTestId('undo-button')).toBeEnabled();
    await page.getByTestId('undo-button').click();

    await expect.poll(async () => (await item0.boundingBox())!.x).toBeCloseTo(before!.x, 0);

    await expect(page.getByTestId('redo-button')).toBeEnabled();
    await page.getByTestId('redo-button').click();

    await expect.poll(async () => (await item0.boundingBox())!.x).toBeCloseTo(afterDrag!.x, 0);
    await expect(page.getByTestId('redo-button')).toBeDisabled();
  });

  test('compactNow() re-packs a layout that drifted apart with compactType set to NONE', async ({ page }) => {
    // This view already sets compact-type="none", so dragging item
    // "growable" further down leaves a gap above it rather than snapping
    // back automatically — exactly the scenario compactNow() exists for.
    // It starts well below the fold (y:6 in grid units, with rows 2-5
    // deliberately empty above it) and needs room to be dragged another
    // 200px down without going off-screen mid-drag — a taller viewport
    // for this test specifically, rather than scrollIntoViewIfNeeded(),
    // since the drag's own endpoint needs to stay on-screen throughout,
    // not just its starting point.
    await page.setViewportSize({ width: 1280, height: 1400 });
    const growable = page.getByTestId('grid-item-growable');
    const before = await stableBoundingBox(growable);
    expect(before).not.toBeNull();

    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2 + 200, { steps: 12 });
    await page.mouse.up();

    await expect.poll(async () => (await growable.boundingBox())!.y).toBeGreaterThan(before!.y);
    const scattered = await growable.boundingBox();

    await page.getByTestId('compact-now').click();

    // compactNow() should pull it back up, closer to (or at) its
    // original, pre-drag position — not left scattered where the drag
    // dropped it.
    await expect.poll(async () => (await growable.boundingBox())!.y).toBeLessThan(scattered!.y);
  });

  test('duplicateItem adds a new item with a "-copy" suffixed id', async ({ page }) => {
    const grid = page.getByTestId('advanced-features-grid');
    const initialCount = await grid.locator('.vue-grid-item').count();

    await page.getByTestId('duplicate-item').click();

    await expect(grid.locator('.vue-grid-item')).toHaveCount(initialCount + 1);
    await expect(page.getByTestId('grid-item-0-copy')).toBeVisible();
  });

  test('snapToGrid magnetically aligns a dragged item with another item\'s edge', async ({ page }) => {
    await page.getByTestId('toggle-snap-to-grid').check();

    // Drag item "0" (x:0,w:2) toward x:4 — close to, but not exactly at,
    // the static "wall" item's left edge (also x:4) — snapToGrid should
    // pull it into exact alignment rather than leaving it wherever the
    // pointer happened to land.
    const item = page.getByTestId('grid-item-0');
    const wall = page.getByTestId('grid-item-wall');
    const itemBefore = await stableBoundingBox(item);
    const wallBox = await stableBoundingBox(wall);
    expect(itemBefore).not.toBeNull();
    expect(wallBox).not.toBeNull();

    await page.mouse.move(itemBefore!.x + itemBefore!.width / 2, itemBefore!.y + itemBefore!.height / 2);
    await page.mouse.down();
    // The drag was grabbed at the item's own center, so the mouse
    // position maps to where that center lands — not the item's left
    // edge. To land the item's left edge a few pixels short of the
    // wall's own left edge (within snapThreshold's default of 1 grid
    // unit), the mouse itself needs to move to wallBox.x + half the
    // item's own width + a few px, not wallBox.x directly.
    await page.mouse.move(wallBox!.x + itemBefore!.width / 2 + 5, itemBefore!.y + itemBefore!.height / 2, { steps: 12 });
    await page.mouse.up();

    await page.waitForTimeout(300);
    const itemAfter = await item.boundingBox();
    // Snapped to exact alignment with the wall's own left edge, not just
    // "close" to where the pointer released.
    expect(itemAfter!.x).toBeCloseTo(wallBox!.x, 0);
  });

  test('saving and loading a named preset restores a previous layout', async ({ page }) => {
    await page.getByTestId('save-preset-compact').click();
    await expect(page.getByTestId('load-preset-compact')).toBeVisible();

    // Change the layout (duplicate an item, changing the item count).
    await page.getByTestId('duplicate-item').click();
    const grid = page.getByTestId('advanced-features-grid');
    const changedCount = await grid.locator('.vue-grid-item').count();

    await page.getByTestId('load-preset-compact').click();

    // Back to the count the "compact" preset was saved with (one fewer
    // than after duplicating).
    await expect(grid.locator('.vue-grid-item')).toHaveCount(changedCount - 1);
  });

  test('multiSelect: clicking an item selects it, shown in the selected-items feedback', async ({ page }) => {
    await page.getByTestId('toggle-multi-select').check();

    await page.getByTestId('grid-item-0').click();

    await expect(page.getByTestId('selected-items-feedback')).toContainText('Selected: 0');
  });

  test('multiSelect: Shift+click adds to the selection additively', async ({ page }) => {
    await page.getByTestId('toggle-multi-select').check();

    await page.getByTestId('grid-item-0').click();
    await page.getByTestId('grid-item-growable').click({ modifiers: [`Shift`] });

    const feedback = await page.getByTestId('selected-items-feedback').textContent();
    expect(feedback).toContain('0');
    expect(feedback).toContain('growable');
  });

  test('multiSelect: clicking empty grid background clears the selection', async ({ page }) => {
    await page.getByTestId('toggle-multi-select').check();

    await page.getByTestId('grid-item-0').click();
    await expect(page.getByTestId('selected-items-feedback')).toContainText('Selected: 0');

    // Click well to the right of "wall" (x:4,w:2 of 12 columns), in the
    // same row as "wall"/"0" — reliably empty grid space, and not below
    // the fold the way growable's own position is, unlike guessing at
    // the wrap div's own bottom-right corner (which risks landing on or
    // right at an item's edge, and did in an earlier version of this
    // test).
    const wall = page.getByTestId('grid-item-wall');
    const wallBox = await wall.boundingBox();
    expect(wallBox).not.toBeNull();
    await page.mouse.click(wallBox!.x + wallBox!.width + 100, wallBox!.y + wallBox!.height / 2);

    await expect(page.getByTestId('selected-items-feedback')).toContainText('Selected: none');
  });

  test('multiSelect: dragging a selected item moves every other selected item by the same delta (group move)', async ({ page }) => {
    // A taller viewport so "growable" (far below the fold in this
    // view's default layout) and item "0" (near the top) are both
    // visible without scrolling — needed since the drag gesture below
    // uses manual page.mouse coordinates for item "0", which would be
    // invalid if a prior .click() on "growable" (which auto-scrolls)
    // had scrolled item "0" out of view first.
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.getByTestId('toggle-multi-select').check();

    await page.getByTestId('grid-item-0').click();
    await page.getByTestId('grid-item-growable').click({ modifiers: [`Shift`] });
    await expect(page.getByTestId('selected-items-feedback')).toContainText('growable');

    const growable = page.getByTestId('grid-item-growable');
    const growableBefore = await stableBoundingBox(growable);
    expect(growableBefore).not.toBeNull();

    const item0 = page.getByTestId('grid-item-0');
    const item0Before = await item0.boundingBox();
    expect(item0Before).not.toBeNull();

    // Drag item "0" (the anchor) down and to the right — "growable"
    // (also selected, not itself dragged) should move by roughly the
    // same amount.
    await page.mouse.move(item0Before!.x + item0Before!.width / 2, item0Before!.y + item0Before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(item0Before!.x + item0Before!.width / 2 + 100, item0Before!.y + item0Before!.height / 2 + 50, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const growableAfter = await growable.boundingBox();
    expect(growableAfter).not.toBeNull();
    // Moved by roughly the same delta as the anchor — not exact pixel
    // match (grid-unit snapping rounds both independently), but clearly
    // shifted in the same direction by a comparable amount, not left in
    // place.
    expect(growableAfter!.x).toBeGreaterThan(growableBefore!.x + 50);
    expect(growableAfter!.y).toBeGreaterThan(growableBefore!.y + 20);
  });

  test('multiSelect: resizing a selected item resizes every other selected item by the same delta (group resize)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1400 });
    await page.getByTestId('toggle-multi-select').check();

    await page.getByTestId('grid-item-0').click();
    await page.getByTestId('grid-item-growable').click({ modifiers: [`Shift`] });
    await expect(page.getByTestId('selected-items-feedback')).toContainText('growable');

    const growable = page.getByTestId('grid-item-growable');
    const growableBefore = await stableBoundingBox(growable);
    expect(growableBefore).not.toBeNull();

    const item0 = page.getByTestId('grid-item-0');
    const seHandle = item0.locator('.vue-resize-hint--se');
    await seHandle.hover();
    await page.mouse.down();
    const seBox = await seHandle.boundingBox();
    // 100px vertical, not the original 40px — found (while fixing an
    // unrelated resizestart bug, see docs/REFACTORING.md) that 40px was
    // too marginal a distance to reliably cross a full grid-row
    // boundary at this demo's own row height, meaning this assertion
    // could pass "by accident" depending on exact pixel-to-grid-unit
    // rounding rather than a real, comfortably-past-the-threshold move.
    await page.mouse.move(seBox!.x + seBox!.width / 2 + 80, seBox!.y + seBox!.height / 2 + 100, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const growableAfter = await growable.boundingBox();
    expect(growableAfter).not.toBeNull();
    // "growable" grew in width too, even though only item "0"'s own
    // handle was dragged — the same group-transform mechanism as group
    // move above, applied to size instead of position. Its height
    // does NOT grow, though — "growable" also has autoHeight, which
    // correctly keeps its height matched to its own content regardless
    // of what group-resize applies, the same way it would override any
    // other externally-set height (see docs/REFACTORING.md's autoHeight
    // finding). Before that fix, this assertion happened to pass only
    // because autoHeight was silently non-functional — the wrapper
    // ResizeObserver never fired at all, so nothing ever corrected the
    // height back down; that bug being fixed is what makes today's
    // "doesn't grow" the actually-correct expectation.
    expect(growableAfter!.width).toBeGreaterThan(growableBefore!.width);
    expect(growableAfter!.height).toBeCloseTo(growableBefore!.height, 0);
  });

  test('custom #resize-handle slot content renders inside the resize hints', async ({ page }) => {
    const handle = page.getByTestId('custom-resize-handle').first();
    await expect(handle).toBeAttached();
  });

  test('multiSelect: a static passenger does not move during group move, even though it is selected', async ({ page }) => {
    await page.getByTestId('toggle-multi-select').check();

    const item0 = page.getByTestId('grid-item-0');
    await item0.click();
    const wall = page.getByTestId('grid-item-wall');
    await wall.click({ modifiers: ['Shift'] });

    const wallBefore = await stableBoundingBox(wall);
    expect(wallBefore).not.toBeNull();
    const item0Before = await item0.boundingBox();
    expect(item0Before).not.toBeNull();

    // Drag item "0" (the anchor, not static) — "wall" (static, also
    // selected) should not move at all, unlike the non-static
    // "growable" passenger in the group-move test above.
    await page.mouse.move(item0Before!.x + item0Before!.width / 2, item0Before!.y + item0Before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(item0Before!.x + item0Before!.width / 2 + 100, item0Before!.y + item0Before!.height / 2 + 50, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const wallAfter = await wall.boundingBox();
    expect(wallAfter!.x).toBeCloseTo(wallBefore!.x, 0);
    expect(wallAfter!.y).toBeCloseTo(wallBefore!.y, 0);
  });

  test('multiSelect: a keyboard-driven arrow-key move on a selected item moves the rest of the group too', async ({ page }) => {
    await page.getByTestId('toggle-multi-select').check();

    const item0 = page.getByTestId('grid-item-0');
    await item0.click();
    const growable = page.getByTestId('grid-item-growable');
    await growable.click({ modifiers: ['Shift'] });

    const growableBefore = await stableBoundingBox(growable);
    expect(growableBefore).not.toBeNull();

    await item0.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);

    const growableAfter = await growable.boundingBox();
    expect(growableAfter!.x).toBeGreaterThan(growableBefore!.x);
  });

  test('grid-wide enableEditMode off disables dragging for every item', async ({ page }) => {
    await page.getByTestId('toggle-enable-edit-mode').uncheck();

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(before!.x + before!.width / 2 + 100, before!.y + before!.height / 2, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const after = await item.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
  });

  test('autoHeight actually grows the item as its content grows, not just visually clip/overflow', async ({ page }) => {
    // Regression test for a real, reported bug: the "growable" item's
    // own box stayed exactly the same size no matter how much content
    // was added inside it — confirmed directly, its rendered height
    // never changed even though the actual content grew far past it.
    // Traced to `.vue-grid-item-auto-height-wrapper`'s own CSS:
    // `height: 100%` constrained the wrapper — the element autoSize()
    // measures, and the one the ResizeObserver watches — to exactly the
    // parent GridItem's current fixed height, so it could never
    // actually grow past that regardless of content, and its own
    // bounding rect never changed either. Both the automatic
    // ResizeObserver-driven resize and any manually invoked autoSize()
    // call were reading the same wrong, unchanging number. Reported as
    // "Per-item autoHeight — container height." See
    // docs/REFACTORING.md.
    const item = page.getByTestId('grid-item-growable');
    const boxBefore = await item.boundingBox();

    const growButton = page.getByTestId('grow-content');
    for (let i = 0; i < 15; i++) {
      await growButton.click();
    }
    await page.waitForTimeout(300);

    const boxAfter = await item.boundingBox();
    expect(boxAfter!.height).toBeGreaterThan(boxBefore!.height);
  });

  test('showGridLines toggle renders visible column/row gridlines behind the items', async ({ page }) => {
    // Added a showGridLines toggle to this demo (and the equivalent
    // VitePress snap-to-grid example) — neither had one, so there was
    // no way to visually see the grid's own column/row boundaries
    // while testing snapToGrid against them. Reported as "snap to
    // grid — show gridlines." showGridLines itself was already a
    // real, working library feature (used elsewhere) — this was a
    // missing-control gap, not a bug in the feature itself.
    const grid = page.getByTestId('advanced-features-grid');
    const bgBefore = await grid.evaluate((el) => getComputedStyle(el, `::before`).backgroundImage);
    expect(bgBefore).toBe(`none`);

    await page.getByTestId('toggle-show-grid-lines').check();

    const bgAfter = await grid.evaluate((el) => getComputedStyle(el, `::before`).backgroundImage);
    expect(bgAfter).toContain(`linear-gradient`);
  });
});
