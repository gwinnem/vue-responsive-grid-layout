// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import {
  getLayoutItem,
  setTopRight,
  setTopLeft,
  setTransformRtl,
  setTransform,
  cloneLayoutItem,
  cloneLayout,
  compactItem,
  compactLayout,
  compactItemHorizontal,
  compactLayoutHorizontal,
  compactLayoutOverlapVertical,
  compactLayoutOverlapHorizontal,
} from '../src/core/helpers/utils';
import {
  ITopRightStyle,
  ITopLeftStyle,
  ITransformStyle,
} from '../src/core/common/interfaces/transform-style.interfaces';
import { EErrorMessage } from '../src/core/common/enums/ErrorMessages';
import { TLayout, ILayoutItem } from '../src/components';
import { testLayoutOne, testLayoutTwo } from './testLayout';

describe('cloneLayoutItem', () => {
  it('Should return exact copy of layout item', () => {
    const item: ILayoutItem = {
      i: 2,
      h: 1,
      w: 2,
      x: 1,
      y: 0,
    };
    const result = cloneLayoutItem(item);
    expect(result).toStrictEqual(item);
  });
});

describe('cloneLayout', () => {
  it('Should return exact copy of layout', () => {
    const result = cloneLayout(testLayoutOne);
    expect(result).toStrictEqual(testLayoutOne);
  });
});

describe('compactItem', () => {
  it('Should move an item up as far as possible when verticalCompact is true and nothing blocks it', () => {
    const item: ILayoutItem = { i: 'a', x: 0, y: 5, w: 2, h: 1 };
    const result = compactItem([], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 0, w: 2, h: 1 });
  });

  it('Should stop moving up when it would collide with another item', () => {
    const blocker: ILayoutItem = { i: 'blocker', x: 0, y: 1, w: 2, h: 1 };
    const item: ILayoutItem = { i: 'a', x: 0, y: 5, w: 2, h: 1 };
    const result = compactItem([blocker], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 2, w: 2, h: 1 });
  });

  it('Should respect minPositions instead of moving to 0 when verticalCompact is false', () => {
    const item: ILayoutItem = { i: 'a', x: 0, y: 5, w: 2, h: 1 };
    const result = compactItem([], item, false, { a: { y: 3 } });

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 3, w: 2, h: 1 });
  });

  it('Should push an item down until it no longer collides', () => {
    const blocker: ILayoutItem = { i: 'blocker', x: 0, y: 0, w: 2, h: 2 };
    const item: ILayoutItem = { i: 'a', x: 0, y: 0, w: 2, h: 1 };
    const result = compactItem([blocker], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 2, w: 2, h: 1 });
  });

  it('Should not infinite-loop on a non-finite starting y (the common "y: Infinity, let compaction settle it" placement convention) — regression test', () => {
    // Bug fix: `Infinity - 1 === Infinity` in JavaScript, so the old
    // decrement loop (`while (layoutItem.y > 0 ...) { layoutItem.y--; }`)
    // never actually reduced `y` at all when nothing collided with it
    // yet — an infinite loop that froze the page entirely, not a slow
    // one. Reported directly via example 43 (the undo/redo example)
    // freezing on its own "Add item" button, which uses exactly this
    // `y: Infinity` convention. This test's own timeout (vitest's
    // default) is the safety net here: if this regresses, the test
    // hangs and times out rather than silently passing.
    const item: ILayoutItem = { i: 'a', x: 0, y: Infinity, w: 2, h: 1 };
    const result = compactItem([], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 0, w: 2, h: 1 });
  });

  it('Should clamp a non-finite starting y to just below existing items, not just to 0, when something would otherwise block it', () => {
    const blocker: ILayoutItem = { i: 'blocker', x: 0, y: 0, w: 2, h: 3 };
    const item: ILayoutItem = { i: 'a', x: 0, y: Infinity, w: 2, h: 1 };
    const result = compactItem([blocker], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 3, w: 2, h: 1 });
  });
});

describe('compactLayout', () => {
  it('Should compact all non-static items upward, leaving static items in place', () => {
    const layout: TLayout = [
      { i: 'static', x: 0, y: 0, w: 2, h: 1, isStatic: true },
      { i: 'a', x: 2, y: 5, w: 2, h: 1 },
    ];

    const result = compactLayout(layout, true);

    expect(result).toStrictEqual([
      { i: 'static', x: 0, y: 0, w: 2, h: 1, isStatic: true, moved: false },
      { i: 'a', x: 2, y: 0, w: 2, h: 1, moved: false },
    ]);
  });

  it('Should return an empty array (not throw) when the layout is empty', () => {
    // Behavior change (see docs/REFACTORING.md #33): nothing to compact
    // isn't an error — a grid with no items yet is a normal state.
    expect(compactLayout([], true)).toStrictEqual([]);
  });
});

