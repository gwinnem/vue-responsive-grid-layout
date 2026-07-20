import { expect, test } from '@playwright/test';

test.describe('Drag & drop from outside (multiple grids)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-external-drop').click();
    // Mirrors the wait in drag-and-resize.spec.ts's beforeEach — the view
    // switch mounts a fresh GridLayout/GridItem tree, and a mouse gesture
    // starting before that's actually attached does nothing rather than
    // failing loudly, which looks exactly like a real regression.
    await expect(page.getByTestId('grid-item-left-0')).toBeVisible();
  });

  test('dropping a widget onto the right (initially empty) grid adds it there', async ({ page }) => {
    const widget = page.getByTestId('drop-widget-a');
    const widgetBox = await widget.boundingBox();
    expect(widgetBox).not.toBeNull();

    const rightGrid = page.getByTestId('drop-grid-right');
    const rightBox = await rightGrid.boundingBox();
    expect(rightBox).not.toBeNull();

    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(rightBox!.x + rightBox!.width / 2, rightBox!.y + rightBox!.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator('[data-testid=drop-grid-right] .demo-item')).toHaveText(['A']);
    await expect(page.locator('[data-testid=drop-grid-left] .demo-item')).toHaveText(['left-0']);
  });

  test('dropping a widget onto the left grid adds it alongside the existing item', async ({ page }) => {
    const widget = page.getByTestId('drop-widget-b');
    const widgetBox = await widget.boundingBox();
    const leftGrid = page.getByTestId('drop-grid-left');
    const leftBox = await leftGrid.boundingBox();
    expect(widgetBox).not.toBeNull();
    expect(leftBox).not.toBeNull();

    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(leftBox!.x + leftBox!.width / 2, leftBox!.y + leftBox!.height - 10, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator('[data-testid=drop-grid-left] .demo-item')).toHaveText(['left-0', 'B']);
  });

  test('releasing a widget away from either grid drops nothing', async ({ page }) => {
    const widget = page.getByTestId('drop-widget-a');
    const widgetBox = await widget.boundingBox();
    expect(widgetBox).not.toBeNull();

    await widget.hover();
    await page.mouse.down();
    // Straight up, away from both grids entirely.
    await page.mouse.move(widgetBox!.x, widgetBox!.y - 300, { steps: 10 });
    await page.mouse.up();

    await expect(page.locator('[data-testid=drop-grid-left] .demo-item')).toHaveText(['left-0']);
    await expect(page.locator('[data-testid=drop-grid-right] .demo-item')).toHaveCount(0);
  });

  test('dragging from one grid\'s area to the other without dropping only leaves a preview in the last one hovered', async ({ page }) => {
    // Regression coverage for the cross-grid preview cleanup: dragging
    // from over the left grid straight to the right grid (a single
    // continuous gesture, never releasing over the left one) should
    // leave the live preview only in whichever grid the pointer is over
    // when it's finally released — not stuck behind in both.
    const widget = page.getByTestId('drop-widget-a');
    const widgetBox = await widget.boundingBox();
    const leftGrid = page.getByTestId('drop-grid-left');
    const leftBox = await leftGrid.boundingBox();
    const rightGrid = page.getByTestId('drop-grid-right');
    const rightBox = await rightGrid.boundingBox();
    expect(widgetBox).not.toBeNull();
    expect(leftBox).not.toBeNull();
    expect(rightBox).not.toBeNull();

    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(leftBox!.x + leftBox!.width / 2, leftBox!.y + leftBox!.height - 10, { steps: 8 });
    await page.mouse.move(rightBox!.x + rightBox!.width / 2, rightBox!.y + rightBox!.height / 2, { steps: 8 });
    await page.mouse.up();

    await expect(page.locator('[data-testid=drop-grid-right] .demo-item')).toHaveText(['A']);
    await expect(page.locator('[data-testid=drop-grid-left] .demo-item')).toHaveText(['left-0']);
  });

  test('reset clears both grids back to their starting layout', async ({ page }) => {
    const widget = page.getByTestId('drop-widget-a');
    const widgetBox = await widget.boundingBox();
    const rightGrid = page.getByTestId('drop-grid-right');
    const rightBox = await rightGrid.boundingBox();

    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(rightBox!.x + rightBox!.width / 2, rightBox!.y + rightBox!.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('[data-testid=drop-grid-right] .demo-item')).toHaveText(['A']);

    await page.getByTestId('reset-grids').click();

    await expect(page.locator('[data-testid=drop-grid-left] .demo-item')).toHaveText(['left-0']);
    await expect(page.locator('[data-testid=drop-grid-right] .demo-item')).toHaveCount(0);
  });

  test('dragging an existing item already in one grid moves it into the other grid, not just new items from the palette', async ({ page }) => {
    // Regression coverage: both grids also set allowCrossGridDrag
    // alongside allowOutsideDrop — a separate, independent mechanism
    // from the outside-drop palette above them. Without it, an item
    // already placed in grid 1 just stays confined there when dragged
    // toward grid 2, which looks exactly like "not being removed from
    // grid 1" from the outside. See docs/REFACTORING.md #49.
    const item = page.getByTestId('grid-item-left-0');
    const itemBox = await item.boundingBox();
    const rightGrid = page.getByTestId('drop-grid-right');
    const rightBox = await rightGrid.boundingBox();
    expect(itemBox).not.toBeNull();
    expect(rightBox).not.toBeNull();

    await page.mouse.move(itemBox!.x + itemBox!.width / 2, itemBox!.y + itemBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(rightBox!.x + rightBox!.width / 2, rightBox!.y + rightBox!.height / 2, { steps: 15 });
    await page.mouse.up();

    await expect(page.locator('[data-testid=drop-grid-left] .demo-item')).toHaveCount(0);
    await expect(page.locator('[data-testid=drop-grid-right] .demo-item')).toHaveText(['left-0']);
  });

  test('compactType controls whether a dropped item settles upward into a gap or stays exactly where it was dropped', async ({ page }) => {
    // The "h/v compact toggle" was missing from this example/demo
    // entirely — added it so the interaction between outside-drop and
    // compactType is actually visible/testable here, not just
    // covered indirectly by generic compaction tests elsewhere.
    await page.getByTestId('toggle-vertical-compact').uncheck();

    const widget = page.getByTestId('drop-widget-b');
    const widgetBox = await widget.boundingBox();
    const leftGrid = page.getByTestId('drop-grid-left');
    const leftBox = await leftGrid.boundingBox();
    expect(widgetBox).not.toBeNull();
    expect(leftBox).not.toBeNull();

    // Drop well below existing item "left-0" (at the grid's own top),
    // leaving a real gap above the dropped item.
    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(leftBox!.x + leftBox!.width / 2, leftBox!.y + leftBox!.height - 10, { steps: 10 });
    await page.mouse.up();

    const droppedItem = page.locator('[data-testid=drop-grid-left] [data-testid^="grid-item-"]').last();
    const droppedBoxNoCompact = await droppedItem.boundingBox();
    const item0Box = await page.getByTestId('grid-item-left-0').boundingBox();
    // With compactType NONE, the dropped item stays below "left-0",
    // not pulled up flush with it.
    expect(droppedBoxNoCompact!.y).toBeGreaterThan(item0Box!.y + item0Box!.height);

    await page.getByTestId('reset-grids').click();
    await page.getByTestId('toggle-vertical-compact').check();

    await widget.hover();
    await page.mouse.down();
    await page.mouse.move(leftBox!.x + leftBox!.width / 2, leftBox!.y + leftBox!.height - 10, { steps: 10 });
    await page.mouse.up();

    const droppedBoxCompact = await page.locator('[data-testid=drop-grid-left] [data-testid^="grid-item-"]').last().boundingBox();
    const item0BoxAfter = await page.getByTestId('grid-item-left-0').boundingBox();
    // With compactType VERTICAL (the default), it settles flush next to
    // "left-0" instead of staying in the gap it was dropped into.
    expect(droppedBoxCompact!.y).toBeCloseTo(item0BoxAfter!.y, 0);
  });
});
