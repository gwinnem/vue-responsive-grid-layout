// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { correctBounds } from '../src/core/helpers/responsive-utils';

describe(`correctBounds`, () => {
  it(`Should move a static item that overflows the right edge back within bounds`, () => {
    const layout = [{ i: `s`, x: 4, y: 0, w: 2, h: 1, isStatic: true }];

    const result = correctBounds(layout, { cols: 4 }, false);

    expect(result).toStrictEqual([{ i: `s`, x: 2, y: 0, w: 2, h: 1, isStatic: true }]);
  });

  it(`Should pull a non-static item that overflows the right edge back to the boundary when distributeEvenly is false`, () => {
    const layout = [{ i: `a`, x: 3, y: 0, w: 2, h: 1 }];

    const result = correctBounds(layout, { cols: 4 }, false);

    expect(result).toStrictEqual([{ i: `a`, x: 2, y: 0, w: 2, h: 1 }]);
  });

  it(`Should move a non-static item to the next available row when distributeEvenly is true and it collides`, () => {
    const layout = [
      { i: `stat`, x: 0, y: 0, w: 2, h: 1, isStatic: true },
      { i: `a`, x: 3, y: 0, w: 2, h: 1 },
    ];

    const result = correctBounds(layout, { cols: 4 }, true);

    expect(result).toStrictEqual([
      { i: `stat`, x: 0, y: 0, w: 2, h: 1, isStatic: true },
      { i: `a`, x: 0, y: 1, w: 2, h: 1 },
    ]);
  });

  it(`Should correct a negative x position back to 0`, () => {
    const layout = [{ i: `a`, x: -3, y: 0, w: 1, h: 1 }];

    const result = correctBounds(layout, { cols: 4 }, false);

    expect(result).toStrictEqual([{ i: `a`, x: 0, y: 0, w: 1, h: 1 }]);
  });

  it(`Should also correct to 0 when an item wider than the target breakpoint's own column count is pulled negative by the right-overflow correction itself`, () => {
    // Distinct from the test above: that one feeds an already-negative x
    // straight in. This one starts from a positive x and lets
    // correctBounds's own right-overflow correction (`l.x = bounds.cols -
    // l.w`) produce the negative value as a side effect — exactly the
    // scenario a `// TODO experiment to get a layout where this is the
    // case ... this is not being triggered` comment had been sitting on
    // the very next line since 2023 (removed once this test confirmed
    // it's reachable — see docs/REFACTORING.md #54). An item wider than
    // the *new* breakpoint's column count (e.g. shrinking from a 12-col
    // desktop breakpoint down to a 2-col mobile one, with the item's own
    // `w` never adjusted for the new breakpoint) is a completely
    // ordinary way to end up here, not a contrived edge case.
    const layout = [{ i: `a`, x: 3, y: 0, w: 6, h: 1 }];

    const result = correctBounds(layout, { cols: 2 }, false);

    expect(result).toStrictEqual([{ i: `a`, x: 0, y: 0, w: 6, h: 1 }]);
  });

  it(`Should leave an item that already fits within bounds unchanged`, () => {
    const layout = [{ i: `a`, x: 0, y: 0, w: 2, h: 1 }];

    const result = correctBounds(layout, { cols: 4 }, false);

    expect(result).toStrictEqual([{ i: `a`, x: 0, y: 0, w: 2, h: 1 }]);
  });
});
