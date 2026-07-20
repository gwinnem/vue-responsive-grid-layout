/**
 * Events emitted by the `GridItem` component. Re-exported from the
 * package's public entry point (`src/components/index.ts`) as a real
 * (value) export, so consumers can both type an event handler's parameter
 * and compare against these at runtime, e.g.
 * `if (eventName === EGridItemEvent.RESIZED) { ... }`.
 */
export enum EGridItemEvent {
  /** The item's rendered pixel size changed; fired after `createStyle()` recomputes `styleObj`. */
  CONTAINER_RESIZED = `container-resized`,
  /**
   * Declared in `defineEmits` but not currently emitted anywhere in the
   * component — `MOVE`/`MOVED` are the events that actually fire during a
   * drag. Kept for backwards compatibility with existing type usage;
   * don't rely on this one firing.
   */
  DRAG = `drag`,
  /** See `DRAG` — declared but not currently emitted; `MOVED` fires instead. */
  DRAGGED = `dragged`,
  /** Fired continuously while a drag is in progress, whenever the grid-unit position changes. */
  MOVE = `item-move`,
  /** Fired once when a drag completes and the item's position actually changed. */
  MOVED = `item-moved`,
  /** Fired when the item's close button is clicked (only rendered when `showCloseButton` and `enableEditMode` are both true). */
  REMOVE_ITEM = `remove-grid-item`,
  /** Fired continuously while a resize is in progress, whenever the grid-unit size changes. */
  RESIZE = `resize`,
  /** Fired once when a resize completes and the item's size actually changed. */
  RESIZED = `resized`,
  /**
   * Fired on a genuine click/tap on the item — not the trailing click a
   * browser can still dispatch immediately after a drag/resize gesture
   * ends, which is suppressed. Payload: `(id, event)`, the native
   * `MouseEvent` included so a consumer (or `GridLayout`'s own
   * `multiSelect` handling) can check `shiftKey`/`ctrlKey`/`metaKey` for
   * additive-selection gestures. See `multiSelect`/`selectedItems`.
   */
  ITEM_CLICKED = `item-clicked`,
}
