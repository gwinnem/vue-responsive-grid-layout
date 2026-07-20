import { computed, ComputedRef, ref, Ref } from 'vue';
import { TLayout } from '@/components';
import { IGridLayoutProps } from '../grid-layout-props.interface';
import { cloneLayout } from '@/core/helpers/utils';
import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';

/** Dependencies `useUndoRedo` needs from `GridLayout.vue`. */
export interface IUseUndoRedoContext {
  props: IGridLayoutProps;
  /** Vue's own overloaded `defineEmits` type can't be narrowed past `any` here — see `useCrossGridDrag.ts`'s own `IUseCrossGridDragContext.emit` for the full rationale (tried and reverted two narrower alternatives, both broke real call-site assignment). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (...args: any[]) => void;
  updateHeight: () => void;
  /** Re-runs compaction — `undo()`/`redo()` call this after restoring a previous/next layout, since the restored layout isn't guaranteed to already be fully compacted. */
  runCompaction: () => void;
}

/**
 * Extracted from `GridLayout.vue` (see `docs/REFACTORING.md`'s code
 * review finding on this file's own size) — undo/redo history, at
 * committed-change granularity (drag start→end, resize start→end, item
 * add/remove, `compactNow()`/`rearrange()`), not per intermediate
 * drag-move frame. Opt-in via `enableUndoRedo`, capped at
 * `undoHistoryLimit` snapshots.
 *
 * `commitUndoPoint(before)` takes the pre-mutation state explicitly,
 * rather than reading a single shared "last known state" variable at
 * call time — deliberately, after finding that reading it implicitly
 * doesn't work for a gesture: calling a would-be `pushUndoPoint()` at
 * `dragstart` (before anything has actually moved) can only ever see
 * "nothing has changed since the last commit yet", since the change
 * itself happens later, at `dragend` — a single implicit-comparison
 * function called at the *start* of a gesture can never detect the
 * change that gesture is about to make. `captureDragStart`/
 * `captureResizeStart` instead only *capture* the pre-gesture snapshot;
 * `commitDragEnd`/`commitResizeEnd` call `commitUndoPoint` themselves,
 * *after* the position update and compaction have already run, passing
 * that captured snapshot in as `before` — at which point comparing it
 * against the now-current `props.layout` actually reflects the
 * gesture's real effect.
 *
 * For the length watcher (item add/remove) and `compactNow()`, the
 * mutation itself already happens synchronously before either can call
 * `commitUndoPoint`, so `lastSnapshot` (only ever updated by a
 * successful commit or `initLastSnapshot`, never by the mutation
 * itself) is *already* the correct "before" value at the point each of
 * them calls it — no separate capture step needed for those two.
 *
 * Bug fix carried over from when this lived directly in `GridLayout.vue`:
 * `lastSnapshot` must only ever be captured *after* compaction has run,
 * never before — capturing it first would clone a layout item still
 * carrying a raw, uncompacted value (e.g. `y: Infinity`, a common
 * placement convention), which `cloneLayout`'s JSON round-trip silently
 * corrupts (`JSON.stringify(Infinity)` produces `null`), permanently
 * breaking that item in every future undo/redo snapshot referencing
 * it. `undo()`/`redo()` themselves had the identical ordering mistake
 * independently — both fixed together. See `docs/REFACTORING.md` #105.
 */
/** Return shape of {@link useUndoRedo}. */
export interface IUseUndoRedoReturn {
  canRedo: ComputedRef<boolean | undefined>;
  canUndo: ComputedRef<boolean | undefined>;
  captureDragStart: () => void;
  captureResizeStart: () => void;
  commitDragEnd: () => void;
  commitFromLastSnapshot: () => void;
  commitResizeEnd: () => void;
  commitUndoPoint: (before: TLayout) => void;
  initLastSnapshot: () => void;
  redo: () => void;
  undo: () => void;
}

