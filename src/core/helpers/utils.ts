import { ILayoutItem, TLayout } from '@/components/Grid/layout-definition';
import { getFirstCollision } from '@/core/gridlayout/helpers/collision-helper';
import { getAllStaticGridItems } from '@/core/common/helpers/grid-item-type-helpers';
import { ITopLeftStyle, ITopRightStyle, ITransformStyle } from '@/core/common/interfaces/transform-style.interfaces';
import { EErrorMessage } from '@/core/common/enums/ErrorMessages';
import { sortLayoutItemsByColRow, sortLayoutItemsByRowCol } from '@/core/gridlayout/helpers/sort-helper';

/**
 * Deep-clone a single layout item via JSON round-trip. Fast because the
 * shape is monomorphic (every `ILayoutItem` has the same set of primitive
 * fields) — `JSON.parse(JSON.stringify(...))` is a reasonable choice here
 * specifically because there's nothing non-serializable (functions,
 * `Date`s, etc.) on an `ILayoutItem` to worry about losing.
 */
export function cloneLayoutItem(layoutItem: ILayoutItem): ILayoutItem {
  return JSON.parse(JSON.stringify(layoutItem));
}

/** Deep-clone an entire layout array (see {@link cloneLayoutItem}) — used whenever a layout needs to be mutated without affecting the caller's original array/objects (e.g. per-breakpoint layout caching in `useResponsiveLayout`). */
export function cloneLayout(layout: TLayout): TLayout {
  const newLayout = Array(layout.length);
  for(let i = 0, len = layout.length; i < len; i++) {
    newLayout[i] = cloneLayoutItem(layout[i]);
  }
  return newLayout;
}

/**
 *
 * @param compareWith
 * @param layoutItem
 * @param verticalCompact
 * @param minPositions
 * @returns {ILayoutItem}
 */
