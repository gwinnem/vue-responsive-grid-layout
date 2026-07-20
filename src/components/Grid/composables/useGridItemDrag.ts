import { ref, Ref } from 'vue';
import { createNativeDraggable, createNativeAutoScroll, INativeDragEvent } from '@/core/helpers/native-interaction';
import { createCoreData, offsetXYFromParentOf } from '@/core/helpers/draggable-utils';
import { calcColWidth, calcGridItemWH, clamp } from '@/core/griditem/helpers/grid-item-calculate-helper';
import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
import { ICalcXy, IGridItemPosition } from '@/core/griditem/interfaces/grid-item.interfaces';
import { IEventsData } from '@/core/common/interfaces/event-bus.interfaces';
import { IGridItemDragContext } from './grid-item-composable-context';

/**
 * Encapsulates GridItem's dragging behavior: the native pointer-driven
 * drag engine's wiring (see `@/core/helpers/native-interaction.ts`),
 * translating pixel deltas to grid units, and the drag lifecycle
 * (dragstart/dragmove/dragend) that emits `move`/`moved` and feeds the
 * shared eventBus's `dragEvent`.
 *
 * Extracted from GridItem.vue as part of the Phase 2 structural cleanup —
 * see docs/REFACTORING.md's "GridItem.vue is doing too much" section and
 * docs/ARCHITECTURE.md for how this fits alongside `useGridItemResize`.
 */
/** Return shape of {@link useGridItemDrag}. */
export interface IUseGridItemDragReturn {
  calcXY: (top: number, left: number) => ICalcXy;
  draggable: Ref<boolean | null>;
  dragging: Ref<IGridItemPosition | undefined>;
  isDragging: Ref<boolean>;
  teardownDraggable: () => void;
  tryMakeDraggable: () => void;
}

