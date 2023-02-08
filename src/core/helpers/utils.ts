import { CSSProperties } from 'vue';
import {
  TLayout,
  TLayoutItem,
  // LayoutItemsByYAxis,
  TMovingDirection,
  EMovingDirections,
  setPositionFnc,
} from '../types/helpers';

export const bottom = (layout: TLayout): number => {
  let max = 0;

  let bottomY: number;

  for(let i = 0; i < layout.length; i++) {
    bottomY = layout[i].y + layout[i].h;

    if(bottomY > max) {
      max = bottomY;
    }
  }

  return max;
};

export const cloneLayoutItem = (layoutItem: TLayoutItem): TLayoutItem => JSON.parse(JSON.stringify(layoutItem));
export const cloneLayout = (layout: TLayout): TLayout => {
  const newLayout = Array(layout.length);

  for(let i = 0; i < layout.length; i++) {
    newLayout[i] = cloneLayoutItem(layout[i]);
  }

  return newLayout;
};

export const collides = (l1: TLayoutItem, l2: TLayoutItem): boolean => {
  return !(l1 === l2 || l1.x + l1.w <= l2.x || l1.x >= l2.x + l2.w || l1.y + l1.h <= l2.y || l1.y >= l2.y + l2.h);
};

// eslint-disable-next-line consistent-return
export const getFirstCollision = (layout: TLayout, layoutItem: TLayoutItem): TLayoutItem | void => {
  for(let i = 0, len = layout.length; i < len; i++) {
    if(collides(layout[i], layoutItem)) return layout[i];
  }
};

export const getStatics = (layout: TLayout): TLayoutItem[] => layout.filter(l => l.static);
export const sortLayoutItemsByRowCol = (layout: TLayout): TLayout => {
  return [...layout].sort((a, b) => {
    if(a.y === b.y && a.x === b.x) return 0;

    if(a.y > b.y || (a.y === b.y && a.x > b.x)) return 1;

    return -1;
  });
};
export const compactItem = (compareWith: TLayout, l: TLayoutItem, verticalCompact: boolean): TLayoutItem => {
  if(verticalCompact) {
    while (l.y > 0 && !getFirstCollision(compareWith, l)) {
      l.y--;
    }
  }

  let collisions;

  // eslint-disable-next-line no-cond-assign
  while ((collisions = getFirstCollision(compareWith, l))) {
    l.y = collisions.y + collisions.h;
  }

  return l;
};
export const compact = (layout: TLayout, verticalCompact: boolean): TLayout | undefined => {
  if(!layout) return;

  const compareWith = getStatics(layout);
  const sorted = sortLayoutItemsByRowCol(layout);
  const out = Array(layout.length);

  for(let i = 0; i < sorted.length; i++) {
    let l = sorted[i];

    if(!l.static) {
      l = compactItem(compareWith, l, verticalCompact);
      compareWith.push(l);
    }

    out[layout.indexOf(l)] = l;

    l.moved = false;
  }

  // eslint-disable-next-line consistent-return
  return out;
};

export const correctBounds = (layout: TLayout, bounds: { cols: number }): TLayout => {
  const collidesWith = getStatics(layout);

  for(let i = 0; i < layout.length; i++) {
    const l = layout[i];

    if(l.x + l.w > bounds.cols) l.x = bounds.cols - l.w;

    if(l.x < 0) {
      l.x = 0;
      l.w = bounds.cols;
    }

    if(!l.static) {
      collidesWith.push(l);
    } else {
      while (getFirstCollision(collidesWith, l)) {
        l.y++;
      }
    }
  }

  return layout;
};

export const getAllCollisions = (layout: TLayout, layoutItem: TLayoutItem): TLayoutItem[] => {
  return layout.filter(l => collides(l, layoutItem));
};

export const getLayoutItem = (layout: TLayout, id: number): TLayoutItem => layout.filter(l => l.i === id)[0];

