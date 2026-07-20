import { IInteractEdges } from '@/core/griditem/interfaces/grid-item.interfaces';

/**
 * Native replacement for interact.js's `.draggable()`/`.resizable()` —
 * see `docs/REFACTORING.md` for the full account of why and how this
 * replaced interact.js entirely. Built on the native Pointer Events API
 * (`pointerdown`/`pointermove`/`pointerup`, `setPointerCapture`), which
 * already unifies mouse/touch/pen in every browser this project
 * targets — the thing interact.js's own cross-input abstraction used to
 * be needed for isn't a gap native browser APIs have anymore.
 *
 * Deliberately narrow: this only reimplements the exact surface
 * `useGridItemDrag.ts`/`useGridItemResize.ts` actually used (confirmed
 * by reading every call site before writing this, not assumed) —
 * start/move/end callbacks, `allowFrom`/`ignoreFrom` selector gating,
 * per-edge resize targets, and a drag-activation distance threshold.
 * `restrictSize` (interact.js's own min/max clamp during the gesture)
 * is intentionally not reimplemented here — `useGridItemResize.ts`
 * already clamps to `minW`/`maxW`/`minH`/`maxH` itself downstream, so
 * interact.js's version was already redundant, not load-bearing.
 */

/** Minimum pointer movement, in pixels, before a pointerdown on the item's root is treated as a drag rather than a click — mirrors interact.js's own default drag-activation behavior, and keeps a plain click from being misread as a zero-distance drag. */
const DRAG_ACTIVATION_THRESHOLD_PX = 3;

export interface INativeDragEvent {
  type: `dragstart` | `dragmove` | `dragend`;
  target: HTMLElement;
  clientX: number;
  clientY: number;
}

export interface INativeDraggableOptions {
  enabled: boolean;
  allowFrom?: string | null;
  ignoreFrom?: string | null;
}

/** `false`/no-match reasons a candidate pointerdown target is rejected before a drag is allowed to start. */
function passesDragFilters(target: EventTarget | null, options: INativeDraggableOptions): boolean {
  if(!(target instanceof Element)) {
    return true;
  }
  if(options.allowFrom) {
    // Bug fix: an explicit `allowFrom` restricts dragging to exactly
    // that one handle — `ignoreFrom`'s own role (excluding specific
    // elements from an otherwise-unrestricted "drag from anywhere"
    // surface) doesn't make sense once the surface is already
    // restricted to a single handle; that handle should start a drag
    // regardless of what element type it happens to be. Previously,
    // `ignoreFrom` was checked first regardless — so `GridItem`'s own
    // default `dragIgnoreFrom="a, button"` silently defeated any
    // `dragAllowFrom` pointed at a handle built on a `<button>` or
    // `<a>`, including the library's own exported `CustomDragElement`
    // (its handle is a `<button>` internally), with no error or
    // warning. Checking `allowFrom` on its own first, and returning
    // its result directly rather than falling through to `ignoreFrom`
    // at all, fixes this.
    return !!target.closest(options.allowFrom);
  }
  if(options.ignoreFrom && target.closest(options.ignoreFrom)) {
    return false;
  }
  return true;
}

/**
 * Wires native pointer-driven dragging onto `el` (the item's own root
 * element — the whole item is the drag handle, matching interact.js's
 * prior configuration). `getOptions()` is called fresh on every
 * `pointerdown` so a consumer's live prop changes (`isDraggable`
 * toggled off mid-session, `dragAllowFrom` changed, etc.) are always
 * respected without needing to re-attach anything.
 */
