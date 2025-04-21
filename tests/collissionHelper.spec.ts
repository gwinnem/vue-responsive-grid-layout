// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { collides, getAllCollisions, getFirstCollision } from "@/core/gridlayout/helpers/collissionHelper";
import { ILayoutItem } from "@/components/Grid/layout-definition";
import { ErrorMsg } from "../src/core/common/enums/ErrorMessages";

const l1: ILayoutItem = {
  i: 0,
  h: 1,
  w: 1,
  x: 0,
  y: 0,
}

const l2: ILayoutItem = {
  i: 1,
  h: 1,
  w: 1,
  x: 0,
  y: 0,
}

const l3: ILayoutItem = {
  i: 1,
  h: 1,
  w: 1,
  x: 1,
  y: 0,
}

const l4: ILayoutItem = {
  i: 1,
  h: 1,
  w: 1,
  x: 1,
  y: 2,
}

const l5: ILayoutItem = {
  i: 1,
  h: 2,
  w: 2,
  x: 1,
  y: 2,
}

describe(`collides`, () => {

  it(`Should throw an error when passed empty values`, () => {
    expect(() => collides()).toThrowError(ErrorMsg.INVALID_PARAMS);
  });


  it(`Should throw an error when first layout item is undefined`, () => {
    expect(() => collides(undefined, l2)).toThrowError(ErrorMsg.INVALID_PARAMS);
  });

  it(`Should throw an error when second layout item is undefined`, () => {
    expect(() => collides(l1, undefined)).toThrowError(ErrorMsg.INVALID_PARAMS);
  });

  it(`Should throw an error when first layout item is null`, () => {
    expect(() => collides(null, l2)).toThrowError(ErrorMsg.INVALID_PARAMS);
  });

  it(`Should throw an error when second layout item is null`, () => {
    expect(() => collides(l1, null)).toThrowError(ErrorMsg.INVALID_PARAMS);
  });

  it(`Should return false when the same GridItem is passed as parameters`, () => {
    const result = collides(l1, l1);
    expect(result).toBe(false);
  });

  if('Should return false when l1 is left of l2', () => {
    const result = collides(l1, l3);
    expect(result).toBe(false);
  });

  it(`Should return false when l1 is right of l2`, () => {
    const result = collides(l3, l1);
    expect(result).toBe(false);
  });

  it(`Should return false when l1 is above l2`, () => {
    // l1.y + l1.h <= l2.y
    const la: ILayoutItem = {
      i: 1,
      h: 1,
      w: 1,
      x: 1,
      y: 0,
    }

    const lb: ILayoutItem = {
      i: 1,
      h: 1,
      w: 1,
      x: 0,
      y: 3,
    }
    const result = collides(lb, la);
    expect(result).toBe(false);
  });

  it(`Should return false when l1 is below l2`, () => {
    const result = collides(l2, l4);
    expect(result).toBe(false);
  });

  it(`Should return true when items overlap`, () => {
    const result = collides(l5, l4);
    expect(result).toBe(true);
  });
});

describe(`getFirstCollision`, () => {
  it(`Should return undefined when all params are undefined`, () => {
    const result = getFirstCollision();
    expect(result).toBe(undefined);
  });

  it(`Should return l1 since this collides with l2`, () => {
    const result = getFirstCollision([
      l1,
      l2,
      l3
    ], l2);

    expect(result).toMatchObject(l1);
  });

  it(`Should return undefined when no collisions are found`, () => {
    const result = getFirstCollision(l1, l3);
    expect(result).toBe(undefined);
  });
});

describe(`getAllCollisions`, () => {
  it(`Should throw an error if params are undefined`, () => {
    expect(() => getAllCollisions()).toThrowError('Invalid parameter values');
  });

  it(`Should throw an error if layout is an empty array`, () => {
    expect(() => getAllCollisions([], l1)).toThrowError('Invalid parameter values');
  });

  it(`Should throw an error if layoutItem is undefined`, () => {
    expect(() => getAllCollisions([l1],)).toThrowError('Invalid parameter values');
  });

  it(`Should return length = 0 when no collisions are found`, () => {
    const result = getAllCollisions([l1], l3);
    expect(result.length).toBe(0);
  });

  it(`Should return a item when collisions are found`, () => {
    const result = getAllCollisions([l1, l3], l2);
    expect(result.length).toBe(1);
  });
});
