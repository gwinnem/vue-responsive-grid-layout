import { expect, test } from '@playwright/test';
import { stableBoundingBox } from './helpers';

test.describe('Drag & resize', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-drag-resize').click();
    // The view switch mounts a fresh GridLayout/GridItem tree — the
    // native drag/resize engine's setup (GridItem.vue's onMounted, see
    // docs/REFACTORING.md #38) needs a moment after that to actually attach.
    // Without this, a test's first mouse gesture can race ahead of that
    // setup completing and simply do nothing, which looks exactly like a
    // real drag/resize regression but is actually the test starting too
    // soon. Waiting for the class that setup applies is a deterministic
    // signal that setup has actually finished, unlike a fixed timeout.
    await expect(page.getByTestId('grid-item-0')).toHaveClass(/vue-draggable/);
  });

  test('dragging an item moves it and logs drag events', async ({ page }) => {
    // compactType=VERTICAL (the default) actively removes vertical gaps —
    // dragging an item down into otherwise-empty space is *supposed* to
    // snap back up once compaction runs after the drop, since there's
    // nothing left for it to be a gap above. A diagonal drag's vertical
    // component fighting that compaction (rather than testing horizontal
    // movement, which compaction doesn't touch) was masking whether
    // dragging worked at all. Setting it to NONE here tests movement on
    // its own terms.
    await page.getByTestId('select-compact-type').selectOption('none');

    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(before!.x + before!.width / 2 + 220, before!.y + before!.height / 2 + 120, { steps: 12 });
    await page.mouse.up();

    // A drag commits its final position via an emit()/eventBus round trip
    // through the parent GridLayout, back down as a prop change, which is
    // async relative to the synchronous mouse-event sequence above —
    // expect.poll retries the read until Vue's render actually catches up,
    // rather than risking a single immediate boundingBox() call capturing
    // whatever the DOM happened to have painted a frame earlier.
    await expect.poll(async () => (await item.boundingBox())!.x).not.toBeCloseTo(before!.x, 0);

    await expect(page.getByTestId('event-log')).toContainText('dragend');
  });

  test('a static item has a permanently lower z-index, so a dragged item stays visible above it', async ({ page }) => {
    // Regression test for a real, reported bug: dragging item "A" over
    // a static item should keep "A" visible on top, not hidden behind
    // it. The natural fix — reactively toggling z-index on the dragged
    // item itself, tied to isDragging — was tried and reverted: it
    // silently released the browser's own pointer capture mid-gesture
    // (verified via the drag's own event trace: a single dragmove
    // followed immediately by a malformed dragend at stale
    // coordinates, instead of a normal run of dragmoves). Since
    // isStatic never toggles mid-gesture, giving static items a
    // permanently lower z-index instead achieves the same visual
    // result without ever mutating a stacking-related property on the
    // element actually holding pointer capture. See
    // docs/REFACTORING.md #84.
    await page.getByTestId('nav-cross-grid').click();

    const dragged = page.getByTestId('grid-item-A');
    const locked = page.getByTestId('grid-item-locked');

    const draggedZ = await dragged.evaluate((el) => getComputedStyle(el).zIndex);
    const lockedZ = await locked.evaluate((el) => getComputedStyle(el).zIndex);

    expect(Number(lockedZ)).toBeLessThan(0);
    // "auto" doesn't parse to a number, but any non-negative resolved
    // value (including "auto") still paints above a negative one.
    expect(draggedZ === `auto` || Number(draggedZ) > Number(lockedZ)).toBe(true);
  });

  test('a static item stays visually paintable even when the grid container has its own background', async ({ page }) => {
    // Regression test for a real, reported bug: the previous test only
    // checks the *computed z-index value* (-1), which stayed correct
    // the whole time this bug was present — the actual symptom was a
    // static item painting fully invisible behind any background the
    // consumer put directly on `.vue-grid-layout` (a reasonable, common
    // thing to do — VitePress's own example docs do exactly this).
    // Root cause: `.vue-grid-layout` had `position: relative` but no
    // `z-index`/`isolation` of its own, so it never established a
    // stacking context — meaning a `-1` child's paint order escaped to
    // compete with the *entire page's* stacking order instead of just
    // this element's own background. `isolation: isolate` fixes it by
    // giving `.vue-grid-layout` its own stacking context, so its own
    // background (however a consumer sets it) always paints behind
    // every child regardless of that child's own z-index. Checked via
    // `elementFromPoint` at the static item's own center — the real
    // question ("what actually paints there") rather than trusting a
    // computed style value that stayed correct throughout the bug.
    await page.getByTestId('nav-cross-grid').click();

    const grid = page.locator('.vue-grid-layout').first();
    await grid.evaluate((el) => {
      (el as HTMLElement).style.background = 'red';
    });

    const locked = page.getByTestId('grid-item-locked');
    const box = await locked.boundingBox();
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;

    const paintedTag = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest('[data-testid="grid-item-locked"]') ? `static-item` : (el?.className ?? `unknown`);
    }, { x: centerX, y: centerY });

    expect(paintedTag).toBe(`static-item`);
  });

  test('cross-grid drop lands in a gap above a static item, not pushed below it (bin-pack, not push-and-compact)', async ({ page }) => {
    // Regression test for a real, reported bug: dropping an item back
    // into a grid where a static item sits in the same column, below
    // an actual gap, used to land the dropped item pushed down against
    // the static item's own bottom edge instead of in the gap above
    // it. Root cause: `useCrossGridDrag.ts`'s own `acceptDrop` placed
    // the dropped item at a hardcoded `{ x: 0, y: 999 }` and relied on
    // vertical compaction to settle it — but plain vertical compaction
    // only ever moves an item straight up *within its own column*, and
    // can't jump over a static obstacle in that column to reach a gap
    // further up. Fixed to use `findFirstFitSlot` (a real first-fit
    // bin-pack) instead. This demo's own layout already has the right
    // shape for it: `A` (y:0) and `locked` (static, y:2) share column
    // x:0 — dragging `A` out then back in used to land it at y:2
    // (pushed against `locked`'s own top... no, its own bottom edge,
    // past it) instead of back at y:0.
    await page.getByTestId('nav-cross-grid').click();

    const itemA = page.getByTestId('grid-item-A');
    await itemA.hover();
    await page.waitForTimeout(200);
    const boxA = await itemA.boundingBox();
    const rightGrid = page.getByTestId('cross-grid-right');
    const rightBox = await rightGrid.boundingBox();

    await page.mouse.down();
    await page.mouse.move(boxA!.x + boxA!.width / 2 + 30, boxA!.y + boxA!.height / 2, { steps: 5 });
    await page.mouse.move(rightBox!.x + rightBox!.width / 2, rightBox!.y + 40, { steps: 15 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(400);

    const itemAInRight = page.getByTestId('grid-item-A');
    await itemAInRight.hover();
    await page.waitForTimeout(200);
    const boxA2 = await itemAInRight.boundingBox();
    const leftGrid = page.getByTestId('cross-grid-left');
    const leftBox = await leftGrid.boundingBox();

    await page.mouse.down();
    await page.mouse.move(boxA2!.x + boxA2!.width / 2 + 30, boxA2!.y + boxA2!.height / 2, { steps: 5 });
    await page.mouse.move(leftBox!.x + 40, leftBox!.y + 20, { steps: 15 });
    await page.waitForTimeout(200);
    await page.mouse.up();
    await page.waitForTimeout(400);

    // "A" should be back at the top of the left grid (y near the
    // original top), well above "locked" — not pushed below it.
    const finalA = page.getByTestId('grid-item-A');
    const finalLocked = page.getByTestId('grid-item-locked');
    const finalABox = await finalA.boundingBox();
    const finalLockedBox = await finalLocked.boundingBox();

    expect(finalABox!.y).toBeLessThan(finalLockedBox!.y);
  });

  test('a dragged item stays visually paintable above a sibling grid it is currently being dragged over, during a cross-grid drag', async ({ page }) => {
    // Regression test for a real, reported bug: `isolation: isolate`
    // on `.vue-grid-layout` (a real, separate fix — see the static-item
    // paint-order test above for why it's needed) had a side effect
    // nobody had tested for: it makes every grid its own stacking
    // context, so two sibling grids with no z-index of their own stack
    // purely by DOM order. During a cross-grid drag, the dragged item
    // stays a DOM child of its own *source* grid the whole time — so
    // once the pointer moved over the *target* grid (which renders
    // later in the DOM, in the standard side-by-side layout every
    // cross-grid example uses), the dragged item visually disappeared
    // behind the target grid's own background, confirmed directly by
    // screenshot before this test existed. Fixed by bumping the
    // source grid's own z-index (via a class bound to `isDragging`,
    // already tracked for the placeholder) only while a drag is
    // actually in progress within it.
    await page.getByTestId('nav-cross-grid').click();

    const itemA = page.getByTestId('grid-item-A');
    await itemA.hover();
    await page.waitForTimeout(200);
    const boxA = await itemA.boundingBox();
    const rightGrid = page.getByTestId('cross-grid-right');
    const rightBox = await rightGrid.boundingBox();

    await page.mouse.down();
    await page.mouse.move(boxA!.x + boxA!.width / 2 + 30, boxA!.y + boxA!.height / 2, { steps: 5 });
    await page.mouse.move(rightBox!.x + rightBox!.width / 2, rightBox!.y + 40, { steps: 15 });
    await page.waitForTimeout(300);

    // The dragged item's own center, in the middle of the target grid's
    // own bounds by this point — the real question is what actually
    // paints there, not a computed z-index value that stayed correct
    // throughout the original bug.
    const draggedItem = page.getByTestId('grid-item-A');
    const draggedBox = await draggedItem.boundingBox();
    const centerX = draggedBox!.x + draggedBox!.width / 2;
    const centerY = draggedBox!.y + draggedBox!.height / 2;

    const paintedTag = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest('[data-testid="grid-item-A"]') ? `dragged-item` : (el?.className ?? `unknown`);
    }, { x: centerX, y: centerY });

    await page.mouse.up();
    await page.waitForTimeout(300);

    expect(paintedTag).toBe(`dragged-item`);
  });

  test('the close button actually removes the item once toggled on, including after toggling edit mode off and back on', async ({ page }) => {
    // Regression test for a real, reported bug: showCloseButton had a
    // working test toggle here and the button rendered and was
    // genuinely clickable once on, but nothing was listening for
    // `@remove-grid-item` at all — clicking it silently did nothing.
    // Confirmed directly: the click handler fired every time,
    // correctly gated on edit mode being on (verified via temporary
    // logging), but the item was never actually removed from the
    // layout, since there was no listener to do that removal.
    // Reported as "edit mode toggle — delete button test."
    await page.getByTestId('toggle-close-button').check();

    const item0 = page.getByTestId('grid-item-0');
    const closeBtn = item0.locator('.btn-close');
    await expect(closeBtn).toBeVisible();

    // Toggling edit mode off and back on shouldn't affect whether the
    // close button actually works once it's showing again.
    await page.getByTestId('toggle-edit-mode').uncheck();
    await page.getByTestId('toggle-edit-mode').check();
    await expect(closeBtn).toBeVisible();

    const itemCountBefore = await page.locator('[data-testid^="grid-item-"]').count();
    await closeBtn.click();

    await expect.poll(async () => page.locator('[data-testid^="grid-item-"]').count()).toBe(itemCountBefore - 1);
    await expect(item0).toHaveCount(0);
  });

  test('compactType HORIZONTAL settles a dropped item leftward, not just vertically', async ({ page }) => {
    // New capability: this project previously only had a boolean
    // verticalCompact — no horizontal compaction existed at all. Select
    // it here and drag item "1" into an otherwise-empty row, away from
    // the left edge; horizontal compaction should pull it back toward
    // x:0 after the drop, the same way vertical compaction pulls a
    // dropped item flush to the top of a gap.
    await page.getByTestId('select-compact-type').selectOption('horizontal');

    const item = page.getByTestId('grid-item-1');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    // Drag down into a fresh, otherwise-empty row, offset to the right
    // so a real leftward compaction is observable.
    await item.hover();
    await page.mouse.down();
    await page.mouse.move(before!.x + 150, before!.y + 300, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(300);

    const after = await item.boundingBox();
    expect(after).not.toBeNull();
    expect(after!.x).toBeLessThan(before!.x + 150);
  });

  test('disabling "draggable" prevents movement', async ({ page }) => {
    await page.getByTestId('toggle-draggable').uncheck();

    const item = page.getByTestId('grid-item-1');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
    await page.mouse.down();
    await page.mouse.move(before!.x + 200, before!.y + 100, { steps: 10 });
    await page.mouse.up();
    // Nothing should be pending to settle here at all (draggable is off,
    // so no drag should have started), but wait the same way the other
    // tests do for consistency rather than asserting on the very next
    // event-loop tick.
    await page.waitForTimeout(200);

    const after = await item.boundingBox();
    expect(after!.x).toBeCloseTo(before!.x, 0);
    expect(after!.y).toBeCloseTo(before!.y, 0);
  });

  test('resizing from the bottom edge changes the item height', async ({ page }) => {
    // grid-item-0, not grid-item-2: the demo's default layout places item
    // 2 at x:8, w:4 with colNum:12 — already flush against the grid's
    // right boundary, with no room to grow further right at all.
    const item = page.getByTestId('grid-item-0');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    // The native resize engine's own hit target is the dedicated
    // `.vue-resize-hint--s` span itself, not a margin-based proximity
    // zone around the item's edge the way interact.js used to work.
    // Using `.hover()` to get there rather than computing a coordinate
    // from a `boundingBox()` snapshot taken beforehand: this item's own
    // `:hover` CSS rule adds a 1px border, shifting the handle's actual
    // position slightly between that snapshot and whenever the pointer
    // physically arrives — `.hover()` (unlike a manually-computed
    // `page.mouse.move()`) re-resolves the target's position immediately
    // before moving there, so it isn't thrown off by that shift.
    const handle = item.locator('.vue-resize-hint--s');
    await handle.hover();
    await page.mouse.down();
    const handleBox = await handle.boundingBox();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2 + 100, { steps: 15 });
    await page.mouse.up();

    // Same async-commit race as the drag test above, for resize.
    await expect.poll(async () => (await item.boundingBox())!.height).toBeGreaterThan(before!.height);
    const after = await item.boundingBox();
    expect(after!.width).toBe(before!.width);
  });

  test('resizing from the left edge grows the item and moves it left (docs/REFACTORING.md #25)', async ({ page }) => {
    // Left/top-edge resizing was previously a non-functional stub — this
    // is the e2e-level regression test for that fix, complementing the
    // unit-level directional tests in tests/GridItem.spec.ts.
    //
    // grid-item-1 (not grid-item-2): it has room to grow left into
    // grid-item-0's space without also being pushed around vertically —
    // see docs/REFACTORING.md #41's open follow-up about an unexplained Y
    // shift observed resizing grid-item-2 specifically, immediately
    // adjacent to grid-item-1 on one side and the container edge on the
    // other. Using an item with clearer room on both sides avoids
    // conflating that unresolved question with this test's own intent.
    const item = page.getByTestId('grid-item-1');
    const before = await stableBoundingBox(item);
    expect(before).not.toBeNull();

    // Same rationale as the bottom-edge test above — `.hover()` first,
    // not a manually-computed coordinate, so the 1px hover-border shift
    // doesn't throw off the click point on this small (10px-wide) target.
    const handle = item.locator('.vue-resize-hint--w');
    await handle.hover();
    await page.mouse.down();
    const handleBox = await handle.boundingBox();
    const startX = handleBox!.x + handleBox!.width / 2;
    const startY = handleBox!.y + handleBox!.height / 2;
    // Drag left, growing the item and pulling its left edge (and so its x
    // position) further left.
    await page.mouse.move(startX - 100, startY, { steps: 15 });
    await page.mouse.up();

    await expect.poll(async () => (await item.boundingBox())!.width).toBeGreaterThan(before!.width);
    const after = await item.boundingBox();
    expect(after!.x).toBeLessThan(before!.x);
  });

  test('clearing the log empties the event list', async ({ page }) => {
    const item = page.getByTestId('grid-item-0');
    const box = await item.boundingBox();
    await page.mouse.move(box!.x + 10, box!.y + 10);
    await page.mouse.down();
    await page.mouse.move(box!.x + 60, box!.y + 40, { steps: 5 });
    await page.mouse.up();

    await expect(page.getByTestId('event-log')).not.toBeEmpty();
    await page.getByTestId('clear-log').click();
    await expect(page.getByTestId('event-log')).toBeEmpty();
  });

  test('margin (horizontal) sets the actual pixel gap between two horizontally-adjacent items', async ({ page }) => {
    // Items "0" and "1" sit in the same row, item "0" ending exactly
    // where item "1" begins (x:4, x:4) — the real gap between their
    // rendered boxes should equal marginH's own pixel value directly,
    // not some derived/approximate spacing.
    const marginInput = page.getByTestId('input-margin-h');
    await marginInput.fill('30');
    await marginInput.blur();
    await page.waitForTimeout(300);

    const item0 = await stableBoundingBox(page.getByTestId('grid-item-0'));
    const item1 = await page.getByTestId('grid-item-1').boundingBox();
    expect(item0).not.toBeNull();
    expect(item1).not.toBeNull();

    const gap = item1!.x - (item0!.x + item0!.width);
    expect(gap).toBeCloseTo(30, 0);
  });

  test('margin (vertical) is independent of horizontal margin, and affects the grid container height', async ({ page }) => {
    // Setting marginH and marginV to different values confirms the two
    // axes are genuinely independent (not, say, a single shared margin
    // value silently applied to both) — the container's own height
    // formula (bottomY * (rowHeight + marginV) + marginV, for this
    // view's single-row, h:2 layout: bottomY resolves to 2) isolates
    // marginV's own effect without needing to drag anything into a
    // second row to measure a vertical gap directly.
    const marginHInput = page.getByTestId('input-margin-h');
    const marginVInput = page.getByTestId('input-margin-v');
    await marginHInput.fill('5');
    await marginHInput.blur();
    await marginVInput.fill('5');
    await marginVInput.blur();
    await page.waitForTimeout(300);

    const grid = page.getByTestId('drag-resize-grid');
    const heightBefore = (await grid.boundingBox())!.height;

    await marginVInput.fill('40');
    await marginVInput.blur();
    await page.waitForTimeout(300);
    const heightAfter = (await grid.boundingBox())!.height;

    // Container height = bottomY * (rowHeight + marginV) + marginV
    // (see GridLayout.vue's own updateHeight()) — for this view's
    // single-row, h:2 layout, bottomY is 2, so a marginV delta of 35
    // affects height twice via the multiplied term and once more via
    // the standalone `+ marginV` term: 3 * 35 = 105px taller.
    expect(heightAfter - heightBefore).toBeCloseTo(105, 0);
  });

  test('RTL: the live visual during an in-progress resize correctly moves the mirrored anchor edge, not the other one', async ({ page }) => {
    // Real, previously-untested gap: GridItem.vue's own createStyle()
    // reads `renderRtl.value` to decide whether the live-resize visual
    // (during isResizing specifically, not just the final committed
    // position at resizeend) should update `pos.right` or `pos.left`
    // from `resizing.value`. In RTL, the mirrored anchor is the right
    // edge (screen-space) rather than the left — dragging that edge
    // should move its own position while the *left* edge stays fixed,
    // the reverse of LTR. No e2e test exercised RTL combined with an
    // in-progress resize at all before this one — everything else
    // either tested RTL's static positioning or LTR's resize direction,
    // never both together, and never mid-drag specifically (only the
    // post-resizeend committed position).
    await page.getByTestId('toggle-mirrored').check();
    await page.waitForTimeout(300);

    const item = page.getByTestId('grid-item-1');
    const before = await item.boundingBox();

    const eHandle = item.locator('.vue-resize-hint--e');
    const handleBox = await eHandle.boundingBox();

    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x - 80, handleBox!.y + handleBox!.height / 2, { steps: 10 });
    await page.waitForTimeout(200);

    // Mid-drag, not after mouse.up() — this is specifically checking
    // the live visual driven by `resizing.value`, distinct from the
    // committed grid-unit position `resizeend` produces.
    const midDrag = await item.boundingBox();

    await page.mouse.up();
    await page.waitForTimeout(200);

    expect(midDrag!.x).toBeCloseTo(before!.x, 0);
    expect(midDrag!.width).toBeLessThan(before!.width);
  });
});
