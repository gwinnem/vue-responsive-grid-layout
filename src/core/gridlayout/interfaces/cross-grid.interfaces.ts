import { ILayoutItem } from '@/components/Grid/layout-definition';

/**
 * A `GridLayout` instance's registration in the shared cross-grid
 * registry (`cross-grid-registry.ts`), created when `allowCrossGridDrag` is
 * true. Lets *other* `GridLayout` instances discover this one without
 * needing a common Vue ancestor to `provide`/`inject` through — grids
 * participating in cross-grid drag/drop are frequently siblings-of-siblings
 * or otherwise unrelated in the component tree, so a module-level
 * registry (a plain `Set`, not Vue state) is what makes discovery
 * possible at all.
 */
export interface ICrossGridZone {
  /** This grid's `layoutId` (either explicitly set via the prop, or auto-generated). Used to identify the source/target grid in emitted event payloads. */
  layoutId: string;
  /** Live read of this grid's current `disableExternalDrop` prop — a function, not a snapshotted boolean, so a later reactive change to the prop is respected without needing to re-register. */
  isExternalDropDisabled: () => boolean;
  /** Returns this grid's container element's current bounding rect, or `null` if it's not mounted/measurable. Read fresh on every check rather than cached, since layout/scroll can change between drags. */
  getRect: () => DOMRect | null;
  /** Called by the *source* grid when a drop is accepted — inserts `item` into this (the target) grid's `layout` and emits `CROSS_GRID_ITEM_DROPPED`. */
  acceptDrop: (item: ILayoutItem, sourceLayoutId: string) => void;
  /** Called by the *source* grid when this (the target) grid has `disableExternalDrop` set — emits `CROSS_GRID_DROP_REJECTED` on the target; does not modify either grid's layout. */
  rejectDrop: (itemId: string | number, sourceLayoutId: string) => void;
}

/** Payload for `EGridLayoutEvent.CROSS_GRID_DROP_REJECTED`, emitted on the target grid. */
export interface ICrossGridDropRejected {
  itemId: string | number;
  sourceLayoutId: string;
}

/** Payload for `EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED`, emitted on the target grid. */
export interface ICrossGridItemDropped {
  item: ILayoutItem;
  sourceLayoutId: string;
}
