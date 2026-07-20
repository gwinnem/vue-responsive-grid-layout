import { TLayout } from '@/components/Grid/layout-definition';
import { getAllStaticGridItems } from '@/core/common/helpers/grid-item-type-helpers';
import { getFirstCollision } from '@/core/gridlayout/helpers/collision-helper';
import { moveToCorrectPlace } from '@/core/gridlayout/helpers/move-helper';

/**
 * Given a layout, make sure all elements fit within its bounds.
 *
 * @param     {TLayout}  layout             Layout array.
 * @param     {Number}  bounds              Number of columns.
 * @param     {Boolean} distributeEvenly    Enforces that a grid item is moved all the way to left/right when there is available space for it
 * @returns   {TLayout}                     The new adjusted layout.
 */
export function correctBounds(layout: TLayout, bounds: { cols: number }, distributeEvenly: boolean): TLayout {
  const collidesWith = getAllStaticGridItems(layout);
  const staticItem = getAllStaticGridItems(layout);
  for(let i = 0, len = staticItem.length; i < len; i++) {
    // move static item first
    // try not move their y
    while (staticItem[i].x + staticItem[i].w > bounds.cols || getFirstCollision(staticItem, staticItem[i])) {
      // Moving to the left
      staticItem[i].x -= 1;
    }
  }

  for(let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];

    if(distributeEvenly) {
      // Fix for issue: https://github.com/gwinnem/vue-responsive-grid-layout/issues/2
      // it's not static, and it's out of layout
      if(!collidesWith.includes(l) && l.x + l.w > bounds.cols) {
        moveToCorrectPlace(l, bounds, collidesWith);
      }
    } else if(!distributeEvenly) {
      // Overflows right, move item to the left
      if(l.x + l.w > bounds.cols) {
        l.x = bounds.cols - l.w;
      }
    }
    // Overflows left — reachable both from directly-negative input and as
    // a side effect of the overflow-right correction above, when an
    // item's own `w` exceeds the *new* breakpoint's column count (see
    // tests/responsive-utils.spec.ts and docs/REFACTORING.md #54 — a
    // stale `// TODO ... this is not being triggered` comment sat here
    // since 2023 until this was actually confirmed one way or the other).
    if(l.x < 0) {
      l.x = 0;
      // this will cause incorrect width when drag item from outside
      // l.w = bounds.cols;
    }

    if(!l.isStatic) {
      collidesWith.push(l);
    }
    // this will cause the item which is real static be moved
    // else {
    //   // If this is static and collides with other statics, we must move it down.
    //   // We have to do something nicer than just letting them overlap.
    //   while (getFirstCollision(collidesWith, l)) {
    //     l.y++;
    //   }
    // }
  }
  return layout;
}
