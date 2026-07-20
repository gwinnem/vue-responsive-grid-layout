/* eslint-disable */
import { describe, expect, it } from 'vitest';
import { layoutValidator, layoutValidatorPayload } from '../src/core/validators/layout-validator';

describe(`layoutValidator`, () => {
  const {
    invalidOptionalLayout,
    invalidRequiredLayout,
    invalidRequiredLayoutTwo,
    validRequiredLayout,
    validOptionalLayout,
  } = layoutValidatorPayload;

  it(`Should return true (not throw) for an empty layout`, () => {
    // Behavior change (see docs/REFACTORING.md #33): an empty layout has
    // nothing in it to violate the required-keys/type checks below, so
    // it's trivially valid — a grid with no items yet (e.g. a fresh
    // cross-grid drop target) is a normal state, not an error.
    expect(layoutValidator([])).toBe(true);
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

  it(`Should return false When layout with required keys is invalid`, () => {
    const data = Array.from({ length: 5 }, () => invalidRequiredLayoutTwo);
    const result = layoutValidator(data);

    expect(result).toBe(false);
  });

  it(`When layout with required and optional keys is valid`, () => {
    const result = layoutValidator([validRequiredLayout, validOptionalLayout]);

    expect(result).toBe(true);
  });

  it(`When layout with required keys is valid and  optional keys is invalid`, () => {
    const result = layoutValidator([validRequiredLayout, invalidOptionalLayout]);

    expect(result).toBe(true);
  });

  it(`Should accept a layout item with an arbitrary data payload (object)`, () => {
    // Regression coverage for making ILayoutItem generic over `data`
    // (ROADMAP.md #5) — data is a consumer-defined payload of any type,
    // not one of the fixed-type optional fields this validator actually
    // checks, so it should never be rejected regardless of its shape.
    const result = layoutValidator([{ ...validRequiredLayout, data: { chartId: 'revenue', refreshMs: 5000 } }]);

    expect(result).toBe(true);
  });

  it(`Should accept a layout item with a data payload of any other type (string, number, array)`, () => {
    expect(layoutValidator([{ ...validRequiredLayout, data: `a plain string` }])).toBe(true);
    expect(layoutValidator([{ ...validRequiredLayout, data: 42 }])).toBe(true);
    expect(layoutValidator([{ ...validRequiredLayout, data: [1, 2, 3] }])).toBe(true);
  });

  it(`Should accept a layout item with no data field at all (it's optional)`, () => {
    expect(layoutValidator([validRequiredLayout])).toBe(true);
  });
});
