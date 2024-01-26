// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { marginValidator } from '@/core/validators/margin-validator';

export const marginValidatorPayload = {
  invalidMargin1: [0, 0, 0],
  invalidMargin2: [`0`, 0],
  invalidMargin3: [0, 0],
  validMargin: [1, 1],
};

describe(`marginValidator`, () => {

  it(`When margin are valid`, () => {
    expect(marginValidator(marginValidatorPayload.validMargin)).toBe(true);
  });

  it(`When margin are invalid 1`, () => {
    expect(marginValidator(marginValidatorPayload.invalidMargin1)).toBe(false);
  });

  it(`When margin are invalid 2`, () => {
    expect(marginValidator(marginValidatorPayload.invalidMargin2)).toBe(false);
  });

  it(`When margin are invalid 3`, () => {
    expect(marginValidator(marginValidatorPayload.invalidMargin3)).toBe(false);
  });
});
