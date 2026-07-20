import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createNativeAutoScroll,
  createNativeDraggable,
  createNativeResizable,
  RESIZE_EDGE_MAP,
} from '../src/core/helpers/native-interaction';

describe(`native-interaction`, () => {
  afterEach(() => {
    document.body.innerHTML = ``;
    vi.restoreAllMocks();
  });

  describe(`createNativeDraggable`, () => {
    it(`Should not start a drag until the pointer moves past the activation threshold`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ enabled: true }), (event) => events.push(event.type));

      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 1, clientY: 1, pointerId: 1 }));
      expect(events).toStrictEqual([]);

      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 10, clientY: 10, pointerId: 1 }));
      expect(events).toStrictEqual([`dragstart`, `dragmove`]);
    });

    it(`Should report dragstart at the pointerdown position, not the position that crossed the threshold`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: { type: string; clientX: number; clientY: number }[] = [];
      createNativeDraggable(el, () => ({ enabled: true }), (event) => events.push(event));

      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 100, clientY: 100, pointerId: 1 }));

      expect(events[0]).toMatchObject({ clientX: 50, clientY: 50, type: `dragstart` });
      expect(events[1]).toMatchObject({ clientX: 100, clientY: 100, type: `dragmove` });
    });

    it(`Should not start a drag when disabled`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ enabled: false }), (event) => events.push(event.type));

      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });

    it(`Should not start a drag when ignoreFrom matches the pointerdown target`, () => {
      const el = document.createElement(`div`);
      const button = document.createElement(`button`);
      button.className = `no-drag`;
      el.appendChild(button);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ enabled: true, ignoreFrom: `.no-drag` }), (event) => events.push(event.type));

      button.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      button.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });

    it(`Should not start a drag when allowFrom is set and the pointerdown target doesn't match it`, () => {
      const el = document.createElement(`div`);
      const handle = document.createElement(`span`);
      handle.className = `handle`;
      const other = document.createElement(`span`);
      el.append(handle, other);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ allowFrom: `.handle`, enabled: true }), (event) => events.push(event.type));

      other.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      other.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      expect(events).toStrictEqual([]);

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 2 }));
      handle.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 2 }));
      expect(events).toStrictEqual([`dragstart`, `dragmove`]);
    });

    it(`Should let allowFrom win when a handle also matches ignoreFrom, not have ignoreFrom silently block it`, () => {
      // Regression test for a real bug: GridItem's own default
      // `dragIgnoreFrom` is `"a, button"` — meant to stop an accidental
      // drag starting on a plain link/button somewhere in an item's own
      // content when there's no dedicated handle. But `ignoreFrom` used
      // to be checked unconditionally, before `allowFrom` — so a
      // consumer explicitly restricting dragging to one handle via
      // `dragAllowFrom` still got silently blocked if that handle
      // happened to be (or contain) a `<button>`/`<a>`, with no error at
      // all. This broke the library's own exported `CustomDragElement`
      // component out of the box, since its handle is a `<button>`
      // internally. An explicit `allowFrom` should be the sole
      // authority once set — `ignoreFrom`'s job (excluding elements from
      // an otherwise-unrestricted "drag from anywhere" surface) doesn't
      // apply once that surface is already narrowed to one handle.
      const el = document.createElement(`div`);
      const handleButton = document.createElement(`button`);
      handleButton.className = `handle`;
      el.append(handleButton);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ allowFrom: `.handle`, enabled: true, ignoreFrom: `a, button` }), (event) => events.push(event.type));

      handleButton.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      handleButton.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));

      expect(events).toStrictEqual([`dragstart`, `dragmove`]);
    });

    it(`Should fire dragend on pointerup, only if a drag had actually started`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ enabled: true }), (event) => events.push(event.type));

      // A plain click — never crosses the activation threshold.
      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      expect(events).toStrictEqual([]);

      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 2 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 20, clientY: 20, pointerId: 2 }));
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 20, clientY: 20, pointerId: 2 }));
      expect(events).toStrictEqual([`dragstart`, `dragmove`, `dragend`]);
    });

    it(`Should ignore a non-primary button`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: string[] = [];
      createNativeDraggable(el, () => ({ enabled: true }), (event) => events.push(event.type));

      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 2, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 2, clientX: 50, clientY: 50, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });

    it(`Should ignore a second pointer's pointerdown while the first is already being tracked, not abandon the first`, () => {
      // Bug fix: two fingers on the same item (or an accidental palm
      // touch mid-drag) used to overwrite pointerId/startX/startY and
      // reset dragStarted, silently abandoning the first pointer's own
      // drag — its eventual pointerup would then never match the
      // (now-different) tracked pointerId, so dragend would never fire.
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: { type: string; clientX: number }[] = [];
      createNativeDraggable(el, () => ({ enabled: true }), (event) => events.push(event));

      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 20, clientY: 20, pointerId: 1 }));
      // A second pointer (a different finger) presses down mid-drag —
      // should be ignored entirely, not hijack tracking.
      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 5, clientY: 5, pointerId: 2 }));
      // The second pointer's own move should be ignored too, not just
      // its down — a mismatched pointerId on pointermove specifically,
      // distinct from the pointerup check below.
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 8, clientY: 8, pointerId: 2 }));
      // The first pointer's own continued movement should still be
      // tracked and reported.
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 40, clientY: 40, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 40, clientY: 40, pointerId: 1 }));

      expect(events.map((event) => event.type)).toStrictEqual([`dragstart`, `dragmove`, `dragmove`, `dragend`]);
      // The ignored second pointer's own up shouldn't do anything either
      // (no matching pointerId to react to) — confirmed indirectly by
      // the event count above not including a spurious extra dragend.
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 5, clientY: 5, pointerId: 2 }));
      expect(events.length).toBe(4);
    });

    it(`Should stop listening after destroy() is called`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      const events: string[] = [];
      const draggable = createNativeDraggable(el, () => ({ enabled: true }), (event) => events.push(event.type));
      draggable.destroy();

      expect(() => {
        el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
        el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      }).not.toThrow();
      expect(events).toStrictEqual([]);
    });
  });

  describe(`createNativeResizable`, () => {
    it(`Should fire resizestart/resizeend immediately (no activation threshold) with the correct edges for the grabbed handle`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      root.appendChild(handle);
      document.body.appendChild(root);
      const events: { type: string; edges: unknown }[] = [];
      createNativeResizable(root, { se: handle }, () => ({ enabled: true }), (event) => events.push(event));

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      handle.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events.map((event) => event.type)).toStrictEqual([`resizestart`, `resizeend`]);
      expect(events[0].edges).toStrictEqual(RESIZE_EDGE_MAP.se);
    });

    it(`Should report the resize event's target as root, never the handle itself`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      root.appendChild(handle);
      document.body.appendChild(root);
      const events: { target: unknown }[] = [];
      createNativeResizable(root, { se: handle }, () => ({ enabled: true }), (event) => events.push(event));

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events[0].target).toBe(root);
    });

    it(`Should ignore a non-left-button pointerdown on a resize handle (e.g. a right-click)`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      root.appendChild(handle);
      document.body.appendChild(root);
      const events: string[] = [];
      createNativeResizable(root, { se: handle }, () => ({ enabled: true }), (event) => events.push(event.type));

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 2, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });

    it(`Should skip a missing/undefined handle entry in the handles map without throwing`, () => {
      // A consumer might pass a handles object with some edges
      // deliberately omitted (e.g. resizeHandles restricting which
      // corners render at all) — this confirms a falsy handle entry is
      // simply skipped, not treated as an error.
      const root = document.createElement(`div`);
      const seHandle = document.createElement(`span`);
      root.appendChild(seHandle);
      document.body.appendChild(root);
      const events: string[] = [];

      expect(() => {
        createNativeResizable(root, { nw: undefined as unknown as HTMLElement, se: seHandle }, () => ({ enabled: true }), (event) => events.push(event.type));
      }).not.toThrow();

      seHandle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      seHandle.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events).toStrictEqual([`resizestart`, `resizeend`]);
    });

    it(`Should not resize when disabled`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      root.appendChild(handle);
      document.body.appendChild(root);
      const events: string[] = [];
      createNativeResizable(root, { se: handle }, () => ({ enabled: false }), (event) => events.push(event.type));

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });

    it(`Should not resize when ignoreFrom matches the pointerdown target within the handle`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      const icon = document.createElement(`i`);
      icon.className = `no-resize`;
      handle.appendChild(icon);
      root.appendChild(handle);
      document.body.appendChild(root);
      const events: string[] = [];
      createNativeResizable(root, { se: handle }, () => ({ enabled: true, ignoreFrom: `.no-resize` }), (event) => events.push(event.type));

      icon.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });

    it(`Should stop propagation on pointerdown even when disabled, so it never also starts a drag on an ancestor`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      root.appendChild(handle);
      document.body.appendChild(root);
      const rootPointerDownSpy = vi.fn();
      root.addEventListener(`pointerdown`, rootPointerDownSpy);
      createNativeResizable(root, { se: handle }, () => ({ enabled: false }), () => {});

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(rootPointerDownSpy).not.toHaveBeenCalled();
    });

    it(`Should ignore a second pointer's pointerdown on any handle while the first is already being tracked`, () => {
      // Same rationale as createNativeDraggable's own version of this
      // test — here the consequence is worse if unguarded: the
      // original resizestart's own resizeend would never fire,
      // leaving `isResizing` stuck permanently `true` in the consuming
      // composable (which also blocks drag, since handleDrag checks it).
      const root = document.createElement(`div`);
      const seHandle = document.createElement(`span`);
      const swHandle = document.createElement(`span`);
      root.append(seHandle, swHandle);
      document.body.appendChild(root);
      const events: string[] = [];
      createNativeResizable(root, { se: seHandle, sw: swHandle }, () => ({ enabled: true }), (event) => events.push(event.type));

      seHandle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      // A second pointer presses a *different* handle mid-resize —
      // should be ignored entirely.
      swHandle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 5, clientY: 5, pointerId: 2 }));
      // The second pointer's own move should be ignored too, not just
      // its down.
      swHandle.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 8, clientY: 8, pointerId: 2 }));
      seHandle.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 20, clientY: 20, pointerId: 1 }));
      seHandle.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 20, clientY: 20, pointerId: 1 }));

      expect(events).toStrictEqual([`resizestart`, `resizemove`, `resizeend`]);
    });

    it(`Should stop listening on all handles after destroy() is called`, () => {
      const root = document.createElement(`div`);
      const handle = document.createElement(`span`);
      root.appendChild(handle);
      document.body.appendChild(root);
      const events: string[] = [];
      const resizable = createNativeResizable(root, { se: handle }, () => ({ enabled: true }), (event) => events.push(event.type));
      resizable.destroy();

      handle.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));

      expect(events).toStrictEqual([]);
    });
  });

  describe(`createNativeAutoScroll`, () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it(`Should scroll a scrollable ancestor when the tracked position is near its edge`, () => {
      const container = document.createElement(`div`);
      const el = document.createElement(`div`);
      container.appendChild(el);
      document.body.appendChild(container);

      Object.defineProperty(container, `scrollHeight`, { configurable: true, value: 800 });
      Object.defineProperty(container, `clientHeight`, { configurable: true, value: 400 });
      container.getBoundingClientRect = () => ({
        bottom: 400, height: 400, left: 0, right: 400, toJSON: () => ({}), top: 0, width: 400, x: 0, y: 0,
      });
      const scrollBySpy = vi.fn();
      container.scrollBy = scrollBySpy;
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `auto` } as CSSStyleDeclaration);

      const autoScroll = createNativeAutoScroll();
      autoScroll.start(el);
      autoScroll.update(10, 10);
      vi.advanceTimersByTime(20);

      expect(scrollBySpy).toHaveBeenCalled();
      const [dx, dy] = scrollBySpy.mock.calls[0];
      expect(dx).toBeLessThan(0);
      expect(dy).toBeLessThan(0);

      autoScroll.stop();
    });

    it(`Should scroll toward the bottom-right when the tracked position is near that edge instead`, () => {
      // The top-left test above only exercises distLeft/distTop —
      // distRight/distBottom are a separate pair of branches with their
      // own sign (positive dx/dy, scrolling the other direction).
      const container = document.createElement(`div`);
      const el = document.createElement(`div`);
      container.appendChild(el);
      document.body.appendChild(container);

      Object.defineProperty(container, `scrollHeight`, { configurable: true, value: 800 });
      Object.defineProperty(container, `clientHeight`, { configurable: true, value: 400 });
      container.getBoundingClientRect = () => ({
        bottom: 400, height: 400, left: 0, right: 400, toJSON: () => ({}), top: 0, width: 400, x: 0, y: 0,
      });
      const scrollBySpy = vi.fn();
      container.scrollBy = scrollBySpy;
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `auto` } as CSSStyleDeclaration);

      const autoScroll = createNativeAutoScroll();
      autoScroll.start(el);
      autoScroll.update(390, 390);
      vi.advanceTimersByTime(20);

      expect(scrollBySpy).toHaveBeenCalled();
      const [dx, dy] = scrollBySpy.mock.calls[0];
      expect(dx).toBeGreaterThan(0);
      expect(dy).toBeGreaterThan(0);

      autoScroll.stop();
    });

    it(`Should not scroll when the tracked position is far from any edge`, () => {
      const container = document.createElement(`div`);
      const el = document.createElement(`div`);
      container.appendChild(el);
      document.body.appendChild(container);

      Object.defineProperty(container, `scrollHeight`, { configurable: true, value: 800 });
      Object.defineProperty(container, `clientHeight`, { configurable: true, value: 400 });
      container.getBoundingClientRect = () => ({
        bottom: 400, height: 400, left: 0, right: 400, toJSON: () => ({}), top: 0, width: 400, x: 0, y: 0,
      });
      const scrollBySpy = vi.fn();
      container.scrollBy = scrollBySpy;
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `auto` } as CSSStyleDeclaration);

      const autoScroll = createNativeAutoScroll();
      autoScroll.start(el);
      autoScroll.update(200, 200);
      vi.advanceTimersByTime(20);

      expect(scrollBySpy).not.toHaveBeenCalled();
      autoScroll.stop();
    });

    it(`Should stop ticking once stop() is called`, () => {
      const container = document.createElement(`div`);
      const el = document.createElement(`div`);
      container.appendChild(el);
      document.body.appendChild(container);

      Object.defineProperty(container, `scrollHeight`, { configurable: true, value: 800 });
      Object.defineProperty(container, `clientHeight`, { configurable: true, value: 400 });
      container.getBoundingClientRect = () => ({
        bottom: 400, height: 400, left: 0, right: 400, toJSON: () => ({}), top: 0, width: 400, x: 0, y: 0,
      });
      const scrollBySpy = vi.fn();
      container.scrollBy = scrollBySpy;
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `auto` } as CSSStyleDeclaration);

      const autoScroll = createNativeAutoScroll();
      autoScroll.start(el);
      autoScroll.update(10, 10);
      autoScroll.stop();
      vi.advanceTimersByTime(50);

      expect(scrollBySpy).not.toHaveBeenCalled();
    });

    it(`Should fall back to document.scrollingElement when no scrollable ancestor is found`, () => {
      const el = document.createElement(`div`);
      document.body.appendChild(el);
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `visible` } as CSSStyleDeclaration);

      const autoScroll = createNativeAutoScroll();
      expect(() => {
        autoScroll.start(el);
        autoScroll.update(10, 10);
        vi.advanceTimersByTime(20);
        autoScroll.stop();
      }).not.toThrow();
    });
  });
});
