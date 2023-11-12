import { ICalcXy, IGridItemWidthHeight } from '@/core/interfaces/grid-item.interfaces';
import { IPositionParameters } from '@/core/interfaces/layout-data.interface';

/**
 * Compute the column width.
 *
 * @param  {IPositionParameters} positionParams  Parameters of grid needed for coordinates calculations.
 * @return {Number}                               Column width (in pixels).
 */
export const calcGridColWidth = (positionParams: IPositionParameters): number => {
  const { margin, containerWidth, cols } = positionParams;
  const tmpContainerWidth = containerWidth || 0;
  return (tmpContainerWidth - (margin[0] * (cols + 1))) / cols;
};

/**
 * Calculation the GridItem's Width and height.
 * @param   {Number}    gridUnits
 * @param   {Number}    colOrRowSize
 * @param   {Number}    marginPx
 * @return  {Number}    The result of the calculation. If gridUnits is not infinite, it returns the gridUnits.
 *                      Othervise the result is being calculated.
 */
export const calcGridItemWH = (gridUnits: number, colOrRowSize: number, marginPx: number): number => {
  if(!Number.isFinite(gridUnits)) {
    return gridUnits;
  }
  return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
};

/**
 * Calculate a GridItem width and height.
 *
 * @param  {IPositionParameters} positionParams Parameters of grid needed for coordinates calculations.
 * @param  {Number}                      w       W coordinate in grid units.
 * @param  {Number}                      h       H coordinate in grid units.
 * @return {IGridItemWidthHeight}                width and height (in pixels).
 */
export const calcItemSize = (positionParams: IPositionParameters, w: number, h: number): IGridItemWidthHeight => {
  const tmpRowHeight = positionParams.rowHeight || 0;
  return {
    // 0 * Infinity === NaN, which causes problems with resize constraints;
    // Fix this if it occurs.
    // Note we do it here rather than later because Math.round(Infinity) causes dept

    height: h === Infinity ? h : Math.round(tmpRowHeight * h + Math.max(0, h - 1) * positionParams.margin[1]),
    width: w === Infinity ? w : Math.round(calcGridColWidth(positionParams) * w + Math.max(0, w - 1) * positionParams.margin[0]),
  };
};

/**
 * Translate x and y coordinates from pixels to grid units.
 *
 * @param  {IPositionParameters} positionParams  Parameters of grid needed for coordinates calculations.
 * @param  {Number}               top             Top position (relative to parent) in pixels.
 * @param  {Number}               left            Left position (relative to parent) in pixels.
 * @param  {Number}               w               W coordinate in grid units.
 * @param  {Number}               h               H coordinate in grid units.
 * @return {ICalcXy}                              x and y in grid units.
 */
export const calcXY = (positionParams: IPositionParameters, top: number, left: number, w: number, h: number): ICalcXy => {
  const {
    margin, cols, rowHeight, maxRows,
  } = positionParams;
  const colWidth = calcGridColWidth(positionParams);

  let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
  const tmpRowHeight = rowHeight || 0;
  let y = Math.round((top - margin[1]) / (tmpRowHeight + margin[1]));

  const tmpMaxRows = maxRows || 0;
  // Capping
  x = Math.max(Math.min(x, cols - w), 0);
  y = Math.max(Math.min(y, tmpMaxRows - h), 0);

  return { x, y };
};
