import { describe, expect, it } from 'vitest';
import { moveElement, moveToCorrectPlace } from "../src/core/gridlayout/helpers/moveHelper";
import { ErrorMsg } from "../src/core/common/enums/ErrorMessages";
import { TLayout } from "../src/components";

const testDataOne: TLayout = [
  {
    i: 1,
    h: 2,
    w: 1,
    x: 0,
    y: 0,
  },
  {
    i: 2,
    h: 2,
    w: 1,
    x: 1,
    y: 0,
  },
  {
    i: 3,
    h: 2,
    w: 1,
    x: 2,
    y: 0,
    isStatic: true,
  },
  {
    i: 4,
    h: 2,
    w: 1,
    x: 3,
    y: 0,
  },
  {
    i: 5,
    h: 2,
    w: 1,
    x: 4,
    y: 0,
  },
  {
    i: 6,
    h: 2,
    w: 1,
    x: 5,
    y: 0,
  }
];

describe(`moveToCorrectPlace`, () => {
  it(`Should throw an error if parameter layoutItem is undefined`, () => {
    expect(() => moveToCorrectPlace(null, {cols: 3}, [testDataOne[0]]))
      .toThrow(ErrorMsg.INVALID_LAYOUT_ITEM);
  });

  it(`Should throw an error if parameter bounds is less than 1`, () => {
    expect(() => moveToCorrectPlace(testDataOne[0], { cols: 0 }, [testDataOne[0]]))
      .toThrow(ErrorMsg.INVALID_BOUNDS);
  });
});


describe(`moveElement`, () => {

  it(`Should throw an error if parameter x is less than 0`, () => {
    expect(() => moveElement(testDataOne, testDataOne[0], -1, 0, true, true, true))
      .toThrowError(ErrorMsg.INVALID_PARAMS);
  });

  it(`Should throw an error if parameter y is less than 0`, () => {
    expect(() => moveElement(testDataOne, testDataOne[0], 1, -1, true, true, true))
      .toThrowError(ErrorMsg.INVALID_PARAMS);
  });

  it('Should return the passed in layout when item isStatic', () => {
    const result = moveElement(testDataOne, {
      isStatic: true,
      i: 1,
      x: 1,
      y: 1,
      w: 1,
      h: 1
    }, 0, 0, false, false, false);

    expect(testDataOne).toMatchObject(result);
  });

  it('Should return', () => {
    const result = moveElement(testDataOne, {
      isStatic: false,
      i: 1,
      x: 0,
      y: 1,
      w: 1,
      h: 1
    }, 0, 0, false, true, false);

    expect(testDataOne).toMatchObject(result);
  });
});
