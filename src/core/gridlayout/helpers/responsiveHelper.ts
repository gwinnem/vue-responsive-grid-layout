import {TLayout, TResponsiveLayout} from "@/components";
import {TBreakpoint, TBreakpoints} from "@/components/Grid/layout-definition";
import {cloneLayout, compactLayout} from "@/core/helpers/utils";
import {correctBounds} from "@/core/helpers/responsiveUtils";

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
  // TODO obsolete code..
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
