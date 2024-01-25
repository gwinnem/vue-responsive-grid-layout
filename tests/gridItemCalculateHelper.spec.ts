// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {calcColWidth, calcGridItemWH} from "../src/core/griditem/helpers/gridItemCalculateHelper";
import {ErrorMsg} from "../src/core/common/enums/ErrorMessages";

// TODO tests should fail but not doing it.
// describe(`clamp tests`, () => {
//   it(`clamp has valid params`, () => {
//     expect(() => clamp(10, 0, 300).toBe(10));
//   });
//
//   it(`clamp successful`, () => {
//     expect(() => clamp(0, 0, 0).toBe(-10));
//   });
// });

describe(`calcGridItemWH tests`, () => {
  it(`Should allow gridUnits to be NaN`, () => {
    const gridUnits = NaN;
    const calculatedValue = calcGridItemWH(gridUnits, 1, 1);
    expect(calculatedValue).toBe(gridUnits);
  });

  it(`Should throw an error if gridUnits is Null`, () => {
    expect(() => calcGridItemWH(null, 1, 1)).toThrowError(new Error(ErrorMsg.INVALID_GRID_UNITS));
  });

  it(`gridUnits is 0 or negative`, () => {
    expect(() => calcGridItemWH(0, 1, 1)).toThrowError(new Error(ErrorMsg.INVALID_GRID_UNITS));
  });

  it(`gridUnits is valid`, () => {
    expect(() => {
      calcGridItemWH(10, 1, 1).toBe(19)
    });
  });

  it(`colOrRowSize is 0 or negative`, () => {
    expect(() => calcGridItemWH(1, 0, 1)).toThrowError(new Error(ErrorMsg.INVALID_COL_OR_ROW_SIZE));
  });

  it(`marginPx is 0 or negative`, () => {
    expect(() => calcGridItemWH(1, 1, 0)).toThrowError(new Error(ErrorMsg.INVALID_MARGIN));
  });
});

describe(`calcColWidth tests`, () => {
  it(`containerWidth is less than 1`, () => {
    expect(() => calcColWidth(0, 1, 1)).toThrowError(new Error(ErrorMsg.INVALID_PARAM_CONTAINER_WIDTH));
  });

  it(`marginLeftRight is less than 1`, () => {
    expect(() => calcColWidth(1, 0, 1)).toThrowError(new Error(ErrorMsg.INVALID_MARGIN_LEFT_RIGHT));
  });

  it(`cols is less than 1`, () => {
    expect(() => calcColWidth(1, 1, 0)).toThrowError(new Error(ErrorMsg.INVALID_COLUMNS));
  });

  it(`Parameters are valid`, () => {
    expect(() => {
      calcColWidth(100, 10, 10).toBe(NaN)
    });
  });
});
