import { Layout } from "../../helpers/utils";

export interface IGridLayoutProps {
  autoSize?: boolean;
  breakpoints?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  colNum?: number;
  cols?: { lg: number; md: number; sm: number; xs: number; xxs: number };
  isBounded?: boolean;
  isDraggable?: boolean;
  isMirrored?: boolean;
  isResizable?: boolean;
  layout: Layout;
  margin?: number[];
  maxRows?: number;
  preventCollision?: boolean;
  responsive?: boolean;
  responsiveLayouts?: { [key: string]: any };
  restoreOnDrag?: boolean;
  rowHeight?: number;
  showCloseButton?: boolean;
  transformScale?: number;
  useBorderRadius?: boolean;
  useCssTransforms?: boolean;
  useStyleCursor?: boolean;
  verticalCompact?: boolean;
}
