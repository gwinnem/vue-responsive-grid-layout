import {TLayout} from '@/components/Grid/layout-definition';
import {getAllStaticGridItems} from "@/core/common/helpers/gridIemTypeHelpers";
import {getFirstCollision} from "@/core/gridlayout/helpers/collissionHelper";
import {moveToCorrectPlace} from "@/core/gridlayout/helpers/moveHelper";

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
  for (let i = 0, len = staticItem.length; i < len; i++) {
    // move static item first
    // try not move their y
    while (staticItem[i].x + staticItem[i].w > bounds.cols || getFirstCollision(staticItem, staticItem[i])) {
      if(staticItem[i].x <= 0) {
        // Can not move the item more than to position 0 on x-axis.
      }
      // Moving to the left
      staticItem[i].x -= 1;
    }
  }

  for (let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];

    if (distributeEvenly) {
      // Fix for issue: https://github.com/gwinnem/vue-responsive-grid-layout/issues/2
      // it's not static, and it's out of layout
      if (!collidesWith.includes(l) && l.x + l.w > bounds.cols) {
        moveToCorrectPlace(l, bounds, collidesWith);
      }
    } else if (!distributeEvenly) {
      // Overflows right, move item to the left
      if (l.x + l.w > bounds.cols) {
        l.x = bounds.cols - l.w;
      }
    }
    // Overflows left
    // TODO experiment to get a layout where this is the case, 01.04.2023, this is not being triggered..
    if (l.x < 0) {
      l.x = 0;
      // this will cause incorrect width when drag item from outside
      // l.w = bounds.cols;
    }

    if (!l.isStatic) {
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
