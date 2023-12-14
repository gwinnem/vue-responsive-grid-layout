// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { testLayoutOne } from '/tests/testLayout'
import {getFirstCollision, getStatics} from "../src/core/helpers/utils";
import {sortBreakpoints} from "../src/core/helpers/responsiveUtils";

describe(`getStatics`, () => {
  it(`Should return 3 GridItems from the testLayout.`, () => {
    const result = getStatics(testLayoutOne).length === 3;
    expect(result).toBe(true);
  });

  it(`Should throw error when testLayout is [].`, () => {
    expect(() => getStatics([])).toThrowError('Empty layout not allowed');
  });
});
