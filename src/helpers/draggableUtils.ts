export interface IPoint {
  x: number;
  y: number;
}

function isNum(num: number): boolean {
  return !Number.isNaN(num);
}

// Get from offsetParent
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

// Get {x, y} positions from event.
export function getControlPosition(e: MouseEvent): IPoint {
  return offsetXYFromParentOf(e);
}

export interface IDraggableCoreData {
  deltaX: number;
  deltaY: number;
  lastX: number;
  lastY: number;
  x: number;
  y: number;
}

// Create a data object exposed by <DraggableCore>'s events
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
