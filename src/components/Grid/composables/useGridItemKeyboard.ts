import { Ref } from 'vue';
import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
import { IEventsData } from '@/core/common/interfaces/event-bus.interfaces';
import { IGridItemComposableContext } from './grid-item-composable-context';

/** One grid unit per keypress, in both axes — matches the smallest unit the mouse-driven path can produce, and keeps a single keypress predictable. */
const STEP = 1;

/**
 * Keyboard-operable alternative to mouse-driven dragging/resizing —
 * previously the only way to move or resize a `GridItem` at all,
 * regardless of `enableEditMode`, was a mouse or touch drag (see
 * docs/REFACTORING.md's accessibility note). Focus the item and:
 *
 * - **Arrow keys** move it by one grid unit, if draggable.
 * - **Shift + arrow keys** resize it by one grid unit, if resizable.
 *
 * Each keypress is treated as a single, atomic, already-"ended" gesture
 * (there's no keyboard equivalent of a continuous drag to preview mid-way
 * through) — it emits the same `MOVE`/`MOVED` or `RESIZE`/`RESIZED` pairs
 * and the same eventBus `dragEvent`/`resizeEvent` message
 * (`eventType: 'dragend'`/`'resizeend'`) the mouse-driven composables emit
 * on release, so `GridLayout`'s compaction/collision handling applies
 * identically regardless of which input method triggered the change.
 *
 * Deliberately scoped to single-unit steps rather than a full WAI-ARIA
 * grid/application widget pattern (roving tabindex between cells, arrow
 * keys for navigation *and* a separate key for move mode, etc.) — this
 * covers the actual gap (no keyboard alternative existed at all) without
 * redesigning the interaction model for something that isn't a
 * traditional data grid. See docs/ACCESSIBILITY.md.
 */
export function useGridItemKeyboard(
  ctx: IGridItemComposableContext & { draggable: Ref<boolean | null>; resizable: Ref<boolean | null> },
): { handleKeydown: (event: KeyboardEvent) => void } {
  const {
    cols,
    draggable,
    editModeEnabled,
    emit,
    eventBus,
    innerH,
    innerW,
    innerX,
    innerY,
    maxRows,
    props,
    renderRtl,
    resizable,
  } = ctx;

  const moveBy = (dx: number, dy: number): void => {
    const x = Math.max(Math.min(innerX.value + dx, cols.value - innerW.value), 0);
    const y = Math.max(Math.min(innerY.value + dy, maxRows.value - innerH.value), 0);
    if(x === innerX.value && y === innerY.value) {
      return;
    }

    emit(EGridItemEvent.MOVE, props.i, x, y);
    emit(EGridItemEvent.MOVED, props.i, x, y);

    // A synthetic 'dragstart' immediately before 'dragend', at the
    // pre-move position — not skipped straight to 'dragend' the way
    // this used to. Bug fix: GridLayout's multiSelect group-move logic
    // snapshots passenger positions on 'dragstart' and applies the
    // delta on 'dragmove'/'dragend'; without a 'dragstart' first, a
    // keyboard-driven move of a selected item never moved the rest of
    // the selection, only a mouse/touch drag did. Treating each
    // keypress as its own complete start-to-end gesture (rather than
    // trying to retrofit group-move to work from a single event) keeps
    // this consistent with how the mouse-driven path already works.
    const startData: IEventsData = {
      eventType: `dragstart`,
      h: innerH.value,
      i: props.i,
      w: innerW.value,
      x: innerX.value,
      y: innerY.value,
    };
    eventBus.emit(`dragEvent`, startData);

    const data: IEventsData = {
      eventType: `dragend`,
      h: innerH.value,
      i: props.i,
      w: innerW.value,
      x,
      y,
    };
    eventBus.emit(`dragEvent`, data);
  };

  const resizeBy = (dw: number, dh: number): void => {
    let w = innerW.value + dw;
    let h = innerH.value + dh;
    w = Math.max(Math.min(w, cols.value - innerX.value, props.maxW ?? Infinity), props.minW ?? 1);
    h = Math.max(Math.min(h, maxRows.value - innerY.value, props.maxH ?? Infinity), props.minH ?? 1);
    if(w === innerW.value && h === innerH.value) {
      return;
    }

    emit(EGridItemEvent.RESIZE, props.i, h, w, h, w);
    emit(EGridItemEvent.RESIZED, props.i, h, w, h, w);

    // Same rationale as moveBy's own synthetic 'resizestart' above — so
    // group-resize (multiSelect) engages for keyboard-driven resizes too.
    const startData: IEventsData = {
      eventType: `resizestart`,
      h: innerH.value,
      i: props.i,
      w: innerW.value,
      x: innerX.value,
      y: innerY.value,
    };
    eventBus.emit(`resizeEvent`, startData);

    const data: IEventsData = {
      eventType: `resizeend`,
      h,
      i: props.i,
      w,
      x: innerX.value,
      y: innerY.value,
    };
    eventBus.emit(`resizeEvent`, data);
  };

  /**
   * Attach as a `keydown` listener on the item's root element. No-ops
   * (and doesn't call `preventDefault`) for any key other than the plain
   * or Shift-modified arrows, so it never interferes with normal keyboard
   * navigation, a consumer's own key handling inside the item's slot
   * content, or — importantly — OS/browser/assistive-technology shortcuts
   * that commonly use Ctrl/Alt/Meta+Arrow (virtual desktop switching,
   * screen reader navigation, etc.). Holding any of those alongside an
   * arrow key is treated as "not ours" and passed through untouched.
   */
  const handleKeydown = (event: KeyboardEvent): void => {
    if(props.isStatic || !editModeEnabled.value) {
      return;
    }
    if(event.ctrlKey || event.altKey || event.metaKey) {
      return;
    }

    const deltas: Record<string, [number, number]> = {
      ArrowDown: [0, STEP],
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
    };
    const delta = deltas[event.key];
    if(!delta) {
      return;
    }

    // ArrowLeft/Right are physical directions; innerX increasing moves the
    // item toward the visual right in LTR but toward the visual left in
    // RTL (see calcPosition's `right = ...` computation, which increases
    // with x). Flipping the horizontal delta here keeps the physical key
    // pressed matching the physical direction the item visually moves,
    // regardless of rendering direction — the same property the
    // mouse-driven path aims for (see docs/ACCESSIBILITY.md for the
    // caveat that RTL handling isn't as thoroughly verified as LTR).
    const [rawDx, dy] = delta;
    const dx = renderRtl.value ? -rawDx : rawDx;

    if(event.shiftKey) {
      if(!resizable.value) {
        return;
      }
      event.preventDefault();
      resizeBy(dx, dy);
    } else {
      if(!draggable.value) {
        return;
      }
      event.preventDefault();
      moveBy(dx, dy);
    }
  };

  return {
    handleKeydown,
  };
}
