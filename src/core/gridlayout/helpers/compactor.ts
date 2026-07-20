import { TLayout } from '@/components/Grid/layout-definition';
import {
  compactLayout,
  compactLayoutHorizontal,
  compactLayoutOverlapHorizontal,
  compactLayoutOverlapVertical,
} from '@/core/helpers/utils';
import { ECompactType } from '@/core/gridlayout/enums/ECompactType';

/**
 * Context a `compact()` call receives alongside the layout and column
 * count — everything the built-in compactors below need to replicate
 * this project's own existing `compactType`/`restoreOnDrag` behavior
 * exactly, available to a custom compactor too, without forcing it to
 * bake `compactType` into a fixed choice of *which* compactor object
 * to use the way `react-grid-layout` v2's own `Compactor` interface
 * does (a deliberate, small divergence — this project's `compactType`
 * (formerly `verticalCompact`) was already an existing, widely-used
 * prop before this interface existed, not something worth removing or
 * replacing to match another library's own design exactly).
 */
export interface ICompactorContext {
  /**
   * Which built-in compaction strategy currently applies —
   * informational, read from `GridLayout`'s own `compactType` prop at
   * the moment compaction runs. A custom compactor decides for itself
   * whether/how to use this; nothing enforces it.
   */
  compactType: ECompactType;
  /**
   * Present only during a `restoreOnDrag`-gated compaction (drag end)
   * — the pre-drag position each item should not rise/shift any
   * *tighter* than it was before the drag started: `y` for
   * `ECompactType.VERTICAL`/`NONE`, `x` for `ECompactType.HORIZONTAL`.
   * Absent for every other trigger (resize end, add/remove item,
   * mount, breakpoint change, `compactNow()`/`rearrange()`), and for
   * the two `*_OVERLAP` types (which never consult `minPositions` at
   * all — every non-static item always moves straight to `0`).
   */
  minPositions?: Record<string | number, { x?: number; y?: number }>;
}

/**
 * Implement this interface to replace `GridLayout`'s own compaction
 * algorithm entirely, via the `compactor` prop. `null`/`undefined`
 * (the default) means "use the built-in logic exactly as before this
 * prop existed" — this is a purely additive override, not a
 * replacement for `compactType`, which keeps working unchanged whether
 * or not `compactor` is set.
 *
 * Called after every drag end, resize end, item add/remove, on mount,
 * on a breakpoint/column-count change, and by `compactNow()`/
 * `rearrange()` on demand — the same trigger points the built-in
 * compaction already ran at.
 *
 * @example
 * ```ts
 * const shelfCompactor: ICompactor = {
 *   type: 'shelf',
 *   compact(layout, cols) {
 *     // Custom placement logic — must return a new array, never
 *     // mutate `layout` or its items in place.
 *     return shelfPack(layout, cols);
 *   },
 * };
 * ```
 */
export interface ICompactor {
  /** A short, descriptive name for this strategy — informational only (e.g. for logging); never read by `GridLayout` itself. */
  readonly type: string;
  /**
   * Compacts a layout, returning a new array. Must not mutate the
   * input `layout` or any of its items in place — `GridLayout` reads
   * the return value as the new layout state, not side effects on the
   * argument.
   */
  compact(layout: TLayout, cols: number, context: ICompactorContext): TLayout;
}

/**
 * The built-in strategy behind `ECompactType.VERTICAL` (the default,
 * and this project's former `verticalCompact: true`) — items float up
 * as far as they can without colliding. Exported separately so a
 * custom `compactor` can delegate back to this for part of a layout
 * (e.g. compact everything except one pinned row) rather than
 * reimplementing it.
 */
export const verticalCompactor: ICompactor = {
  compact: (layout: TLayout, _cols: number, context: ICompactorContext): TLayout =>
    compactLayout(layout, true, context.minPositions as Record<string | number, { y: number }> | undefined),
  type: `vertical`,
};

/**
 * The built-in strategy behind `ECompactType.NONE` (this project's
 * former `verticalCompact: false`) — items don't float up; collisions
 * still resolve by pushing down, and (during a `restoreOnDrag`-gated
 * compaction specifically) never rise above `context.minPositions`.
 */
export const noCompactor: ICompactor = {
  compact: (layout: TLayout, _cols: number, context: ICompactorContext): TLayout =>
    compactLayout(layout, false, context.minPositions as Record<string | number, { y: number }> | undefined),
  type: `none`,
};

/**
 * The built-in strategy behind `ECompactType.HORIZONTAL` — items float
 * left as far as they can without colliding, the same algorithm as
 * `verticalCompactor` transposed to the x axis. New: this project had
 * no horizontal compaction at all before this — only `horizontalShift`
 * (an unrelated, separate prop controlling which direction a
 * *colliding* item gets shifted during an active drag, not how the
 * resting layout settles).
 */
export const horizontalCompactor: ICompactor = {
  compact: (layout: TLayout, _cols: number, context: ICompactorContext): TLayout =>
    compactLayoutHorizontal(layout, true, context.minPositions as Record<string | number, { x: number }> | undefined),
  type: `horizontal`,
};

/**
 * The built-in strategy behind `ECompactType.VERTICAL_OVERLAP` — every
 * non-static item moves straight to `y: 0`, ignoring collisions
 * entirely. Matches `react-grid-layout`'s own `allowOverlap` semantics
 * applied to compaction specifically; items may genuinely end up
 * overlapping one another as a result.
 */
export const verticalOverlapCompactor: ICompactor = {
  compact: (layout: TLayout): TLayout => compactLayoutOverlapVertical(layout),
  type: `vertical-overlap`,
};

/**
 * The horizontal counterpart to `verticalOverlapCompactor` above —
 * every non-static item moves straight to `x: 0`, ignoring collisions.
 */
export const horizontalOverlapCompactor: ICompactor = {
  compact: (layout: TLayout): TLayout => compactLayoutOverlapHorizontal(layout),
  type: `horizontal-overlap`,
};

/**
 * Looks up the built-in `ICompactor` matching a given `ECompactType` —
 * the same mapping `GridLayout` itself uses internally to pick a
 * default when the `compactor` prop isn't set, exposed for a consumer
 * who wants to reference (or delegate to, from their own custom
 * compactor) "whichever built-in strategy this enum value means"
 * without re-deriving that mapping themselves. Mirrors
 * `react-grid-layout` v2's own `getCompactor(compactType, ...)`
 * factory function.
 */
export function getCompactor(compactType: ECompactType): ICompactor {
  switch(compactType) {
    case ECompactType.HORIZONTAL:
      return horizontalCompactor;
    case ECompactType.HORIZONTAL_OVERLAP:
      return horizontalOverlapCompactor;
    case ECompactType.VERTICAL_OVERLAP:
      return verticalOverlapCompactor;
    case ECompactType.NONE:
      return noCompactor;
    case ECompactType.VERTICAL:
    default:
      return verticalCompactor;
  }
}
