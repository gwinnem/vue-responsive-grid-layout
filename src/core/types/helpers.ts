import { EMovingDirections } from '../enums/EMovingDirections';
import { TBreakpoints, TBreakpointsKeys, TRecordBreakpoint } from './breakpoints';

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
export type TResponsiveLayout = TRecordBreakpoint<TLayout>;

export type TMovingDirection = keyof typeof EMovingDirections

// eslint-disable-next-line @typescript-eslint/naming-convention
export type findOrGenerateResponsiveLayoutFnc = (
  orgLayout: TLayout,
  layouts: TResponsiveLayout,
  breakpoints: TBreakpoints,
  breakpoint: TBreakpointsKeys,
  cols: number,
  verticalCompact: boolean,
) => TLayout;
