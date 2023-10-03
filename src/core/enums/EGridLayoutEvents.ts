/**
 * Events emitted by the GridLayout component
 */
export enum EGridLayoutEvent {
  BREAKPOINT_CHANGED = `breakpoint-changed`,
  COLUMNS_CHANGED = `columns-changed`,
  CONTAINER_RESIZED = `container-resized`,
  ITEM_MOVE = `item-move`,
  // ITEM_MOVED = `item-moved`,
  // ITEM_RESIZE = `item-resize`,
  // ITEM_RESIZED = `item-resized`,
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  LAYOUT_CREATED = `layout-created`,
  LAYOUT_MOUNTED = `layout-mounted`,
  LAYOUT_READY = `layout-ready`,
  LAYOUT_UPDATED = `layout-updated`,
  UPDATE_BREAKPOINT = `update-breakpoint`,
  UPDATE_LAYOUT = `update:layout`,
}