export function useGridItemDrag(ctx: IGridItemDragContext): IUseGridItemDragReturn {
  const {
    bounded,
    cols,
    containerWidth,
    editModeEnabled,
    emit,
    eventBus,
    gridItem,
    innerH,
    innerW,
    innerX,
    innerY,
    isResizing,
    margin,
    maxRows,
    props,
    renderRtl,
    rowHeight,
    transformScale,
  } = ctx;

  /** `null` until `GridItem`'s `onMounted` resolves it from the `isDraggable` prop or the parent layout's default. */
  const draggable = ref<boolean | null>(null);
  /** Whether a drag is currently in progress — drives the `vue-draggable-dragging`/`disable-userselect` classes. */
  const isDragging = ref(false);
  /** Current pixel position while dragging; `undefined` when not dragging. */
  const dragging = ref<IGridItemPosition | undefined>(undefined);
  /** Previous tick's pointer x position, `NaN` before the first `dragmove` (see `createCoreData`). */
  const lastX = ref(NaN);
  /** Previous tick's pointer y position, `NaN` before the first `dragmove`. */
  const lastY = ref(NaN);
  /** Grid-unit x position at drag-start, used to detect whether a drag actually moved the item (for the `MOVED` event). */
  const previousX = ref<number | undefined>(undefined);
  /** Grid-unit y position at drag-start. */
  const previousY = ref<number | undefined>(undefined);
  /** The native draggable engine's own cleanup handle, once created — `undefined` until `tryMakeDraggable` first runs against a real, mounted element. */
  let nativeDraggable: { destroy: () => void } | undefined;
  /** Backing the `autoScroll` prop — started/stopped alongside the drag lifecycle in `handleDrag` below. */
  const autoScroll = createNativeAutoScroll();

  /**
   * Translate x and y coordinates from pixels to grid units.
   * @param  {Number} top  Top position (relative to parent) in pixels.
   * @param  {Number} left Left position (relative to parent) in pixels.
   * @return {ICalcXy}     x and y in grid units.
   */
  const calcXY = (top: number, left: number): ICalcXy => {
    const colWidth = calcColWidth(containerWidth.value, margin.value[0], cols.value);

    let x = Math.round((left - margin.value[0]) / (colWidth + margin.value[0]));
    let y = Math.round((top - margin.value[1]) / (rowHeight.value + margin.value[1]));

    // Capping
    x = Math.max(Math.min(x, cols.value - innerW.value), 0);
    y = Math.max(Math.min(y, maxRows.value - innerH.value), 0);

    return {
      x,
      y,
    };
  };

  /**
   * The native drag engine's `dragstart`/`dragmove`/`dragend` handler — computes
   * the item's new pixel position (respecting RTL and `bounded`), converts
   * it to grid units via `calcXY`, and emits `MOVE`/`MOVED` plus the
   * eventBus `dragEvent` message `GridLayout` uses to cascade collisions.
   * Registered once per `GridItem` by `tryMakeDraggable`, not called
   * directly.
   */
  const handleDrag = (event: INativeDragEvent): void => {
    if(props.isStatic || !editModeEnabled.value) {
      return;
    }
    if(isResizing.value) {
      return;
    }

    const position = offsetXYFromParentOf(event);

    const { x, y } = position;

    const newPosition = {
      left: 0,
      top: 0,
    };

    switch(event.type) {
      case `dragstart`: {
        previousX.value = innerX.value;
        previousY.value = innerY.value;

        const tg = event.target as HTMLElement;
        const parentTg = tg.offsetParent as HTMLElement;
        const parentRect = parentTg.getBoundingClientRect();
        const clientRect = tg.getBoundingClientRect();

        const cLeft = clientRect.left / transformScale.value;
        const pLeft = parentRect.left / transformScale.value;
        const cRight = clientRect.right / transformScale.value;
        const pRight = parentRect.right / transformScale.value;
        const cTop = clientRect.top / transformScale.value;
        const pTop = parentRect.top / transformScale.value;

        if(renderRtl.value) {
          newPosition.left = (cRight - pRight) * -1;
        } else {
          newPosition.left = cLeft - pLeft;
        }
        newPosition.top = cTop - pTop;
        dragging.value = newPosition as IGridItemPosition;
        isDragging.value = true;
        if(props.autoScroll) {
          autoScroll.start(tg);
        }
        break;
      }
      case `dragend`: {
        if(!isDragging.value) {
          return;
        }

        // Bug fix (docs/REFACTORING.md #41): this used to re-derive the
        // final position from `event.target`'s live
        // `getBoundingClientRect()`, exactly like `dragstart` does — but
        // unlike `dragstart` (where nothing has moved yet, so a fresh
        // DOM measurement is trivially correct), by `dragend` there have
        // typically been many `dragmove` events already, each
        // synchronously updating `dragging.value` in JS. The browser
        // fires all of a fast mouse gesture's move/up events back to
        // back before yielding, but Vue's own re-render (turning the
        // updated `dragging.value` into an actual CSS transform on the
        // element) is asynchronous — queued, not immediate. Reading
        // getBoundingClientRect() at dragend could therefore capture
        // whatever position the DOM last happened to actually paint,
        // not the latest one `dragging.value` already holds, making a
        // fast/long drag land far short of where the pointer actually
        // ended up (confirmed directly: instrumenting handleDrag showed
        // every dragmove's accumulated delta was correct throughout,
        // but the final measured position only reflected an early
        // fraction of the total movement). `dragging.value` is already
        // the source of truth `dragmove` maintains — reusing it here
        // instead of a fresh, potentially-stale DOM read removes the
        // race entirely.
        newPosition.left = Number(dragging.value?.left);
        newPosition.top = Number(dragging.value?.top);
        dragging.value = undefined;
        isDragging.value = false;
        autoScroll.stop();
        break;
      }
      case `dragmove`: {
        const coreEvent = createCoreData(lastX.value, lastY.value, x, y);
        // Add rtl support
        if(renderRtl.value) {
          newPosition.left = Number(dragging.value?.left) - coreEvent.deltaX / transformScale.value;
        } else {
          newPosition.left = Number(dragging.value?.left) + coreEvent.deltaX / transformScale.value;
        }
        newPosition.top = Number(dragging.value?.top) + coreEvent.deltaY / transformScale.value;
        if(bounded.value) {
          const tg = event.target as HTMLElement;
          const parentTg = tg.offsetParent as HTMLElement;
          const bottomBoundary = parentTg.clientHeight - calcGridItemWH(props.h, rowHeight.value, margin.value[1]);
          newPosition.top = clamp(newPosition.top, 0, bottomBoundary);
          const colWidth = calcColWidth(containerWidth.value, margin.value[0], cols.value);
          const rightBoundary = containerWidth.value - calcGridItemWH(props.w, colWidth, margin.value[0]);
          newPosition.left = clamp(newPosition.left, 0, rightBoundary);
        }
        dragging.value = newPosition as IGridItemPosition;
        if(props.autoScroll) {
          autoScroll.update(event.clientX, event.clientY);
        }
        break;
      }
      default: {
        // Do nothing just to avoid linting complaints
      }
    }

    const pos: ICalcXy = calcXY(newPosition.top, newPosition.left);

    lastX.value = x;
    lastY.value = y;

    if(innerX.value !== pos.x || innerY.value !== pos.y) {
      emit(EGridItemEvent.MOVE, props.i, pos.x, pos.y);
    }

    if(event.type === `dragend` && (previousX.value !== innerX.value || previousY.value !== innerY.value)) {
      emit(EGridItemEvent.MOVED, props.i, pos.x, pos.y);
    }

    const data: IEventsData = {
      clientX: event.clientX,
      clientY: event.clientY,
      eventType: event.type,
      h: innerH.value,
      i: props.i,
      w: innerW.value,
      x: pos.x,
      y: pos.y,
    };
    eventBus.emit(`dragEvent`, data);
  };

  /**
   * Wires up the native draggable engine on first call (once
   * `gridItem.value` is a real, mounted element) — unlike interact.js's
   * own `.draggable(opts)`, which needed re-invoking on every relevant
   * prop change to reconfigure an existing `Interactable`, the native
   * engine reads `draggable`/`isStatic`/`dragAllowFrom`/`dragIgnoreFrom`
   * fresh on every `pointerdown` via its own `getOptions()` callback —
   * so nothing needs re-attaching when those change later. Still safe
   * to call repeatedly (from `GridItem.vue`'s watchers, exactly as
   * before): every call after the first is a no-op.
   */
  const tryMakeDraggable = (): void => {
    // Bug fix (docs/REFACTORING.md #38): gridItem starts as a plain `{}`
    // placeholder (`ref<HTMLElement>({} as HTMLElement)`), only becoming
    // the real DOM element once this component actually mounts. Several
    // watchers call tryMakeDraggable()/tryMakeResizable() reactively —
    // if one fires before (or during a brief window around) mount, the
    // native engine would be attached to that placeholder instead of a
    // real Element. Skipping the call entirely when the target isn't
    // mounted yet is safe: whichever watcher fires once it *is* mounted
    // picks the setup back up.
    if(!(gridItem.value instanceof HTMLElement)) {
      return;
    }

    if(nativeDraggable) {
      return;
    }

    nativeDraggable = createNativeDraggable(
      gridItem.value,
      () => ({
        allowFrom: props.dragAllowFrom,
        enabled: Boolean(draggable.value) && !props.isStatic,
        ignoreFrom: props.dragIgnoreFrom,
      }),
      handleDrag,
    );
  };

  /** Tears down the native draggable engine's own listeners — called from `GridItem.vue`'s `onBeforeUnmount`. */
  const teardownDraggable = (): void => {
    nativeDraggable?.destroy();
    nativeDraggable = undefined;
  };

  /**
   * @returns
   * - `calcXY` — exposed because `GridItem.vue`'s own `defineExpose` re-exposes it publicly (see `calcXY` usage in `GridItem.vue`).
   * - `draggable` — the resolved draggable state; watched by `GridItem.vue` to re-run `tryMakeDraggable`.
   * - `dragging` — current pixel position while dragging; read by `GridItem.vue`'s `createStyle()`.
   * - `isDragging` — read by `classObj` and `createStyle()`.
   * - `teardownDraggable` — called from `GridItem.vue`'s `onBeforeUnmount`.
   * - `tryMakeDraggable` — called from `GridItem.vue`'s watchers.
   */
  return {
    calcXY,
    draggable,
    dragging,
    isDragging,
    teardownDraggable,
    tryMakeDraggable,
  };
}
