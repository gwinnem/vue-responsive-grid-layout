import {TBreakpoint, TBreakpoints} from "@/components/Grid/layout-definition";
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
