/**
 * Events emitted by the GridLayout component
 */
export enum EGridLayoutEvent {
  BREAKPOINT_CHANGED = `breakpoint-changed`,
  CHANGED_DIRECTION = `changed-direction`,
  COLUMNS_CHANGED = `columns-changed`,
  CONTAINER_RESIZED = `container-resized`,
  DRAG_END = `dragend`,
  DRAG_MOVE= `dragmove`,
  DRAG_START = `dragstart`,
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  LAYOUT_CREATED = `layout-created`,
  LAYOUT_MOUNTED = `layout-mounted`,
  LAYOUT_READY = `layout-ready`,
  LAYOUT_UPDATED = `layout-updated`,
  LAYOUT_UPDATE = `update:layout`,
}
