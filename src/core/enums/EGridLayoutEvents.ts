/**
 * Events emitted by the GridLayout component
 */
export enum EGridLayoutEvent {
  CONTAINER_RESIZED = `container-resized`,
  ITEM_MOVE = `item-move`,
  ITEM_MOVED = `item-moved`,
  ITEM_RESIZE = `item-resize`,
  ITEM_RESIZED = `item-resized`,
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  LAYOUT_CREATED = `layout-created`,
  LAYOUT_MOUNTED = `layout-mounted`,
  LAYOUT_READY = `layout-ready`,
  UPDATE_BREAKPOINT = `update-breakpoint`,
  UPDATE_LAYOUT = `update:layout`,
}
