import elementResizeDetectorMaker from 'element-resize-detector';
import { TLayout } from '@/components';

export interface IPlaceholder {
  h: number;
  i: number | string;
  x: number;
  y: number;
  w: number;
}

export interface ILayoutData {
  erd: elementResizeDetectorMaker.Erd | null;
  isDragging: boolean;
  layouts: { [key: string]: TLayout | any };
  lastBreakpoint: string | null;
  lastLayoutLength: number;
  mergeStyle: { [key: string]: string };
  originalLayout: TLayout | null;
  placeholder: IPlaceholder;
  positionsBeforeDrag: { [key: string]: string };
  width: number | null;
  this$refsLayout: HTMLElement;
}

export interface IPositionParameters {
  cols: number;
  containerWidth: number | null;
  margin: [number, number];
  maxRows: number | null;
  rowHeight: number | null;
}