describe('compactItemHorizontal', () => {
  it('Should move an item left as far as possible when horizontalCompact is true and nothing blocks it', () => {
    const item: ILayoutItem = { i: 'a', x: 5, y: 0, w: 1, h: 2 };
    const result = compactItemHorizontal([], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 0, w: 1, h: 2 });
  });

  it('Should stop moving left when it would collide with another item', () => {
    const blocker: ILayoutItem = { i: 'blocker', x: 1, y: 0, w: 1, h: 2 };
    const item: ILayoutItem = { i: 'a', x: 5, y: 0, w: 1, h: 2 };
    const result = compactItemHorizontal([blocker], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 2, y: 0, w: 1, h: 2 });
  });

  it('Should respect minPositions (minimum x) instead of moving to 0 when horizontalCompact is false', () => {
    const item: ILayoutItem = { i: 'a', x: 5, y: 0, w: 1, h: 2 };
    const result = compactItemHorizontal([], item, false, { a: { x: 3 } });

    expect(result).toStrictEqual({ i: 'a', x: 3, y: 0, w: 1, h: 2 });
  });

  it('Should push an item right until it no longer collides', () => {
    const blocker: ILayoutItem = { i: 'blocker', x: 0, y: 0, w: 2, h: 2 };
    const item: ILayoutItem = { i: 'a', x: 0, y: 0, w: 1, h: 2 };
    const result = compactItemHorizontal([blocker], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 2, y: 0, w: 1, h: 2 });
  });

  it('Should not infinite-loop on a non-finite starting x — regression test, same class of bug as compactItem\'s own fix', () => {
    const item: ILayoutItem = { i: 'a', x: Infinity, y: 0, w: 1, h: 2 };
    const result = compactItemHorizontal([], item, true);

    expect(result).toStrictEqual({ i: 'a', x: 0, y: 0, w: 1, h: 2 });
  });
});

describe('compactLayoutHorizontal', () => {
  it('Should compact all non-static items leftward, leaving static items in place', () => {
    const layout: TLayout = [
      { i: 'static', x: 0, y: 0, w: 1, h: 2, isStatic: true },
      { i: 'a', x: 5, y: 2, w: 1, h: 2 },
    ];

    const result = compactLayoutHorizontal(layout, true);

    expect(result).toStrictEqual([
      { i: 'static', x: 0, y: 0, w: 1, h: 2, isStatic: true, moved: false },
      { i: 'a', x: 0, y: 2, w: 1, h: 2, moved: false },
    ]);
  });

  it('Should process items leftmost-first, so a later item settles against an earlier one already placed to its left', () => {
    const layout: TLayout = [
      { i: 'a', x: 6, y: 0, w: 2, h: 2 },
      { i: 'b', x: 3, y: 0, w: 2, h: 2 },
    ];

    const result = compactLayoutHorizontal(layout, true);

    expect(result).toStrictEqual([
      { i: 'a', x: 2, y: 0, w: 2, h: 2, moved: false },
      { i: 'b', x: 0, y: 0, w: 2, h: 2, moved: false },
    ]);
  });

  it('Should return an empty array (not throw) when the layout is empty', () => {
    expect(compactLayoutHorizontal([], true)).toStrictEqual([]);
  });
});

describe('compactLayoutOverlapVertical', () => {
  it('Should move every non-static item straight to y:0, ignoring collisions entirely', () => {
    const layout: TLayout = [
      { i: 'static', x: 0, y: 0, w: 2, h: 1, isStatic: true },
      { i: 'a', x: 0, y: 5, w: 2, h: 1 },
      { i: 'b', x: 0, y: 8, w: 2, h: 1 },
    ];

    const result = compactLayoutOverlapVertical(layout);

    // "a" and "b" both land at y:0 — genuinely overlapping each other,
    // by design; nothing here resolves that.
    expect(result).toStrictEqual([
      { i: 'static', x: 0, y: 0, w: 2, h: 1, isStatic: true, moved: false },
      { i: 'a', x: 0, y: 0, w: 2, h: 1, moved: false },
      { i: 'b', x: 0, y: 0, w: 2, h: 1, moved: false },
    ]);
  });

  it('Should return an empty array (not throw) when the layout is empty', () => {
    expect(compactLayoutOverlapVertical([])).toStrictEqual([]);
  });
});

