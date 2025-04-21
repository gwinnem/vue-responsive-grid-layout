import {ErrorMsg} from "@/core/common/enums/ErrorMessages";

// Similar to _.clamp from lodash.
export const clamp = (num: number, lowerBound: number, upperBound: number): number => {
  const res = Math.max(Math.min(num, upperBound), lowerBound);
  return res;
};

/**
 * Calculation the GridItem's Width and height.
 * @param   {Number}    gridUnits
 * @param   {Number}    colOrRowSize
 * @param   {Number}    marginPx
 * @return  {Number}    The result of the calculation. If gridUnits is not infinite, it returns the gridUnits.
 *                      Otherwise, the result is being calculated.
 */
export const calcGridItemWH = (gridUnits: number, colOrRowSize: number, marginPx: number): number => {
  if (gridUnits <= 0) {
    throw new Error(ErrorMsg.INVALID_GRID_UNITS);
  }

  if (colOrRowSize <= 0) {
    throw new Error(ErrorMsg.INVALID_COL_OR_ROW_SIZE);
  }

  if (marginPx < 0) {
    throw new Error(ErrorMsg.INVALID_MARGIN);
  }

  if (!Number.isFinite(gridUnits)) {
    return gridUnits;
  }
  return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
};

/**
 * Calculating the Column width.
 * @param   {Number}    containerWidth      The width of the GridLayout container
 * @param   {Number}    marginLeftRight     Left snd Right margin value.
 * @param   {Number}    cols                Number of columns defined in the layout.
 * @return  {Number}                        The new column width.
 */
export const calcColWidth = (containerWidth: number, marginLeftRight: number, cols: number): number => {
  if (containerWidth < 1) {
    throw new Error(ErrorMsg.INVALID_PARAM_CONTAINER_WIDTH);
  }

  if (marginLeftRight < 0) {
    throw new Error(ErrorMsg.INVALID_MARGIN_LEFT_RIGHT);
  }

  if (cols < 1) {
    throw new Error(ErrorMsg.INVALID_COLUMNS);
  }

  // if(marginLeftRight === 0){
  //   return (containerWidth * (cols + 1)) / cols;
  // }
  return (containerWidth - marginLeftRight * (cols + 1)) / cols;
};
