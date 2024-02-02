// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {collides, getAllCollisions, getFirstCollision} from "@/core/gridlayout/helpers/collissionHelper";
import {ILayoutItem} from "@/components/Grid/layout-definition";
import {ErrorMsg} from "../src/core/common/enums/ErrorMessages";

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

describe(`collides`, () => {

  it(`Should throw an error when passed empty values`, () => {
    expect(() => collides()).toThrowError('Invalid parameter values');
  });

  it(`Should return false when the same GridItem is passed as parameters`, () => {
    const result = collides(l1, l1);
    expect(result).toBe(false);
  });

  it(`Should return false when the GridItems are not colliding`, () => {
    const result = collides(l1, l3);
    expect(result).toBe(false);
  });

  it(`Should return true when there is a collision between the GridItems`, () => {
    const result = collides(l1, l2);
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
