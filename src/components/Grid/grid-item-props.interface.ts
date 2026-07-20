import { IGridAriaLabels } from '@/core/common/interfaces/aria-labels.interface';

/**
 * Props accepted by the `GridItem` component. `h`, `i`, `w`, `x`, and `y`
 * are the only required props — everything else has a default applied via
 * `withDefaults()` in `GridItem.vue` (noted per-property below).
 *
 * A GridItem's own props (`isDraggable`, `isResizable`, `isBounded`) can
 * each be left `null` to defer to the corresponding prop on the parent
 * `GridLayout` instead — see `GridLayout`'s `isDraggable`/`isResizable`/
 * `isBounded` props and the `eventBus`-based cascade documented in
 * `docs/ARCHITECTURE.md`.
 */
export interface IGridItemProps {
  /** Per-item overrides for localizable UI/ARIA strings — only the keys actually set here override whatever `GridLayout`'s own `ariaLabels` (or the built-in English defaults) would otherwise supply for this specific item. See `IGridAriaLabels` for every key and its default text. */
  ariaLabels?: IGridAriaLabels;
  /**
   * Scrolls the item's nearest scrollable ancestor automatically when a
   * drag or resize approaches its edge, rather than the interaction
   * being limited to whatever's currently in the viewport. A native
   * `requestAnimationFrame`-driven implementation (see
   * `@/core/helpers/native-interaction.ts`'s `createNativeAutoScroll`),
   * not configurable beyond on/off — margin/speed are fixed constants
   * tuned for the common case, not exposed as their own props. Default
   * `false`.
   */
  autoScroll?: boolean;
  /**
   * Automatically re-runs `autoSize()`'s measurement whenever the
   * default slot's content actually changes size — a chart that renders
   * taller with more data points, for instance — without needing the
   * whole grid to also be `autoSize`d, and without a consumer manually
   * calling the exposed `autoSize()` method themselves every time
   * something inside might have changed. Backed by a `ResizeObserver` on
   * the slot content's own root element, set up once at mount (unlike
   * the exposed `autoSize()` method, invoked from outside the component
   * entirely, this reads `slots.default()` from within `GridItem`'s own
   * mount lifecycle, where — per docs/REFACTORING.md #12 — the returned
   * VNode's `.elm` reliably ties back to the real, already-rendered DOM
   * element rather than a disconnected fresh one). Default `false`.
   */
  autoHeight?: boolean;
  /** Border radius, in pixels, applied via an inline style when `useBorderRadius` is true. `null` defers to `GridLayout`'s own `borderRadiusPx` (itself `10` by default) — same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. (Previously declared but had no effect at all — see docs/REFACTORING.md #23; then wired up but not inheritable — see #47.) */
  borderRadiusPx?: number | null;
  /** CSS selector restricting which descendant elements can start a drag; `null` (default) allows dragging from anywhere on the item except `dragIgnoreFrom` matches. Passed to interact.js as `allowFrom`. */
  dragAllowFrom?: string | null;
  /** CSS selector for elements that should *not* start a drag (e.g. buttons/links inside the item). Default `` `a, button` ``. */
  dragIgnoreFrom?: string;
  /** Master switch for interactivity — when `false`, the item can't be dragged, resized, or closed regardless of the other props. `null` (default) inherits `GridLayout`'s own `enableEditMode` (itself `true` by default) — same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. Set explicitly per item to override the grid-wide default for just that item. */
  enableEditMode?: boolean | null;
  /** Height, in grid row units. Required. */
  h: number;
  /** Unique identifier matching this item's entry in the parent `GridLayout`'s `layout` array. Required (though typed optional-looking due to a default of `''`, an empty id isn't meaningful in practice). */
  i: string | number;
  /** Restricts dragging to within the container's bounds. `null` (default) defers to `GridLayout`'s `isBounded` prop. */
  isBounded?: boolean | null;
  /** Whether this item can be dragged. `null` (default) defers to `GridLayout`'s `isDraggable` prop. */
  isDraggable?: boolean | null;
  /** Whether this item participates in the parent layout's RTL mirroring. Default `true`. */
  isMirrored?: boolean | null;
  /** Whether this item can be resized. `null` (default) defers to `GridLayout`'s `isResizable` prop. */
  isResizable?: boolean | null;
  /** When `true`, the item ignores `isDraggable`/`isResizable` entirely (can't be moved or resized, and is excluded from drag-collision cascades). Default `false`. */
  isStatic?: boolean | null;
  /** Maximum width, in grid column units. Default `Infinity`. */
  maxW?: number;
  /** Maximum height, in grid row units. Default `Infinity`. */
  maxH?: number;
  /** Minimum height, in grid row units. Default `1`. */
  minH?: number;
  /** Minimum width, in grid column units. Default `1`. */
  minW?: number;
  /** Locks the width/height ratio while resizing, via interact.js's `aspectRatio` modifier. Default `false`. */
  preserveAspectRatio?: boolean;
  /** CSS selector for elements that should *not* start a resize. `null` (default) means no restriction. */
  resizeIgnoreFrom?: string | null;
  /** CSS color for the visible resize handle, when `showResizeHandles` is true. Applied via a `--resize-handle-color` CSS custom property; has no effect while `showResizeHandles` is false, since there's nothing visible to color. Default `null` (inherits `GridLayout`'s own `resizeHandleColor` — itself a semi-transparent gray by default), same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. */
  resizeHandleColor?: string | null;
  /** Renders a visible resize-handle affordance (a small triangle/bar per edge and corner) instead of only a cursor change on hover. Default `null` (inherits `GridLayout`'s own `showResizeHandles` — itself `false` by default), same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. */
  showResizeHandles?: boolean | null;
  /** Shows the built-in close button (emits `EGridItemEvent.REMOVE_ITEM` on click). Ignored when `isStatic` is true. `null` (default) defers to `GridLayout`'s `showCloseButton` prop (itself `false` by default) — see docs/REFACTORING.md #31 for why this needed fixing rather than already working like `isBounded`. */
  showCloseButton?: boolean | null;
  /** Applies `borderRadiusPx` as a border radius. `null` defers to `GridLayout`'s own `useBorderRadius` (itself `false` by default) — same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. */
  useBorderRadius?: boolean | null;
  /** Width, in grid column units. Required. */
  w: number;
  /** Starting horizontal position, in grid column units. Required. */
  x: number;
  /** Starting vertical position, in grid row units. Required. */
  y: number;
}
