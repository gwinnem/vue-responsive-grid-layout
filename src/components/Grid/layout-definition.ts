export interface ILayoutItemRequired {
  w: number;
  h: number;
  x: number;
  y: number;
  i: string | number;
}

export type TLayoutItem = ILayoutItemRequired & {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  moved?: boolean;
  isStatic?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}

export type TLayout = TLayoutItem[];
