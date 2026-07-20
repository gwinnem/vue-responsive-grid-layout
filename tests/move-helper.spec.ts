import { describe, expect, it } from 'vitest';
import { moveElement, moveElementAwayFromCollision, moveToCorrectPlace } from "../src/core/gridlayout/helpers/move-helper";
import { EErrorMessage } from "../src/core/common/enums/ErrorMessages";
import { EMovingDirections } from "../src/core/common/enums/EMovingDirections";
import { TLayout } from "../src/components";
import { TMovingDirection } from "../src/core/common/types/TMovingDirections";

const testDataOne: TLayout = [
  {
    i: 1,
    h: 2,
    w: 1,
    x: 0,
    y: 0,
  },
  {
    i: 2,
    h: 2,
    w: 1,
    x: 1,
    y: 0,
  },
  {
    i: 3,
    h: 2,
    w: 1,
    x: 2,
    y: 0,
    isStatic: true,
  },
  {
    i: 4,
    h: 2,
    w: 1,
    x: 3,
    y: 0,
  },
  {
    i: 5,
    h: 2,
    w: 1,
    x: 4,
    y: 0,
  },
  {
    i: 6,
    h: 2,
    w: 1,
    x: 5,
    y: 0,
  }
];

describe(`moveToCorrectPlace`, () => {
  it(`Should throw an error if parameter layoutItem is undefined`, () => {
    expect(() => moveToCorrectPlace(null, {cols: 3}, [testDataOne[0]]))
      .toThrow(EErrorMessage.INVALID_LAYOUT_ITEM);
  });

  it(`Should throw an error if parameter bounds is less than 1`, () => {
    expect(() => moveToCorrectPlace(testDataOne[0], { cols: 0 }, [testDataOne[0]]))
      .toThrow(EErrorMessage.INVALID_BOUNDS);
  });

  it(`Should wrap the item to the next row when it collides all the way across the current one`, () => {
    const item = { i: `a`, x: 2, y: 0, w: 2, h: 1 };
    const statics = [{ i: `s1`, x: 0, y: 0, w: 3, h: 1, isStatic: true }];

    moveToCorrectPlace(item, { cols: 3 }, statics);

    expect(item).toStrictEqual({ i: `a`, x: 0, y: 1, w: 2, h: 1 });
  });

  it(`Should step past multiple colliding static items before settling in a free column`, () => {
    const item = { i: `a`, x: 0, y: 0, w: 1, h: 1 };
    const statics = [
      { i: `s1`, x: 0, y: 0, w: 1, h: 1, isStatic: true },
      { i: `s2`, x: 1, y: 0, w: 1, h: 1, isStatic: true },
    ];

    moveToCorrectPlace(item, { cols: 3 }, statics);

    expect(item).toStrictEqual({ i: `a`, x: 2, y: 0, w: 1, h: 1 });
  });

  it(`Should wrap to the next row mid-loop when stepping past collisions runs out of columns`, () => {
    // Distinct from the "collides all the way across" case above, which
    // wraps via the pre-loop check before the while loop ever runs. This
    // starts within bounds, then only overflows *after* stepping past two
    // colliding static items inside the loop itself.
    const item = { i: `a`, x: 0, y: 0, w: 1, h: 1 };
    const statics = [
      { i: `s1`, x: 0, y: 0, w: 1, h: 1, isStatic: true },
      { i: `s2`, x: 1, y: 0, w: 1, h: 1, isStatic: true },
    ];

    moveToCorrectPlace(item, { cols: 2 }, statics);

    expect(item).toStrictEqual({ i: `a`, x: 0, y: 1, w: 1, h: 1 });
  });
});


describe(`moveElement`, () => {

  it(`Should throw an error if parameter x is less than 0`, () => {
    expect(() => moveElement(testDataOne, testDataOne[0], -1, 0, true, true, true))
      .toThrowError(EErrorMessage.INVALID_PARAMS);
  });

  it(`Should throw an error if parameter y is less than 0`, () => {
    expect(() => moveElement(testDataOne, testDataOne[0], 1, -1, true, true, true))
      .toThrowError(EErrorMessage.INVALID_PARAMS);
  });

  it('Should return the passed in layout when item isStatic', () => {
    const result = moveElement(testDataOne, {
      isStatic: true,
      i: 1,
      x: 1,
      y: 1,
      w: 1,
      h: 1
    }, 0, 0, false, false, false);

    expect(testDataOne).toMatchObject(result);
  });

  it('Should return', () => {
    const result = moveElement(testDataOne, {
      isStatic: false,
      i: 1,
      x: 0,
      y: 1,
      w: 1,
      h: 1
    }, 0, 0, false, true, false);

    expect(testDataOne).toMatchObject(result);
  });

  it(`Should push a colliding non-static item downward (cascading move)`, () => {
    const layout: TLayout = [
      { i: `a`, x: 0, y: 0, w: 2, h: 2 },
      { i: `b`, x: 0, y: 2, w: 2, h: 2 },
    ];

    const result = moveElement(layout, layout[0], 0, 2, true, false, false);

    expect(result).toStrictEqual([
      { i: `a`, x: 0, y: 2, w: 2, h: 2, moved: true },
      { i: `b`, x: 0, y: 0, w: 2, h: 2, moved: true },
    ]);
  });

  it(`Should shift a colliding item horizontally when horizontalShift is enabled`, () => {
    const layout: TLayout = [
      { i: `a`, x: 0, y: 0, w: 2, h: 2 },
      { i: `b`, x: 2, y: 0, w: 2, h: 2 },
    ];

    const result = moveElement(layout, layout[0], 1, 0, true, true, false);

    expect(result).toStrictEqual([
      { i: `a`, x: 1, y: 0, w: 2, h: 2, moved: true },
      { i: `b`, x: 0, y: 0, w: 2, h: 2, moved: true },
    ]);
  });

  it(`Should revert the move entirely when preventCollision is set and a collision occurs`, () => {
    const layout: TLayout = [
      { i: `a`, x: 0, y: 0, w: 2, h: 2 },
      { i: `b`, x: 2, y: 0, w: 2, h: 2 },
    ];

    const result = moveElement(layout, layout[0], 1, 0, true, false, true);

    expect(result[0]).toStrictEqual({ i: `a`, x: 0, y: 0, w: 2, h: 2, moved: false });
  });
});

describe(`moveElementAwayFromCollision`, () => {
  it(`Should move the non-static item away when it collides with a static item`, () => {
    const layout: TLayout = [
      { i: `a`, x: 0, y: 0, w: 2, h: 2, isStatic: true },
      { i: `b`, x: 0, y: 0, w: 2, h: 2 },
    ];

    const result = moveElementAwayFromCollision(layout, layout[0], layout[1], true, undefined as unknown as TMovingDirection, false);

    expect(result).toStrictEqual([
      { i: `a`, x: 0, y: 0, w: 2, h: 2, isStatic: true },
      { i: `b`, x: 0, y: 1, w: 2, h: 2, moved: true },
    ]);
  });

  it(`Should fall back to the default drop position when the colliding item is narrower and offset (horizontalShift)`, () => {
    const layout: TLayout = [
      { i: `a`, x: 5, y: 0, w: 2, h: 2 },
      { i: `b`, x: 0, y: 0, w: 4, h: 2 },
    ];

    expect(() =>
      moveElementAwayFromCollision(layout, layout[0], layout[1], false, EMovingDirections.RIGHT, true),
    ).not.toThrow();
  });
});
