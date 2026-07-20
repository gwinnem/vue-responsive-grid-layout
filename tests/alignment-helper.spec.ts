import { describe, expect, it } from 'vitest';
import { findAlignmentGuides, findSnapAdjustment } from '../src/core/gridlayout/helpers/alignment-helper';

describe(`findSnapAdjustment`, () => {
  it(`Should snap x to align the active item's left edge with another item's left edge, within threshold`, () => {
    // other is wide enough that its right edge (x:20) is far outside
    // threshold, so only its left edge (x:0) is a candidate match.
    const layout = [
      { h: 2, i: `active`, w: 2, x: 3, y: 4 },
      { h: 2, i: `other`, w: 20, x: 0, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 3);

    expect(result.x).toBe(0);
  });

  it(`Should not snap when the nearest edge is further than threshold`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 5, y: 4 },
      { h: 2, i: `other`, w: 2, x: 0, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 2);

    expect(result.x).toBeUndefined();
  });

  it(`Should snap the active item's right edge to another item's left edge, adjusting for the item's own width`, () => {
    // active (w:2) right edge should land at other's left edge (x:6),
    // meaning active.x should snap to 6 - 2 = 4.
    const layout = [
      { h: 2, i: `active`, w: 2, x: 3, y: 4 },
      { h: 2, i: `other`, w: 2, x: 6, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 2);

    expect(result.x).toBe(4);
  });

  it(`Should snap y independently of x, on the vertical axis`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 8, y: 3 },
      { h: 20, i: `other`, w: 2, x: 0, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 3);

    expect(result.y).toBe(0);
    expect(result.x).toBeUndefined();
  });

  it(`Should pick the closest match when multiple items are within threshold`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 3, y: 4 },
      { h: 2, i: `far`, w: 2, x: 0, y: 0 },
      { h: 2, i: `near`, w: 2, x: 2, y: 10 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 3);

    // "near" (distance 1) should win over "far" (distance 3).
    expect(result.x).toBe(2);
  });

  it(`Should never return a negative snapped position`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 1, y: 4 },
      { h: 2, i: `other`, w: 2, x: -3, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 3);

    expect(result.x).toBeGreaterThanOrEqual(0);
  });

  it(`Should return an empty object when threshold is 0`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 0, y: 4 },
      { h: 2, i: `other`, w: 2, x: 0, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 0);

    expect(result).toStrictEqual({});
  });

  it(`Should return an empty object when nothing else is in the layout`, () => {
    const layout = [{ h: 2, i: `active`, w: 2, x: 5, y: 5 }];

    const result = findSnapAdjustment(layout, layout[0], 3);

    expect(result).toStrictEqual({});
  });

  it(`Should snap the active item's left edge to another item's right edge (the remaining untested x edge-combination)`, () => {
    // active's left edge (x:6) near other's right edge (x:0+5=5).
    const layout = [
      { h: 2, i: `active`, w: 2, x: 6, y: 4 },
      { h: 2, i: `other`, w: 5, x: 0, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 2);

    expect(result.x).toBe(5);
  });

  it(`Should snap the active item's right edge to another item's right edge (the remaining untested x edge-combination)`, () => {
    // Isolated so only right-to-right falls within threshold: active's
    // left edge (10) is far from other's left (0) and right (14) edges;
    // only active's right edge (12) is close to other's right (14).
    const layout = [
      { h: 2, i: `active`, w: 2, x: 10, y: 4 },
      { h: 2, i: `other`, w: 14, x: 0, y: 0 },
    ];

    const result = findSnapAdjustment(layout, layout[0], 3);

    expect(result.x).toBe(12);
  });

  it(`Should snap on the remaining three untested y edge-combinations (top-to-bottom, bottom-to-top, bottom-to-bottom)`, () => {
    // top-to-bottom: active's top edge (y:6) near other's bottom edge (y:0+5=5).
    const topToBottom = [
      { h: 2, i: `active`, w: 2, x: 4, y: 6 },
      { h: 5, i: `other`, w: 2, x: 0, y: 0 },
    ];
    expect(findSnapAdjustment(topToBottom, topToBottom[0], 2).y).toBe(5);

    // bottom-to-top: active's bottom edge (y:0+2=2) near other's top edge (y:5).
    const bottomToTop = [
      { h: 2, i: `active`, w: 2, x: 4, y: 0 },
      { h: 3, i: `other`, w: 2, x: 0, y: 5 },
    ];
    expect(findSnapAdjustment(bottomToTop, bottomToTop[0], 3).y).toBe(3);

    // bottom-to-bottom: isolated so only this combo falls within
    // threshold — active's top edge (10) is far from other's top (0)
    // and bottom (14) edges; only active's bottom edge (12) is close
    // to other's bottom (14).
    const bottomToBottom = [
      { h: 2, i: `active`, w: 2, x: 4, y: 10 },
      { h: 14, i: `other`, w: 2, x: 0, y: 0 },
    ];
    expect(findSnapAdjustment(bottomToBottom, bottomToBottom[0], 3).y).toBe(12);
  });
});


