import { TBreakpoints } from '../types/breakpoints';

export interface IGridLayoutGridItemItemProps {
  borderRadiusPx: number;
  breakpointCols: TBreakpoints;
  colNum: number;
  containerWidth: number;
  isDraggable: boolean;
  isResizable: boolean;
  lastBreakpoint: string;
  margin: number[];
  maxRows: number;
  responsive: boolean;
  rowHeight: number;
  showCloseButton: boolean;
  useBorderRadius: boolean;
  useCssTransforms: boolean;
  width: number;
}
