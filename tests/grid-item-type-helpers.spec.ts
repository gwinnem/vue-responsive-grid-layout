// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {TLayout} from "../src/components";
import {getAllNonStaticGridItems, getAllStaticGridItems} from "../src/core/common/helpers/grid-item-type-helpers";

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
  it(`Should return an empty array (not throw) when an empty layout is passed`, () => {
    // Behavior change (see docs/REFACTORING.md #33): an empty layout is a
    // normal state (a grid with no items yet — e.g. a fresh cross-grid
    // drop target), not an error.
    expect(getAllStaticGridItems([])).toStrictEqual([]);
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
  it(`Should return an empty array (not throw) when an empty layout is passed`, () => {
    expect(getAllNonStaticGridItems([])).toStrictEqual([]);
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
