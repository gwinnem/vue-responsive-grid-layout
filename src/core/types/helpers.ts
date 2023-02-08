export type TBreakpointsKeys = `lg` | `md` | `sm` | `xs` | `xxs` | ``;

export type TLayoutItemRequired = { w: number; h: number; x: number; y: number; i: number };
export type TLayoutItemOptional = {
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  moved?: boolean;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
};

export type TLayoutItem = TLayoutItemRequired & TLayoutItemOptional;
export type TLayout = TLayoutItem[];

// export type LayoutItemsByYAxis = {
//   [K in string]: LayoutItem[]
// }

export enum EMovingDirections {
  DOWN = `DOWN`,
  LEFT = `LEFT`,
  RIGHT = `RIGHT`,
  UP = `UP`,
}
export type TMovingDirection = keyof typeof EMovingDirections

export type TRecordBreakpoint<Type> = Partial<Record<TBreakpointsKeys, Type>>;
export type TBreakpoints = TRecordBreakpoint<number>;

export type TResponsiveLayout = TRecordBreakpoint<TLayout>;

// eslint-disable-next-line @typescript-eslint/naming-convention
export type findOrGenerateResponsiveLayoutFnc = (
  orgLayout: TLayout,
  layouts: TResponsiveLayout,
  breakpoints: TBreakpoints,
  breakpoint: TBreakpointsKeys,
  cols: number,
  verticalCompact: boolean,
) => TLayout;

// eslint-disable-next-line @typescript-eslint/naming-convention
export type setPositionFnc<Position> = (top: number, left: number, width: number, height: number) => Position;
