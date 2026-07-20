import { ILayoutItem, TLayout } from '@/components/Grid/layout-definition';
import { collides } from '@/core/gridlayout/helpers/collision-helper';

/**
 * Finds the first available `(x, y)` slot for an item of the given
 * `w`×`h`, via a real first-fit bin-pack: scans row by row from the
 * top (`y: 0` upward), and within each row column by column from the
 * left (`x: 0` upward), returning the first position where the
 * candidate rect fits — both within `colNum` and without colliding
 * with any existing item in `layout`.
 *
 * Exists because the common "just place a new item at `x: 0, y:
 * Infinity` and let compaction settle it" pattern doesn't actually
 * bin-pack: plain vertical compaction only ever moves an item straight
 * up within its own x range, it never searches other columns for a
 * better fit. A new item hardcoded to `x: 0` never reuses a gap opened
 * up at some other column by a previously-removed item — it always
 * lands in a fresh row at the bottom instead, even when there's
 * visibly room for it much higher up. Row-major scan order (not
 * column-major) matches how a person visually scans a grid for open
 * space, and matches this library's own default top-to-bottom,
 * left-to-right compaction order, so a newly-placed item settles where
 * a human would expect it to, not merely *some* valid gap.
 *
 * Doesn't itself mutate `layout` or push anything into it — callers
 * combine the returned position with whatever item shape/id scheme
 * they're using (see the `Add or remove items` example and demo view
 * for a full `addItem` built on this).
 *
 * @param layout  The entire grid layout to search for a gap in.
 * @param colNum  The grid's own column count — a candidate slot whose
 *                `x + w` would exceed this is never considered, the
 *                same bound `GridLayout`'s own `colNum` prop enforces.
 * @param w       Width, in grid units, of the item being placed.
 * @param h       Height, in grid units, of the item being placed.
 * @return        The first `(x, y)` slot the item fits in. If every
 *                row already in use is completely full, returns
 *                `{ x: 0, y: maxY }` — one fresh row past everything
 *                currently occupied, the correct behavior once there
 *                genuinely is no gap anywhere, not a fallback masking
 *                a bug.
 */
export function findFirstFitSlot(layout: TLayout, colNum: number, w: number, h: number): { x: number; y: number } {
  const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  for(let y = 0; y <= maxY; y++) {
    for(let x = 0; x <= colNum - w; x++) {
      const candidate = { h, i: `__find-first-fit-slot-candidate__`, w, x, y } as ILayoutItem;
      if(!layout.some(item => collides(candidate, item))) {
        return { x, y };
      }
    }
  }
  return { x: 0, y: maxY };
}
