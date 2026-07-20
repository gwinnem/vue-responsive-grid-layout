/**
 * Events emitted by the `GridLayout` component. Re-exported from the
 * package's public entry point (`src/components/index.ts`) as a real
 * (value) export, so consumers can both type an event handler's parameter
 * and compare against these at runtime.
 *
 * `LAYOUT_UPDATE`'s value (`update:layout`) is Vue's `v-model` convention —
 * it's what lets `<GridLayout v-model:layout="layout">` work.
 */
export enum EGridLayoutEvent {
  /** Fired when responsive mode picks a different breakpoint than before. */
  BREAKPOINT_CHANGED = `breakpoint-changed`,
  /**
   * Declared on the enum but not wired into `defineEmits` or emitted
   * anywhere in `GridLayout.vue` — dead. Kept for backwards compatibility;
   * don't rely on it firing.
   */
  CHANGED_DIRECTION = `changed-direction`,
  /** Fired when the resolved `colNum` changes (either the prop, or the responsive-breakpoint column count). */
  COLUMNS_CHANGED = `columns-changed`,
  /**
   * Declared on the enum but not wired into `defineEmits` or emitted
   * anywhere in `GridLayout.vue` — dead. (`GridItem` has its own,
   * functioning `CONTAINER_RESIZED` event — see `EGridItemEvent` — this is
   * a different, unused one on the layout itself.)
   */
  CONTAINER_RESIZED = `container-resized`,
  /** Fired when a drag ends (mirrors the browser's own `dragend`). */
  DRAG_END = `dragend`,
  /** Fired while a drag is in progress (mirrors the browser's own `dragmove`, i.e. every `dragmove`/`drag` tick). */
  DRAG_MOVE = `dragmove`,
  /** Fired when a drag begins (mirrors the browser's own `dragstart`). */
  DRAG_START = `dragstart`,
  /**
   * Fired on the *target* `GridLayout` when a cross-grid drop is
   * attempted (via `allowCrossGridDrag`) but rejected because that grid
   * has `disableExternalDrop` set. Payload: `{ itemId, sourceLayoutId }`
   * — see `ICrossGridDropRejected`. The item stays in its source grid;
   * nothing about either grid's `layout` array changes.
   */
  CROSS_GRID_DROP_REJECTED = `cross-grid-drop-rejected`,
  /**
   * Fired on the *target* `GridLayout` when an item is successfully
   * moved into it from another grid via `allowCrossGridDrag`. Payload:
   * `{ item, sourceLayoutId }` — the moved layout item (already inserted
   * into this grid's `layout`) and the source grid's `layoutId`.
   */
  CROSS_GRID_ITEM_DROPPED = `cross-grid-item-dropped`,
  /**
   * Fired when something is dropped via native HTML5 drag-and-drop from
   * outside the grid system entirely (`allowOutsideDrop`) — a plain
   * `draggable="true"` element, not a `GridItem` or another `GridLayout`.
   * Payload: `{ x, y, w, h, dataTransfer }` — the resolved grid position
   * and size (from `outsideDropWidth`/`outsideDropHeight`), and the
   * native `DataTransfer` object so the handler can read whatever the
   * dragged element attached to it (e.g. via `dataTransfer.getData(...)`)
   * to decide what — if anything — to actually add to `layout`. The
   * library has no way to know what a dropped element represents on its
   * own, so nothing is added automatically.
   */
  ITEM_DROPPED_FROM_OUTSIDE = `item-dropped-from-outside`,
  /** Fired from `onBeforeMount`, before the layout has been validated or laid out. */
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  /** Fired synchronously during component setup, immediately, with the initial `layout` prop. */
  LAYOUT_CREATED = `layout-created`,
  /** Fired from `onMounted`, before layout validation/responsive setup has run. */
  LAYOUT_MOUNTED = `layout-mounted`,
  /** Fired once, after the container's width is known and every GridItem's size is stable — the first reliable point to inspect final positions/sizes. */
  LAYOUT_READY = `layout-ready`,
  /**
   * The `v-model:layout` update event — fired whenever the layout array is
   * replaced internally (compaction, responsive breakpoint switch, drag
   * completion, etc). Consumers using `v-model:layout` don't need to
   * listen for this directly; Vue wires it up automatically.
   */
  LAYOUT_UPDATE = `update:layout`,
  /** Fired after a layout mutation (compaction, drag/resize completion, responsive switch) has fully settled. */
  LAYOUT_UPDATED = `layout-updated`,
  /**
   * Fired when `preventCollision` blocks an in-progress drag or resize —
   * the item stays exactly where it was (the collision-blocked position
   * is never committed), with no other signal otherwise indicating this
   * happened, since a blocked move looks identical to "the pointer
   * hasn't moved yet" from a consumer's perspective. Payload: the
   * blocked item's `id` — useful for a "can't place item here" shake,
   * flash, or toast without needing to reimplement collision detection
   * against the same layout array just to know when to show one.
   */
  MOVE_BLOCKED_BY_COLLISION = `move-blocked-by-collision`,
  /**
   * Fired whenever the current multi-selection changes (`multiSelect`)
   * — an item selected/deselected, the selection replaced by a plain
   * click, or cleared by clicking empty grid background. Payload: the
   * full current selection as an array of item ids (not just the one
   * that changed), matching the exposed `selectedItems` value at the
   * moment this fires.
   */
  SELECTION_CHANGED = `selection-changed`,
}
