/**
 * Events emitted by the GridLayout component
 */
export enum EGridLayoutEvent {
  CONTAINER_RESIZED = `container-resized`,
  ITEM_MOVE = `item-move`,
  ITEM_MOVED = `item-moved`,
  ITEM_RESIZE = `item-resize`,
  ITEM_RESIZED = `item-resized`,
  INTERSECTION_OBSERVE = `intersection-observe`,
  INTERSECTION_UNOBSERVE = `intersection-unobserve`,
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  LAYOUT_CREATED = `layout-created`,
  LAYOUT_MOUNTED = `layout-mounted`,
  LAYOUT_READY = `layout-ready`,
  // RECALCULATE_STYLES = `recalculate-styles`,
  UPDATE_BREAKPOINT = `update:breakpoint`,
  UPDATE_LAYOUT = `update:layout`,
}