export function createNativeDraggable(
  el: HTMLElement,
  getOptions: () => INativeDraggableOptions,
  onEvent: (event: INativeDragEvent) => void,
): { destroy: () => void } {
  // Stashed on the element itself as a plain, undocumented property —
  // not part of any public API, but lets tests invoke the exact same
  // handler a real pointer gesture would, without needing to simulate
  // a full pointerdown/move/up sequence (including the drag-activation
  // threshold) for every single assertion. Mirrors the same role the
  // interact.js mock's own per-target handler map used to serve before
  // this replaced it — see tests/GridItem.spec.ts's own
  // `dispatchDragEvent` helper.
  (el as unknown as { __nativeDragHandler?: typeof onEvent }).__nativeDragHandler = onEvent;

  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let dragStarted = false;

  const onPointerMove = (event: PointerEvent): void => {
    if(event.pointerId !== pointerId) {
      return;
    }
    if(!dragStarted) {
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if(Math.hypot(dx, dy) < DRAG_ACTIVATION_THRESHOLD_PX) {
        return;
      }
      dragStarted = true;
      // Fired at the pointerdown position, not the current one — matches
      // interact.js's own dragstart, which reports where the gesture
      // began, not wherever it happened to cross the activation threshold.
      onEvent({ clientX: startX, clientY: startY, target: el, type: `dragstart` });
    }
    onEvent({ clientX: event.clientX, clientY: event.clientY, target: el, type: `dragmove` });
  };

  const cleanup = (): void => {
    if(pointerId !== null) {
      try {
        el.releasePointerCapture(pointerId);
      } catch{
        // Already released (e.g. the pointer left the document) — not an error.
      }
    }
    pointerId = null;
    dragStarted = false;
    el.removeEventListener(`pointermove`, onPointerMove);
    el.removeEventListener(`pointerup`, onPointerUp);
    el.removeEventListener(`pointercancel`, onPointerUp);
  };

  const onPointerUp = (event: PointerEvent): void => {
    if(event.pointerId !== pointerId) {
      return;
    }
    if(dragStarted) {
      onEvent({ clientX: event.clientX, clientY: event.clientY, target: el, type: `dragend` });
    }
    cleanup();
  };

  const onPointerDown = (event: PointerEvent): void => {
    const options = getOptions();
    if(!options.enabled) {
      return;
    }
    // Primary button/first touch point only — a right-click or
    // secondary pointer shouldn't start a drag.
    if(event.button !== 0) {
      return;
    }
    // Bug fix: a second pointer pressing down on the same item while
    // one is already being tracked (two fingers on the same item, or
    // an accidental palm touch mid-drag) used to unconditionally
    // overwrite `pointerId`/`startX`/`startY` and reset `dragStarted`
    // to false — silently abandoning the first pointer's drag. Its
    // eventual pointerup would then never match the (now different)
    // tracked `pointerId`, so `dragend` would never fire for it.
    // Ignoring any further pointerdown while one is already tracked,
    // until the current gesture's own pointerup/pointercancel clears
    // it, is the same "one gesture at a time per element" invariant
    // interact.js's own Interactable had.
    if(pointerId !== null) {
      return;
    }
    if(!passesDragFilters(event.target, options)) {
      return;
    }

    ({ pointerId } = event);
    ({ clientX: startX, clientY: startY } = event);
    dragStarted = false;
    el.setPointerCapture(pointerId);
    el.addEventListener(`pointermove`, onPointerMove);
    el.addEventListener(`pointerup`, onPointerUp);
    el.addEventListener(`pointercancel`, onPointerUp);
  };

  el.addEventListener(`pointerdown`, onPointerDown);

  return {
    destroy(): void {
      el.removeEventListener(`pointerdown`, onPointerDown);
      cleanup();
    },
  };
}

export interface INativeResizeEvent {
  type: `resizestart` | `resizemove` | `resizeend`;
  target: HTMLElement;
  clientX: number;
  clientY: number;
  edges: IInteractEdges;
}

/** Which of the 8 resize-hint spans map to which `IInteractEdges` combination. */
export const RESIZE_EDGE_MAP: Record<string, IInteractEdges> = {
  e: { bottom: false, left: false, right: true, top: false },
  n: { bottom: false, left: false, right: false, top: true },
  ne: { bottom: false, left: false, right: true, top: true },
  nw: { bottom: false, left: true, right: false, top: true },
  s: { bottom: true, left: false, right: false, top: false },
  se: { bottom: true, left: false, right: true, top: false },
  sw: { bottom: true, left: true, right: false, top: false },
  w: { bottom: false, left: true, right: false, top: false },
};

export interface INativeResizableOptions {
  enabled: boolean;
  ignoreFrom?: string | null;
}

