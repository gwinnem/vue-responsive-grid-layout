import { ref, Ref, useSlots } from 'vue';
import { createNativeAutoScroll, createNativeResizable, RESIZE_EDGE_MAP } from '@/core/helpers/native-interaction';
import { createCoreData, offsetXYFromParentOf } from '@/core/helpers/draggable-utils';
import { calcColWidth } from '@/core/griditem/helpers/grid-item-calculate-helper';
import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
import { ICalcWh, IGridItemPosition, IInteractEdges } from '@/core/griditem/interfaces/grid-item.interfaces';
import { IEventsData } from '@/core/common/interfaces/event-bus.interfaces';
import { IGridItemComposableContext } from './grid-item-composable-context';

/**
 * A `resizestart`/`resizemove`/`resizeend` event, as `handleResize` below
 * actually receives and uses it: the three fields `offsetXYFromParentOf`
 * reads (`clientX`/`clientY`/`target`) plus `edges` — the resize-handle
 * combination active for this gesture (see
 * `@/core/helpers/native-interaction.ts`'s `RESIZE_EDGE_MAP`).
 */
type TResizeEvent = {
  type: `resizestart` | `resizemove` | `resizeend`;
  target: HTMLElement;
  clientX: number;
  clientY: number;
  edges: IInteractEdges;
};

/**
 * Encapsulates GridItem's resizing behavior: the native pointer-driven
 * resize engine's wiring (including native aspect-ratio preservation),
 * pixel-to-grid-unit size math, the resize lifecycle
 * (resizestart/resizemove/resizeend), and
 * `autoSize()` — the "resize when slot content changes" feature, which is
 * really just another way of arriving at the same resize-completion flow.
 *
 * Extracted from GridItem.vue as part of the Phase 2 structural cleanup —
 * see docs/REFACTORING.md's "GridItem.vue is doing too much" section and
 * docs/ARCHITECTURE.md for how this fits alongside `useGridItemDrag`.
 */
/** Return shape of {@link useGridItemResize}. */
export interface IUseGridItemResizeReturn {
  autoSize: () => void;
  calcPosition: (x: number, y: number, w: number, h: number) => IGridItemPosition;
  calcWH: (height: number, width: number, autoSizeFlag?: boolean) => ICalcWh;
  isResizing: Ref<boolean>;
  resizable: Ref<boolean | null>;
  resizing: Ref<IGridItemPosition | undefined>;
  setupAutoHeight: () => void;
  teardownAutoHeight: () => void;
  teardownResizable: () => void;
  tryMakeResizable: () => void;
}