describe('compactLayoutOverlapHorizontal', () => {
  it('Should move every non-static item straight to x:0, ignoring collisions entirely', () => {
    const layout: TLayout = [
      { i: 'static', x: 0, y: 0, w: 1, h: 2, isStatic: true },
      { i: 'a', x: 5, y: 0, w: 1, h: 2 },
      { i: 'b', x: 8, y: 0, w: 1, h: 2 },
    ];

    const result = compactLayoutOverlapHorizontal(layout);

    expect(result).toStrictEqual([
      { i: 'static', x: 0, y: 0, w: 1, h: 2, isStatic: true, moved: false },
      { i: 'a', x: 0, y: 0, w: 1, h: 2, moved: false },
      { i: 'b', x: 0, y: 0, w: 1, h: 2, moved: false },
    ]);
  });

  it('Should return an empty array (not throw) when the layout is empty', () => {
    expect(compactLayoutOverlapHorizontal([])).toStrictEqual([]);
  });
});

describe(`getLayoutItem`, () => {
  it(`Should throw an exception when layout is empty`, () => {
    expect(() => getLayoutItem()).toThrowError(EErrorMessage.INVALID_LAYOUT);
  });

  it(`Should throw an exception when id is less than 0`, () => {
    expect(() => getLayoutItem(testLayoutOne, -1)).toThrowError(EErrorMessage.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is undefined`, () => {
    expect(() => getLayoutItem(testLayoutOne, undefined)).toThrowError(EErrorMessage.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is null`, () => {
    expect(() => getLayoutItem(testLayoutOne, null)).toThrowError(EErrorMessage.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is whitespace only`, () => {
    expect(() => getLayoutItem(testLayoutOne, "  ")).toThrowError(EErrorMessage.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is empty string`, () => {
    expect(() => getLayoutItem(testLayoutOne, "")).toThrowError(EErrorMessage.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should Return correct layout item when it exists by number`, () => {
    const expectedResult: ILayoutItem = {
      i: 2,
      h: 1,
      w: 2,
      x: 1,
      y: 0,
    };
    const result: ILayoutItem = getLayoutItem(testLayoutOne, 2);
    expect(result).toStrictEqual(expectedResult);
  });

  
  it(`Should Return correct layout item when it exists by string`, () => {
    const expectedResult: ILayoutItem = {
      i: "qwerty",
      h: 1,
      w: 1,
      x: 0,
      y: 0,
    };
    const result: ILayoutItem = getLayoutItem(testLayoutTwo, "qwerty");
    expect(result).toStrictEqual(expectedResult);
  });

  
  it(`Should Return correct layout item when it exists by string and case is wrong`, () => {
    const expectedResult: ILayoutItem = {
      i: "qwerty",
      h: 1,
      w: 1,
      x: 0,
      y: 0,
    };
    const result: ILayoutItem = getLayoutItem(testLayoutTwo, "QwerTy");
    expect(result).toStrictEqual(expectedResult);
  });

  it(`Should Return undefined when layout item does not exists by string`, () => {
    const result: ILayoutItem = getLayoutItem(testLayoutOne, 'abc');
    expect(result).toBe(undefined);
  });

  it(`Should Return undefined when layout item does not exists by number`, () => {
    const result: ILayoutItem = getLayoutItem(testLayoutOne, 999);
    expect(result).toBe(undefined);
  });
});

describe('setTransform', () => {
  it('Should return correct values', () => {
    const result: ITransformStyle = setTransform(1, 1, 1, 1);
    const expectedValue: ITransformStyle = {
      MozTransform: 'translate3d(1px,1px, 0)',
      OTransform: 'translate3d(1px,1px, 0)',
      WebkitTransform: 'translate3d(1px,1px, 0)',
      height: '1px',
      msTransform: 'translate3d(1px,1px, 0)',
      position: 'absolute',
      transform: 'translate3d(1px,1px, 0)',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});

describe('setTransformRtl', () => {
  it('Should return correct values', () => {
    const result: ITransformStyle = setTransformRtl(1, 1, 1, 1);
    const expectedValue: ITransformStyle = {
      MozTransform: 'translate3d(-1px,1px, 0)',
      OTransform: 'translate3d(-1px,1px, 0)',
      WebkitTransform: 'translate3d(-1px,1px, 0)',
      height: '1px',
      msTransform: 'translate3d(-1px,1px, 0)',
      position: 'absolute',
      transform: 'translate3d(-1px,1px, 0)',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});

describe('setTopLeft', () => {
  it('Should return correct values', () => {
    const result: ITopLeftStyle = setTopLeft(1, 1, 1, 1);
    const expectedValue: ITopLeftStyle = {
      height: '1px',
      position: 'absolute',
      left: '1px',
      top: '1px',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});

describe('setTopRight', () => {
  it('Should return correct values', () => {
    const result: ITopRightStyle = setTopRight(1, 1, 1, 1);
    const expectedValue: ITopRightStyle = {
      height: '1px',
      position: 'absolute',
      right: '1px',
      top: '1px',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});
