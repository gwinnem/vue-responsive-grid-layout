// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import {getLayoutItem} from "../src/core/helpers/utils";
import {ErrorMsg} from "../src/core/common/enums/ErrorMessages";

describe(`getLayoutItem`, () => {
  it(`Should throw an exception when layout is empty`, () => {
    expect(() =>  getLayoutItem()).toThrowError(ErrorMsg.INVALID_LAYOUT);
  });
});
