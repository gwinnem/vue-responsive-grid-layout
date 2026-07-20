import { expect, test } from '@playwright/test';

test.describe('Responsive breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('nav-responsive').click();
  });

  test('switches breakpoint as the viewport shrinks', async ({ page }) => {
    // The grid measures its own container (viewport minus the nav sidebar and
    // padding), so exact pixel-to-breakpoint thresholds depend on the demo
    // shell's layout. Rather than hardcoding those offsets, assert on the
    // relationship: a large viewport and a much smaller one must resolve to
    // different, decreasing breakpoints.
    const order = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs', 'xxs'];
    const breakpointText = page.getByTestId('current-breakpoint');

    // Bug fix: reading `.textContent()` immediately after
    // `setViewportSize()` is a race — the browser's own resize event and
    // the library's `ResizeObserver` callback both fire asynchronously,
    // not synchronously within the same call. Confirmed directly: an
    // immediate read after resizing to 1800px still showed the
    // *previous* breakpoint every time, settling to the correct one
    // only after further waiting. The previous version of this test had
    // no wait at all between `setViewportSize` and reading the text,
    // producing exactly the "one resize behind" failure this was
    // intermittently hitting (e.g. asserting 'sm' — the stale,
    // pre-resize reading — was narrower than 'xl', a stale reading one
    // resize behind). Locator-based `toContainText` auto-retries until
    // the text actually changes (or times out), which a raw
    // `.textContent()` snapshot does not.
    const initial = (await breakpointText.textContent())?.trim() ?? '';

    await page.setViewportSize({ width: 1800, height: 900 });
    await expect(breakpointText).not.toHaveText(initial);
    const wide = (await breakpointText.textContent())?.trim() ?? '';

    await page.setViewportSize({ width: 700, height: 900 });
    await expect(breakpointText).not.toHaveText(wide);
    const narrow = (await breakpointText.textContent())?.trim() ?? '';

    expect(wide).not.toEqual(narrow);

    const wideIndex = order.findIndex(bp => wide.includes(bp));
    const narrowIndex = order.findIndex(bp => narrow.includes(bp));

    expect(wideIndex).toBeGreaterThanOrEqual(0);
    expect(narrowIndex).toBeGreaterThan(wideIndex);
  });
});