export function useUndoRedo(ctx: IUseUndoRedoContext): IUseUndoRedoReturn {
  const { props, emit, updateHeight, runCompaction } = ctx;

  const undoStack: Ref<TLayout[]> = ref<TLayout[]>([]);
  const redoStack: Ref<TLayout[]> = ref<TLayout[]>([]);
  let lastSnapshot: TLayout = [];
  let dragStartSnapshot: TLayout | null = null;
  let resizeStartSnapshot: TLayout | null = null;

  const canUndo = computed(() => props.enableUndoRedo && undoStack.value.length > 0);
  const canRedo = computed(() => props.enableUndoRedo && redoStack.value.length > 0);

  const commitUndoPoint = (before: TLayout): void => {
    if(!props.enableUndoRedo) {
      return;
    }
    // No-op if nothing has actually changed — without this, e.g. a
    // drag that snaps back to its own start position, or a
    // `compactNow()` on an already-fully-compacted layout, would still
    // consume an undo slot for a change that never happened.
    if(JSON.stringify(before) === JSON.stringify(props.layout)) {
      return;
    }
    undoStack.value.push(before);
    if(undoStack.value.length > (props.undoHistoryLimit as number)) {
      undoStack.value.shift();
    }
    redoStack.value = [];
    lastSnapshot = cloneLayout(props.layout);
  };

  const undo = (): void => {
    if(!props.enableUndoRedo || undoStack.value.length === 0) {
      return;
    }
    const previous = undoStack.value.pop() as TLayout;
    redoStack.value.push(cloneLayout(props.layout));
    props.layout.splice(0, props.layout.length, ...cloneLayout(previous));
    // `lastSnapshot` captured after runCompaction(), not before — see
    // this file's own doc comment above for the full account.
    runCompaction();
    lastSnapshot = cloneLayout(props.layout);
    updateHeight();
    emit(EGridLayoutEvent.LAYOUT_UPDATE, props.layout);
    emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
  };

  const redo = (): void => {
    if(!props.enableUndoRedo || redoStack.value.length === 0) {
      return;
    }
    const next = redoStack.value.pop() as TLayout;
    undoStack.value.push(cloneLayout(props.layout));
    props.layout.splice(0, props.layout.length, ...cloneLayout(next));
    // See undo()'s own comment just above for why this is captured
    // after runCompaction(), not before.
    runCompaction();
    lastSnapshot = cloneLayout(props.layout);
    updateHeight();
    emit(EGridLayoutEvent.LAYOUT_UPDATE, props.layout);
    emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
  };

  /** Called once at `onMounted` — establishes the initial "before" baseline so the very first item add/remove has a real snapshot to compare against. */
  const initLastSnapshot = (): void => {
    lastSnapshot = cloneLayout(props.layout);
  };

  /** Called at `dragstart` — captures the pre-drag layout so `commitDragEnd` has the real "before" state to commit. */
  const captureDragStart = (): void => {
    dragStartSnapshot = cloneLayout(props.layout);
  };

  /** Called at `dragend` — commits the captured pre-drag snapshot, then clears it (a no-op if `captureDragStart` was never called, e.g. a drag that started before `enableUndoRedo` was toggled on). */
  const commitDragEnd = (): void => {
    if(dragStartSnapshot) {
      commitUndoPoint(dragStartSnapshot);
      dragStartSnapshot = null;
    }
  };

  /** Called at `resizestart` — same as `captureDragStart`, for the resize gesture. */
  const captureResizeStart = (): void => {
    resizeStartSnapshot = cloneLayout(props.layout);
  };

  /** Called at `resizeend` — same as `commitDragEnd`, for the resize gesture. */
  const commitResizeEnd = (): void => {
    if(resizeStartSnapshot) {
      commitUndoPoint(resizeStartSnapshot);
      resizeStartSnapshot = null;
    }
  };

  /** Called from the `props.layout.length` watcher (item add/remove), after compaction has already run — commits `lastSnapshot` (the state just before this change) as the "before" value. */
  const commitFromLastSnapshot = (): void => {
    commitUndoPoint(lastSnapshot);
  };

  return {
    canRedo,
    canUndo,
    captureDragStart,
    captureResizeStart,
    commitDragEnd,
    commitFromLastSnapshot,
    commitResizeEnd,
    commitUndoPoint,
    initLastSnapshot,
    redo,
    undo,
  };
}
