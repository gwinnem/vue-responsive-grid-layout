// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { calcColWidth, calcGridItemWH, clamp } from '../src/core/griditem/helpers/grid-item-calculate-helper';
import { EErrorMessage } from '../src/core/common/enums/ErrorMessages';

describe(`clamp`, () => {
  it(`Should return the number unchanged when within bounds`, () => {
    expect(clamp(10, 0, 300)).toBe(10);
  });

  it(`Should clamp up to the lower bound when below it`, () => {
    expect(clamp(10, 11, 300)).toBe(11);
  });

  it(`Should clamp down to the upper bound when above it`, () => {
    expect(clamp(1000, 11, 300)).toBe(300);
  });
});

describe(`calcGridItemWH tests`, () => {
  it(`Should allow gridUnits to be NaN`, () => {
    const gridUnits = NaN;
    const calculatedValue = calcGridItemWH(gridUnits, 1, 1);
    expect(calculatedValue).toBe(gridUnits);
  });

  it(`Should return gridUnits unchanged when it is Infinity`, () => {
    expect(calcGridItemWH(Infinity, 1, 1)).toBe(Infinity);
  });

  it(`Should throw an error if gridUnits is Null`, () => {
    expect(() => calcGridItemWH(null, 1, 1)).toThrowError(new Error(EErrorMessage.INVALID_GRID_UNITS));
  });

  it(`Should throw an error if gridUnits is 0 or negative`, () => {
    expect(() => calcGridItemWH(0, 1, 1)).toThrowError(new Error(EErrorMessage.INVALID_GRID_UNITS));
  });

  it(`Should return the correct pixel size for finite grid units`, () => {
    // width = colOrRowSize * gridUnits + max(0, gridUnits - 1) * marginPx
    //       = 30 * 3 + max(0, 2) * 10 = 90 + 20 = 110
    expect(calcGridItemWH(3, 30, 10)).toBe(110);
  });

  it(`Should not add margin when gridUnits is 1`, () => {
    expect(calcGridItemWH(1, 30, 10)).toBe(30);
  });

  it(`Should throw an error when colOrRowSize is 0 or negative`, () => {
    expect(() => calcGridItemWH(1, 0, 1)).toThrowError(new Error(EErrorMessage.INVALID_COL_OR_ROW_SIZE));
  });

  it(`Should throw an error when marginPx is negative`, () => {
    expect(() => calcGridItemWH(1, 1, -1)).toThrowError(new Error(EErrorMessage.INVALID_MARGIN));
  });
});

describe(`calcColWidth`, () => {
  it(`Should throw an error when containerWidth is less than 1`, () => {
    expect(() => calcColWidth(0, 1, 1)).toThrowError(new Error(EErrorMessage.INVALID_PARAM_CONTAINER_WIDTH));
  });

  it(`Should throw an error when marginLeftRight is less than 0`, () => {
    expect(() => calcColWidth(1, -1, 1)).toThrowError(new Error(EErrorMessage.INVALID_MARGIN_LEFT_RIGHT));
  });

  it(`Should throw an error when cols is less than 1`, () => {
    expect(() => calcColWidth(1, 0, 0)).toThrowError(new Error(EErrorMessage.INVALID_COLUMNS));
  });

  it(`Should return the correct column width when parameters are valid`, () => {
    // (containerWidth - marginLeftRight * (cols + 1)) / cols
    // (100 - 10 * 11) / 10 = (100 - 110) / 10 = -1
    expect(calcColWidth(100, 10, 10)).toBe(-1);
  });

  it(`Should return a positive column width for a realistic layout`, () => {
    // (1200 - 10 * 13) / 12 = (1200 - 130) / 12 = 89.1666...
    expect(calcColWidth(1200, 10, 12)).toBeCloseTo(89.1666, 3);
  });
});