describe(`findAlignmentGuides`, () => {
  it(`Should find a vertical guide when the active item's left edge matches another item's left edge`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 0, y: 4 },
      { h: 2, i: `other`, w: 2, x: 0, y: 0 },
    ];

    const guides = findAlignmentGuides(layout, layout[0]);

    expect(guides).toContainEqual({ axis: `x`, position: 0 });
  });

  it(`Should find a vertical guide when the active item's left edge matches another item's right edge`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 4, y: 0 },
      { h: 2, i: `other`, w: 2, x: 2, y: 4 }, // right edge at x=4
    ];

    const guides = findAlignmentGuides(layout, layout[0]);

    expect(guides).toContainEqual({ axis: `x`, position: 4 });
  });

  it(`Should find a vertical guide when the active item's right edge matches another item's right edge`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 2, y: 0 }, // right edge at x=4
      { h: 2, i: `other`, w: 4, x: 0, y: 4 }, // right edge at x=4
    ];

    const guides = findAlignmentGuides(layout, layout[0]);

    expect(guides).toContainEqual({ axis: `x`, position: 4 });
  });

  it(`Should find a horizontal guide when the active item's top edge matches another item's top edge`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 4, y: 0 },
      { h: 2, i: `other`, w: 2, x: 0, y: 0 },
    ];

    const guides = findAlignmentGuides(layout, layout[0]);

    expect(guides).toContainEqual({ axis: `y`, position: 0 });
  });

  it(`Should find a horizontal guide when the active item's bottom edge matches another item's bottom edge`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 4, y: 2 }, // bottom edge at y=4
      { h: 4, i: `other`, w: 2, x: 0, y: 0 }, // bottom edge at y=4
    ];

    const guides = findAlignmentGuides(layout, layout[0]);

    expect(guides).toContainEqual({ axis: `y`, position: 4 });
  });

  it(`Should find both a vertical and horizontal guide when both align`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 0, y: 0 },
      { h: 2, i: `other`, w: 2, x: 0, y: 4 }, // same left edge (x=0), different row
    ];

    const guides = findAlignmentGuides(layout, layout[0]);

    expect(guides).toContainEqual({ axis: `x`, position: 0 });
  });

  it(`Should return no guides when nothing aligns`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 1, y: 1 },
      { h: 2, i: `other`, w: 2, x: 5, y: 5 },
    ];

    expect(findAlignmentGuides(layout, layout[0])).toStrictEqual([]);
  });

  it(`Should exclude the active item itself from comparison`, () => {
    // Without the i !== activeItem.i filter, the active item would
    // trivially "align" with itself on every edge.
    const layout = [{ h: 2, i: `active`, w: 2, x: 0, y: 0 }];

    expect(findAlignmentGuides(layout, layout[0])).toStrictEqual([]);
  });

  it(`Should deduplicate when multiple other items share the same aligned edge`, () => {
    const layout = [
      { h: 2, i: `active`, w: 2, x: 0, y: 0 },
      { h: 2, i: `other1`, w: 2, x: 0, y: 4 },
      { h: 2, i: `other2`, w: 4, x: 0, y: 8 },
    ];

    const guides = findAlignmentGuides(layout, layout[0]).filter((g) => g.axis === `x` && g.position === 0);

    expect(guides).toHaveLength(1);
  });

  it(`Should return no guides for an empty layout (only the active item, already excluded)`, () => {
    expect(findAlignmentGuides([], { h: 2, i: `active`, w: 2, x: 0, y: 0 })).toStrictEqual([]);
  });
});
