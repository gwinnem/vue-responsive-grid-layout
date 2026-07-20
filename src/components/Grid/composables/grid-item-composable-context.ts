import { ComputedRef, Ref } from 'vue';
import { RESIZE_EDGE_MAP } from '@/core/helpers/native-interaction';
import { IGridItemProps } from '../grid-item-props.interface';
import { TGridItemEventBus } from '@/core/griditem/interfaces/grid-item.interfaces';

/**
 * The slice of GridItem's internal state that both `useGridItemDrag` and
 * `useGridItemResize` need to read and, in most cases, write. It's a wide
 * interface because the underlying coupling is real — position/size math
 * and the container's measured layout are shared between dragging and
 * resizing in the actual component. The composable split isn't about
 * pretending that coupling doesn't exist; it's about giving each concern
 * its own file, its own tests, and a name, instead of interleaving both
 * in one 1,300-line component. See docs/REFACTORING.md and
 * docs/ARCHITECTURE.md for the full rationale.
 */
export interface IGridItemComposableContext {
  /** Only populated when the `autoHeight` prop is true — the wrapper element `useGridItemResize`'s `setupAutoHeight()` observes for size changes, distinct from `gridItem` (the item's own root) since observing the root itself would also fire on drag/resize-driven size changes, not just the slot content's own. */
  autoHeightWrapper: Ref<HTMLElement | null>;
  /** Restricts dragging to within the container's bounds; only read by `useGridItemDrag`. */
  bounded: Ref<boolean | null>;
  /** Resolved master interactivity switch — `useGridItemDrag`/`useGridItemResize`/`useGridItemKeyboard` all gate on this rather than the raw `enableEditMode` prop directly, since that prop is `null` by default (meaning "inherit from GridLayout") and reading it directly as a boolean would incorrectly block every interaction by default. See ROADMAP.md's "layout-level read-only/edit-mode toggle" item. */
  editModeEnabled: Ref<boolean | null>;
  /** Current column count, resolved from the parent layout's `colNum`/responsive breakpoint. */
  cols: Ref<number>;
  /** The container's last known-good measured pixel width (see the `updateWidth` guard in `GridItem.vue` — never set to a non-positive value). */
  containerWidth: Ref<number>;
  /** This `GridItem` instance's `defineEmits`-typed emit function. */
  /** Vue's own overloaded `defineEmits` type can't be narrowed past `any` here — see `useCrossGridDrag.ts`'s own `IUseCrossGridDragContext.emit` for the full rationale (tried and reverted two narrower alternatives, both broke real call-site assignment). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (...args: any[]) => void;
  /** The shared eventBus injected from `GridLayout` — see `docs/ARCHITECTURE.md`. */
  eventBus: TGridItemEventBus;
  /** Template ref to the item's root DOM element — the native drag engine's own target, and the `target` every resize event reports regardless of which handle actually started the gesture. */
  gridItem: Ref<HTMLElement>;
  /** Current height, in grid row units. */
  innerH: Ref<number>;
  /** Current width, in grid column units. */
  innerW: Ref<number>;
  /** Current horizontal position, in grid column units. */
  innerX: Ref<number>;
  /** Current vertical position, in grid row units. */
  innerY: Ref<number>;
  /** `[horizontal, vertical]` spacing between items, in pixels. */
  margin: Ref<number[]>;
  /** Maximum number of rows the layout may grow to. */
  maxRows: Ref<number>;
  /** This `GridItem`'s own props. */
  props: IGridItemProps;
  /** Whether this item should currently render right-to-left (combines the parent layout's `isMirrored` with this item's own `rtl` state). */
  renderRtl: ComputedRef<boolean>;
  /** Template refs to the 8 resize-hint spans (`.vue-resize-hint--n`/`--s`/etc) — the native resize engine's own hit targets, one `pointerdown` listener per handle. Only read by `useGridItemResize`. */
  resizeHandleRefs: Record<keyof typeof RESIZE_EDGE_MAP, Ref<HTMLElement | null>>;
  /** Height of one grid row, in pixels. */
  rowHeight: Ref<number>;
  /** CSS transform scale factor to compensate for in pixel math. */
  transformScale: Ref<number>;
}

/**
 * `useGridItemDrag` additionally needs to know when a resize is in
 * progress (so its own drag handling doesn't run reentrantly while a
 * resize is active) — passed in separately since it's owned by
 * `useGridItemResize`, created alongside it in GridItem.vue.
 */
export interface IGridItemDragContext extends IGridItemComposableContext {
  isResizing: Ref<boolean>;
}
