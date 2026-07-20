// Global Vitest setup — runs once before each test file.
import { vi } from 'vitest';

// jsdom does not implement ResizeObserver (a real gap — every browser this
// project targets has supported it for years; see docs/BUNDLE_ANALYSIS.md
// #3 for why GridLayout uses it instead of element-resize-detector now).
// GridLayout only uses it to be notified of container resizes; the initial
// width read (`offsetWidth`) happens independently via `onWindowResize()`,
// so a no-op stub is sufficient for every test that doesn't specifically
// exercise resize-detection wiring.
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal(`ResizeObserver`, ResizeObserverMock);

// The native drag/resize engine (see @/core/helpers/native-interaction.ts)
// uses setPointerCapture/releasePointerCapture, which jsdom doesn't
// implement at all (calling either throws "is not a function" without
// this stub) — every element needs these to exist for GridItem to even
// mount cleanly, not just tests that directly exercise dragging/resizing.
// A no-op is sufficient: tests dispatch pointer events directly rather
// than relying on capture-driven event routing the way a real browser
// gesture would.
if (!(`setPointerCapture` in Element.prototype)) {
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
  Element.prototype.hasPointerCapture = vi.fn(() => false);
}

// createNativeAutoScroll (@/core/helpers/native-interaction.ts) drives its
// own polling loop via requestAnimationFrame — stubbed to a no-op rather
// than a real scheduler, since no test in this suite currently exercises
// autoScroll's own scrolling behavior directly (only that starting/
// stopping it doesn't throw); see e2e for real, visual autoScroll coverage.
if (typeof globalThis.requestAnimationFrame !== `function`) {
  globalThis.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 0) as unknown as number);
  globalThis.cancelAnimationFrame = vi.fn((handle: number) => clearTimeout(handle));
}

// jsdom doesn't implement PointerEvent at all (a real gap — every browser
// this project targets has supported it for years). The native drag/resize
// engine is built on it, so tests dispatching real pointer gestures
// (rather than using the __nativeDragHandler/__nativeResizeHandler
// test-only backdoors) need a constructor to exist. A thin MouseEvent
// subclass carrying the one field actually read (pointerId) is
// sufficient — nothing in this project reads pointerType/pressure/etc.
if (typeof globalThis.PointerEvent === `undefined`) {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId: number;

    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  globalThis.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}
