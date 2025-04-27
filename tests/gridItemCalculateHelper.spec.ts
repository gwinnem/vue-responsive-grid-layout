// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { calcColWidth, calcGridItemWH, clamp } from '../src/core/griditem/helpers/gridItemCalculateHelper';
import { ErrorMsg } from '../src/core/common/enums/ErrorMessages';

// TODO tests should fail but not doing it.
describe(`clamp`, () => {
  it(`Should return correct value`, () => {
    expect(() => clamp(10, 0, 300).toBe(10));
  });

  it(`Should return correct value 1`, () => {
    expect(() => clamp(10, 11, 300).toBe(11));
  });

  it(`Should return correct value 2`, () => {
    expect(() => clamp(1000, 11, 300).toBe(300));
  });

});

describe(`calcGridItemWH tests`, () => {
  it(`Should allow gridUnits to be NaN`, () => {
    const gridUnits = NaN;
    const calculatedValue = calcGridItemWH(gridUnits, 1, 1);
    expect(calculatedValue).toBe(gridUnits);
  });

  it(`Should throw an error if gridUnits is Null`, () => {
    expect(() => calcGridItemWH(null, 1, 1)).toThrowError(new Error(ErrorMsg.INVALID_GRID_UNITS));
  });

  it(`Should throw an error if gridUnits is 0 or negative`, () => {
    expect(() => calcGridItemWH(0, 1, 1)).toThrowError(new Error(ErrorMsg.INVALID_GRID_UNITS));
  });

  it(`Should return correct value`, () => {
    expect(() => {
      calcGridItemWH(10, 1, 1).toBe(19);
    });
  });

  it(`Should throw an error when colOrRowSize is 0 or negative`, () => {
    expect(() => calcGridItemWH(1, 0, 1)).toThrowError(new Error(ErrorMsg.INVALID_COL_OR_ROW_SIZE));
  });

  it(`Should throw an error when marginPx is negative`, () => {
    expect(() => calcGridItemWH(1, 1, -1)).toThrowError(new Error(ErrorMsg.INVALID_MARGIN));
  });
});

describe(`calcColWidth`, () => {
  it(`Should throw an error when containerWidth is less than 1`, () => {
    expect(() => calcColWidth(0, 1, 1)).toThrowError(new Error(ErrorMsg.INVALID_PARAM_CONTAINER_WIDTH));
  });

  it(`Should throw an error when marginLeftRight is less than 0`, () => {
    expect(() => calcColWidth(1, -1, 1)).toThrowError(new Error(ErrorMsg.INVALID_MARGIN_LEFT_RIGHT));
  });

  it(`Should throw an error when cols is less than 1`, () => {
    expect(() => calcColWidth(1, 0, 0)).toThrowError(new Error(ErrorMsg.INVALID_COLUMNS));
  });

  it(`Should return correct value when Parameters are valid`, () => {
    console.log(calcColWidth(100, 10, 10));
    expect(() => {
      calcColWidth(100, 10, 10).toBe(-1);
    });
  });
});
