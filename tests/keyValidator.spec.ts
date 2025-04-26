import { describe, expect, it } from 'vitest';
import { validateLayoutItemRequiredKeys } from '../src/core/validators/keys-validator';

describe('validateLayoutItemRequiredKeys', () => {
  it('Should return true when all required keys are passed, and the values are valid', () => {
    const keys = {
      i: 5,
      x: 1,
      y: 1,
      h: 1,
      w: 1,
    };
    const result = validateLayoutItemRequiredKeys(keys);
    return expect(result).toBe(true);
  });

  it('Should return false when not all required keys are passed, and the values are valid', () => {
    const keys = {
      i: 5,
      x: 1,
      h: 1,
      w: 1,
    };
    const result = validateLayoutItemRequiredKeys(keys);
    return expect(result).toBe(false);
  });

  it('Should return false if i is not valid', () => {
    const keys = {
      i: true,
      x: 1,
      y: 1,
      h: 1,
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if x is less then min value', () => {
    const keys = {
      i: 1,
      x: -1,
      y: 1,
      h: 1,
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if x is not a number', () => {
    const keys = {
      i: 1,
      x: '',
      y: 1,
      h: 1,
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if y is less then min value', () => {
    const keys = {
      i: 1,
      x: 1,
      y: -1,
      h: 1,
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if y is not a number', () => {
    const keys = {
      i: 1,
      x: 1,
      y: '',
      h: 1,
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if h is less then min value', () => {
    const keys = {
      i: 1,
      x: 1,
      y: 1,
      h: 0,
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if h is not a number', () => {
    const keys = {
      i: 1,
      x: 1,
      y: 1,
      h: '',
      w: 1,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if w is less then min value', () => {
    const keys = {
      i: 1,
      x: 1,
      y: 1,
      h: 1,
      w: 0,
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });

  it('Should return false if w is not a number', () => {
    const keys = {
      i: 1,
      x: 1,
      y: 1,
      h: 1,
      w: '',
    };
    expect(validateLayoutItemRequiredKeys(keys)).toBe(false);
  });
});
