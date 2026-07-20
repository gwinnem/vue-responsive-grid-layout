import { IPoint } from '@/core/helpers/point.interface';

/**
 * Checking if the number is a real number and not NaN.
 * @param num       The number to validate.
 * @returns boolean If the param is a real number it returns true, if not it returns false.
 */
function isNum(num: number): boolean {
  return !Number.isNaN(num);
}

/**
 * Get a mouse event's `{x, y}` position relative to its target's offset
 * parent, accounting for scroll position — the first step in converting a
 * raw browser mouse event into the grid-unit coordinates `calcXY` needs.
 *
 * Note: the short-circuit to `{left: 0, top: 0}` only applies when the
 * target's *own* `offsetParent` is literally `document.body` — since
 * jsdom (and some real detached-from-layout elements) report `offsetParent`
 * as `null`, the more common path falls through to the `else` branch and
 * reads `document.body.getBoundingClientRect()` instead, which happens to
 * be equivalent in practice but isn't quite what the code appears to
 * optimize for. See `tests/draggable-utils.spec.ts` for both cases exercised
 * explicitly.
 *
 * Typed to exactly the three fields actually read (`target`/`clientX`/
 * `clientY`), not the full `MouseEvent` shape — both a real `MouseEvent`
 * and the native drag/resize engine's own lightweight synthetic event
 * objects (`INativeDragEvent`/`INativeResizeEvent`) satisfy this without
 * a cast.
 *
 * @param evt The mouse (or native drag/resize) event to read the position from.
 */
export function offsetXYFromParentOf(evt: { target: EventTarget | null; clientX: number; clientY: number }): IPoint {
  const t = evt.target as HTMLElement;
  const offsetParent = t.offsetParent || document.body;
  const offsetParentRect =
    t.offsetParent === document.body
      ? {
        left: 0,
        top: 0,
      }
      : offsetParent.getBoundingClientRect();

  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;

  /* const x = Math.round(evt.clientX + offsetParent.scrollLeft - offsetParentRect.left);
  const y = Math.round(evt.clientY + offsetParent.scrollTop - offsetParentRect.top); */

  return {
    x,
    y,
  };
}

/** Position delta between two consecutive drag/resize ticks, as computed by {@link createCoreData}. */
export interface IDraggableCoreData {
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
  x: number;
  y: number;
}

/**
 * Compute the position delta between the previous tick (`lastX`/`lastY`)
 * and the current one (`x`/`y`) during a drag or resize. On the very first
 * tick, `lastX` is `NaN` (see `useGridItemDrag`/`useGridItemResize`'s
 * initial `ref(NaN)`), which this function treats as "no previous
 * position yet" and returns a zero delta instead of `NaN - x`.
 *
 * @param lastX Previous tick's x position (`NaN` if this is the first tick).
 * @param lastY Previous tick's y position (`NaN` if this is the first tick).
 * @param x     Current tick's x position.
 * @param y     Current tick's y position.
 */
export function createCoreData(lastX: number, lastY: number, x: number, y: number): IDraggableCoreData {
  // State changes are often (but not always!) async. We want the latest value.
  const isStart = !isNum(lastX);

  if(isStart) {
    // If this is our first move, use the x and y as last coords.
    return {
      deltaX: 0,
      deltaY: 0,
      lastX: x,
      lastY: y,
      x,
      y,
    };
  }
  // Otherwise calculate proper values.
  return {
    deltaX: x - lastX,
    deltaY: y - lastY,
    lastX,
    lastY,
    x,
    y,
  };
}
