import { TMovingDirection } from '@/core/helpers/moving-directions';
import { ILayoutItem, TLayout } from '@/components/Grid/layout-definition';
import {EMovingDirections} from "@/core/enums/EMovingDirections";

/**
 * Get all static elements.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of static layout items.
 * @throws {String}       Empty layout not allowed.
 */
// eslint-disable-next-line no-undef
export function getStatics(layout: TLayout): ILayoutItem[] {
  if(layout.length === 0) {
    throw new Error('Empty layout not allowed');
  }
  return layout.filter(l => l.isStatic);
}

/**
 * Return the bottom coordinate of the layout.
 *
 * @param  {Array} layout Layout array.
 * @return {Number}       Bottom coordinate.
 */
export function bottom(layout: TLayout): number {
  let max = 0;
  let bottomY;
  for(let i = 0, len = layout.length; i < len; i++) {
    bottomY = layout[i].y + layout[i].h;
    if(bottomY > max) max = bottomY;
  }
  return max;
}

// Fast path to cloning, since this is monomorphic
export function cloneLayoutItem(layoutItem: ILayoutItem): ILayoutItem {
  return JSON.parse(JSON.stringify(layoutItem));
}

export function cloneLayout(layout: TLayout): TLayout {
  const newLayout = Array(layout.length);
  for(let i = 0, len = layout.length; i < len; i++) {
    newLayout[i] = cloneLayoutItem(layout[i]);
  }
  return newLayout;
}

/**
 * Given two layout items, check if they collide.
 *
 * @return {Boolean}   True if colliding.
 */
export function collides(l1: ILayoutItem, l2: ILayoutItem): boolean {
  if(l1 === l2) return false; // same element
  if(l1.x + l1.w <= l2.x) return false; // l1 is left of l2
  if(l1.x >= l2.x + l2.w) return false; // l1 is right of l2
  if(l1.y + l1.h <= l2.y) return false; // l1 is above l2
  if(l1.y >= l2.y + l2.h) return false; // l1 is below l2
  return true; // boxes overlap
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
  if(layout.length < 1) {
    throw new Error('Empty layout');
  }

  for(let i = 0, len = layout.length; i < len; i++) {
    if(collides(layout[i], layoutItem)) {
      return layout[i];
    }
  }
  return undefined;
}

/**
 * Get layout items sorted from top left to right and down.
 *
 * @param  {TLayout} layout  Array of layout objects.
 * @return {TLayout}        Layout, sorted static items first.
 */
