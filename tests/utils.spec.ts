// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { testLayoutOne } from '/tests/testLayout'
import {getAllStaticGridItems} from "../src/core/common/helpers/gridIemTypeHelpers";


describe(`getStatics`, () => {
  it(`Should return 3 GridItems from the testLayout.`, () => {
    const result = getAllStaticGridItems(testLayoutOne).length === 3;
    expect(result).toBe(true);
  });

  it(`Should throw error when testLayout is [].`, () => {
    expect(() => getAllStaticGridItems([])).toThrowError('Empty layout not allowed');
  });
});
