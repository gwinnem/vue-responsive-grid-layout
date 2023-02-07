import { Breakpoints } from "../types/helpers";

export interface IGridLayoutGridItemItemProps {
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
  useCssTransforms: boolean;
  width: number;
}
