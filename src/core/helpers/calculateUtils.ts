import { ICalcXy } from '@/core/interfaces/grid-item.interfaces';
// import { IPositionParameters } from '@/core/interfaces/layout-data.interface';

// Similar to _.clamp
export const clamp = (num: number, lowerBound: number, upperBound: number): number => {
    return Math.max(Math.min(num, upperBound), lowerBound);
};

/**
 * Compute the column width.
 *
 * @param  {IPositionParameters} positionParams  Parameters of grid needed for coordinates calculations.
 * @return {Number}                               Column width (in pixels).
 */
// export const calcGridColWidth = (positionParams: IPositionParameters): number => {
//   const { margin, containerWidth, cols } = positionParams;
//   const tmpContainerWidth = containerWidth || 0;
//   return (tmpContainerWidth - (margin[0] * (cols + 1))) / cols;
// };

// import {ICalcXy} from "@/core/interfaces/grid-item.interfaces";

/**
 * Calculation the GridItem's Width and height.
 * @param   {Number}    gridUnits
 * @param   {Number}    colOrRowSize
 * @param   {Number}    marginPx
 * @return  {Number}    The result of the calculation. If gridUnits is not infinite, it returns the gridUnits.
 *                      Otherwise, the result is being calculated.
 */
export const calcGridItemWH = (gridUnits: number, colOrRowSize: number, marginPx: number): number => {
    if(gridUnits <= 0) {
        throw new Error(`Invalid gridUnits passed`);
    }

    if(colOrRowSize <= 0) {
        throw new Error(`Invalid colOrRowSize passed`);
    }

    if(marginPx < 1) {
        throw new Error(`Invalid marginPx passed`);
    }

    if (!Number.isFinite(gridUnits)) {
        return gridUnits;
    }
    return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
};

/**
 * Calculate a GridItem width and height.
 *
 * @param  {IPositionParameters} positionParams  Parameters of grid needed for coordinates calculations.
 * @param  {Number}                      w       W coordinate in grid units.
 * @param  {Number}                      h       H coordinate in grid units.
 * @return {IGridItemWidthHeight}                width and height (in pixels).
 */
// export const calcItemSize = (positionParams: IPositionParameters, w: number, h: number): IGridItemWidthHeight => {
//   const tmpRowHeight = positionParams.rowHeight || 0;
//   return {
//     // 0 * Infinity === NaN, which causes problems with resize constraints;
//     // Fix this if it occurs.
//     // Note we do it here rather than later because Math.round(Infinity) causes dept
//
//     height: h === Infinity ? h : Math.round(tmpRowHeight * h + Math.max(0, h - 1) * positionParams.margin[1]),
//     width: w === Infinity ? w : Math.round(calcGridColWidth(positionParams) * w + Math.max(0, w - 1) * positionParams.margin[0]),
//   };
// };

/**
 * Calculating the Column width.
 * @param   {Number}    containerWidth      The width of the GridLayout container
 * @param   {Number}    marginLeftRight     Left snd Right margin value.
 * @param   {Number}    cols                Number of columns defined in the layout.
 * @return  {Number}                        The new column width.
 */
export const calcColWidth = (containerWidth: number, marginLeftRight: number, cols: number): number => {
    if(containerWidth < 1) {
        throw new Error(`Invalid containerWidth passed`);
    }

    if(marginLeftRight < 1) {
        throw new Error(`Invalid marginLeftRight passed`);
    }

    if(cols < 1) {
        throw new Error(`Invalid cols passed` );
    }

    return (containerWidth - marginLeftRight * (cols + 1)) / cols;
};

/**
 * Translate x and y coordinates from pixels to grid units.
 * @param   {Number}    top             Top position (relative to parent) in pixels.
 * @param   {Number}    left            Left position (relative to parent) in pixels.
 * @param   {[]}        margin          Left Right margin.
 * @param   {Number}    rowHeight       Height of each row in the layout.
 * @param   {Number}    cols            Number of GridItem columns specified in the GridLayout (colNum property in the GridLayout component).
 * @param   {Number}    innerH          GridItem height in GridLayout units.
 * @param   {Number}    innerW          GridItem width in GridLayout units.
 * @param   {Number}    maxRows         Number of rows (maxRows property in GridLayout) in the GridLayout.
 * @param   {Number}    containerWidth  Width of the GridLayout container.
 * @return  {ICalcXy}                   x and y in grid units.
 */
export const calcXY = (
    top: number,
    left: number,
    margin: [x: number, y: number],
    rowHeight: number,
    cols: number,
    innerH: number,
    innerW: number,
    maxRows: number,
    containerWidth: number
): ICalcXy => {
    const colWidth = calcColWidth(containerWidth, margin[0], cols);
    let x = Math.round((left - margin[0]) / (colWidth + margin[0]));
    let y = Math.round((top - margin[1]) / (rowHeight + margin[1]));

    // Capping
    x = Math.max(Math.min(x, cols - innerW), 0);
    y = Math.max(Math.min(y, maxRows - innerH), 0);

    return {
        x,
        y,
    };
};
