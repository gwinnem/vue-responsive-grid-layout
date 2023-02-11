import { CSSProperties } from 'vue';
import {
  TLayout,
  TLayoutItem,
  TMovingDirection,
} from '../types/helpers';
import { EMovingDirections } from '../enums/EMovingDirections';

export const bottom = (layout: TLayout): number => {
  let max = 0;
  let bottomY: number;

  for(let i = 0; i < layout.length; i++) {
    bottomY = layout[i].y + layout[i].h;

    if(bottomY > max) {
      max = bottomY;
    }
  }

  return max;
};

export const cloneLayoutItem = (layoutItem: TLayoutItem): TLayoutItem => JSON.parse(JSON.stringify(layoutItem));
export const cloneLayout = (layout: TLayout): TLayout => {
  const newLayout = Array(layout.length);

  for(let i = 0; i < layout.length; i++) {
    newLayout[i] = cloneLayoutItem(layout[i]);
  }

  return newLayout;
};

export const collides = (l1: TLayoutItem, l2: TLayoutItem): boolean => {
  // return !(l1 === l2 || l1.x + l1.w <= l2.x || l1.x >= l2.x + l2.w || l1.y + l1.h <= l2.y || l1.y >= l2.y + l2.h);
  if(l1 === l2) return false; // same element
  if(l1.x + l1.w <= l2.x) return false; // l1 is left of l2
  if(l1.x >= l2.x + l2.w) return false; // l1 is right of l2
  if(l1.y + l1.h <= l2.y) return false; // l1 is above l2
  if(l1.y >= l2.y + l2.h) return false; // l1 is below l2
  return true; // boxes overlap
};

/**
 * Returns the first item this layout collides with.
 * It doesn't appear to matter which order we approach this from, although perhaps that is the wrong thing to do.
 *
 * @param  {TLayout}      layout       The layout.
 * @param  {TLayoutItem}  layoutItem   Layout item.
 * @return {TLayoutItem|undefined}     A colliding layout item, or undefined.
 */
export const getFirstCollision = (layout: TLayout, layoutItem: TLayoutItem): TLayoutItem | undefined => {
  for(let i = 0, len = layout.length; i < len; i++) {
    if(collides(layout[i], layoutItem)) {
      return layout[i];
    }
  }
  return undefined;
};

/**
 * Get all static elements in a layout.
 * @param  {TLayout} layout       The layout.
 * @return {TLayoutItem[]}        Array of static layout items..
 */
export const getStaticGridItems = (layout: TLayout): TLayoutItem[] => {
  return layout.filter(l => l.static);
};

/**
 * Get layout items sorted from top left to right and down.
 *
 * @return {Array} Array of layout objects.
 * @return {Array}        Layout, sorted static items first.
 */
export const sortLayoutItemsByRowCol = (layout: TLayout): TLayout => {
  return [...layout].sort((a, b) => {
    if(a.y === b.y && a.x === b.x) return 0;

    if(a.y > b.y || (a.y === b.y && a.x > b.x)) return 1;

    return -1;
  });
};

/**
 * Compact an item in the layout.
 */
export const compactItem = (compareWith: TLayout, l: TLayoutItem, verticalCompact: boolean): TLayoutItem => {
  if(verticalCompact) {
    // Move the element up as far as it can go without colliding.
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  }

  // Move the element down, and keep moving it down if it's colliding.
  let collisions;

  // eslint-disable-next-line no-cond-assign
  while ((collisions = getFirstCollision(compareWith, l))) {
    l.y = collisions.y + collisions.h;
  }

  return l;
};

/**
 * Given a layout, compact it. This involves going down each y coordinate and removing gaps
 * between items.
 *
 * @param  {Array}   layout           Layout.
 * @param  {Boolean} verticalCompact  Whether or not to compact the layout vertically.
 * @return {Array}                    Compacted Layout.
 */
