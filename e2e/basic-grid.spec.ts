import { expect, test } from '@playwright/test';

test.describe('Basic grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-basic').click();
  });

  test('renders the configured number of grid items', async ({ page }) => {
    const wrap = page.getByTestId('basic-grid-wrap');
    await expect(wrap).toBeVisible();

    await expect(page.getByTestId('grid-item-0')).toBeVisible();
    await expect(page.getByTestId('grid-item-1')).toBeVisible();
    await expect(page.getByTestId('grid-item-2')).toBeVisible();
    await expect(page.getByTestId('grid-item-3')).toBeVisible();
  });

  test('positions items according to the layout (x/y translated to pixels)', async ({ page }) => {
    const item0 = page.getByTestId('grid-item-0');
    const item1 = page.getByTestId('grid-item-1');

    const box0 = await item0.boundingBox();
    const box1 = await item1.boundingBox();

    expect(box0).not.toBeNull();
    expect(box1).not.toBeNull();

    // item 1 sits to the right of item 0 in the same row
    expect(box1!.x).toBeGreaterThan(box0!.x);
    expect(Math.abs(box1!.y - box0!.y)).toBeLessThan(5);
  });

  test('applies draggable/resizable classes by default', async ({ page }) => {
    const item = page.getByTestId('grid-item-0');
    await expect(item).toHaveClass(/vue-draggable/);
    await expect(item).toHaveClass(/vue-resizable/);
  });
});
