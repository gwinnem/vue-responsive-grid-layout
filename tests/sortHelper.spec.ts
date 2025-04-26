// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { sortLayoutItemsByRowCol } from '../src/core/gridlayout/helpers/sortHelper';
import { TLayout } from '../src/components';

describe('sortLayoutItemsByRowCol', () => {
  it('Should return correct sorted layout', () => {
    const unsortedLayout: TLayout = [
      { h: 1, i: 5, w: 2, x: 4, y: 0 },
      { h: 4, i: 6, w: 4, x: 0, y: 1 },
      { h: 2, i: 7, w: 2, x: 4, y: 1 },
      { h: 1, i: 1, w: 1, x: 0, y: 0 },
      { h: 1, i: 4, w: 1, x: 3, y: 0 },
      { h: 1, i: 2, w: 1, x: 1, y: 0 },
      { h: 1, i: 3, w: 1, x: 2, y: 0 },
      { h: 2, i: 8, w: 2, x: 4, y: 3 },
    ];

    const sortedLayout: TLayout = [
      { h: 1, i: 1, w: 1, x: 0, y: 0 },
      { h: 1, i: 2, w: 1, x: 1, y: 0 },
      { h: 1, i: 3, w: 1, x: 2, y: 0 },
      { h: 1, i: 4, w: 1, x: 3, y: 0 },
      { h: 1, i: 5, w: 2, x: 4, y: 0 },
      { h: 4, i: 6, w: 4, x: 0, y: 1 },
      { h: 2, i: 7, w: 2, x: 4, y: 1 },
      { h: 2, i: 8, w: 2, x: 4, y: 3 },
    ];

    const result = sortLayoutItemsByRowCol(unsortedLayout);
    expect(result).toStrictEqual(sortedLayout);
  });

  it('Should return correct sorted layout when layout items are colliding', () => {
    const unsortedLayout: TLayout = [
        { h: 1, i: 1, w: 1, x: 0, y: 0 },
        { h: 1, i: 2, w: 1, x: 1, y: 0 },
        { h: 1, i: 4, w: 1, x: 0, y: 0 },
    ];

    const sortedLayout: TLayout = [
      { h: 1, i: 1, w: 1, x: 0, y: 0 },
      { h: 1, i: 4, w: 1, x: 0, y: 0 },
      { h: 1, i: 2, w: 1, x: 1, y: 0 },
    ];

    const result = sortLayoutItemsByRowCol(unsortedLayout);
    expect(result).toStrictEqual(sortedLayout);
  });
});