/**
 * Wires native pointer-driven resizing onto the 8 resize-hint spans
 * `GridItem.vue` already renders (`.vue-resize-hint--n`/`--s`/etc) —
 * used as the actual hit targets directly, rather than reimplementing
 * interact.js's own margin-based edge-proximity detection on the root
 * element. More precise as a result: each span's own real, visible hit
 * area (sized via CSS, present in the DOM whether or not
 * `showResizeHandles` makes it visible) is exactly what's grabbable,
 * with no separate proximity math to keep in sync with it.
 *
 * `target` on every emitted event is always `root` (the item's own
 * root element), never one of the handle spans — `handleResize` (and
 * `offsetXYFromParentOf`, which it calls) expects the item's own root,
 * matching what interact.js always reported here too.
 *
 * `ignoreFrom` still matters even though resize now starts from a
 * dedicated handle rather than edge-proximity anywhere on the item:
 * the `#resize-handle` slot lets a consumer put custom interactive
 * content (an icon with its own click handler, say) inside a handle,
 * and `resizeIgnoreFrom` is how they keep that from also starting a
 * resize.
 */
export function createNativeResizable(
  root: HTMLElement,
  handles: Partial<Record<keyof typeof RESIZE_EDGE_MAP, HTMLElement>>,
  getOptions: () => INativeResizableOptions,
  onEvent: (event: INativeResizeEvent) => void,
): { destroy: () => void } {
  // See createNativeDraggable's matching comment above — same
  // test-only backdoor, same rationale.
  (root as unknown as { __nativeResizeHandler?: typeof onEvent }).__nativeResizeHandler = onEvent;

  let pointerId: number | null = null;
  let activeEdges: IInteractEdges | null = null;
  let activeHandle: HTMLElement | null = null;

  const onPointerMove = (event: PointerEvent): void => {
    if(event.pointerId !== pointerId || !activeEdges) {
      return;
    }
    onEvent({ clientX: event.clientX, clientY: event.clientY, edges: activeEdges, target: root, type: `resizemove` });
  };

  const cleanup = (): void => {
    if(activeHandle && pointerId !== null) {
      try {
        activeHandle.releasePointerCapture(pointerId);
      } catch{
        // Already released — not an error.
      }
      activeHandle.removeEventListener(`pointermove`, onPointerMove);
      activeHandle.removeEventListener(`pointerup`, onPointerUp);
      activeHandle.removeEventListener(`pointercancel`, onPointerUp);
    }
    pointerId = null;
    activeEdges = null;
    activeHandle = null;
  };

  function onPointerUp(event: PointerEvent): void {
    if(event.pointerId !== pointerId || !activeEdges) {
      return;
    }
    onEvent({ clientX: event.clientX, clientY: event.clientY, edges: activeEdges, target: root, type: `resizeend` });
    cleanup();
  }

  const listeners: [HTMLElement, (event: PointerEvent) => void][] = [];

  for(const [edgeKey, handleEl] of Object.entries(handles)) {
    if(!handleEl) {
      continue;
    }
    const edges = RESIZE_EDGE_MAP[edgeKey];
    const onPointerDown = (event: PointerEvent): void => {
      // Stopped regardless of enabled/ignoreFrom below — a pointerdown
      // that landed on a resize handle at all should never also bubble
      // up and be interpreted as the start of a drag on the root,
      // whether or not resizing itself is currently enabled.
      event.stopPropagation();

      const options = getOptions();
      if(!options.enabled) {
        return;
      }
      if(event.button !== 0) {
        return;
      }
      // Bug fix: same rationale as createNativeDraggable's own version
      // of this guard — a second pointer pressing down on any handle
      // (the same one or a different one) while a resize is already
      // being tracked used to overwrite `pointerId`/`activeEdges`/
      // `activeHandle`, abandoning the first gesture. Worse than the
      // drag equivalent: the original resizestart's own resizeend would
      // then never fire, leaving `isResizing` stuck `true` indefinitely
      // (which also blocks drag, since handleDrag checks it).
      if(pointerId !== null) {
        return;
      }
      if(options.ignoreFrom && event.target instanceof Element && event.target.closest(options.ignoreFrom)) {
        return;
      }
      // Prevents native browser behaviors (text selection, native drag
      // initiation) from interfering with the gesture on such a small
      // (10x10px) target.
      event.preventDefault();

      ({ pointerId } = event);
      activeEdges = edges;
      activeHandle = handleEl;
      handleEl.setPointerCapture(pointerId);
      handleEl.addEventListener(`pointermove`, onPointerMove);
      handleEl.addEventListener(`pointerup`, onPointerUp);
      handleEl.addEventListener(`pointercancel`, onPointerUp);
      onEvent({ clientX: event.clientX, clientY: event.clientY, edges, target: root, type: `resizestart` });
    };
    handleEl.addEventListener(`pointerdown`, onPointerDown);
    listeners.push([handleEl, onPointerDown]);
  }

  return {
    destroy(): void {
      listeners.forEach(([handleEl, listener]) => handleEl.removeEventListener(`pointerdown`, listener));
      cleanup();
    },
  };
}

