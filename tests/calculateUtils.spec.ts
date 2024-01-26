// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {calcXY} from "../src/core/helpers/calculateUtils";
import {ErrorMsg} from "../src/core/common/enums/ErrorMessages";

describe(`calcXY`, () => {
  it(`Should throw error when invalid rowHeight is passed`, () => {
    expect(() => calcXY(10, 589, [10, 10], 0, 6, 10, 10, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_ROW_HEIGHT);
  });

  it(`Should throw error when invalid margin[0] is passed`, () => {
    expect(() => calcXY(10, 589, [0, 10], 60, 6, 10, 10, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_MARGIN);
  });

  it(`Should throw error when invalid margin[1] is passed`, () => {
    expect(() => calcXY(10, 589, [10, 0], 60, 6, 10, 10, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_MARGIN);
  });

  it(`Should throw error when invalid margin is passed`, () => {
    expect(() => calcXY(10, 589, [0, 0], 60, 6, 10, 10, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_MARGIN);
  });

  it(`Should throw error when invalid innerH is passed`, () => {
    expect(() => calcXY(10, 589, [10, 10], 10, 10, 0, 10, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_INNER_H);
  });

  it(`Should throw error when invalid innerW is passed`, () => {
    expect(() => calcXY(10, 589, [10, 10], 10, 10, 10, 0, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_INNER_W);
  });

  it(`Should throw error when invalid cols is passed`, () => {
    expect(() => calcXY(10, 589, [10, 10], 10, 0, 10, 10, 1, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_COLS);
  });

  it(`Should throw error when invalid maxRows is passed`, () => {
    expect(() => calcXY(10, 589, [10, 10], 10, 10, 10, 10, 0, 1))
      .toThrowError(ErrorMsg.INVALID_PARAM_MAX_ROWS);
  });

  it(`Should throw error when invalid containerWidth is passed`, () => {
    expect(() => calcXY(10, 589, [10, 10], 10, 10, 10, 10, 1, 0))
      .toThrowError(ErrorMsg.INVALID_PARAM_CONTAINER_WIDTH);
  });
});
