import { Emitter } from 'mitt';
import { TLayout } from '@/components/Grid/layout-definition';
import { IEventsData } from '@/core/common/interfaces/event-bus.interfaces';
import { IItemClickedData } from '@/core/griditem/interfaces/grid-item.interfaces';

/** Grid-unit position/size of `GridLayout`'s internal drag placeholder item — the hidden `GridItem` shown while a drag is in progress. */
export interface IPlaceholder {
  h: number;
  i: number | string;
  x: number;
  y: number;
  w: number;
}

/**
 * The shape of `GridLayout`'s internal state, as seen through `$parent` by
 * a child `GridItem` (via `GridLayout`'s `defineExpose(...)` call — see
 * `docs/ARCHITECTURE.md`). Combined with `IGridLayoutProps` to form the
 * `thisLayout` type in `GridItem.vue`.
 */
export interface ILayoutData {
  /** The `ResizeObserver` watching the container for size changes, or `null` before it's been created (mount) / after cleanup (unmount). */
  erd: ResizeObserver | null;
  /** Whether an item is currently being dragged or resized — drives the drag-placeholder's visibility. */
  isDragging: boolean;
  /** Per-breakpoint layout cache, keyed by breakpoint name (see `useResponsiveLayout`). */
  layouts: { [key: string]: TLayout };
  /** The currently active responsive breakpoint name, or `null` before responsive mode has resolved one. */
  lastBreakpoint: string | null;
  lastLayoutLength: number;
  /** Inline style applied to the grid container — currently just `height`, for `autoSize`. */
  mergeStyle: { [key: string]: string };
  /** The layout array as last processed internally (post-compaction/validation), distinct from the raw `layout` prop. */
  originalLayout: TLayout | null;
  /** Position/size of the hidden drag-placeholder `GridItem`. */
  placeholder: IPlaceholder;
  /** The current multi-selection (`multiSelect`) — read reactively by every `GridItem`'s own `isSelected` computed via `thisLayout`. Always empty when `multiSelect` is off. */
  selectedItemIds: Set<string | number>;
  /** Snapshot of every item's position at drag-start, used by the `restoreOnDrag` prop. */
  positionsBeforeDrag: Record<string | number, { x: number; y: number }>;
  /** The container's last measured pixel width, or `null` before it's been measured. */
  width: number | null;
  this$refsLayout: HTMLElement;
}

/** Parameters shared by the grid-unit↔pixel conversion helpers in `core/helpers/utils.ts`/`core/griditem/helpers/grid-item-calculate-helper.ts`. */
export interface IPositionParameters {
  cols: number;
  containerWidth: number | null;
  margin: [number, number];
  maxRows: number | null;
  rowHeight: number | null;
}

/**
 * The eventBus contract GridLayout creates and provides to its GridItem
 * children. Shared with GridLayout's composables so both sides of every
 * eventBus.on/emit pair stay in sync with a single type definition.
 */
export type TGridLayoutEventBus = Emitter<{
  changeDirection: boolean;
  compact: void;
  // dragEvent's payload is required, not optional like resizeEvent's —
  // confirmed by grep across every emitter, nothing ever emits this one
  // without a payload the way onWindowResize does for resizeEvent (see
  // docs/REFACTORING.md #70).
  dragEvent: IEventsData;
  resizeEvent?: IEventsData;
  setColNum: number;
  setBounded: boolean;
  setShowCloseButton: boolean;
  setEnableEditMode: boolean;
  setUseBorderRadius: boolean;
  itemClicked: IItemClickedData;
  setBorderRadiusPx: number;
  setDraggable: boolean;
  setMargin: number[];
  setMaxRows: number;
  setResizable: boolean;
  setRowHeight: number;
  updateWidth: number | null;
  setTransformScale: number;
  setUseCssTransforms: boolean;
}>;
