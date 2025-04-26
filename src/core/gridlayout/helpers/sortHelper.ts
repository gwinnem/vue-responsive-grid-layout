import { ILayoutItem, TLayout } from '@/components';

/**
 * Get layout items sorted from top left to right and down.
 *
 * @param  {TLayout} layout   Array of layout objects.
 * @return {TLayout}          Sorted layout
 */
export function sortLayoutItemsByRowCol(layout: TLayout): TLayout {
  const a: ILayoutItem[] = [];
  return a.concat(layout).sort((itemA, itemB) => {
    if (itemA.y === itemB.y && itemA.x === itemB.x) {
      return 0;
    }

    if (itemA.y > itemB.y || (itemA.y === itemB.y && itemA.x > itemB.x)) {
      return 1;
    }

    return -1;
  });
}