export const moveElementAwayFromCollision = (
  layout: TLayout,
  collidesWith: TLayoutItem,
  itemToMove: TLayoutItem,
  isUserAction: boolean,
  movingDirection: TMovingDirection,
  horizontalShift: boolean,
): TLayout => {
  const preventCollision = false;

  if(isUserAction) {
    const fakeItem: TLayoutItem = {
      h: itemToMove.h,
      i: -1,
      w: itemToMove.w,
      x: itemToMove.x,
      y: Math.max(collidesWith.y - itemToMove.h, 0),
    };

    if(!getFirstCollision(layout, fakeItem)) {
      // eslint-disable-next-line no-use-before-define
      return moveElement(layout, itemToMove, fakeItem.x, fakeItem.y, isUserAction, horizontalShift, preventCollision);
    }
  }

  const movingCordsData = {
    $default: {
      x: itemToMove.x,
      y: itemToMove.y + 1,
    },
    [EMovingDirections.LEFT]: [itemToMove.x + collidesWith.w, collidesWith.y],
    [EMovingDirections.RIGHT]: [itemToMove.x - collidesWith.w, collidesWith.y],
    [EMovingDirections.UP]: [itemToMove.x, itemToMove.y + collidesWith.h],
    [EMovingDirections.DOWN]: [itemToMove.x, itemToMove.y - collidesWith.h],
  };

  if(horizontalShift) {
    const horizontalDirection = movingDirection === EMovingDirections.LEFT || movingDirection === EMovingDirections.RIGHT;

    if(movingDirection in movingCordsData && !(horizontalDirection && collidesWith.w < itemToMove.w && collidesWith.x !== itemToMove.x)) {
      const [x, y] = movingCordsData[movingDirection];

      movingCordsData.$default.x = x;
      movingCordsData.$default.y = y;
    }
  }

  // eslint-disable-next-line no-use-before-define
  return moveElement(layout, itemToMove, movingCordsData.$default.x, movingCordsData.$default.y, horizontalShift, preventCollision);
};

export const moveElement = (
  layout: TLayout,
  l: TLayoutItem,
  x: number,
  y: number,
  isUserAction: boolean,
  horizontalShift: boolean,
  preventCollision?: boolean,
): TLayout => {
  if(l.static) return layout;

  const oldX = l.x;
  const oldY = l.y;
  const moving = {
    DOWN: oldY < y,
    LEFT: oldX > x,
    RIGHT: oldX < x,
    UP: oldY > y,
  };

  l.x = x;
  l.y = y;

  l.moved = true;

  let sorted = sortLayoutItemsByRowCol(layout);

  if(moving.UP) sorted = sorted.reverse();

  const collisions = getAllCollisions(sorted, l);

  if(preventCollision && collisions.length) {
    l.x = oldX;
    l.y = oldY;
    l.moved = false;

    return layout;
  }

  for(let i = 0; i < collisions.length; i++) {
    const collision = collisions[i];

    if(collision.moved) continue;

    if(l.y > collision.y && l.y - collision.y > collision.h / 4) continue;

    const movingDirection = (Object.keys(moving) as EMovingDirections[]).filter(k => moving[k])?.[0];

    if(collision.static) {
      // eslint-disable-next-line no-param-reassign
      layout = moveElementAwayFromCollision(layout, collision, l, isUserAction, movingDirection, horizontalShift);
    } else {
      // eslint-disable-next-line no-param-reassign
      layout = moveElementAwayFromCollision(layout, l, collision, isUserAction, movingDirection, horizontalShift);
    }
  }

  return layout;
};

export const setTopLeft: setPositionFnc<CSSProperties> = (top, left, width, height) => ({
  height: `${height}px`,
  left: `${left}px`,
  position: `absolute`,
  top: `${top}px`,
  width: `${width}px`,
});

export const setTransform = (top: number, left: number, width: number, height: number): CSSProperties => ({
  height: `${height}px`,
  position: `absolute`,
  transform: `translate3d(${left}px,${top}px, 0)`,
  width: `${width}px`,
});

export const stringReplacer = (string: string, value: string, replacer: string): string => {
  return string.trim()
    .replace(value, replacer);
};
