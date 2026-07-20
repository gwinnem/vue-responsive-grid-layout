/**
 * Payload for `EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE`, emitted when
 * something is dropped via native HTML5 drag-and-drop from outside the
 * grid system entirely (`allowOutsideDrop`) — see
 * `grid-layout-props.interface.ts` for the full explanation of why the
 * library doesn't add anything to `layout` on its own here, unlike
 * `allowCrossGridDrag`'s `ICrossGridItemDropped`.
 */
export interface IOutsideItemDropped {
  /** Resolved horizontal grid position (grid columns), from wherever the pointer was released. */
  x: number;
  /** Resolved vertical grid position (grid rows), from wherever the pointer was released. */
  y: number;
  /** Width, in grid columns — always `outsideDropWidth`, included here so a consumer doesn't need to separately track what they configured. */
  w: number;
  /** Height, in grid rows — always `outsideDropHeight`. */
  h: number;
  /** The native `DataTransfer` object from the browser's own `drop` event, or `null` if the browser didn't provide one. Read whatever the dragged element attached to it (typically via `dataTransfer.getData(...)`, matching whatever `dataTransfer.setData(...)` call the drag source made) to decide what this drop actually represents. */
  dataTransfer: DataTransfer | null;
}
