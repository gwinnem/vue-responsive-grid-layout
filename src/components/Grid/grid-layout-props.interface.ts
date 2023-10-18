import { TLayout } from '@/components/Grid/layout-definition';

export interface IBreakpoints {
  xxl: number;
  xl: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

export interface IColumns {
  xxl: number;
  xl: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  xxs: number;
}

export interface IGridLayoutProps {
  autoSize?: boolean;
  borderRadiusPx?: number;
  breakpoints?: IBreakpoints;
  colNum?: number;
  cols?: IColumns;
  distributeEvenly?: boolean;
  horizontalShift?: boolean;
  isBounded?: boolean;
  isDraggable?: boolean;
  isMirrored?: boolean;
  isResizable?: boolean;
  layout: TLayout;
  margin?: number[];
  maxRows?: number;
  preventCollision?: boolean;
  responsive?: boolean;
  responsiveLayouts?: { [key: string]: TLayout };
  restoreOnDrag?: boolean;
  rowHeight?: number;
  showCloseButton?: boolean;
  showGridLines?: boolean;
  transformScale?: number;
  useBorderRadius?: boolean;
  useCssTransforms?: boolean;
  verticalCompact?: boolean;
}
