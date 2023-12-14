import {cloneLayout, compactLayout, getFirstCollision, getStatics,} from './utils';
import {ILayoutItem, TBreakpoint, TBreakpoints, TLayout, TResponsiveLayout,} from '@/components/Grid/layout-definition';
import {IColumns} from "@/components/Grid/grid-layout-props.interface";

/**
 * Given breakpoints, return an array of breakpoints sorted by width. This is usually
 * e.g. ['xxs', 'xs', 'sm', ...]
 *
 * @param  {TBreakpoints}   breakpoints   Key/value a pair of breakpoint names to widths.
 * @return {TBreakpoint[]}                Sorted breakpoints.
 */
export const sortBreakpoints = (breakpoints: TBreakpoints): TBreakpoint[] => {
  const keys: string[] = Object.keys(breakpoints);
  if (keys.length === 0) {
    throw new Error('Invalid parameter breakPoints');
  }
  return keys.sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return breakpoints[a] - breakpoints[b];
  });
};

/**
 * Given a width, find the highest breakpoint that matches is valid for it (width > breakpoint).
 *
 * @param  {TBreakpoints} breakpoints Breakpoints object (e.g. {lg: 1200, md: 960, ...})
 * @param  {Number}       width       Window width.
 * @return {TBreakpoint}              Highest breakpoint that is less than width.
 * @throws {Error}                    Invalid width. Must be greater or equal 0
 */
export const getBreakpointFromWidth = (breakpoints: TBreakpoints, width: number): TBreakpoint => {
  if (width < 0) {
    throw new Error('Width Must be greater or equal 0');
  }

  if (!breakpoints) {
    throw new Error('Invalid param breakpoints');
  }

  const sortedBreakpoints = sortBreakpoints(breakpoints);
  let matchingBreakpoint = sortedBreakpoints[0];

  sortedBreakpoints.forEach((breakpoint, index): void => {
    const breakpointName = sortedBreakpoints[index];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (width > breakpoints[breakpointName]) {
      matchingBreakpoint = breakpointName;
    }
  });

  return matchingBreakpoint;
};

/**
 * Given a breakpoint, get the # of cols set for it.
 *
 * @param  {TBreakpoint}  breakpoint  Breakpoint.
 * @param  {IColumns}     cols        Map of breakpoints to cols.
 * @return {Number}                   Number of cols.
 * @throws {Error}                    Column not found
 */
export const getColsFromBreakpoint = (breakpoint: TBreakpoint, cols: IColumns): number => {
  if (!breakpoint) {
    throw new Error('Param breakpoint is empty');
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!cols[breakpoint]) {
    throw new Error(`Breakpoint not found`);
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return cols[breakpoint];
};

/**
 * Moving a GridItem to the correct place in the layout.
 *
 * @param {ILayoutItem}     layoutItem
 * @param {ILayoutItem}     bounds
 * @param {ILayoutItem[]}   staticItems
 */
const moveToCorrectPlace = (layoutItem: ILayoutItem, bounds: { cols: number }, staticItems: ILayoutItem[]): void => {
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
 * Given a layout, make sure all elements fit within its bounds.
 *
 * @param     {TLayout}  layout             Layout array.
 * @param     {Number}  bounds              Number of columns.
 * @param     {Boolean} distributeEvenly    Enforces that a grid item is moved all the way to left/right when there is available space for it
 * @returns   {TLayout}                     The new adjusted layout.
 */
export function correctBounds(layout: TLayout, bounds: { cols: number }, distributeEvenly: boolean): TLayout {
  const collidesWith = getStatics(layout);
  const staticItem = getStatics(layout);
  for (let i = 0, len = staticItem.length; i < len; i++) {
    // move static item first
    // try not move their y
    while (staticItem[i].x + staticItem[i].w > bounds.cols || getFirstCollision(staticItem, staticItem[i])) {
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

/**
 * Given existing layouts and a new breakpoint, find or generate a new layout.
 *
 * This finds the layout above the new one and generates from it, if it exists.
 *
 * @param  {TLayout}       orgLayout         Original layout.
 * @param  {TLayout}       layouts           Existing layouts.
 * @param  {TBreakpoints}  breakpoints       All breakpoints.
 * @param  {TBreakpoint}   breakpoint        New breakpoint.
 * @param  {TBreakpoint}   lastBreakpoint    Last breakpoint (for fallback).
 * @param  {Number}        cols              Column count at new breakpoint.
 * @param  {Boolean}       verticalCompact   Whether or not to compact the layout vertically.
 * @param  {Boolean}       distributeEvenly
 * @return {TLayout}                         New layout.
 */
export const findOrGenerateResponsiveLayout = (
  // TODO Refactor it for proper use
  orgLayout: TLayout,
  layouts: TResponsiveLayout,
  breakpoints: TBreakpoints,
  breakpoint: TBreakpoint,
  lastBreakpoint: TBreakpoint,
  cols: number,
  verticalCompact: boolean,
  distributeEvenly: boolean,
): TLayout => {
  // we cant return the layouts[breakpoints] directly because we don't know whether user change the layout or not

  // Find or generate the next layout
  const layout = cloneLayout(orgLayout || []);

  return compactLayout(correctBounds(layout, {cols}, distributeEvenly), verticalCompact);
};
