import {IPoint} from "@/core/helpers/IPoint";

/**
 * Checking if the number is a real number and not NaN.
 * @param num       The number to validate.
 * @returns boolean If the param is a real number it returns true, if not it returns false.
 */
function isNum(num: number): boolean {
  return !Number.isNaN(num);
}

/**
 * Get {x, y} positions from event.
 * @param evt
 */
export function offsetXYFromParentOf(evt: MouseEvent): IPoint {
  const t = evt.target as HTMLElement;
  const offsetParent = t.offsetParent || document.body;
  const offsetParentRect = t.offsetParent === document.body ? {
    left: 0,
    top: 0,
  } : offsetParent.getBoundingClientRect();

  const x = evt.clientX + offsetParent.scrollLeft - offsetParentRect.left;
  const y = evt.clientY + offsetParent.scrollTop - offsetParentRect.top;

  /* const x = Math.round(evt.clientX + offsetParent.scrollLeft - offsetParentRect.left);
  const y = Math.round(evt.clientY + offsetParent.scrollTop - offsetParentRect.top); */

  return {
    x,
    y,
  };
}

export interface IDraggableCoreData {
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
  x: number;
  y: number;
}

/**
 * Create a data object exposed by <DraggableCore>'s events
 * @param lastX
 * @param lastY
 * @param x
 * @param y
 */
export function createCoreData(
  lastX: number,
  lastY: number,
  x: number,
  y: number,
): IDraggableCoreData {
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