export const compact = (layout: TLayout, verticalCompact: boolean): TLayout | undefined => {
  if(!layout) {
    return;
  }

  const compareWith = getStaticGridItems(layout);
  const sorted = sortLayoutItemsByRowCol(layout);
  const out = Array(layout.length);

  for(let i = 0; i < sorted.length; i++) {
    let l = sorted[i];

    // Don't move static elements
    if(!l.static) {
      l = compactItem(compareWith, l, verticalCompact);
      // Add to comparison array. We only collide with items before this one.
      // Statics are already in this array.
      compareWith.push(l);
    }
    // Add to output array to make sure they still come out in the right order.
    out[layout.indexOf(l)] = l;

    // Clear moved flag, if it exists.
    l.moved = false;
  }

  // eslint-disable-next-line consistent-return
  return out;
};

/**
 * Given a layout, make sure all elements fit within its bounds.
 *
 * @param  {Array}  layout Layout array.
 * @param  {Number} bounds Number of columns.
 * @return {TLayout}       Updated layout
 */
export const correctBounds = (layout: TLayout, bounds: { cols: number }): TLayout => {
  const collidesWith = getStaticGridItems(layout);

  for(let i = 0; i < layout.length; i++) {
    const l = layout[i];

    // Overflows right
    if(l.x + l.w > bounds.cols) {
      l.x = bounds.cols - l.w;
    }

    // Overflows left
    if(l.x < 0) {
      l.x = 0;
      l.w = bounds.cols;
    }

    if(!l.static) {
      collidesWith.push(l);
    } else {
      // If this is static and collides with other statics, we must move it down.
      // We have to do something nicer than just letting them overlap.
      while (getFirstCollision(collidesWith, l)) {
        l.y++;
      }
    }
  }

  return layout;
};

/**
 * Getting all items in a layout that an item collides with.
 * @param   {TLayout}     layout      The layout.
 * @param   {TLayoutItem} layoutItem  The item in the layout.
 * @return  {TLayoutItem[]}           All items in the layout the item is colliding with.
 */
export const getAllCollisions = (layout: TLayout, layoutItem: TLayoutItem): TLayoutItem[] => {
  return layout.filter(l => collides(l, layoutItem));
};

/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 *
 * @param  {TLayout}      layout  Layout array.
 * @param  {String}       id      ID.
 * @return {TLayoutItem}          Item at ID.
 */
export const getLayoutItem = (layout: TLayout, id: number): TLayoutItem | undefined => {
  for(let i = 0, len = layout.length; i < len; i++) {
    if(layout[i].i === id) {
      return layout[i];
    }
  }
  return undefined;
};
// TODO refactor this back export const getLayoutItem = (layout: TLayout, id: number): TLayoutItem => layout.filter(l => l.i === id)[0];

/**
 *
 * @param   {TLayout}           layout            The layout to modify.
 * @param   {TLayoutItem}       collidesWith      The item it collides with.
 * @param   {TLayoutItem}       itemToMove        The item to move.
 * @param   {Boolean}           isUserAction      If true, designates that the item we're moving is being dragged/resized by the user.
 * @param   {TMovingDirection}  movingDirection   The direction the item is moving in.
 * @param   {Boolean}           horizontalShift   if true, the item will be moved horizontally instead of vertically.
 * @return  {TLayout}                             The modified layout.
 */