export function useGridItemResize(ctx: IGridItemComposableContext): IUseGridItemResizeReturn {
  const {
    autoHeightWrapper,
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
    margin,
    maxRows,
    props,
    renderRtl,
    resizeHandleRefs,
    rowHeight,
    transformScale,
  } = ctx;

  const slots = useSlots();

  /** `null` until `GridItem`'s `onMounted` resolves it from the `isResizable` prop or the parent layout's default. */
  const resizable = ref<boolean | null>(null);
  /** Whether a resize is currently in progress — drives the `resizing` class and blocks `useGridItemDrag`'s `handleDrag` from running concurrently. */
  const isResizing = ref(false);
  /** Current pixel position+size while resizing; `undefined` when not resizing. Tracks `left`/`right`/`top` too, not just `width`/`height`, so left/top-edge resizes can move the item's anchor point live (see `handleResize`). */
  const resizing = ref<IGridItemPosition | undefined>(undefined);
  /** Previous tick's pointer x position, `NaN` before the first `resizemove`. */
  const lastW = ref(NaN);
  /** Previous tick's pointer y position, `NaN` before the first `resizemove`. */
  const lastH = ref(NaN);
  /** Grid-unit width at resize-start, used to detect whether a resize actually changed the item's size (for the `RESIZED` event). */
  const previousW = ref<number | undefined>(undefined);
  /** Grid-unit height at resize-start. */
  const previousH = ref<number | undefined>(undefined);
  /** Starting pixel width/height ratio, captured at `resizestart` — used by `preserveAspectRatio` to derive one dimension from the other during `resizemove`. `undefined` when not resizing or the starting height was 0. */
  const aspectRatio = ref<number | undefined>(undefined);
  /** Backing the `autoScroll` prop — started/stopped alongside the resize lifecycle in `handleResize` below. */
  const autoScroll = createNativeAutoScroll();
  /** The native resize engine's own cleanup handle, once created — `undefined` until `tryMakeResizable` first runs against a real, mounted element. */
  let nativeResizable: { destroy: () => void } | undefined;

  /** Which edges are being dragged during the current resize, as reported by the native resize engine's `resizestart` event (see the handle each of the 8 resize-hint spans is wired to). */
  let edges: IInteractEdges = {
    bottom: false,
    left: false,
    right: false,
    top: false,
  };

  /**
   * Convert grid-unit x/y/w/h into pixel position + size, respecting RTL.
   * Shared with GridItem's own `createStyle()` for rendering, which is why
   * it's returned rather than kept private like `handleResize`.
   */
  const calcPosition = (x: number, y: number, w: number, h: number): IGridItemPosition => {
    const colWidth = calcColWidth(containerWidth.value, margin.value[0], cols.value);

    let out;
    if(renderRtl.value) {
      out = {
        height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin.value[1]),
        right: Math.round(colWidth * x + (x + 1) * margin.value[0]),
        top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
        width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin.value[0]),
      };
    } else {
      out = {
        height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin.value[1]),
        left: Math.round(colWidth * x + (x + 1) * margin.value[0]),
        top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
        width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin.value[0]),
      };
    }

    return out;
  };

  /**
   * Given a height and width in pixel values, calculate grid units.
   * @param  {Number} height Height in pixels.
   * @param  {Number} width  Width in pixels.
   * @param  {Boolean} autoSizeFlag  function autoSize identifier.
   * @return {ICalcWh} w, h as grid units.
   */
  const calcWH = (height: number, width: number, autoSizeFlag: boolean = false): ICalcWh => {
    const colWidth = calcColWidth(containerWidth.value, margin.value[0], cols.value);

    let w = Math.round((width + margin.value[0]) / (colWidth + margin.value[0]));
    let h;
    if(!autoSizeFlag) {
      h = Math.round((height + margin.value[1]) / (rowHeight.value + margin.value[1]));
    } else {
      h = Math.ceil((height + margin.value[1]) / (rowHeight.value + margin.value[1]));
    }

    // Capping
    w = Math.max(Math.min(w, cols.value - innerX.value), 0);
    h = Math.max(Math.min(h, maxRows.value - innerY.value), 0);
    return {
      h,
      w,
    };
  };

  /**
   * Convert a new left-edge pixel position to a grid-unit x, capped so the
   * item (at its new width `newW`) can't be pushed past the right edge of
   * the grid. The left/top-edge counterpart to `calcXY` in
   * `useGridItemDrag.ts` — not shared with it because the capping bound
   * here depends on the *new* size being resized to, not the item's
   * current (pre-resize) size, which is what `calcXY` assumes.
   */
  const pixelsToGridX = (leftPx: number, newW: number): number => {
    const colWidth = calcColWidth(containerWidth.value, margin.value[0], cols.value);
    let gridX = Math.round((leftPx - margin.value[0]) / (colWidth + margin.value[0]));
    gridX = Math.max(Math.min(gridX, cols.value - newW), 0);
    return gridX;
  };

  /** Top-edge counterpart to `pixelsToGridX`. */
  const pixelsToGridY = (topPx: number, newH: number): number => {
    let gridY = Math.round((topPx - margin.value[1]) / (rowHeight.value + margin.value[1]));
    gridY = Math.max(Math.min(gridY, maxRows.value - newH), 0);
    return gridY;
  };

  /**
   * The native resize engine's `resizestart`/`resizemove`/`resizeend` handler —
   * computes the item's new pixel size (and, for left/top-edge resizes,
   * new position — see docs/REFACTORING.md's resize-direction note)
   * based on which edge(s) are being dragged, converts it to grid units
   * via `calcWH`/`pixelsToGridX`/`pixelsToGridY`, clamps to
   * `minW`/`maxW`/`minH`/`maxH`, and emits `RESIZE`/`RESIZED` plus the
   * eventBus `resizeEvent` message. Registered once per `GridItem` by
   * `tryMakeResizable`, not called directly.
   */
  const handleResize = (event: TResizeEvent): void => {
    if(props.isStatic || (!editModeEnabled.value && props.isResizable)) {
      return;
    }
    const position = offsetXYFromParentOf(event);

    const { x, y } = position;

    const newSize: { height: number; horizontal?: number; top?: number; width: number } = {
      height: 0,
      width: 0,
    };

    let pos: (IGridItemPosition | ICalcWh) & { h?: number; w?: number };

    switch(event.type) {
      case `resizestart`: {
        // Note: previously re-called tryMakeResizable() here to refresh
        // interact.js's own config before handling the gesture. Not
        // needed under the native engine's "configure once, read live
        // state per-gesture" model (see tryMakeResizable's own doc
        // comment) — nativeResizable is already attached, and
        // getOptions() reads current prop values fresh on every
        // pointerdown regardless.
        emit(EGridItemEvent.RESIZE, props.i, innerH.value, innerW.value, innerH.value, innerW.value);
        previousW.value = innerW.value;
        previousH.value = innerH.value;
        pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
        // Bug fix: the code shared by all three event types below this
        // switch statement (`pos = calcWH(newSize.height, newSize.width)`
        // onward) recomputes `pos` from `newSize`, but `newSize` is only
        // ever populated by the resizemove/resizeend cases — for
        // resizestart it's still its initial `{ height: 0, width: 0 }`.
        // `calcWH(0, 0)` producing a near-zero size, then clamped up to
        // the library's own 1x1 floor, silently overwrote this case's
        // own correct `pos` (and, from there, the eventBus payload, and
        // from there `GridLayout`'s own `l.w`/`l.h`) with `{ h: 1, w: 1 }`
        // on every single `resizestart` — before anything had actually
        // resized. Nothing user-visible caught this directly (the
        // *rendered* size stays correct, driven by CSS already
        // reflecting the real size from the previous render) — it only
        // surfaced once something else read the corrupted `props.layout`
        // value later, e.g. multiSelect's own group-resize snapshot,
        // silently applying a wrong delta to every other selected item.
        // Emitting this case's own, already-correct eventBus message
        // directly and returning early — rather than trying to guard
        // the shared code against running for this event type instead —
        // keeps resizestart's own values as the single source of truth
        // for what it emits, with no risk of the shared recomputation
        // touching them at all.
        resizing.value = { ...pos };
        isResizing.value = true;
        ({ edges } = event);
        aspectRatio.value = pos.height > 0 ? pos.width / pos.height : undefined;
        if(props.autoScroll) {
          autoScroll.start(event.target);
        }
        // The shared code below this switch statement (which this case
        // returns early to avoid — see the comment above) is also where
        // `lastW`/`lastH` get initialized to the starting pointer
        // position, which `resizemove`'s own delta calculation
        // (`createCoreData(lastW.value, lastH.value, x, y)`) depends on
        // having a real value rather than stale/initial ones. Setting
        // them here too, not just skipping past where they used to be
        // set as a side effect of the (buggy) fall-through.
        lastW.value = x;
        lastH.value = y;
        eventBus.emit(`resizeEvent`, {
          eventType: event.type,
          h: innerH.value,
          i: props.i,
          w: innerW.value,
          x: innerX.value,
          y: innerY.value,
        });
        return;
      }
      case `resizemove`: {
        const coreEvent = createCoreData(lastW.value, lastH.value, x, y);
        const dx = coreEvent.deltaX / transformScale.value;
        const dy = coreEvent.deltaY / transformScale.value;

        // "horizontal" is whichever anchor calcPosition used for this
        // render direction — `left` in LTR, `right` in RTL (see the
        // edges.right/edges.left handling below for how each one gets
        // updated correctly per direction — fixed in docs/REFACTORING.md
        // #53, verified with real click-drag browser tests in both
        // directions, not just reasoned through).
        const prevHorizontal = Number(renderRtl.value ? resizing.value?.right : resizing.value?.left);
        const prevTop = Number(resizing.value?.top);
        const prevWidth = Number(resizing.value?.width);
        const prevHeight = Number(resizing.value?.height);

        newSize.width = prevWidth;
        newSize.height = prevHeight;
        newSize.horizontal = prevHorizontal;
        newSize.top = prevTop;

        // Each edge is handled independently (rather than one branch per
        // edge combination) so every single-edge and every corner
        // combination — including the diagonals — falls out of the same
        // four lines instead of needing eight near-duplicate branches.
        //
        // `edges.left`/`edges.right` describe the *physical* edge being
        // dragged — screen-space, unaffected by RTL — but which one of
        // them should also move the `horizontal` anchor depends on
        // render direction, since dragging an edge only moves the anchor
        // when that edge *is* the anchor. In LTR, `horizontal` means
        // `left`: dragging the right edge grows/shrinks width with the
        // left edge fixed (anchor untouched, correct below); dragging
        // the left edge is what moves the anchor itself. In RTL,
        // `horizontal` means `right` instead — so it's now the *right*
        // edge whose drag moves the anchor, and the left edge that
        // leaves it alone. Previously this was hardcoded to the LTR
        // case regardless of `renderRtl`, so RTL resize dragged the
        // wrong edge fixed in place (see docs/REFACTORING.md #53).
        if(edges.right) {
          newSize.width = prevWidth + dx;
          if(renderRtl.value) {
            newSize.horizontal = prevHorizontal - dx;
          }
        }
        if(edges.left) {
          newSize.width = prevWidth - dx;
          if(!renderRtl.value) {
            newSize.horizontal = prevHorizontal + dx;
          }
        }
        if(edges.bottom) {
          newSize.height = prevHeight + dy;
        }
        if(edges.top) {
          newSize.height = prevHeight - dy;
          newSize.top = prevTop + dy;
        }

        // preserveAspectRatio — native replacement for interact.js's
        // `aspectRatio` modifier (see docs/REFACTORING.md). Derives
        // whichever dimension isn't directly driven by the edge(s) in
        // this gesture from the one that is, using the ratio captured
        // at resizestart. A single horizontal-only or vertical-only
        // edge derives the other dimension outright (no anchor
        // adjustment needed, since the undriven dimension's own anchor
        // was never touched above); a corner (both a horizontal and a
        // vertical edge active) derives height from width and, if the
        // top edge is part of this gesture, adjusts `top` by exactly
        // the resulting height delta — the same anchor-compensation
        // `edges.top` already does for a direct height change above,
        // just applied to the derived one instead.
        if(props.preserveAspectRatio && aspectRatio.value) {
          const drivingWidth = edges.left || edges.right;
          const drivingHeight = edges.top || edges.bottom;
          if(drivingWidth && !drivingHeight) {
            newSize.height = newSize.width / aspectRatio.value;
          } else if(drivingHeight && !drivingWidth) {
            newSize.width = newSize.height * aspectRatio.value;
          } else if(drivingWidth && drivingHeight) {
            const derivedHeight = newSize.width / aspectRatio.value;
            if(edges.top) {
              newSize.top = prevTop + (prevHeight - derivedHeight);
            }
            newSize.height = derivedHeight;
          }
        }

        if(props.autoScroll) {
          autoScroll.update(event.clientX, event.clientY);
        }

        resizing.value = {
          ...resizing.value,
          height: newSize.height,
          top: newSize.top,
          width: newSize.width,
          ...(renderRtl.value ? { right: newSize.horizontal } : { left: newSize.horizontal }),
        } as IGridItemPosition;
        break;
      }
      case `resizeend`: {
        // Bug fix (docs/REFACTORING.md #41, same class as dragend's):
        // this used to recompute `newSize` via `calcPosition(innerX.value,
        // innerY.value, innerW.value, innerH.value)` — but `innerW`/
        // `innerH` are the grid item's *pre-resize* dimensions, only
        // ever updated later via the emit()/eventBus round trip through
        // the parent layout, which hasn't happened yet within this same
        // synchronous resize gesture. Every `resizemove` had already been
        // correctly accumulating the live pixel size into
        // `resizing.value` — recomputing from `innerW`/`innerH` here
        // instead discarded all of that and used the size the item had
        // *before* the resize even started, which is exactly why
        // resizing appeared to grow the item by nothing at all.
        newSize.width = Number(resizing.value?.width);
        newSize.height = Number(resizing.value?.height);
        newSize.top = Number(resizing.value?.top);
        newSize.horizontal = Number(renderRtl.value ? resizing.value?.right : resizing.value?.left);
        resizing.value = undefined;
        isResizing.value = false;
        aspectRatio.value = undefined;
        autoScroll.stop();
        break;
      }
      default: {
        // Do nothing just to avoid linting complaints
      }
    }

    // Get new WH
    pos = calcWH(newSize.height, newSize.width);
    // minW/maxW/minH/maxH all have withDefaults() defaults (1/Infinity), so
    // they're guaranteed present at runtime — the `!` here is only needed
    // because that guarantee lives in GridItem.vue's withDefaults() call,
    // which TypeScript can't see through once props cross a module boundary.
    if(pos.w < props.minW!) {
      pos.w = props.minW!;
    }
    if(pos.w > props.maxW!) {
      pos.w = props.maxW!;
    }
    if(pos.h < props.minH!) {
      pos.h = props.minH!;
    }
    if(pos.h > props.maxH!) {
      pos.h = props.maxH!;
    }

    if(pos.h < 1) {
      pos.h = 1;
    }
    if(pos.w < 1) {
      pos.w = 1;
    }

    // For left/top-edge resizes (right-edge in RTL — see the
    // edges.right/edges.left handling above, and docs/REFACTORING.md
    // #53), derive the new grid-unit position too — capped against the
    // *new* w/h computed just above. The non-anchor-edge-only resizes
    // never touch position, so this leaves x/y at their current values
    // in that case.
    let newX = innerX.value;
    let newY = innerY.value;
    const horizontalAnchorEdge = renderRtl.value ? edges.right : edges.left;
    if(horizontalAnchorEdge && newSize.horizontal !== undefined) {
      // pixelsToGridX's formula is the same regardless of which CSS
      // property (`left` or `right`) newSize.horizontal actually
      // represents — calcPosition computes both the same way
      // (`colWidth * x + (x + 1) * margin`), just assigned to a
      // different property name depending on renderRtl — so no
      // direction-specific math is needed here beyond picking the right
      // edge to trigger on above.
      newX = pixelsToGridX(newSize.horizontal, pos.w);
    }
    if(edges.top && newSize.top !== undefined) {
      newY = pixelsToGridY(newSize.top, pos.h);
    }

    lastW.value = x;
    lastH.value = y;

    if(innerW.value !== pos.w || innerH.value !== pos.h) {
      emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }
    if(event.type === `resizeend` && (previousW.value !== innerW.value || previousH.value !== innerH.value)) {
      emit(EGridItemEvent.RESIZED, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }

    const data: IEventsData = {
      eventType: event.type,
      h: pos.h,
      i: props.i,
      w: pos.w,
      x: newX,
      y: newY,
    };

    eventBus.emit(`resizeEvent`, data);
  };

  /**
   * Wires up the native resize engine on first call (once
   * `gridItem.value` is a real, mounted element and the 8 resize-hint
   * spans have their own template refs populated) — same "configure
   * once, read live state per-gesture" model as
   * `useGridItemDrag.ts`'s `tryMakeDraggable`. `minW`/`maxW`/`minH`/
   * `maxH` clamping during the gesture itself is intentionally not
   * reimplemented from interact.js's own `restrictSize` here — the
   * clamps inside `handleResize` below (and `useGridItemKeyboard.ts`'s
   * own) are already the actual source of truth; interact.js's
   * equivalent was already redundant, not load-bearing.
   */
  const tryMakeResizable = (): void => {
    // See the matching guard + comment in useGridItemDrag.ts's
    // tryMakeDraggable() (docs/REFACTORING.md #38) — same bug, same fix.
    if(!(gridItem.value instanceof HTMLElement)) {
      return;
    }

    if(nativeResizable) {
      return;
    }

    const handleEls: Partial<Record<keyof typeof RESIZE_EDGE_MAP, HTMLElement>> = {};
    for(const edgeKey of Object.keys(RESIZE_EDGE_MAP)) {
      const handleEl = resizeHandleRefs[edgeKey]?.value;
      if(handleEl) {
        handleEls[edgeKey] = handleEl;
      }
    }

    // Bug fix: the 8 resize-hint spans are `v-if`-gated on the resolved
    // `resizable` state, which this same `onMounted` sets *synchronously*
    // just before first calling this function — but Vue's own DOM
    // update from that change is asynchronous (batched to the next
    // tick), so the very first call here could run before the spans
    // actually exist yet, finding zero handles. Since `nativeResizable`
    // being set is what permanently guards against re-attaching (see
    // the comment on tryMakeDraggable's own version of this pattern),
    // locking it in on that first, handle-less call would leave resize
    // wired up to nothing for the rest of this GridItem's lifetime —
    // not just delayed, silently broken. Only committing once at least
    // one handle was actually found lets whichever later call (from the
    // same watchers that already call this reactively) picks the setup
    // back up once the DOM has caught up.
    if(Object.keys(handleEls).length === 0) {
      return;
    }

    nativeResizable = createNativeResizable(
      gridItem.value,
      handleEls,
      () => ({ enabled: Boolean(resizable.value) && !props.isStatic, ignoreFrom: props.resizeIgnoreFrom }),
      handleResize,
    );
  };

  /** Tears down the native resize engine's own listeners — called from `GridItem.vue`'s `onBeforeUnmount`. */
  const teardownResizable = (): void => {
    nativeResizable?.destroy();
    nativeResizable = undefined;
  };

  /**
   * Resize the item to fit its slot content's measured size — the
   * "GridItem automatically resizes when content changes" feature.
   *
   * See docs/REFACTORING.md #12: `slots.default()` here returns freshly
   * created VNodes, not the ones the renderer actually mounted, so `.elm`
   * is not reliably available. This bails out as a no-op rather than
   * throwing when that's the case; the underlying measurement approach
   * still needs a template-ref-based rewrite to be fully reliable.
   */
  function autoSize(): void {
    previousW.value = innerW.value;
    previousH.value = innerH.value;

    // Prefers autoHeightWrapper (a real template ref, only populated
    // when the autoHeight prop is true) over slots.default()[0]?.elm —
    // confirmed directly that the latter doesn't reliably tie back to
    // real DOM even when read from within this component's own
    // lifecycle (an async ResizeObserver callback, in autoHeight's
    // case), not just when autoSize() is invoked externally as
    // originally documented in finding #12. Falls back to the
    // slots-based lookup for a manually-invoked autoSize() call without
    // autoHeight enabled at all, where no wrapper ref exists to prefer.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const slotElement = autoHeightWrapper.value ?? slots?.default?.()[0]?.elm;
    if(!slotElement || typeof slotElement.getBoundingClientRect !== `function`) {
      return;
    }

    const newSize = slotElement.getBoundingClientRect();
    const pos = calcWH(newSize.height, newSize.width, true);
    if(props.minW) {
      if(pos.w < props.minW) {
        pos.w = props.minW;
      }
    }

    if(props.maxW) {
      if(pos.w > props.maxW) {
        pos.w = props.maxW;
      }
    }

    if(props.minH) {
      if(pos.h < props.minH) {
        pos.h = props.minH;
      }
    }

    if(props.maxH) {
      if(pos.h > props.maxH) {
        pos.h = props.maxH;
      }
    }

    if(pos.h < 1) {
      pos.h = 1;
    }
    if(pos.w < 1) {
      pos.w = 1;
    }

    if(innerW.value !== pos.w || innerH.value !== pos.h) {
      emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }

    if(previousW.value !== pos.w || previousH.value !== pos.h) {
      emit(EGridItemEvent.RESIZED, props.i, pos.h, pos.w, newSize.height, newSize.width);

      const data: IEventsData = {
        eventType: `resizeend`,
        h: pos.h,
        i: props.i,
        w: pos.w,
        x: innerX.value,
        y: innerY.value,
      };
      eventBus.emit(`resizeEvent`, data);
    }
  }

  /**
   * Backing implementation for the `autoHeight` prop — a `ResizeObserver`
   * on `autoHeightWrapper` (a template ref, only rendered/populated when
   * `autoHeight` is true), calling `autoSize()` whenever it actually
   * changes size. Deliberately not `slots.default()[0]?.elm`, the way
   * `autoSize()` itself reads the slot content when manually invoked —
   * confirmed directly (not assumed) that this doesn't reliably tie back
   * to real DOM even when called from `onMounted`, not just when invoked
   * externally as originally documented in finding #12: Vue's own
   * "Slot 'default' invoked outside of the render function" warning
   * fires either way, since `onMounted`'s callback runs outside Vue's
   * own render-function call context regardless of which lifecycle
   * point it's called from. A real template ref sidesteps the problem
   * entirely rather than working around it.
   */
  let autoHeightObserver: ResizeObserver | undefined;

  const setupAutoHeight = (): void => {
    if(!props.autoHeight || typeof ResizeObserver === `undefined` || !autoHeightWrapper.value) {
      return;
    }
    autoHeightObserver = new ResizeObserver(() => {
      autoSize();
    });
    autoHeightObserver.observe(autoHeightWrapper.value);
  };

  const teardownAutoHeight = (): void => {
    autoHeightObserver?.disconnect();
    autoHeightObserver = undefined;
  };

  /**
   * @returns
   * - `autoSize` — exposed because `GridItem.vue`'s own `defineExpose` re-exposes it publicly.
   * - `calcPosition` — used by `GridItem.vue`'s `createStyle()` for rendering.
   * - `calcWH` — used by `GridItem.vue`'s `autoSize` caller context; kept alongside `autoSize` for symmetry.
   * - `isResizing` — read by `classObj`/`createStyle()`, and passed into `useGridItemDrag`'s context.
   * - `resizable` — the resolved resizable state; watched by `GridItem.vue` to re-run `tryMakeResizable`.
   * - `resizing` — current pixel position+size while resizing; read by `createStyle()`.
   * - `teardownResizable` — called from `GridItem.vue`'s `onBeforeUnmount`.
   * - `tryMakeResizable` — called from `GridItem.vue`'s watchers.
   */
  return {
    autoSize,
    calcPosition,
    calcWH,
    isResizing,
    resizable,
    resizing,
    setupAutoHeight,
    teardownAutoHeight,
    teardownResizable,
    tryMakeResizable,
  };
}