/**
 * Native replacement for interact.js's `autoScroll: { enabled: true }` —
 * scrolls the nearest scrollable ancestor of `el` while the pointer is
 * near its edge during a drag/resize, at a speed proportional to how
 * close to the edge the pointer is. Started on `dragstart`/`resizestart`,
 * fed the latest pointer position on every `dragmove`/`resizemove`, and
 * stopped on `dragend`/`resizeend` — a `requestAnimationFrame` loop, not
 * a one-shot check per pointer event, since the pointer can sit
 * stationary near an edge and scrolling should still continue.
 */
export interface INativeAutoScroll {
  /** Call once, when the drag/resize starts. */
  start: (el: HTMLElement) => void;
  /** Call on every pointermove during the gesture, with the latest client coordinates. */
  update: (clientX: number, clientY: number) => void;
  /** Call once, when the drag/resize ends. */
  stop: () => void;
}

/** How close to a scrollable ancestor's edge (in pixels) auto-scroll engages. */
const AUTO_SCROLL_MARGIN_PX = 40;
/** Maximum scroll speed, in pixels per animation frame, at the very edge. */
const AUTO_SCROLL_MAX_SPEED_PX = 12;

function findScrollableAncestor(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const { overflowY } = style;
    const { overflowX } = style;
    const scrollableY = (overflowY === `auto` || overflowY === `scroll`) && node.scrollHeight > node.clientHeight;
    const scrollableX = (overflowX === `auto` || overflowX === `scroll`) && node.scrollWidth > node.clientWidth;
    if(scrollableY || scrollableX) {
      return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
}

export function createNativeAutoScroll(): INativeAutoScroll {
  let container: HTMLElement | null = null;
  let lastClientX = 0;
  let lastClientY = 0;
  let rafId: number | null = null;

  const tick = (): void => {
    if(!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    let dx = 0;
    let dy = 0;

    const distLeft = lastClientX - rect.left;
    const distRight = rect.right - lastClientX;
    const distTop = lastClientY - rect.top;
    const distBottom = rect.bottom - lastClientY;

    if(distLeft >= 0 && distLeft < AUTO_SCROLL_MARGIN_PX) {
      dx = -AUTO_SCROLL_MAX_SPEED_PX * (1 - distLeft / AUTO_SCROLL_MARGIN_PX);
    } else if(distRight >= 0 && distRight < AUTO_SCROLL_MARGIN_PX) {
      dx = AUTO_SCROLL_MAX_SPEED_PX * (1 - distRight / AUTO_SCROLL_MARGIN_PX);
    }
    if(distTop >= 0 && distTop < AUTO_SCROLL_MARGIN_PX) {
      dy = -AUTO_SCROLL_MAX_SPEED_PX * (1 - distTop / AUTO_SCROLL_MARGIN_PX);
    } else if(distBottom >= 0 && distBottom < AUTO_SCROLL_MARGIN_PX) {
      dy = AUTO_SCROLL_MAX_SPEED_PX * (1 - distBottom / AUTO_SCROLL_MARGIN_PX);
    }

    if(dx !== 0 || dy !== 0) {
      container.scrollBy(dx, dy);
    }
    rafId = requestAnimationFrame(tick);
  };

  return {
    start(el: HTMLElement): void {
      container = findScrollableAncestor(el);
      if(container && rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    },
    stop(): void {
      if(rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      container = null;
    },
    update(clientX: number, clientY: number): void {
      lastClientX = clientX;
      lastClientY = clientY;
    },
  };
}
