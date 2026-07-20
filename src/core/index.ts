/**
 * `vue-ts-responsive-grid-layout/core` — the pure grid-layout math this
 * library's own Vue components are built on, with zero Vue dependency
 * and no live DOM/browser requirement (every function here takes plain
 * data in, returns plain data out). Usable standalone: validating a
 * layout server-side, computing collisions/compaction for a batch job,
 * or building an entirely different UI layer on top of the same
 * algorithms, without installing Vue or mounting any component at all.
 *
 * Every export here is re-exported from every other file that already
 * imported it before this entry point existed — this file adds a new
 * *public* door into code that was already internally shared and
 * already Vue-free, not new logic. See `docs/REFACTORING.md` for the
 * import-path audit that confirmed nothing in this dependency graph
 * reaches into `@/components`'s own Vue component code (every import of
 * a layout/breakpoint type goes directly to its defining file, e.g.
 * `@/components/Grid/layout-definition`, never through the main
 * barrel) — the thing that would otherwise silently pull the entire
 * component tree into what's supposed to be a Vue-free bundle.
 *
 * Deliberately excludes anything that needs a live browser: DOM
 * measurement (`DOM.ts`), the native pointer-driven drag/resize engine
 * (`native-interaction.ts`, `draggable-utils.ts`), and the cross-grid
 * registry (a runtime coordination singleton tied to component
 * mount/unmount, not a pure calculation). Those stay reachable only
 * through the main Vue component entry point, where they're actually
 * usable.
 */

// Layout data shapes — re-exported here so `/core` is usable without
// also importing from the main component entry point.
export type {
  ILayoutItem,
  ILayoutItemRequired,
  TLayout,
  TResponsiveLayout,
  TBreakpoint,
  TBreakpoints,
} from '@/components/Grid/layout-definition';
export type { IBreakpoints, IColumns } from '@/components/Grid/grid-layout-props.interface';

// Collision detection.
export { collides, getAllCollisions, getFirstCollision } from '@/core/gridlayout/helpers/collision-helper';
export { findFirstFitSlot } from '@/core/gridlayout/helpers/bin-pack-helper';

// Movement — resolving a target position/size against collisions and
// grid bounds.
export { moveToCorrectPlace, moveElement, moveElementAwayFromCollision } from '@/core/gridlayout/helpers/move-helper';

// Compaction, cloning, and pixel-position style generation.
export {
  cloneLayoutItem,
  cloneLayout,
  compactItem,
  compactLayout,
  compactItemHorizontal,
  compactLayoutHorizontal,
  compactLayoutOverlapVertical,
  compactLayoutOverlapHorizontal,
  getLayoutItem,
  setTransform,
  setTransformRtl,
  setTopLeft,
  setTopRight,
} from '@/core/helpers/utils';
export { getBottomYCoordinate } from '@/core/gridlayout/helpers/grid-layout-helper';

// Pluggable compaction — the same interface `GridLayout`'s own
// `compactor` prop takes, plus the five built-in strategies its
// default (`null`) falls back to (matching `compactType`'s own
// `ECompactType` values), and a `getCompactor()` factory to look one
// up by that enum directly.
export type { ICompactor, ICompactorContext } from '@/core/gridlayout/helpers/compactor';
export {
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  getCompactor,
} from '@/core/gridlayout/helpers/compactor';
export { ECompactType } from '@/core/gridlayout/enums/ECompactType';

// Grid-unit <-> pixel math.
export { calcXY } from '@/core/helpers/calculate-utils';
export { clamp, calcGridItemWH, calcColWidth } from '@/core/griditem/helpers/grid-item-calculate-helper';

// Ordering, static/non-static partitioning, and bounds correction.
export { sortLayoutItemsByRowCol, sortLayoutItemsByColRow } from '@/core/gridlayout/helpers/sort-helper';
export { getAllStaticGridItems, getAllNonStaticGridItems } from '@/core/common/helpers/grid-item-type-helpers';
export { correctBounds } from '@/core/helpers/responsive-utils';

// Alignment guides / magnetic snapping.
export type { IAlignmentGuide } from '@/core/gridlayout/helpers/alignment-helper';
export { findAlignmentGuides, findSnapAdjustment } from '@/core/gridlayout/helpers/alignment-helper';

// Responsive breakpoints.
export { findOrGenerateResponsiveLayout } from '@/core/gridlayout/helpers/responsive-helper';
export {
  sortBreakpoints,
  getBreakpointFromWidth,
  getColsFromBreakpoint,
} from '@/core/common/helpers/breakpoints-helper';

// Serialization, SVG export, and the outside-drop payload helper.
export { serializeLayout, deserializeLayout } from '@/core/helpers/layout-storage';
export type { IExportLayoutAsSvgOptions } from '@/core/gridlayout/helpers/export-svg';
export { exportLayoutAsSvg } from '@/core/gridlayout/helpers/export-svg';
export { readOutsideDropPayload } from '@/core/gridlayout/helpers/outside-drop-payload';

// Validators — the same ones GridLayout/GridItem use internally for
// prop validation, reachable standalone (e.g. validating a layout
// that came from an API response before ever handing it to the grid).
export { breakpointsValidator } from '@/core/validators/breakpoint-validator';
export { keysValidator, validateLayoutItemRequiredKeys } from '@/core/validators/keys-validator';
export { layoutValidator } from '@/core/validators/layout-validator';
export { marginValidator } from '@/core/validators/margin-validator';

// Shared enums/types small helpers above take or return.
export { EMovingDirections } from '@/core/common/enums/EMovingDirections';
export type { TMovingDirection } from '@/core/common/types/TMovingDirections';
export type {
  ITransformStyle,
  ITopLeftStyle,
  ITopRightStyle,
} from '@/core/common/interfaces/transform-style.interfaces';
export type { ICalcXy } from '@/core/griditem/interfaces/grid-item.interfaces';