export function sortLayoutItemsByRowCol(layout: TLayout): TLayout {
  const a: ILayoutItem[] = [];
  return a.concat(layout)
    .sort((itemA, itemB) => {
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
 * Compact a GridItem in the layout.
 */
export function compactItem(
  compareWith: TLayout,
  l: ILayoutItem,
  verticalCompact: boolean,
  minPositions?: any,
): ILayoutItem {
  if(verticalCompact) {
    // Move the element up as far as it can go without colliding.
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  } else if(minPositions) {
    const minY = minPositions[l.i].y;
    while (l.y > minY && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  }

  // Move it down, and keep moving it down if it's colliding.
  let collisions;
  // eslint-disable-next-line no-cond-assign
  while ((collisions = getFirstCollision(compareWith, l))) {
    l.y = collisions.y + collisions.h;
  }
  return l;
}

/**
 * Given a layout, compact it. This involves going down each y coordinate and removing gaps
 * between items.
 *
 * @param   {TLayout} layout          Layout.
 * @param   {Boolean} verticalCompact Whether or not to compact the layout vertically.
 * @param   {Object}  minPositions
 * @return  {TLayout}                 Compacted Layout.
 */
export function compactLayout(layout: TLayout, verticalCompact: boolean, minPositions?: any): TLayout {
  // Statics go in the compareWith array right away so items flow around them.
  const compareWith = getStatics(layout);
  // We go through the items by row and column.
  const sorted = sortLayoutItemsByRowCol(layout);
  // Holding for new items.
  const out: TLayout = Array(layout.length);

  for(let i = 0, len = sorted.length; i < len; i++) {
    let l = sorted[i];

    // Don't move static elements
    if(!l.isStatic) {
      l = compactItem(compareWith, l, verticalCompact, minPositions);

      // Add to comparison array. We only collide with items before this one.
      // Statics are already in this array.
      compareWith.push(l);
    }

    // Add to output array to make sure they still come out in the right order.
    out[layout.indexOf(l)] = l;

    // Clear moved flag, if it exists.
    l.moved = false;
  }
  return out;
}

/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 *
 * @param  {Array}  layout Layout array.
 * @param  {String} id     ID
 * @return {ILayoutItem}    Item at ID.
 */
export function getLayoutItem(
  layout: TLayout,
  id: string | number | undefined,
): ILayoutItem | undefined {
  for(let i = 0, len = layout.length; i < len; i++) {
    if(layout[i].i === id) {
      return layout[i];
    }
  }
  return undefined;
}

export function getAllCollisions(layout: TLayout, layoutItem: ILayoutItem): ILayoutItem[] {
  return layout.filter(l => collides(l, layoutItem));
}

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
  if(l.isStatic) {
    return layout;
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

  if(moving.UP) {
    sorted = sorted.reverse();
  }

  const collisions = getAllCollisions(sorted, l);

  if(preventCollision && collisions.length) {
    l.x = oldX;
    l.y = oldY;
    l.moved = false;
    return layout;
  }

  // Move each item that collides away from this element.
  for(let i = 0, len = collisions.length; i < len; i++) {
    const collision = collisions[i];

    // Short circuit so we can't loop infinite
    if(collision.moved) {
      continue;
    }

    // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
    if(l.y > collision.y && l.y - collision.y > collision.h / 4) {
      continue;
    }

    const movingDirection = (Object.keys(moving) as EMovingDirections[]).filter(k => moving[k])?.[0];

    // Don't move static items - we have to move *this* element away
    if(collision.isStatic) {
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
  if(isUserAction) {
    // Make a mock item, so we don't modify the item here, only modify in moveElement.
    const fakeItem: ILayoutItem = {
      h: itemToMove.h,
      i: `-1`,
      w: itemToMove.w,
      x: itemToMove.x,
      y: itemToMove.y,
    };

    fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);

    if(!getFirstCollision(layout, fakeItem)) {
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

  if(horizontalShift) {
    const horizontalDirection = movingDirection === EMovingDirections.LEFT || movingDirection === EMovingDirections.RIGHT;

    if(movingDirection in movingCordsData && !(horizontalDirection && collidesWith.w < itemToMove.w && collidesWith.x !== itemToMove.x)) {
      const [x, y] = movingCordsData[movingDirection];

      movingCordsData.$default.x = x;
      movingCordsData.$default.y = y;
    }
  }

  return moveElement(layout, itemToMove, movingCordsData.$default.x, movingCordsData.$default.y, horizontalShift, preventCollision);
}

export interface ITransformStyle {
  transform: string;
  WebkitTransform: string;
  MozTransform: string;
  msTransform: string;
  OTransform: string;
  width: string;
  height: string;
  position: `absolute` | `relative`;
}

/**
 * Returns default direction
 *
 * @param top
 * @param left
 * @param width
 * @param height
 * @returns {ITransformStyle}
 */
export function setTransform(
  top: number,
  left: number,
  width: number,
  height: number,
): ITransformStyle {
  // Replace unit less items with px
  const translate = `translate3d(${left}px,${top}px, 0)`;
  return {
    MozTransform: translate,
    OTransform: translate,
    WebkitTransform: translate,
    height: `${height}px`,
    msTransform: translate,
    position: `absolute`,
    transform: translate,
    width: `${width}px`,
  };
}

/**
 * Just like the setTransform method, but instead it will return a negative value of right.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {ITransformStyle}
 */
export function setTransformRtl(
  top: number,
  right: number,
  width: number,
  height: number,
): ITransformStyle {
  // Replace unit less items with px
  const translate = `translate3d(${right * -1}px,${top}px, 0)`;
  return {
    MozTransform: translate,
    OTransform: translate,
    WebkitTransform: translate,
    height: `${height}px`,
    msTransform: translate,
    position: `absolute`,
    transform: translate,
    width: `${width}px`,
  };
}

export interface ITopLeftStyle {
  top: string;
  left: string;
  width: string;
  height: string;
  position: `absolute`;
}

export function setTopLeft(top: number, left: number, width: number, height: number): ITopLeftStyle {
  return {
    height: `${height}px`,
    left: `${left}px`,
    position: `absolute`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

export interface ITopRightStyle {
  top: string;
  right: string;
  width: string;
  height: string;
  position: string;
}

/**
 * Just like the setTopLeft method, but instead, it will return a right property instead of left.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {ITopRightStyle}
 */
export function setTopRight(
  top: number,
  right: number,
  width: number,
  height: number,
): ITopRightStyle {
  return {
    height: `${height}px`,
    position: `absolute`,
    right: `${right}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}

/**
 * Validate a layout. Throws errors.
 *
 * @param  {Array}  layout        Array of layout items.
 * @param  {String} [contextName] Context name for errors.
 * @throw  {Error}                Validation error.
 */
export function validateLayout(layout: TLayout, contextName?: string): void {
  contextName = contextName || `Layout`;
  const subProps = [`x`, `y`, `w`, `h`];
  const keyArr = [];

  for(let i = 0, len = layout.length; i < len; i++) {
    const item = layout[i];
    for(let j = 0; j < subProps.length; j++) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if(typeof item[subProps[j]] !== `number`) {
        throw new Error(
          `VueResponsiveGridLayout: ${contextName}[${i}].${subProps[j]} must be a number!`,
        );
      }
    }

    if(item.i === undefined || item.i === null) {
      throw new Error(`VueResponsiveGridLayout: ${contextName}[${i}].i cannot be null!`);
    }

    if(keyArr.indexOf(item.i) >= 0) {
      throw new Error(`VueResponsiveGridLayout: ${contextName}[${i}].i must be unique!`);
    }
    keyArr.push(item.i);

    // TODO this a wrong assumption since it can be undefined
    if(item.isStatic === null) {
      throw new Error(`VueResponsiveGridLayout: ${contextName}[${i}].isStatic must be a boolean!, actual value is: ${item.isStatic}`);
    }
  }
}
