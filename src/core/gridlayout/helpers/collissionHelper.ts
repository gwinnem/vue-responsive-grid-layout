import {ILayoutItem, TLayout} from "@/components";
import {ErrorMsg} from "@/core/common/enums/ErrorMessages";

/**
 * Given two layout items, check if they collide.
 *
 * @return {Boolean}   True if colliding.
 */
export function collides(l1: ILayoutItem, l2: ILayoutItem): boolean {
  if(l1 === undefined || l2 === undefined || l1 === null || l2 === null) {
    throw new Error(ErrorMsg.INVALID_PARAMS);
  }

  if (l1 === l2) return false; // same element
  if (l1.y + l1.h <= l2.y) return false; // l1 is above l2
  if (l1.y >= l2.y + l2.h) return false; // l1 is below l2
  if (l1.x + l1.w <= l2.x) return false; // l1 is left of l2
  if (l1.x >= l2.x + l2.w) return false; // l1 is right of l2
  return true; // boxes overlap
}

/**
 * Returns all the items which collides in the layout
 * It doesn't appear to matter which order we approach this from, although
 * perhaps that is the wrong thing to do.
 *
 * @param  {TLayout}     layout     The entire grid layout.
 * @param  {ILayoutItem} layoutItem Layout item.
 * @return {ILayoutItem|undefined}  A colliding layout item, or undefined.
 * @throws {Error}                  Empty layout.
 */
export function getAllCollisions(layout: TLayout, layoutItem: ILayoutItem): ILayoutItem[] {
  if(layout === undefined || layout.length === 0 || layoutItem === undefined) {
    throw new Error(ErrorMsg.INVALID_PARAMS);
  }
  return layout.filter(l => collides(l, layoutItem));
}

/**
 * Returns the first item this layout collides with.
 * It doesn't appear to matter which order we approach this from, although
 * perhaps that is the wrong thing to do.
 *
 * @param  {TLayout}     layout     The entire grid layout.
 * @param  {ILayoutItem} layoutItem Layout item.
 * @return {ILayoutItem|undefined}  A colliding layout item, or undefined.
 * @throws {Error}                  Empty layout.
 */
export function getFirstCollision(layout: TLayout, layoutItem: ILayoutItem): ILayoutItem | undefined {

  if(layout === undefined || layout.length === 0 || layoutItem === undefined) {
    return undefined;
  }

  // if layout doesnt have static item it will cause error
  // cannot drag or do anything

  for (let i = 0, len = layout.length; i < len; i++) {
    if (collides(layout[i], layoutItem)) {
      return layout[i];
    }
  }
  return undefined;
}