export function compactItem(
  compareWith: TLayout,
  layoutItem: ILayoutItem,
  verticalCompact: boolean,
  minPositions?: Record<string | number, { y: number }>,
): ILayoutItem {
  // Bug fix: `y: Infinity` (or any other non-finite value) is a common,
  // widely-used convention for "place this new item past everything
  // else, then let compaction settle it" — react-grid-layout's own
  // docs use exactly this pattern, and so did this project's own
  // undo/redo example before this fix. It froze the page entirely:
  // `Infinity - 1 === Infinity` in JavaScript, so the decrement loop
  // below (`while (layoutItem.y > 0 ...) { layoutItem.y--; }`) never
  // actually reduces `y` at all when nothing collides with it yet
  // (the common case for a freshly-added item with no siblings below
  // it) — an infinite loop that hangs the tab, not a slow one.
  // Clamping a non-finite `y` to one row past everything already in
  // `compareWith` first gives the loop a real, finite starting point;
  // everything above that point is unaffected, since a lower starting
  // `y` was already equivalent to this clamped one as far as collision
  // detection is concerned (nothing occupies space below the last
  // item's own bottom edge either way).
  if(!Number.isFinite(layoutItem.y)) {
    layoutItem.y = compareWith.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  }

  if(verticalCompact) {
    // Move the element up as far as it can go without colliding.
    while (layoutItem.y > 0 && !getFirstCollision(compareWith, layoutItem)) {
      layoutItem.y--;
    }
  } else if(minPositions) {
    const minY = minPositions[layoutItem.i].y;
    while (layoutItem.y > minY && !getFirstCollision(compareWith, layoutItem)) {
      layoutItem.y--;
    }
  }

  // Move it down, and keep moving it down if it's colliding.
  let collisions;

  while ((collisions = getFirstCollision(compareWith, layoutItem))) {
    layoutItem.y = collisions.y + collisions.h;
  }
  return layoutItem;
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
export function compactLayout(
  layout: TLayout,
  verticalCompact: boolean,
  minPositions?: Record<string | number, { y: number }>,
): TLayout {
  // Statics go in the compareWith array right away so items flow around them.
  const compareWith = getAllStaticGridItems(layout);
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
 * The horizontal-compaction counterpart to {@link compactItem} above —
 * moves a single item leftward as far as it can go without colliding,
 * then (mirroring `compactItem`'s own "push down if still colliding"
 * step, transposed to the x axis) pushes it rightward past anything it
 * still overlaps at its starting position. `minPositions` here holds
 * the pre-drag minimum *x* (not `y`) each item shouldn't compact
 * tighter than — the `restoreOnDrag` case, transposed the same way.
 */
export function compactItemHorizontal(
  compareWith: TLayout,
  layoutItem: ILayoutItem,
  horizontalCompact: boolean,
  minPositions?: Record<string | number, { x: number }>,
): ILayoutItem {
  // Bug fix: same class of bug as compactItem's own fix above (see its
  // comment for the full account) — a non-finite `x` (the same
  // "place past everything else, let compaction settle it" convention,
  // transposed to the x axis) would infinite-loop the decrement below
  // for the identical reason (`Infinity - 1 === Infinity`). Clamped the
  // same way: one column past everything already in `compareWith`.
  if(!Number.isFinite(layoutItem.x)) {
    layoutItem.x = compareWith.reduce((max, item) => Math.max(max, item.x + item.w), 0);
  }

  if(horizontalCompact) {
    // Move the element left as far as it can go without colliding.
    while (layoutItem.x > 0 && !getFirstCollision(compareWith, layoutItem)) {
      layoutItem.x--;
    }
  } else if(minPositions) {
    const minX = minPositions[layoutItem.i].x;
    while (layoutItem.x > minX && !getFirstCollision(compareWith, layoutItem)) {
      layoutItem.x--;
    }
  }

  // Move it right, and keep moving it right if it's colliding.
  let collisions;

  while ((collisions = getFirstCollision(compareWith, layoutItem))) {
    layoutItem.x = collisions.x + collisions.w;
  }
  return layoutItem;
}

/**
 * The horizontal-compaction counterpart to {@link compactLayout} above
 * — same algorithm, transposed to the x axis: items are processed
 * leftmost-first (via {@link sortLayoutItemsByColRow}, the column-major
 * counterpart to `sortLayoutItemsByRowCol`) and settle toward `x: 0`
 * instead of `y: 0`.
 */
export function compactLayoutHorizontal(
  layout: TLayout,
  horizontalCompact: boolean,
  minPositions?: Record<string | number, { x: number }>,
): TLayout {
  const compareWith = getAllStaticGridItems(layout);
  const sorted = sortLayoutItemsByColRow(layout);
  const out: TLayout = Array(layout.length);

  for(let i = 0, len = sorted.length; i < len; i++) {
    let l = sorted[i];

    if(!l.isStatic) {
      l = compactItemHorizontal(compareWith, l, horizontalCompact, minPositions);
      compareWith.push(l);
    }

    out[layout.indexOf(l)] = l;
    l.moved = false;
  }
  return out;
}

/**
 * The "allow overlap" compaction variant `ECompactType.VERTICAL_OVERLAP`
 * uses — every non-static item moves straight to `y: 0`
 * unconditionally, with no collision checking at all (unlike
 * {@link compactItem}, which stops as soon as it would collide).
 * Matches `react-grid-layout`'s own `allowOverlap` semantics applied to
 * compaction specifically: items are genuinely allowed to end up
 * overlapping one another as a result — nothing here resolves that,
 * by design.
 */
export function compactLayoutOverlapVertical(layout: TLayout): TLayout {
  const out: TLayout = Array(layout.length);
  for(let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];
    if(!l.isStatic) {
      l.y = 0;
    }
    l.moved = false;
    out[i] = l;
  }
  return out;
}

/**
 * The horizontal counterpart to {@link compactLayoutOverlapVertical}
 * above — every non-static item moves straight to `x: 0`
 * unconditionally, with no collision checking.
 */
export function compactLayoutOverlapHorizontal(layout: TLayout): TLayout {
  const out: TLayout = Array(layout.length);
  for(let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];
    if(!l.isStatic) {
      l.x = 0;
    }
    l.moved = false;
    out[i] = l;
  }
  return out;
}

/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 *
 * @param  {Array}      layout  Layout array.
 * @param  {String}     id      ID
 * @return {ILayoutItem}        Item at ID.
 * @throws {Error}              Invalid parameters
 */
export function getLayoutItem(layout: TLayout, id: string | number | undefined): ILayoutItem | undefined {
  if(layout === undefined) {
    throw new Error(EErrorMessage.INVALID_LAYOUT);
  }

  if(id === undefined || id === null || id.toString().trim().length === 0 || parseInt(id.toString()) < 0) {
    throw new Error(EErrorMessage.INVALID_LAYOUT_ITEM_ID);
  }

  for(let i = 0, len = layout.length; i < len; i++) {
    if(typeof id === 'string') {
      if(layout[i].i.toString().toLowerCase() === id.toString().toLowerCase()) {
        return layout[i];
      }
    } else if(typeof id === 'number') {
      if(layout[i].i === id) {
        return layout[i];
      }
    }
  }

  return undefined;
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
export function setTransform(top: number, left: number, width: number, height: number): ITransformStyle {
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
export function setTransformRtl(top: number, right: number, width: number, height: number): ITransformStyle {
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

/**
 * Getting top left css values from numeric coordinates
 * @param top
 * @param left
 * @param width
 * @param height
 * @returns {ITopLeftStyle}
 */
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
 * @returns {ITopRightStyle}
 */
export function setTopRight(top: number, right: number, width: number, height: number): ITopRightStyle {
  return {
    height: `${height}px`,
    position: `absolute`,
    right: `${right}px`,
    top: `${top}px`,
    width: `${width}px`,
  };
}
