import { getAllCollisions, getFirstCollision } from "@/core/gridlayout/helpers/collissionHelper";
import { ILayoutItem, TLayout } from "@/components";
import { EMovingDirections } from "@/core/common/enums/EMovingDirections";
import { TMovingDirection } from "@/core/common/types/TMovingDirections";
import { ErrorMsg } from "@/core/common/enums/ErrorMessages";
import { sortLayoutItemsByRowCol } from "@/core/gridlayout/helpers/sortHelper";



/**
 * Moving a GridItem to the correct place in the layout.
 *
 * @param {ILayoutItem}     layoutItem
 * @param {ILayoutItem}     bounds
 * @param {ILayoutItem[]}   staticItems
 */
export const moveToCorrectPlace = (layoutItem: ILayoutItem, bounds: { cols: number }, staticItems: ILayoutItem[]): void => {
  // @ts-ignore
  if (layoutItem == {} as ILayoutItem || layoutItem == null) {
    throw new Error(ErrorMsg.INVALID_LAYOUT_ITEM);
  }

  if (bounds.cols < 1) {
    throw new Error(ErrorMsg.INVALID_BOUNDS);
  }

  if (layoutItem.x + layoutItem.w > bounds.cols) {
    layoutItem.x = 0;
    layoutItem.y += 1;
  }
  // eslint-disable-next-line no-cond-assign
  while (getFirstCollision(staticItems, layoutItem)) {
    layoutItem.x += layoutItem.w;
    // move x to next place which might be able to contain it
    if (layoutItem.x + layoutItem.w > bounds.cols) {
      // if this width is out of layout
      layoutItem.y += 1; // move y to next y
      layoutItem.x = 0; // start x from 0
    }
  }
};

/**
 * Move an element. Responsible for doing cascading movements of other elements.
 *
 * @param  {TLayout}      layout              Full layout to modify.
 * @param  {ILayoutItem}  l                   element to move.
 * @param  {Number}       [x]                 X position in grid units.
 * @param  {Number}       [y]                 Y position in grid units.
 * @param  {Boolean}      [isUserAction]      If true, designates that the item we're moving is being dragged/resized by the user.
 * @param  {Boolean}      [horizontalShift]   If true, the GridItems will move left or right when the moving element is passing over a GridItem.
 * @param  {Boolean}      [preventCollision]  If true, the moving element will not be moving other elements to make space for a possible drop.
 * @return {TLayout}                          The updated layout.
 */
export function moveElement(
  layout: TLayout,
  l: ILayoutItem,
  x: number,
  y: number,
  isUserAction: boolean,
  horizontalShift: boolean,
  preventCollision?: boolean,
): TLayout {
  if (l.isStatic) {
    return layout;
  }

  if (x < 0 || y < 0) {
    throw new Error(ErrorMsg.INVALID_PARAMS)
  }
  // Short-circuit if nothing to do.
  // if (l.y === y && l.x === x) return layout;

  const oldX = l.x;
  const oldY = l.y;

  const moving = {
    DOWN: oldY < y,
    LEFT: oldX > x,
    RIGHT: oldX < x,
    UP: oldY > y,
  };

  l.x = x;
  l.y = y;
  l.moved = true;

  // If this collides with anything, move it.
  // When doing this comparison, we have to sort the items we compare with
  // to ensure, in the case of multiple collisions, that we're getting the
  // nearest collision.
  let sorted = sortLayoutItemsByRowCol(layout);

  if (moving.UP) {
    sorted = sorted.reverse();
  }

  const collisions = getAllCollisions(sorted, l);

  if (preventCollision && collisions.length) {
    l.x = oldX;
    l.y = oldY;
    l.moved = false;
    return layout;
  }

  // Move each item that collides away from this element.
  for (let i = 0, len = collisions.length; i < len; i++) {
    const collision = collisions[i];

    // Short circuit so we can't loop infinite
    if (collision.moved) {
      continue;
    }

    // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
    if (l.y > collision.y && l.y - collision.y > collision.h / 4) {
      continue;
    }

    const movingDirection = (Object.keys(moving) as EMovingDirections[]).filter(k => moving[k])?.[0];

    // Don't move static items - we have to move *this* element away
    if (collision.isStatic) {
      // eslint-disable-next-line no-use-before-define
      layout = moveElementAwayFromCollision(layout, collision, l, isUserAction, movingDirection, horizontalShift);
    } else {
      // eslint-disable-next-line no-use-before-define
      layout = moveElementAwayFromCollision(layout, l, collision, isUserAction, movingDirection, horizontalShift);
    }
  }

  return layout;
}

/**
 * This is where the magic needs to happen - given a collision, move an element away from the collision.
 * We attempt to move it up if there's room, otherwise it goes below.
 *
 * @param  {TLayout} layout             Full layout to modify.
 * @param  {ILayoutItem} collidesWith   Layout item we're colliding with.
 * @param  {ILayoutItem} itemToMove     Layout item we're moving.
 * @param  {Boolean} [isUserAction]     If true, designates that the item we're moving is being dragged/resized by the user.
 * @param  {Boolean} [movingDirection]
 * @param  {Boolean} [horizontalShift]
 * @return {TLayout}                    The modified layout.
 */
export function moveElementAwayFromCollision(
  layout: TLayout,
  collidesWith: ILayoutItem,
  itemToMove: ILayoutItem,
  isUserAction: boolean,
  movingDirection: TMovingDirection,
  horizontalShift: boolean,
): TLayout {
  const preventCollision = false; // we're already colliding
  // If there is enough space above the collision to put this element, move it there.
  // We only do this on the main collision as this can get funky in cascades and cause
  // unwanted swapping behavior.
  if (isUserAction) {
    // Make a mock item, so we don't modify the item here, only modify in moveElement.
    const fakeItem: ILayoutItem = {
      h: itemToMove.h,
      i: `-1`,
      w: itemToMove.w,
      x: itemToMove.x,
      y: itemToMove.y,
    };

    fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);

    if (!getFirstCollision(layout, fakeItem)) {
      return moveElement(layout, itemToMove, fakeItem.x, fakeItem.y, isUserAction, horizontalShift, preventCollision);
    }
  }

  const movingCordsData = {
    $default: {
      x: itemToMove.x,
      y: itemToMove.y + 1,
    },
    [EMovingDirections.LEFT]: [itemToMove.x + collidesWith.w, collidesWith.y],
    [EMovingDirections.RIGHT]: [itemToMove.x - collidesWith.w, collidesWith.y],
    [EMovingDirections.UP]: [itemToMove.x, itemToMove.y + collidesWith.h],
    [EMovingDirections.DOWN]: [itemToMove.x, itemToMove.y - collidesWith.h],
  };

  if (horizontalShift) {
    const horizontalDirection = movingDirection === EMovingDirections.LEFT || movingDirection === EMovingDirections.RIGHT;

    if (movingDirection in movingCordsData && !(horizontalDirection && collidesWith.w < itemToMove.w && collidesWith.x !== itemToMove.x)) {
      const [x, y] = movingCordsData[movingDirection];

      movingCordsData.$default.x = x;
      movingCordsData.$default.y = y;
    }
  }

  return moveElement(layout, itemToMove, movingCordsData.$default.x, movingCordsData.$default.y, horizontalShift, preventCollision);
}

