import elementResizeDetectorMaker from 'element-resize-detector';
import { TLayout } from '@/helpers/utils';

export interface IPlaceholder {
  x: number;
  y: number;
  w: number;
  h: number;
  i: number | string;
}

export interface ILayoutData {
  width: number | null;
  mergeStyle: { [key: string]: string };
  lastLayoutLength: number;
  isDragging: boolean;
  placeholder: IPlaceholder;
  layouts: { [key: string]: TLayout | any };
  lastBreakpoint: string | null;
  originalLayout: TLayout | null;
  erd: elementResizeDetectorMaker.Erd | null;
  positionsBeforeDrag: { [key: string]: string };
  this$refsLayout: HTMLElement;
}
