export interface ILayoutItemRequired {
  w: number;
  h: number;
  x: number;
  y: number;
  i: string | number;
}

export type TLayoutItem = ILayoutItemRequired & {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  moved?: boolean;
  isStatic?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export type TLayout = TLayoutItem[]

export type TSizeWH = { w: number; h: number }

/**
 * Get all static elements.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of static layout items..
 */
export function getStatics(layout: TLayout): TLayoutItem[] {
  // return [];
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
export function cloneLayoutItem(layoutItem: TLayoutItem): TLayoutItem {
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
export function collides(l1: TLayoutItem, l2: TLayoutItem): boolean {
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
 * @param  {TLayoutItem} layoutItem Layout item.
 * @return {TLayoutItem|undefined}  A colliding layout item, or undefined.
 */
export function getFirstCollision(layout: TLayout, layoutItem: TLayoutItem): TLayoutItem | undefined {
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
 * @return {Array} Array of layout objects.
 * @return {Array}        Layout, sorted static items first.
 */
export function sortLayoutItemsByRowCol(layout: TLayout): TLayout {
  const a: TLayoutItem[] = [];
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
 * Compact an item in the layout.
 */
export function compactItem(
  compareWith: TLayout,
  l: TLayoutItem,
  verticalCompact: boolean,
  minPositions?: any,
): TLayoutItem {
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
 * @param  {Array} layout Layout.
 * @param  {Boolean} verticalCompact Whether or not to compact the layout
 *   vertically.
 * @param {Object} minPositions
 * @return {Array}       Compacted Layout.
 */
export function compact(layout: TLayout, verticalCompact: boolean, minPositions?: any): TLayout {
  // Statics go in the compareWith array right away so items flow around them.
  const compareWith = getStatics(layout);
  // We go through the items by row and column.
  const sorted = sortLayoutItemsByRowCol(layout);
  // Holding for new items.
  const out = Array(layout.length);

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
 * Given a layout, make sure all elements fit within its bounds.
 *
 * @param  {Array} layout Layout array.
 * @param  {Number} bounds Number of columns.
 */
export function correctBounds(layout: TLayout, bounds: { cols: number }): TLayout {
  const collidesWith = getStatics(layout);
  for(let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];
    // Overflows right
    if(l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;
    // Overflows left
    if(l.x < 0) {
      l.x = 0;
      l.w = bounds.cols;
    }
    if(!l.isStatic) {
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
}

/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 *
 * @param  {Array}  layout Layout array.
 * @param  {String} id     ID
 * @return {TLayoutItem}    Item at ID.
 */
export function getLayoutItem(
  layout: TLayout,
  id: string | number | undefined,
): TLayoutItem | undefined {
  for(let i = 0, len = layout.length; i < len; i++) {
    if(layout[i].i === id) {
      return layout[i];
    }
  }
  return undefined;
}

export function getAllCollisions(layout: TLayout, layoutItem: TLayoutItem): TLayoutItem[] {
  return layout.filter(l => collides(l, layoutItem));
}

/**
 * Move an element. Responsible for doing cascading movements of other elements.
 *
 * @param  {Array}      layout Full layout to modify.
 * @param  {TLayoutItem} l      element to move.
 * @param  {Number}     [x]    X position in grid units.
 * @param  {Number}     [y]    Y position in grid units.
 * @param  {Boolean}    [isUserAction] If true, designates that the item we're moving is being dragged/resized by the user.
 */
export function moveElement(
  layout: TLayout,
  l: TLayoutItem,
  x: number | undefined,
  y: number | undefined,
  isUserAction?: boolean,
  preventCollision?: boolean,
): TLayout {
  if(l.isStatic) return layout;

  // Short-circuit if nothing to do.
  // if (l.y === y && l.x === x) return layout;

  const oldX = l.x;
  const oldY = l.y;

  const movingUp = y && l.y > y;
  // This is quite a bit faster than extending the object
  if(typeof x === `number`) l.x = x;
  if(typeof y === `number`) l.y = y;
  l.moved = true;

  // If this collides with anything, move it.
  // When doing this comparison, we have to sort the items we compare with
  // to ensure, in the case of multiple collisions, that we're getting the
  // nearest collision.
  let sorted = sortLayoutItemsByRowCol(layout);
  if(movingUp) sorted = sorted.reverse();
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
    // console.log('resolving collision between', l.i, 'at', l.y, 'and', collision.i, 'at', collision.y);

    // Short circuit so we can't infinite loop
    if(collision.moved) continue;

    // This makes it feel a bit more precise by waiting to swap for just a bit when moving up.
    if(l.y > collision.y && l.y - collision.y > collision.h / 4) continue;

    // Don't move static items - we have to move *this* element away
    if(collision.isStatic) {
      // eslint-disable-next-line no-use-before-define
      layout = moveElementAwayFromCollision(layout, collision, l, isUserAction);
    } else {
      // eslint-disable-next-line no-use-before-define
      layout = moveElementAwayFromCollision(layout, l, collision, isUserAction);
    }
  }

  return layout;
}

/**
 * This is where the magic needs to happen - given a collision, move an element away from the collision.
 * We attempt to move it up if there's room, otherwise it goes below.
 *
 * @param  {Array} layout            Full layout to modify.
 * @param  {TLayoutItem} collidesWith Layout item we're colliding with.
 * @param  {TLayoutItem} itemToMove   Layout item we're moving.
 * @param  {Boolean} [isUserAction]  If true, designates that the item we're moving is being dragged/resized
 *                                   by the user.
 */
export function moveElementAwayFromCollision(
  layout: TLayout,
  collidesWith: TLayoutItem,
  itemToMove: TLayoutItem,
  isUserAction?: boolean,
): TLayout {
  const preventCollision = false; // we're already colliding
  // If there is enough space above the collision to put this element, move it there.
  // We only do this on the main collision as this can get funky in cascades and cause
  // unwanted swapping behavior.
  if(isUserAction) {
    // Make a mock item, so we don't modify the item here, only modify in moveElement.
    const fakeItem: TLayoutItem = {
      h: itemToMove.h,
      i: `-1`,
      w: itemToMove.w,
      x: itemToMove.x,
      y: itemToMove.y,
    };
    fakeItem.y = Math.max(collidesWith.y - itemToMove.h, 0);
    if(!getFirstCollision(layout, fakeItem)) {
      return moveElement(layout, itemToMove, undefined, fakeItem.y, preventCollision);
    }
  }
  /*
  layout: Layout,
  l: LayoutItem,
  x: number,
  y: number,
  isUserAction: boolean,
  preventCollision: boolean
  */
  // Previously this was optimized to move below the collision directly, but this can cause problems
  // with cascading moves, as an item may actually leapflog a collision and cause a reversal in order.
  return moveElement(layout, itemToMove, undefined, itemToMove.y + 1, preventCollision);
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

export function setTransform(
  top: number,
  left: number,
  width: number,
  height: number,
): ITransformStyle {
  // Replace unitless items with px
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
 * @returns {{transform: string, WebkitTransform: string, MozTransform: string, msTransform: string, OTransform: string, width: string, height: string, position: string}}
 */
export function setTransformRtl(
  top: number,
  right: number,
  width: number,
  height: number,
): ITransformStyle {
  // Replace unitless items with px
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

/**
 * Just like the setTopLeft method, but instead, it will return a right property instead of left.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {{top: string, right: string, width: string, height: string, position: string}}
 */

export interface ITopRightStyle {
  top: string;
  right: string;
  width: string;
  height: string;
  position: string;
}

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
  if(!Array.isArray(layout)) throw new Error(`${contextName} must be an array!`);
  for(let i = 0, len = layout.length; i < len; i++) {
    const item = layout[i];
    for(let j = 0; j < subProps.length; j++) {
      if(typeof item[subProps[j]] !== `number`) {
        throw new Error(
          `VueGridLayout: ${contextName}[${i}].${subProps[j]} must be a number!`,
        );
      }
    }

    if(item.i === undefined || item.i === null) {
      throw new Error(`VueGridLayout: ${contextName}[${i}].i cannot be null!`);
    }

    if(typeof item.i !== `number` && typeof item.i !== `string`) {
      throw new Error(`VueGridLayout: ${contextName}[${i}].i must be a string or number!`);
    }

    if(keyArr.indexOf(item.i) >= 0) {
      throw new Error(`VueGridLayout: ${contextName}[${i}].i must be unique!`);
    }
    keyArr.push(item.i);

    if(item.isStatic !== undefined && typeof item.isStatic !== `boolean`) {
      throw new Error(`VueGridLayout: ${contextName}[${i}].static must be a boolean!`);
    }
  }
}

/* The following list is defined in React's core */
export const IS_UNITLESS = {
  animationIterationCount: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  flex: true,
  flexGrow: true,
  flexNegative: true,
  flexOrder: true,
  flexPositive: true,
  flexShrink: true,
  fontWeight: true,
  gridColumn: true,
  gridRow: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,

  // SVG-related properties
  fillOpacity: true,
  stopOpacity: true,
  strokeDashoffset: true,
  strokeOpacity: true,
  strokeWidth: true,
};

/**
 * Hyphenate a camelCase string.
 *
 * @param {String} str
 * @return {String}
 */

export const hyphenateRE = /([a-z\d])([A-Z])/g;

export function hyphenate(str: string): string {
  return str.replace(hyphenateRE, `$1-$2`)
    .toLowerCase();
}
