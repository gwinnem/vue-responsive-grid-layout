import { describe, expect, it } from 'vitest';
import { findFirstFitSlot } from '@/core/gridlayout/helpers/bin-pack-helper';
import { TLayout } from '@/components/Grid/layout-definition';

describe(`findFirstFitSlot`, () => {
  it(`Should place the first item at (0, 0) on an empty layout`, () => {
    expect(findFirstFitSlot([], 12, 2, 2)).toStrictEqual({ x: 0, y: 0 });
  });

  it(`Should place a new item right after existing ones in the same row, when there's room`, () => {
    const layout: TLayout = [{ h: 2, i: `0`, w: 2, x: 0, y: 0 }];
    expect(findFirstFitSlot(layout, 12, 2, 2)).toStrictEqual({ x: 2, y: 0 });
  });

  it(`Should reuse a gap left by a removed item, rather than always placing at the bottom`, () => {
    // Regression test for the actual reported bug: removing an item
    // from the middle of a row used to still place the next new item
    // in a fresh row at the very bottom — this asserts the gap itself
    // (x:2, the slot item "1" used to occupy) gets reused instead.
    const layout: TLayout = [
      { h: 2, i: `0`, w: 2, x: 0, y: 0 },
      // item "1" (x: 2) has been removed, leaving a gap there
      { h: 2, i: `2`, w: 2, x: 4, y: 0 },
    ];
    expect(findFirstFitSlot(layout, 12, 2, 2)).toStrictEqual({ x: 2, y: 0 });
  });

  it(`Should scan row by row from the top, not just check the very first row`, () => {
    const layout: TLayout = [
      { h: 2, i: `0`, w: 12, x: 0, y: 0 },
      // Row 2 (y: 2) has a gap at x: 4 — should be found before falling
      // through to a brand-new row at y: 4.
      { h: 2, i: `1`, w: 4, x: 0, y: 2 },
      { h: 2, i: `2`, w: 4, x: 8, y: 2 },
    ];
    expect(findFirstFitSlot(layout, 12, 4, 2)).toStrictEqual({ x: 4, y: 2 });
  });

  it(`Should fall through to a fresh row past everything occupied, when every existing row is completely full`, () => {
    const layout: TLayout = [{ h: 2, i: `0`, w: 12, x: 0, y: 0 }];
    expect(findFirstFitSlot(layout, 12, 2, 2)).toStrictEqual({ x: 0, y: 2 });
  });

  it(`Should never return an x position where the item would exceed colNum`, () => {
    const layout: TLayout = [{ h: 2, i: `0`, w: 10, x: 0, y: 0 }];
    // Only 2 columns free in row 0 (x:10-12), too narrow for a w:4 item
    // — should skip to the next row rather than overflow colNum.
    const result = findFirstFitSlot(layout, 12, 4, 2);
    expect(result.x + 4).toBeLessThanOrEqual(12);
    expect(result).toStrictEqual({ x: 0, y: 2 });
  });

  it(`Should account for an item's own height, not just its top edge, when checking a row for collisions`, () => {
    // item "0" spans y:0-3 (h:3) — a 2-tall candidate at y:1 would
    // still collide with it, even though y:1 isn't item "0"'s own
    // starting row.
    const layout: TLayout = [{ h: 3, i: `0`, w: 2, x: 0, y: 0 }];
    expect(findFirstFitSlot(layout, 12, 2, 2)).toStrictEqual({ x: 2, y: 0 });
  });
});
