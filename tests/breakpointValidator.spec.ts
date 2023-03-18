// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { breakpointsValidator } from '@/core/validators/breakpoint-validator';

const breakpointsValidatorPayload = {
  invalidBreakpointsKeys1: {
    lg: 0, md: 0, sm: 0, xs: 0, xx: 0,
  },
  invalidBreakpointsKeys2: {
    lg: 0, md: 0, sm: 0, xs: 0,
  },
  invalidBreakpointsTypes: {
    lg: `0`, md: 0, sm: 0, xs: 0, xx: 0,
  },
  validBreakpoints: {
    // eslint-disable-next-line sort-keys
    xxl: 10, xl: 10, lg: 10, md: 10, sm: 10, xs: 10, xxs: 0,
  },
};

describe(`breakpoint-validator`, () => {
  it(`When breakpoints are valid`, () => {
    const result = breakpointsValidator(breakpointsValidatorPayload.validBreakpoints);

    expect(result).toBe(true);
  });

  it(`When breakpoints have invalid (keys) 1`, () => {
    const result = breakpointsValidator(breakpointsValidatorPayload.invalidBreakpointsKeys1);

    expect(result).toBe(false);
  });

  it(`When breakpoints have invalid (keys) 2`, () => {
    const result = breakpointsValidator(breakpointsValidatorPayload.invalidBreakpointsKeys2);

    expect(result).toBe(false);
  });

  it(`When breakpoints are invalid (types)`, () => {
    const result = breakpointsValidator(breakpointsValidatorPayload.invalidBreakpointsTypes);

    expect(result).toBe(false);
  });
});