export const moveElementAwayFromCollision = (
  layout: TLayout,
  collidesWith: TLayoutItem,
  itemToMove: TLayoutItem,
  isUserAction: boolean,
  movingDirection: TMovingDirection,
  horizontalShift: boolean,
): TLayout => {
  // we're already colliding.
  const preventCollision = false;

  // If there is enough space above the collision to put this element, move it there.
  // We only do this on the main collision as this can get funky in cascades and cause
  // unwanted swapping behavior.
  if(isUserAction) {
    // Make a mock item, so we don't modify the item here, only modify in moveElement.
    const fakeItem: TLayoutItem = {
      h: itemToMove.h,
      i: -1,
      w: itemToMove.w,
      x: itemToMove.x,
      y: Math.max(collidesWith.y - itemToMove.h, 0),
    };

    if(!getFirstCollision(layout, fakeItem)) {
      // eslint-disable-next-line no-use-before-define
      return moveElement(layout, itemToMove, fakeItem.x, fakeItem.y, isUserAction, horizontalShift, preventCollision);
    }
  }

  const movingCordsData = {
    default: {
      x: itemToMove.x,
      y: itemToMove.y + 1,
    },
    [EMovingDirections.LEFT]: [itemToMove.x + collidesWith.w, collidesWith.y],
    [EMovingDirections.RIGHT]: [itemToMove.x - collidesWith.w, collidesWith.y],
    [EMovingDirections.UP]: [itemToMove.x, itemToMove.y + collidesWith.h],
    [EMovingDirections.DOWN]: [itemToMove.x, itemToMove.y - collidesWith.h],
  };

  // TODO This can only be done when there is space left or right.
  if(horizontalShift) {
    const horizontalDirection = movingDirection === EMovingDirections.LEFT || movingDirection === EMovingDirections.RIGHT;

    if(movingDirection in movingCordsData && !(horizontalDirection && collidesWith.w < itemToMove.w && collidesWith.x !== itemToMove.x)) {
      const [x, y] = movingCordsData[movingDirection];

      movingCordsData.default.x = x;
      movingCordsData.default.y = y;
    }
  }

  // Previously this was optimized to move below the collision directly, but this can cause problems
  // with cascading moves, as an item may actually leap flog a collision and cause a reversal in order.
  // eslint-disable-next-line no-use-before-define
  return moveElement(layout, itemToMove, movingCordsData.default.x, movingCordsData.default.y, horizontalShift, preventCollision);
  // return moveElement(layout, itemToMove, -1, itemToMove.y + 1, horizontalShift, preventCollision);
};

/**
 * Move an element. Responsible for doing cascading movements of other elements.
 *
 * @param {TLayout}     layout              The layout to modify.
 * @param {TLayoutItem} l                   The item to move.
 * @param {Number}      x                   x position in the grid in units.
 * @param {Number}      y                   y position in the grid in units.
 * @param {Boolean}     isUserAction        If true, designates that the item we're moving is being dragged/resized by the user.
 * @param {Boolean}     horizontalShift     If true, items will be shifted horizontally instead of vertically.
 * @param {Boolean}     preventCollision    If true :(
 * @return
 */
export const moveElement = (
  layout: TLayout,
  l: TLayoutItem,
  x: number,
  y: number,
  isUserAction: boolean,
  horizontalShift: boolean,
  preventCollision?: boolean,
): TLayout => {
  // Do nothing it the GridItem is static.
  if(l.static) {
    return layout;
  }

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
  if(moving.UP) sorted = sorted.reverse();
  const collisions = getAllCollisions(sorted, l);

  if(preventCollision && collisions.length) {
    l.x = oldX;
    l.y = oldY;
    l.moved = false;

    return layout;
  }

  // Move each item that collides away from this element.
  for(let i = 0; i < collisions.length; i++) {
    const collision = collisions[i];

    // Short circuit so we can't loop infinite.
    if(collision.moved) {
      continue;
    }

    // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
    if(l.y > collision.y && l.y - collision.y > collision.h / 4) {
      continue;
    }

    const movingDirection = (Object.keys(moving) as EMovingDirections[]).filter(k => moving[k])?.[0];

    // Don't move static items - we have to move *this* element away
    if(collision.static) {
      // eslint-disable-next-line no-param-reassign
      layout = moveElementAwayFromCollision(layout, collision, l, isUserAction, movingDirection, horizontalShift);
    } else {
      // eslint-disable-next-line no-param-reassign
      layout = moveElementAwayFromCollision(layout, l, collision, isUserAction, movingDirection, horizontalShift);
    }
  }

  return layout;
};

