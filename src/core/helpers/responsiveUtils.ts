import {
  findOrGenerateResponsiveLayoutFnc,
  TLayout, TResponsiveLayout,
} from '../types/helpers';
import { cloneLayout, compact, correctBounds } from './utils';
import { TBreakpoints, TBreakpointsKeys } from '../types/breakpoints';

export const sortBreakpoints = (breakpoints: TBreakpoints): TBreakpointsKeys[] => {
  return (Object.keys(breakpoints) as (keyof typeof breakpoints)[])
    .sort((a, b) => (breakpoints[a] ?? 1) - (breakpoints[b] ?? 1));
};

export const findOrGenerateResponsiveLayout: findOrGenerateResponsiveLayoutFnc = (
  orgLayout: TLayout,
  layouts: TResponsiveLayout,
  breakpoints: TBreakpoints,
  breakpoint: TBreakpointsKeys,
  cols: number,
  verticalCompact: boolean,
): TLayout => {
  if(Object.prototype.hasOwnProperty.call(layouts, breakpoint)) {
    return cloneLayout(layouts[breakpoint] || []);
  }

  let layout = orgLayout;

  const breakpointsSorted = sortBreakpoints(breakpoints);
  const breakpointsAbove = breakpointsSorted.slice(breakpointsSorted.indexOf(breakpoint));

  for(let i = 0; i < breakpointsAbove.length; i++) {
    const b = breakpointsAbove[i];

    if(Object.prototype.hasOwnProperty.call(layouts, b)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      layout = layouts[b];
      break;
    }
  }

  layout = cloneLayout(layout || []);

  return compact(correctBounds(layout, { cols }), verticalCompact) as TLayout;
};

export const getBreakpointFromWidth = (breakpoints: TBreakpoints, width: number): TBreakpointsKeys => {
  const sorted = sortBreakpoints(breakpoints);
  let [matching] = sorted;

  for(let i = 1; i < sorted.length; i++) {
    const breakpointName = sorted[i];

    if(width > (breakpoints[breakpointName] ?? 1)) matching = breakpointName;
  }
  return matching;
};

export const getColsFromBreakpoint = (breakpoint: keyof TBreakpoints, cols: TBreakpoints): number | undefined => {
  return cols[breakpoint] ?? undefined;
};
