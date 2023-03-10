export interface ILayoutItemRequired {
  i: string | number;
  h: number;
  w: number;
  x: number;
  y: number;
}

export interface ILayoutItem extends ILayoutItemRequired {
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  moved?: boolean;
}

export type TLayoutItem = ILayoutItemRequired & {
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  moved?: boolean;
}

export type TLayout = ILayoutItem[];

export type TResponsiveLayout = {
  xxl?: TLayout;
  xl?: TLayout;
  lg?: TLayout;
  md?: TLayout;
  sm?: TLayout;
  xs?: TLayout;
  xxs?: TLayout;
};

export type TBreakpoint = string;

export type TBreakpoints = {
  xxl?: number;
  xl?: number;
  lg?: number;
  md?: number;
  sm?: number;
  xs?: number;
  xxs?: number;
};
