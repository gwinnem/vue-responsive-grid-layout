import { ILayoutItem, TLayout } from '@/components/Grid/layout-definition';

/**
 * Get layout items sorted from top left to right and down — used before
 * compaction so items are processed in visual reading order, and each
 * item only collides with items already placed above/to-the-left of it.
 *
 * @param  {TLayout} layout   Array of layout objects.
 * @return {TLayout}          A new, sorted array (does not mutate `layout`).
 */
export function sortLayoutItemsByRowCol(layout: TLayout): TLayout {
  const a: ILayoutItem[] = [];
  return a.concat(layout).sort((itemA, itemB) => {
    if(itemA.y === itemB.y && itemA.x === itemB.x) {
      return 0;
    }

    if(itemA.y > itemB.y || (itemA.y === itemB.y && itemA.x > itemB.x)) {
      return 1;
    }

    return -1;
  });
}

/**
 * Get layout items sorted from top left to bottom and right — the
 * column-first counterpart to {@link sortLayoutItemsByRowCol} above,
 * used before *horizontal* compaction specifically. Processing items
 * leftmost-first (not topmost-first) means each item only collides
 * with items already placed to its left/above, mirroring
 * `sortLayoutItemsByRowCol`'s own row-major order but transposed —
 * the correct visual "reading order" for a layout that's settling
 * left-to-right instead of top-to-bottom.
 *
 * @param  {TLayout} layout   Array of layout objects.
 * @return {TLayout}          A new, sorted array (does not mutate `layout`).
 */
export function sortLayoutItemsByColRow(layout: TLayout): TLayout {
  const a: ILayoutItem[] = [];
  return a.concat(layout).sort((itemA, itemB) => {
    if(itemA.x === itemB.x && itemA.y === itemB.y) {
      return 0;
    }

    if(itemA.x > itemB.x || (itemA.x === itemB.x && itemA.y > itemB.y)) {
      return 1;
    }

    return -1;
  });
}
