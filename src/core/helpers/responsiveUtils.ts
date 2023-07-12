import {
  cloneLayout,
  compactLayout,
  getFirstCollision,
  getStatics,
} from './utils';
import {
  ILayoutItem,
  TBreakpoint,
  TBreakpoints,
  TLayout,
  TResponsiveLayout,
} from '@/components/Grid/layout-definition';

/**
 * Given breakpoints, return an array of breakpoints sorted by width. This is usually
 * e.g. ['xxs', 'xs', 'sm', ...]
 *
 * @param  {Object} breakpoints Key/value pair of breakpoint names to widths.
 * @return {Array}              Sorted breakpoints.
 */
export const sortBreakpoints = (breakpoints: TBreakpoints): TBreakpoint[] => {
  const keys: string[] = Object.keys(breakpoints);
  return keys.sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return breakpoints[a] - breakpoints[b];
  });
};

/**
 * Given a width, find the highest breakpoint that matches is valid for it (width > breakpoint).
 *
 * @param  {Object} breakpoints Breakpoints object (e.g. {lg: 1200, md: 960, ...})
 * @param  {Number} width Screen width.
 * @return {String}       Highest breakpoint that is less than width.
 */
export const getBreakpointFromWidth = (breakpoints: TBreakpoints, width: number): TBreakpoint => {
  const sorted = sortBreakpoints(breakpoints);
  let matching = sorted[0];
  for(let i = 1, len = sorted.length; i < len; i++) {
    const breakpointName = sorted[i];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if(width > breakpoints[breakpointName]) matching = breakpointName;
  }
  return matching;
};

/**
 * Given a breakpoint, get the # of cols set for it.
 * @param  {String} breakpoint Breakpoint name.
 * @param  {Object} cols       Map of breakpoints to cols.
 * @return {Number}            Number of cols.
 */
export const getColsFromBreakpoint = (breakpoint: TBreakpoint, cols: TBreakpoints): number => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if(!cols[breakpoint]) {
    throw new Error(
      `VueResponsiveGridLayout: \`cols\` entry for breakpoint ${breakpoint} is missing!`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return cols[breakpoint];
};

const moveToCorrectPlace = (l:ILayoutItem, layout: TLayout, bounds: { cols: number }, staticItem: ILayoutItem[]):void => {
  if(l.x + l.w > bounds.cols) {
    l.x = 0;
    l.y += 1;
  }
  // eslint-disable-next-line no-cond-assign
  while (getFirstCollision(staticItem, l)) {
    l.x += l.w;
    // move x to next place which might be able to contain it
    if(l.x + l.w > bounds.cols) {
      // if this width is out of layout
      l.y += 1; // move y to next y
      l.x = 0; // start x from 0
    }
  }
};

/**
 * Given a layout, make sure all elements fit within its bounds.
 *
 * @param  {Array}  layout             Layout array.
 * @param  {Number}  bounds            Number of columns.
 * @param  {Boolean} distributeEvenly  Enforces that a grid item is moved all the way to left/right when there is available space for it
 */
export function correctBounds(layout: TLayout, bounds: { cols: number }, distributeEvenly: boolean): TLayout {
  const collidesWith = getStatics(layout);
  const staticItem = getStatics(layout);
  for(let i = 0, len = staticItem.length; i < len; i++) {
    // move static item first
    // try not move their y
    while (staticItem[i].x + staticItem[i].w > bounds.cols || getFirstCollision(staticItem, staticItem[i])) {
      staticItem[i].x -= 1;
    }
  }
  for(let i = 0, len = layout.length; i < len; i++) {
    const l = layout[i];

    if(distributeEvenly) {
      // Fix for issue: https://github.com/gwinnem/vue-responsive-grid-layout/issues/2
      // it's not static or it's out of layout
      if(!collidesWith.includes(l) || l.x + l.w > bounds.cols) {
        moveToCorrectPlace(l, layout, bounds, collidesWith);
      }
    } else if(!distributeEvenly) {
      // Overflows right, move item to the left
      if(l.x + l.w > bounds.cols) {
        l.x = bounds.cols - l.w;
      }
    }
    // Overflows left
    // TODO experiment to get a layout where this is the case, 01.04.2023, this is not being triggered..
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

/**
 * Given existing layouts and a new breakpoint, find or generate a new layout.
 *
 * This finds the layout above the new one and generates from it, if it exists.
 *
 * @param  {TLayout}       orgLayout         Original layout.
 * @param  {Object}        layouts           Existing layouts.
 * @param  {TBreakpoints}  breakpoints       All breakpoints.
 * @param  {TBreakpoint}   breakpoint        New breakpoint.
 * @param  {TBreakpoint}   lastBreakpoint    Last breakpoint (for fallback).
 * @param  {Number}        cols              Column count at new breakpoint.
 * @param  {Boolean}       verticalCompact   Whether or not to compact the layout vertically.
 * @param  {Boolean}       distributeEvenly
 * @return {TLayout}                         New layout.
 */
export const findOrGenerateResponsiveLayout = (
  orgLayout: TLayout,
  layouts: TResponsiveLayout,
  breakpoints: TBreakpoints,
  breakpoint: TBreakpoint,
  lastBreakpoint: TBreakpoint,
  cols: number,
  verticalCompact: boolean,
  distributeEvenly: boolean,
): TLayout => {
  // If it already exists, just return it.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if(layouts[breakpoint] && !distributeEvenly) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return cloneLayout(layouts[breakpoint]);
  }
  // Find or generate the next layout
  let layout = orgLayout;

  const breakpointsSorted = sortBreakpoints(breakpoints);
  const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));
  for(let i = 0, len = breakpointsAbove.length; i < len; i++) {
    const b = breakpointsAbove[i];
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if(layouts[b]) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      layout = layouts[b];
      break;
    }
  }
  layout = cloneLayout(layout || []); // clone layout so we don't modify existing items
  return compactLayout(correctBounds(layout, { cols }, distributeEvenly), verticalCompact);
};
