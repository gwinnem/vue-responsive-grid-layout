/**
 * Events emitted by the GridLayout component
 */
export enum EGridLayoutEvent {
  BREAKPOINT_CHANGED = `breakpoint-changed`,
  COLUMNS_CHANGED = `columns-changed`,
  CONTAINER_RESIZED = `container-resized`,
  DRAG_END = `drag-end`,
  DRAG_START = `drag-start`,
  ITEM_MOVE = `item-move`,
  ITEM_MOVED = `item-moved`,
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  LAYOUT_CREATED = `layout-created`,
  LAYOUT_MOUNTED = `layout-mounted`,
  LAYOUT_READY = `layout-ready`,
  LAYOUT_UPDATED = `layout-updated`,
  UPDATE_LAYOUT = `layout-update`,
}
