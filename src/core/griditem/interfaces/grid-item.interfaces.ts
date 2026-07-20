import { Emitter } from 'mitt';
import { IEventsData } from '@/core/common/interfaces/event-bus.interfaces';

/** Grid-unit x/y position — the output of {@link useGridItemDrag}'s `calcXY`. */
export interface ICalcXy {
  x: number;
  y: number;
}

/** Grid-unit width/height — the output of `useGridItemResize`'s `calcWH`. */
export interface ICalcWh {
  w: number;
  h: number;
}

/**
 * Pixel position/size for a `GridItem`, as tracked during an active drag
 * (`left`/`top`) or resize (`width`/`height`). `right` is populated
 * instead of `left` when rendering RTL.
 */
export interface IGridItemPosition {
  left?: number;
  right?: number;
  top: number;
  width: number;
  height: number;
}

/** Pixel width/height only — used for `resizing` state and `emitContainerResized`'s payload. */
export interface IGridItemWidthHeight {
  width: number;
  height: number;
}

/**
 * Which edges of a `GridItem` are being dragged during a resize, as
 * reported by interact.js's `resizestart` event (`event.edges`). All four
 * are enabled (see `tryMakeResizable` in `useGridItemResize.ts`), so any
 * single edge or diagonal corner combination can be `true`.
 */
export interface IInteractEdges {
  bottom: boolean;
  left: boolean;
  right: boolean;
  top: boolean;
}

/**
 * The eventBus contract GridItem injects (provided by GridLayout). Shared
 * between GridItem.vue and its composables so both sides of every
 * eventBus.on/emit pair stay in sync with a single type definition.
 */

/** Payload of the `itemClicked` eventBus message — a genuine click/tap on an item (drag/resize trailing clicks already suppressed), for `GridLayout`'s own `multiSelect` handling. */
export interface IItemClickedData {
  i: string | number;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
}

export type TGridItemEventBus = Emitter<{
  changeDirection: boolean;
  compact?: undefined;
  dragEvent?: IEventsData;
  resizeEvent?: IEventsData;
  setBounded: boolean;
  setShowCloseButton: boolean;
  setEnableEditMode: boolean;
  setUseBorderRadius: boolean;
  setBorderRadiusPx: number;
  itemClicked: IItemClickedData;
  setColNum: number;
  setMirrored: boolean;
  setDraggable: boolean;
  setMargin: number[];
  setResizable: boolean;
  setRowHeight: number;
  updateWidth: number;
  setTransformScale: number;
  setUseCssTransforms: boolean;
  setMaxRows: number;
}>;
