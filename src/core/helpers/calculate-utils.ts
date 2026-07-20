import { ICalcXy } from '@/core/griditem/interfaces/grid-item.interfaces';
import { calcColWidth } from '@/core/griditem/helpers/grid-item-calculate-helper';
import { EErrorMessage } from '@/core/common/enums/ErrorMessages';

/**
 * Validates the numeric parameters `calcXY` depends on before doing any
 * math with them — see `calcXY` below.
 */
const validateXYParams = (
  rowHeight: number,
  margin: [x: number, y: number],
  cols: number,
  innerH: number,
  innerW: number,
  maxRows: number,
  containerWidth: number,
): void => {
  if(rowHeight < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_ROW_HEIGHT);
  }

  if(margin[0] < 1 || margin[1] < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_MARGIN);
  }

  if(cols < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_COLS);
  }

  if(innerH < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_INNER_H);
  }

  if(innerW < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_INNER_W);
  }

  if(maxRows < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_MAX_ROWS);
  }

  if(containerWidth < 1) {
    throw new Error(EErrorMessage.INVALID_PARAM_CONTAINER_WIDTH);
  }
};
/**
 * Translate x and y coordinates from pixels to grid units, with full
 * parameter validation via {@link validateXYParams}.
 *
 * **Not currently used anywhere in `src/`.** `useGridItemDrag.ts`'s own
 * `calcXY` duplicates this logic inline (without the validation step)
 * rather than calling this one — the two have quietly diverged into
 * separate implementations of the same calculation. This file is
 * exercised only by its own test (`tests/calculate-utils.spec.ts`); nothing
 * in the actual component tree imports it. Worth a deliberate decision —
 * either wire `useGridItemDrag` to call this validated version, or remove
 * this file — rather than leaving two implementations to maintain in sync
 * by accident.
 *
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
  containerWidth: number,
): ICalcXy => {
  validateXYParams(rowHeight, margin, cols, innerH, innerW, maxRows, containerWidth);

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
