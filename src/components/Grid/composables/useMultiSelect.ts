import { computed, ComputedRef, ref, Ref } from 'vue';
import { IGridLayoutProps } from '../grid-layout-props.interface';
import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';
import { IItemClickedData } from '@/core/griditem/interfaces/grid-item.interfaces';

/** Dependencies `useMultiSelect` needs from `GridLayout.vue`. */
export interface IUseMultiSelectContext {
  props: IGridLayoutProps;
  /** Vue's own overloaded `defineEmits` type can't be narrowed past `any` here — see `useCrossGridDrag.ts`'s own `IUseCrossGridDragContext.emit` for the full rationale (tried and reverted two narrower alternatives, both broke real call-site assignment). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (...args: any[]) => void;
}

/** Return shape of {@link useMultiSelect}. */
export interface IUseMultiSelectReturn {
  backgroundClickHandler: (event: MouseEvent) => void;
  clearSelection: () => void;
  deselectItem: (id: string | number) => void;
  itemClickedHandler: (data: IItemClickedData) => void;
  pruneSelection: () => void;
  /**
   * The raw `Set` ref itself, not just the high-level methods above —
   * unlike `useUndoRedo`'s internal state (which stays fully private
   * behind named methods), `dragEvent`/`resizeEvent`'s own group-move/
   * group-resize logic reads this directly (`.has(id)`, iterating via
   * `Array.from(selectedItemIds.value, ...)`) to apply a delta to every
   * other selected item — that logic stays in `GridLayout.vue` itself
   * (it's part of the drag/resize event handlers, not multi-select
   * management per se), so it needs real read access to the live set,
   * not a method wrapping it.
   */
  selectedItemIds: Ref<Set<string | number>>;
  selectedItems: ComputedRef<(string | number)[]>;
  selectItem: (id: string | number, additive?: boolean) => void;
  toggleItemSelection: (id: string | number) => void;
}

/**
 * Extracted from `GridLayout.vue` (see `docs/REFACTORING.md`'s code
 * review finding on this file's own size, and the parallel `useUndoRedo`
 * extraction) — `multiSelect`'s selection-management state and the two
 * click handlers driving it. The group move/resize logic that actually
 * *applies* the selection during a drag/resize gesture stays in
 * `GridLayout.vue`'s own `dragEvent`/`resizeEvent` (see `selectedItemIds`'s
 * own doc comment above for why), reading `selectedItemIds` directly
 * from this composable's return rather than through a wrapping method.
 */
export function useMultiSelect(ctx: IUseMultiSelectContext): IUseMultiSelectReturn {
  const { props, emit } = ctx;

  /**
   * A `Set`, not an array — every `GridItem`'s own `isSelected` check
   * (read every render, via `thisLayout`, to decide its
   * `vue-grid-item-selected` class) needs an O(1) lookup regardless of
   * selection size, not an O(n) `.includes()`.
   */
  const selectedItemIds = ref<Set<string | number>>(new Set());

  /** Reactive, read-only array view of the current selection — the exposed public form. `selectedItemIds` (a `Set`) stays internal; `GridItem`'s own `isSelected` check via `thisLayout` uses it directly for O(1) lookups. */
  const selectedItems = computed(() => Array.from(selectedItemIds.value));

  const emitSelectionChanged = (): void => {
    emit(EGridLayoutEvent.SELECTION_CHANGED, Array.from(selectedItemIds.value));
  };

  /**
   * Selects `id`. `additive: false` (the default — a plain click)
   * replaces the entire selection with just this one item; `additive:
   * true` (Shift/Ctrl/Cmd+click) adds it to whatever's already
   * selected without clearing the rest.
   */
  const selectItem = (id: string | number, additive = false): void => {
    selectedItemIds.value = additive ? new Set([...selectedItemIds.value, id]) : new Set([id]);
    emitSelectionChanged();
  };

  /** Removes `id` from the selection, if present. A no-op (no event fired) if it wasn't selected. */
  const deselectItem = (id: string | number): void => {
    if(!selectedItemIds.value.has(id)) {
      return;
    }
    const next = new Set(selectedItemIds.value);
    next.delete(id);
    selectedItemIds.value = next;
    emitSelectionChanged();
  };

  /** Adds `id` to the selection if not already present, removes it otherwise — the Shift/Ctrl/Cmd+click gesture. */
  const toggleItemSelection = (id: string | number): void => {
    if(selectedItemIds.value.has(id)) {
      deselectItem(id);
    } else {
      selectItem(id, true);
    }
  };

  /** Empties the selection entirely — the "click empty grid background" gesture, also callable directly. A no-op (no event fired) if nothing was selected. */
  const clearSelection = (): void => {
    if(selectedItemIds.value.size === 0) {
      return;
    }
    selectedItemIds.value = new Set();
    emitSelectionChanged();
  };

  /**
   * Removes any selected id no longer present in `props.layout` — bug
   * fix: a selected item's id used to linger in `selectedItemIds`
   * (and so the exposed `selectedItems`) indefinitely after that item
   * was removed from the layout (closed, or removed by the consumer's
   * own code), a dangling reference to something that no longer
   * exists. Wired to the same `props.layout.length` watcher that
   * already reacts to add/remove — a length change is exactly when
   * this can happen.
   */
  const pruneSelection = (): void => {
    if(selectedItemIds.value.size === 0) {
      return;
    }
    const currentIds = new Set(props.layout.map(item => item.i));
    const next = new Set(Array.from(selectedItemIds.value).filter(id => currentIds.has(id)));
    if(next.size !== selectedItemIds.value.size) {
      selectedItemIds.value = next;
      emitSelectionChanged();
    }
  };

  /**
   * eventBus `itemClicked` listener — every `GridItem`'s own click
   * handler (after suppressing the trailing click a drag/resize
   * gesture can still dispatch) sends this regardless of whether
   * `multiSelect` is on, since a `GridItem` has no way to know this
   * grid's own prop value itself; the early return here is what
   * actually gates the feature being off by default.
   */
  const itemClickedHandler = (data: IItemClickedData): void => {
    if(!props.multiSelect) {
      return;
    }
    if(data.shiftKey || data.ctrlKey || data.metaKey) {
      toggleItemSelection(data.i);
    } else {
      selectItem(data.i, false);
    }
  };

  /**
   * Clears the selection when the click landed on the grid's own root
   * element directly — not bubbled up from a `GridItem` (or anything
   * else) inside it. `event.target === event.currentTarget` is exactly
   * that distinction: a click that started somewhere nested would have
   * a different `target` than `currentTarget` by the time it reaches
   * this listener.
   */
  const backgroundClickHandler = (event: MouseEvent): void => {
    if(props.multiSelect && event.target === event.currentTarget) {
      clearSelection();
    }
  };

  return {
    backgroundClickHandler,
    clearSelection,
    deselectItem,
    itemClickedHandler,
    pruneSelection,
    selectedItemIds,
    selectedItems,
    selectItem,
    toggleItemSelection,
  };
}
