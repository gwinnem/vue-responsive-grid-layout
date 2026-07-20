import { TLayout, TResponsiveLayout } from '@/components/Grid/layout-definition';
import { TBreakpoint, TBreakpoints } from '@/components/Grid/layout-definition';
import { cloneLayout } from '@/core/helpers/utils';
import { correctBounds } from '@/core/helpers/responsive-utils';
import { getCompactor } from '@/core/gridlayout/helpers/compactor';
import { ECompactType } from '@/core/gridlayout/enums/ECompactType';

/**
 * Given existing layouts and a new breakpoint, find or generate a new layout.
 *
 * This finds the layout above the new one and generates from it, if it exists.
 *
 * Despite a stale `// TODO obsolete code..` comment that used to sit on
 * this function's own parameter list (removed — see docs/REFACTORING.md
 * #54), this is not obsolete: it's the one function `useResponsiveLayout.ts`
 * calls on every breakpoint change, and has its own passing test suite
 * (`tests/responsive-helper.spec.ts`) exercising clone/bounds-correct/
 * compact behavior, immutability of the input, and the undefined-layout
 * edge case. Confirmed both directly before removing that comment,
 * rather than assuming it was safe to delete.
 *
 * @param  {TLayout}       orgLayout         Original layout.
 * @param  {TLayout}       layouts           Existing layouts.
 * @param  {TBreakpoints}  breakpoints       All breakpoints.
 * @param  {TBreakpoint}   breakpoint        New breakpoint.
 * @param  {TBreakpoint}   lastBreakpoint    Last breakpoint (for fallback).
 * @param  {Number}        cols              Column count at new breakpoint.
 * @param  {ECompactType}  compactType       Which built-in compaction strategy to apply.
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
  compactType: ECompactType,
  distributeEvenly: boolean,
): TLayout => {
  // we cant return the layouts[breakpoints] directly because we don't know whether user change the layout or not

  // Find or generate the next layout
  const layout = cloneLayout(orgLayout || []);
  const bounded = correctBounds(layout, { cols }, distributeEvenly);

  return getCompactor(compactType).compact(bounded, cols, { compactType });
};