/**
 * Computing left property.
 * @param   {Number}          top       Top position of the item.
 * @param   {Number}          left      Left position of the item.
 * @param   {Number}          width     Width of the item.
 * @param   {Number}          height    Height of the item.
 * @return  {CSSProperties}             The computed properties.
 */
export const setTopLeft = (top: number, left: number, width: number, height: number): CSSProperties => ({
  height: `${height}px`,
  left: `${left}px`,
  position: `absolute`,
  top: `${top}px`,
  width: `${width}px`,
});

/**
 * Just like the setTopLeft method, but instead, it will return a right property instead of left.
 * @param   {Number}          top       Top position of the item.
 * @param   {Number}          right     Right position of the item.
 * @param   {Number}          width     Width of the item.
 * @param   {Number}          height    Height of the item.
 * @return  {CSSProperties}             The computed properties.
 */
export const setTopRight = (top: number, right: number, width: number, height: number): CSSProperties => {
  return {
    height: `${height}px`,
    position: `absolute`,
    right: `${right}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
};

/**
 * Computing the transform CSS properties.
 * @param   {Number}          top       Top position of the item.
 * @param   {Number}          left      Left position of the item.
 * @param   {Number}          width     Width of the item.
 * @param   {Number}          height    Height of the item.
 * @return  {CSSProperties}             The computed properties.
 */
export const setTransform = (top: number, left: number, width: number, height: number): CSSProperties => {
  // Replace unit less items with px
  const translate = `translate3d(${left}px,${top}px, 0)`;
  return {
    OTransform: `${translate}`,
    WebkitTransform: `${translate}`,
    height: `${height}px`,
    msTransform: `${translate}`,
    position: `absolute`,
    transform: `${translate}`,
    width: `${width}px`,
  };
};

/**
 * Just like the setTransform method, but instead it will return a negative value of right.
 *
 * @param   {Number}          top       Top position of the item.
 * @param   {Number}          right     Right position of the item.
 * @param   {Number}          width     Width of the item.
 * @param   {Number}          height    Height of the item.
 * @return  {CSSProperties}             The computed properties.
 */
export const setTransformRtl = (top: number, right: number, width: number, height: number): CSSProperties => {
  // Replace unit less items with px
  const translate = `translate3d(${right * -1}px,${top}px, 0)`;
  return {
    OTransform: translate,
    WebkitTransform: translate,
    height: `${height}px`,
    msTransform: translate,
    position: `absolute`,
    transform: translate,
    width: `${width}px`,
  };
};

/**
 * Validate a layout. Throws errors.
 *
 * @param  {TLayout[]}  layout        Array of layout items.
 * @param  {String}     contextName   Context name for errors.
 * @throw  {Error}                    Validation error.
 */
export function validateLayout(layout: TLayout, contextName = `Layout`): void {
  const subProps = [`x`, `y`, `w`, `h`];
  if(!Array.isArray(layout)) throw new Error(`${contextName} must be an array!`);
  for(let i = 0, len = layout.length; i < len; i++) {
    const item = layout[i];
    for(let j = 0; j < subProps.length; j++) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if(typeof item[subProps[j]] !== `number`) {
        throw new Error(`VueGridLayout: ${contextName}[${i}].${subProps[j]} must be a number!`);
      }
    }
    if(item.i && typeof item.i !== `string`) {
      // number is also ok, so comment the error
      // TODO confirm if commenting the line below doesn't cause unexpected problems
      // throw new Error('VueGridLayout: ' + contextName + '[' + i + '].i must be a string!');
    }
    if(item.static !== undefined && typeof item.static !== `boolean`) {
      throw new Error(`VueGridLayout: ${contextName}[${i}].static must be a boolean!`);
    }
  }
}

/**
 * Helper for replacing string values.
 * @param   {String}            orgValue
 * @param   {String}            value       The value to be replaced.
 * @param   {String}            replacer    The value to be used for replacing.
 * @return  {String}                        The updated string.
 */
export const stringReplacer = (orgValue: string, value: string, replacer: string): string => {
  return orgValue
    .trim()
    .replace(value, replacer);
};
