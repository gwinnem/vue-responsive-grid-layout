import { Breakpoints } from "../types/helpers";

export interface IGridLayoutGridItemItemProps {
  borderRadiusPx: number;
  breakpointCols: Breakpoints;
  colNum: number;
  containerWidth: number;
  isDraggable: boolean;
  isResizable: boolean;
  lastBreakpoint: string;
  margin: number[];
  maxRows: number;
  responsive: boolean;
  rowHeight: number;
  useBorderRadius: boolean;
  useCssTransforms: boolean;
  width: number;
}
