// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {TLayout} from "../src/components";
import {getAllNonStaticGridItems, getAllStaticGridItems} from "../src/core/common/helpers/gridIemTypeHelpers";
import {ErrorMsg} from "../src/core/common/enums/ErrorMessages";

const testLayout: TLayout = [
  {
    i: 0,
    h: 1,
    w: 1,
    x: 0,
    y: 0,
    isStatic: true,
  },
  {
    i: 0,
    h: 1,
    w: 1,
    x: 0,
    y: 0,
    isStatic: false,
  }
];

const testLayoutTwo: TLayout = [
  {
    i: 0,
    h: 1,
    w: 1,
    x: 0,
    y: 0,
    isStatic: false,
  },
  {
    i: 0,
    h: 1,
    w: 1,
    x: 0,
    y: 0,
    isStatic: false,
  },
];

const testLayoutThree: TLayout = [
  {
    i: 0,
    h: 1,
    w: 1,
    x: 0,
    y: 0,
    isStatic: true,
  }
];

describe(`getAllStaticGridItems`, () => {
  it(`It should throw error when empty layout is passed`, () => {
    expect(() => getAllStaticGridItems([])).toThrowError(ErrorMsg.INVALID_EMPTY_LAYOUT);
  });

  it(`Should return one item from testLayout`, () => {
    const result = getAllStaticGridItems(testLayout);
    expect(result.length).toBe(1);
  });

  it(`Should return empty array when no statics are found`, () => {
    const result = getAllStaticGridItems(testLayoutTwo);
    expect(result.length).toBe(0);
  });
});

describe(`getAllNonStaticGridItems`, () => {
  it(`It should throw error when empty layout is passed`, () => {
    expect(() => getAllNonStaticGridItems([])).toThrowError(ErrorMsg.INVALID_EMPTY_LAYOUT);
  });

  it(`Should return one item from testLayout`, () => {
    const result = getAllNonStaticGridItems(testLayout);
    expect(result.length).toBe(1);
  });

  it(`Should return empty array when no statics are found`, () => {
    const result = getAllNonStaticGridItems(testLayoutThree);
    expect(result.length).toBe(0);
  });
});
