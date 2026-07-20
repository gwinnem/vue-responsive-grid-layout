import { nextTick, Ref } from 'vue';
import { ILayoutItem, TLayout } from '@/components/Grid/layout-definition';
import { IGridLayoutProps } from '../grid-layout-props.interface';
import { getCompactor } from '@/core/gridlayout/helpers/compactor';
import { ECompactType } from '@/core/gridlayout/enums/ECompactType';
import { findCrossGridZoneAt, registerCrossGridZone } from '@/core/gridlayout/helpers/cross-grid-registry';
import { ICrossGridZone } from '@/core/gridlayout/interfaces/cross-grid.interfaces';
import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';
import { TGridLayoutEventBus } from '@/core/gridlayout/interfaces/layout-data.interface';
import { findFirstFitSlot } from '@/core/gridlayout/helpers/bin-pack-helper';

/** Dependencies `useCrossGridDrag` needs from `GridLayout.vue`. */
export interface IUseCrossGridDragContext {
  props: IGridLayoutProps;
  /**
   * `GridLayout`'s own `defineEmits`-generated emit — its real type is a
   * *union of call signatures*, one per declared event, each with its
   * own specific payload types (not a single, nameable function shape).
   * Tried narrowing this to `(event: EGridLayoutEvent, ...args:
   * unknown[]) => void` and separately to `(event: string, ...args:
   * unknown[]) => void` — both broke the actual assignment at every
   * real call site (`GridLayout.vue` passing its own `emit` in), since
   * Vue's overloaded type only accepts specific literal event names per
   * overload, not the broader parameter type either alternative
   * promised. `any` here is a deliberate, checked exception, not an
   * oversight — every real call site (see below) still passes a real
   * `EGridLayoutEvent` value in practice.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (...args: any[]) => void;
  eventBus: TGridLayoutEventBus;
  /** `GridLayout`'s own root element ref — used for this grid's own `getRect()` in the cross-grid registry. */
  refsLayout: Ref<HTMLElement>;
  isDragging: Ref<boolean>;
  originalLayout: Ref<TLayout | undefined>;
  updateHeight: () => void;
}

/**
 * Encapsulates `allowCrossGridDrag`: registering this grid into the
 * shared cross-grid registry (`core/gridlayout/helpers/cross-grid-registry.ts`),
 * tracking which item (if any) is currently being dragged with
 * cross-grid dropping possible, and the accept/reject decision at
 * `dragend`.
 *
 * Extracted from `GridLayout.vue` as part of the structural cleanup
 * flagged in `docs/REFACTORING.md`'s Structural section — see
 * `docs/ARCHITECTURE.md` for the full design this composable
 * implements, and finding #68 there for the extraction itself. Kept
 * deliberately un-reactive internally (`crossGridDraggedId`,
 * `unregisterCrossGridZone` are plain variables, not refs) — nothing
 * here needs a reactive read/write, it's just state read once at
 * `dragend`, matching the reasoning already documented for these same
 * variables before the extraction (see finding #35).
 */
/** Return shape of {@link useCrossGridDrag}. */
export interface IUseCrossGridDragReturn {
  handleDragEnd: (
    id: string | number,
    clientX: number | undefined,
    clientY: number | undefined,
    currentItem: ILayoutItem,
  ) => boolean;
  handleDragStart: (id: string | number) => void;
  setCrossGridDragEnabled: (enabled: boolean) => void;
  teardown: () => void;
}

