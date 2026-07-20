import { TLayout } from '@/components/Grid/layout-definition';
import { EErrorMessage } from '@/core/common/enums/ErrorMessages';

/**
 * Return the bottom-most occupied row (`y + h`, maximized across every
 * item) of a layout — used by `GridLayout`'s `containerHeight()` to size
 * the container when `autoSize` is enabled.
 *
 * @param  {Array} layout Layout array.
 * @return {Number}       Bottom coordinate, in grid row units — `0` for an empty layout (see docs/REFACTORING.md #9/#33: no items means nothing occupies any row, not an error).
 * @throws {Error}        `EErrorMessage.INVALID_LAYOUT` if `layout` is `undefined` (still genuinely invalid — an empty array and a missing one aren't the same thing).
 */
export function getBottomYCoordinate(layout: TLayout): number {
  if(layout === undefined) {
    throw new Error(EErrorMessage.INVALID_LAYOUT);
  }
  if(layout.length === 0) {
    return 0;
  }
  let max = 0;
  let bottomY;
  for(let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].y + layout[i].h;
    if(bottomY > max) max = bottomY;
  }
  return max;
}
