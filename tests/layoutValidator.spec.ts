/* eslint-disable */
import { describe, expect, it } from 'vitest';
import { layoutValidator, layoutValidatorPayload } from '../src/core/validators/layout-validator';
import { ErrorMsg } from '../src/core/common/enums/ErrorMessages';

describe(`layoutValidator`, () => {
  const { invalidOptionalLayout, invalidRequiredLayout, validRequiredLayout, validOptionalLayout } =
    layoutValidatorPayload;

  it(`Should throw error when layout is undefined`, () => {
    expect(() => layoutValidator([])).toThrow(ErrorMsg.INVALID_LAYOUT);
  });

  it(`Should return true When layout with required keys is valid`, () => {
    const data = Array.from({ length: 5 }, () => validRequiredLayout);
    const result = layoutValidator(data);

    expect(result).toBe(true);
  });

  // TODO Fix this test it should be working
  // it(`Should return false When layout with required keys is invalid`, () => {
  //   const data = Array.from({ length: 5 }, () => invalidRequiredLayout);
  //   const result = layoutValidator(data);

  //   expect(result).toBe(false);
  // });

  it(`When layout with required and optional keys is valid`, () => {
    const result = layoutValidator([validRequiredLayout, validOptionalLayout]);

    expect(result).toBe(true);
  });

  it(`When layout with required keys is valid and  optional keys is invalid`, () => {
    const result = layoutValidator([validRequiredLayout, invalidOptionalLayout]);

    expect(result).toBe(true);
  });
});
