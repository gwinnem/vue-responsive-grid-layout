export interface ICalcXy {
  x: number;
  y: number;
}

export interface ICalcWh {
  w: number;
  h: number;
}

export interface IGridItemPosition {
  left?: number;
  right?: number;
  top: number;
  width: number;
  height: number;
}

export interface IGridItemWidthHeight {
  width: number;
  height: number;
}

// Interfaces describing the resize interact edges.
export interface IInteractEdges {
  bottom: boolean;
  left: boolean;
  right: boolean;
  top: boolean;
}
