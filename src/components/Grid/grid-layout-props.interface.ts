import { TLayout } from '@/components/Grid/layout-definition';
import { IGridAriaLabels } from '@/core/common/interfaces/aria-labels.interface';
import { ICompactor } from '@/core/gridlayout/helpers/compactor';
import { ECompactType } from '@/core/gridlayout/enums/ECompactType';

/**
 * The width (in pixels) at or above which each named breakpoint applies.
 * `GridLayout` picks the largest breakpoint whose value is `<=` the
 * measured container width. Defaults (see `IGridLayoutProps.breakpoints`):
 * `{ xxl: 1600, xl: 1400, lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }`.
 */
export interface IBreakpoints {
  xxl: number;
  xl: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

/**
 * The number of grid columns to use at each breakpoint, when `responsive`
 * is enabled. Defaults (see `IGridLayoutProps.cols`):
 * `{ xxl: 12, xl: 12, lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }`.
 */
export interface IColumns {
  xxl: number;
  xl: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

/**
 * Props accepted by the `GridLayout` component. Only `layout` is required;
 * everything else has a default applied via `withDefaults()` in
 * `GridLayout.vue` (noted per-property below).
 *
 * Most of the boolean/number props here have a matching prop on `GridItem`
 * that can override it per-item (e.g. `isDraggable`) — see
 * `IGridItemProps` and `docs/ARCHITECTURE.md` for how that cascade works.
 */
export interface IGridLayoutProps {
  /** Automatically grow/shrink the container's height to fit the layout's content. Default `true`. */
  autoSize?: boolean;
  /** Enables this grid to participate in cross-grid drag/drop: its items can be dragged out into any other `GridLayout` that also has this set, and (unless `disableExternalDrop` is also set) it accepts drops from them too. Default `false`. See [Drag, drop from grid to grid](/examples/12-example) and [Cross-grid drop restrictions](/examples/22-example). */
  allowCrossGridDrag?: boolean;
  /** Grid-wide overrides for localizable UI/ARIA strings (the close button's label, keyboard move/resize instructions, the item's `aria-roledescription`) — only the keys actually set here override the built-in English defaults; everything else falls back to them. A specific `GridItem` can further override any of these for just itself via its own `ariaLabels` prop. See `IGridAriaLabels` for every key and its default text. */
  ariaLabels?: IGridAriaLabels;
  /** Grid-wide default for `enableEditMode` — the master interactivity switch on every `GridItem` that doesn't set its own. Default `true`. A `false` value here disables dragging/resizing/closing across the whole grid at once (a "view mode" toggle), without needing to bind `enableEditMode` on every item individually. A specific `GridItem` can still override this for just itself via its own `enableEditMode` prop. */
  enableEditMode?: boolean;
  /** When `true`, this grid never accepts an incoming cross-grid drop (from a grid with `allowCrossGridDrag` set) even if this grid also has `allowCrossGridDrag` set — its own items can still be dragged *out* to other grids, but nothing can be dropped *into* it. A rejected drop emits `EGridLayoutEvent.CROSS_GRID_DROP_REJECTED` on this grid rather than failing silently. Default `false`. Ignored (has no effect either way) when `allowCrossGridDrag` is `false`, since this grid isn't part of the cross-grid registry at all in that case. */
  disableExternalDrop?: boolean;
  /** A stable identifier for this grid, used in `EGridLayoutEvent.CROSS_GRID_DROP_REJECTED`/`CROSS_GRID_ITEM_DROPPED` payloads to say which grid an item came from or was rejected by. Auto-generated if not provided; only meaningful when `allowCrossGridDrag` is `true`. */
  layoutId?: string;
  /** Enables this grid to accept native HTML5 drag-and-drop from *outside* the grid system entirely — a plain `draggable="true"` element that is neither a `GridItem` nor another `GridLayout`. Distinct from `allowCrossGridDrag`/`disableExternalDrop`, which are both about dragging between grids. Shows the same live placeholder a normal in-grid drag does while the drag hovers over this grid, then emits `EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE` on drop with the resolved grid position and the native `DataTransfer` object — the library has no way to know what a dropped element actually represents, so it's up to that handler to decide what (if anything) to add to `layout`. Default `false`. See [Drag, drop from outside](/examples/11-example) and [Drag, drop from outside into multiple grids](/examples/23-example). */
  allowOutsideDrop?: boolean;
  /** Width, in grid columns, of the live placeholder shown while an outside drag hovers over this grid (`allowOutsideDrop`), and the `w` included in `EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE`'s payload. Default `2`. Ignored when `allowOutsideDrop` is `false`. */
  outsideDropWidth?: number;
  /** Height, in grid rows, of the live placeholder shown while an outside drag hovers over this grid (`allowOutsideDrop`), and the `h` included in `EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE`'s payload. Default `2`. Ignored when `allowOutsideDrop` is `false`. */
  outsideDropHeight?: number;
  /**
   * A predicate deciding whether a given native drag is one
   * `allowOutsideDrop` should actually respond to — checked on
   * `dragenter`/`dragover`/`drop`, before the live placeholder appears at
   * all. Without this, any `draggable="true"` element anywhere on the
   * page can trigger the placeholder/drop handling, including drags a
   * consumer never intended to be droppable there (a native OS file
   * drag, or an unrelated draggable element from a third-party widget on
   * the same page). Receives the native `DataTransfer` — check
   * `dataTransfer.types` to decide, since the actual data itself isn't
   * readable via `getData()` until the `drop` event fires in the native
   * HTML5 drag-and-drop API, but `types` is available throughout.
   * Default `null` (accepts everything, the previous unconditional
   * behavior).
   */
  outsideDropAccept?: ((dataTransfer: DataTransfer | null) => boolean) | null;
  /** Only affects `GridLayout`'s own internal drag placeholder — not cascaded to consumer-rendered items (unlike `isDraggable`/`isResizable`/etc). Set `border-radius-px` directly on each `GridItem` for real items. Default `10`. */
  borderRadiusPx?: number;
  /** Duration, in milliseconds, of the CSS transition applied to item position/size changes and this grid's own auto-height (`autoSize`) resizing. Applied via a CSS custom property (`--grid-transition-duration`) inherited naturally by every `GridItem`, not an eventBus cascade — no per-item override needed, since CSS custom properties already inherit through the DOM. Default `200`. */
  transitionDurationMs?: number;
  /** CSS `transition-timing-function` for the same transitions `transitionDurationMs` controls (e.g. `'ease'`, `'ease-out'`, `'linear'`, or a `cubic-bezier(...)` string). Applied the same way, via `--grid-transition-timing`. Default `'ease'`. */
  transitionTimingFunction?: string;
  /** Shows Figma-style alignment guide lines while dragging or resizing an item, wherever its edges land on the same grid coordinate as another item's edges (not restricted to same-side matches — a left edge lining up with another item's right edge counts too). Grid-unit-based, not pixel-based: an alignment exists independent of the current `colWidth`/`rowHeight`. Default `false`. */
  showAlignmentGuides?: boolean;
  /**
   * Magnetic snapping during drag — distinct from `showAlignmentGuides`,
   * which is purely visual and never changes where an item actually
   * lands. When enabled, a dragged item's position adjusts to align
   * exactly with another item's edge once it's within `snapThreshold`
   * grid units of one, the same edge-alignment concept
   * `showAlignmentGuides` visualizes, but changing the drop position
   * instead of (or in addition to, if both are on) just drawing a line.
   * Only affects drag, not resize. Default `false`.
   */
  snapToGrid?: boolean;
  /** How close, in grid units, a dragged item's edge needs to be to another item's edge to snap to it — only meaningful when `snapToGrid` is `true`. Default `1`. */
  snapThreshold?: number;
  /** Container-width thresholds for each named breakpoint, used when `responsive` is true. See `IBreakpoints` for the default values. */
  breakpoints?: IBreakpoints;
  /** Maximum number of columns, capping whatever `cols`/breakpoint resolution would otherwise produce. Default `12`. */
  colNum?: number;
  /** Column count per breakpoint, used when `responsive` is true. See `IColumns` for the default values. */
  cols?: IColumns;
  /** When `true`, items that would otherwise overflow the right edge are spread evenly across the available columns instead of just clamped. Default `false`. */
  distributeEvenly?: boolean;
  /**
   * When `true`, colliding items are shifted left/right instead of
   * down, during an active drag/resize. Distinct from `compactType` —
   * this only decides which direction an item gets bumped *mid-gesture*
   * when it's collided into; `compactType` decides how the *whole
   * layout* settles afterward, and only ever moves items along its own
   * axis (`HORIZONTAL` only ever adjusts `x`, never `y`). Setting
   * `compactType: ECompactType.HORIZONTAL` alone does **not** undo a
   * vertical bump this prop being off already caused — a colliding
   * item pushed down mid-drag stays at that `y`, since horizontal
   * compaction never touches `y`. For a grid that behaves consistently
   * horizontal both during a drag and once things settle, set both
   * `horizontalShift: true` and `compactType: ECompactType.HORIZONTAL`
   * together — either alone gives you horizontal behavior in one
   * respect while still defaulting to vertical in the other. Default
   * `false`.
   */
  horizontalShift?: boolean;
  /** Default `isBounded` for items that don't set their own. Default `false`. */
  isBounded?: boolean;
  /** Default `isDraggable` for items that don't set their own. Default `true`. */
  isDraggable?: boolean;
  /** Enables RTL layout mirroring. Default `false`. */
  isMirrored?: boolean;
  /** Default `isResizable` for items that don't set their own. Default `true`. */
  isResizable?: boolean;
  /** The layout array — one entry per `GridItem` rendered in the default slot, matched by `i`. Required; see `TLayout`/`ILayoutItem`. */
  layout: TLayout;
  /** `[horizontal, vertical]` spacing between items, in pixels. Default `[10, 10]`. */
  margin?: number[];
  /** Maximum number of rows the layout may grow to. Default `Infinity`. */
  maxRows?: number;
  /**
   * Opt-in multi-select and group move/resize. Off (`false`) by
   * default — every prior behavior (single-item drag/resize, no
   * selection state or visuals) is completely unaffected when this
   * stays off. When on: clicking an item selects only it (replacing
   * any prior selection); Shift+click or Ctrl/Cmd+click toggles that
   * item into/out of the current selection additively; clicking empty
   * grid background clears the selection entirely. Dragging or
   * resizing any *selected* item — from the keyboard too (arrow keys/
   * Shift+arrow on a focused item), not just mouse/touch drag — while
   * more than one item is selected moves/resizes every other selected
   * item by the same delta. A passenger that's static, or has
   * `isDraggable`/`isResizable` explicitly `false`, is skipped
   * entirely; a passenger's own `minW`/`maxW`/`minH`/`maxH` are
   * respected individually during group resize, not just clamped to
   * the anchor's own limits.
   *
   * Deliberately scoped down from a fully collision-aware group
   * transform: the delta is applied directly to every other selected
   * item's `x`/`y` (move) or `w`/`h` (resize) with no per-passenger
   * collision detection against *non-selected* items during the
   * gesture itself — only the dragged/resized anchor item gets the
   * usual collision/bounds handling. Compaction (per `compactType`)
   * still runs normally once the gesture ends. See
   * `docs/REFACTORING.md` for the full design rationale and why a
   * fully collision-aware version was out of scope here. Default
   * `false`.
   */
  multiSelect?: boolean;
  /** When `true`, dragging/resizing an item that would collide with another is blocked instead of pushing the other item out of the way. Default `false`. */
  preventCollision?: boolean;
  /** Enables responsive breakpoint switching (using `breakpoints`/`cols`/`responsiveLayouts`). Default `false`. */
  responsive?: boolean;
  /** Pre-defined layouts per breakpoint name, used instead of auto-generating one the first time a breakpoint is entered. Default `{}`. */
  responsiveLayouts?: { [key: string]: TLayout };
  /** When `true`, dragging an item doesn't let other items compact past their pre-drag position until the drag ends. Default `false`. */
  restoreOnDrag?: boolean;
  /** Height of one grid row, in pixels. Default `150`. */
  rowHeight?: number;
  /** Default `showCloseButton` for items that don't set their own. Default `false`. */
  showCloseButton?: boolean;
  /** Renders visible grid line guides behind the items. Default `false`. */
  showGridLines?: boolean;
  /** Default `showResizeHandles` for items that don't set their own — see `GridItem`'s own prop for what it does. Default `false`. */
  showResizeHandles?: boolean;
  /** CSS color for the visible resize handle, when `showResizeHandles` is on (this grid's own default, or an item's own override). Applied via a `--resize-handle-color` CSS custom property, inherited naturally by every `GridItem` underneath — same mechanism `transitionDurationMs`/`transitionTimingFunction` already use, not an eventBus cascade. Default a semi-transparent gray (`rgb(94 94 94 / 45%)`). */
  resizeHandleColor?: string;
  /** CSS transform scale factor to compensate for, when this grid is rendered inside a scaled ancestor (e.g. a zoomed-out canvas). Default `1`. */
  transformScale?: number;
  /** Only affects `GridLayout`'s own internal drag placeholder — unlike `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`, there's no eventBus cascade for this to consumer-rendered items. Set `use-border-radius` directly on each `GridItem`. Default `false`. */
  useBorderRadius?: boolean;
  /** Positions items with CSS `transform: translate3d(...)` instead of `top`/`left`. Default `true` (faster, GPU-accelerated). */
  useCssTransforms?: boolean;
  /**
   * Replaces the built-in compaction algorithm entirely — see
   * `ICompactor`. `null`/`undefined` (the default) means "use the
   * built-in logic exactly as before this prop existed"; this is a
   * purely additive override, not a replacement for `compactType`,
   * which keeps working unchanged whether or not this is set. Called
   * after every drag end, resize end, item add/remove, on mount, on a
   * breakpoint/column-count change, and by `compactNow()`/
   * `rearrange()` — the same trigger points the built-in compaction
   * already runs at. `verticalCompactor`/`horizontalCompactor`/
   * `noCompactor`/`verticalOverlapCompactor`/`horizontalOverlapCompactor`
   * (exported from this package, and from
   * `vue-ts-responsive-grid-layout/core`, alongside a `getCompactor()`
   * factory) are the same built-in strategies this prop's own default
   * falls back to, reusable as a starting point for a custom one.
   * Default `null`.
   */
  compactor?: ICompactor | null;
  /**
   * Opts into an `undo()`/`redo()` history — off by default, since it
   * has a real memory cost (up to `undoHistoryLimit` cloned layout
   * snapshots kept in memory) that shouldn't apply to every consumer
   * automatically. A snapshot is taken at each *committed* change —
   * drag start, resize start, an item added/removed (including
   * `duplicateItem`), and `compactNow()`/`rearrange()` — not per
   * intermediate drag-move frame, and not for every automatic
   * recompaction a commit triggers as a side effect. See `undo()`/
   * `redo()`/`canUndo`/`canRedo` on the exposed instance. Default
   * `false`.
   */
  enableUndoRedo?: boolean;
  /**
   * Caps how many snapshots `undo()` can step back through when
   * `enableUndoRedo` is on — the oldest is dropped once this is
   * exceeded, so a long editing session doesn't grow this without
   * bound. Ignored when `enableUndoRedo` is `false`. Default `50`.
   */
  undoHistoryLimit?: number;
  /**
   * Selects the built-in compaction strategy — see `ECompactType` for
   * the full set and what each one does. Default `ECompactType.VERTICAL`
   * (items compact upward), matching this prop's own former boolean
   * predecessor's default (`verticalCompact: true`).
   *
   * Replaces the old, separate `verticalCompact: boolean` prop — see
   * `MIGRATION.md` for the exact mapping
   * (`verticalCompact: true` → `ECompactType.VERTICAL`,
   * `verticalCompact: false` → `ECompactType.NONE`) if migrating an
   * existing consumer.
   */
  compactType?: ECompactType | `${ECompactType}`;
}