export function useCrossGridDrag(ctx: IUseCrossGridDragContext): IUseCrossGridDragReturn {
  const { props, emit, eventBus, refsLayout, isDragging, originalLayout, updateHeight } = ctx;

  let crossGridDraggedId: string | number | null = null;
  let unregisterCrossGridZone: (() => void) | undefined;

  /** This grid's own `getRect`/`acceptDrop`/`rejectDrop` implementation, registered into the shared cross-grid registry when `allowCrossGridDrag` is true. */
  const crossGridZone: ICrossGridZone = {
    acceptDrop: (item, sourceLayoutId) => {
      // Bug fix: this used to place the dropped item at a hardcoded
      // `{ x: 0, y: 999 }` and rely on the subsequent vertical-compact
      // call to settle it into place — the same "place far below, let
      // compaction pull it up" anti-pattern `findFirstFitSlot`'s own
      // doc comment specifically calls out as broken: plain vertical
      // compaction only ever moves an item straight up *within its own
      // x range*, it never searches other columns, and it can't jump
      // over a static item blocking that column to reach a gap further
      // up. Reported directly: a static item sitting below an actual
      // gap (e.g. `A` at y:0, a static item at y:4, gap at y:2) meant a
      // dropped item landed at y:6 — pushed down against the static
      // item's own bottom edge — instead of in the gap at y:2, since
      // straight-up movement from y:999 hit the static item first and
      // stopped there, never able to continue past it. `findFirstFitSlot`
      // does a real first-fit bin-pack instead — row by row, column by
      // column — so it finds the gap directly regardless of what's
      // sitting below it.
      const slot = findFirstFitSlot(props.layout, props.colNum as number, item.w, item.h);
      const droppedItem: ILayoutItem = { ...item, x: slot.x, y: slot.y };
      // Mutates props.layout in place (push), matching how every other
      // in-place layout change in this file works (compactLayout/
      // moveElement mutate existing items' x/y directly) — a fresh array
      // via spread/concat here would only reach a real v-model consumer
      // through the `update:layout` emit below, not the same array
      // reference this component (and anything already holding a
      // reference to it, e.g. a test) is reading from.
      props.layout.push(droppedItem);
      emit(EGridLayoutEvent.LAYOUT_UPDATE, props.layout);
      getCompactor(props.compactType! as ECompactType).compact(props.layout, props.colNum as number, {
        compactType: props.compactType! as ECompactType,
      });
      eventBus.emit(`compact`);
      updateHeight();
      emit(EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED, { item: droppedItem, sourceLayoutId });
    },
    getRect: () => (refsLayout.value instanceof HTMLElement ? refsLayout.value.getBoundingClientRect() : null),
    isExternalDropDisabled: () => props.disableExternalDrop as boolean,
    get layoutId() {
      return props.layoutId as string;
    },
    rejectDrop: (itemId, sourceLayoutId) => {
      emit(EGridLayoutEvent.CROSS_GRID_DROP_REJECTED, { itemId, sourceLayoutId });
    },
  };

  /**
   * Registers/unregisters this grid's `crossGridZone` with the shared
   * registry — called once at mount with the initial `allowCrossGridDrag`
   * value, and again whenever that prop changes reactively.
   */
  const setCrossGridDragEnabled = (enabled: boolean): void => {
    if(enabled && !unregisterCrossGridZone) {
      unregisterCrossGridZone = registerCrossGridZone(crossGridZone);
    } else if(!enabled && unregisterCrossGridZone) {
      unregisterCrossGridZone();
      unregisterCrossGridZone = undefined;
    }
  };

  /** Unregisters this grid on unmount — a no-op if it was never registered (`allowCrossGridDrag` was never true). */
  const teardown = (): void => {
    unregisterCrossGridZone?.();
  };

  /** Called from `dragEvent()`'s `EDragEvent.DRAG_START` case. Records which item is being dragged, if cross-grid dragging is enabled. */
  const handleDragStart = (id: string | number): void => {
    if(props.allowCrossGridDrag) {
      crossGridDraggedId = id;
    }
  };

  /**
   * Called from `dragEvent()`'s `EDragEvent.DRAG_END` case, before its
   * own normal end-of-drag handling. Returns `true` if the drop was
   * accepted by another grid — in which case this function already
   * performed every side effect the accept path needs (removing the
   * item from `props.layout`, compaction, the various emits,
   * `isDragging`/`originalLayout` updates), and the caller should
   * `return` immediately rather than also running its own normal
   * end-of-drag logic, since the item no longer belongs to this grid's
   * layout at all. Returns `false` for every other case (cross-grid
   * dragging isn't enabled, no drag was in progress, no target zone
   * found at the drop point, or the target rejected it) — the caller
   * should continue with its own normal end-of-drag handling exactly as
   * if this function didn't exist.
   */
  const handleDragEnd = (
    id: string | number,
    clientX: number | undefined,
    clientY: number | undefined,
    currentItem: ILayoutItem,
  ): boolean => {
    if(!props.allowCrossGridDrag || crossGridDraggedId === null) {
      return false;
    }

    const targetZone = findCrossGridZoneAt(clientX ?? Number.NaN, clientY ?? Number.NaN, props.layoutId as string);
    crossGridDraggedId = null;

    if(!targetZone) {
      return false;
    }

    if(targetZone.isExternalDropDisabled()) {
      // Rejected — emitted on the *target* grid (that's what
      // targetZone.rejectDrop does), not this one. This grid's own item
      // stays exactly where it was before the drag, as if the
      // cross-grid attempt never happened: the caller falls through to
      // its own normal end-of-drag handling rather than treating this
      // as accepted, so the item still completes its (purely internal)
      // drag-end move/compaction there.
      targetZone.rejectDrop(id, props.layoutId as string);
      return false;
    }

    // Accepted — hand the current item data to the target grid, then
    // remove it from this one entirely. No moveElement()/compaction
    // call for *this* grid's own layout: the item no longer belongs to
    // it at all, so there's nothing left here to move or compact.
    targetZone.acceptDrop({ ...currentItem }, props.layoutId as string);
    const removedIndex = props.layout.findIndex(entry => entry.i === id);
    if(removedIndex !== -1) {
      // In-place mutation (splice), not filter — see acceptDrop's own
      // comment above for why: this needs to change the same array
      // reference `props.layout` already points to, not produce a new
      // one only reachable via the `update:layout` emit below.
      props.layout.splice(removedIndex, 1);
    }
    emit(EGridLayoutEvent.LAYOUT_UPDATE, props.layout);
    getCompactor(props.compactType! as ECompactType).compact(props.layout, props.colNum as number, {
      compactType: props.compactType! as ECompactType,
    });
    eventBus.emit(`compact`);
    updateHeight();
    originalLayout.value = props.layout;
    emit(EGridLayoutEvent.DRAG_END, id);
    emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
    nextTick(() => {
      isDragging.value = false;
    });
    return true;
  };

  return { handleDragEnd, handleDragStart, setCrossGridDragEnabled, teardown };
}
