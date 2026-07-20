// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { findOrGenerateResponsiveLayout } from '../src/core/gridlayout/helpers/responsive-helper';
import { ECompactType } from '../src/core/gridlayout/enums/ECompactType';

describe(`findOrGenerateResponsiveLayout`, () => {
  it(`Should clone, bounds-correct and compact the original layout for the new breakpoint`, () => {
    const layout = [
      { i: `a`, x: 0, y: 0, w: 2, h: 1 },
      { i: `b`, x: 0, y: 5, w: 2, h: 1 },
    ];

    const result = findOrGenerateResponsiveLayout(layout, {}, {}, `md`, `lg`, 4, ECompactType.VERTICAL, false);

    // Vertical compaction (ECompactType.VERTICAL) should pull item "b" up
    // to sit directly under "a" instead of leaving a gap at y=1..4.
    expect(result).toStrictEqual([
      { i: `a`, x: 0, y: 0, w: 2, h: 1, moved: false },
      { i: `b`, x: 0, y: 1, w: 2, h: 1, moved: false },
    ]);
  });

  it(`Should not mutate the original layout array passed in`, () => {
    const layout = [{ i: `a`, x: 0, y: 5, w: 2, h: 1 }];
    const original = JSON.parse(JSON.stringify(layout));

    findOrGenerateResponsiveLayout(layout, {}, {}, `sm`, `md`, 4, ECompactType.VERTICAL, false);

    expect(layout).toStrictEqual(original);
  });

  it(`Should return an empty layout (not throw) when the original layout is undefined`, () => {
    // Behavior change (see docs/REFACTORING.md #33): orgLayout defaults
    // to `[]` internally, which now flows cleanly through
    // correctBounds()/compactLayout() -> getAllStaticGridItems([]) (fixed
    // to return `[]` instead of throwing) rather than surfacing as a
    // thrown error partway through.
    expect(findOrGenerateResponsiveLayout(undefined, {}, {}, `sm`, `md`, 4, ECompactType.VERTICAL, false)).toStrictEqual([]);
  });

  it(`Should apply horizontal compaction when compactType is HORIZONTAL`, () => {
    // Regression coverage for the new enum-based compactType parameter
    // — this function used to only ever be able to apply vertical
    // compaction or none at all during a breakpoint change; a grid
    // configured for horizontal compaction should stay horizontally
    // compacted after switching breakpoints too, not silently revert.
    const layout = [
      { i: `a`, x: 0, y: 0, w: 1, h: 2 },
      { i: `b`, x: 5, y: 0, w: 1, h: 2 },
    ];

    const result = findOrGenerateResponsiveLayout(layout, {}, {}, `md`, `lg`, 8, ECompactType.HORIZONTAL, false);

    expect(result).toStrictEqual([
      { i: `a`, x: 0, y: 0, w: 1, h: 2, moved: false },
      { i: `b`, x: 1, y: 0, w: 1, h: 2, moved: false },
    ]);
  });
});
