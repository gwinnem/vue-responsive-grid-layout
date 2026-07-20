// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addWindowEventListener, removeWindowEventListener } from '../src/core/helpers/DOM';

describe(`addWindowEventListener`, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(`Should register the callback on window and return true when window exists`, () => {
    const addSpy = vi.spyOn(window, `addEventListener`);
    const callback = vi.fn();

    const result = addWindowEventListener(`resize`, callback);

    expect(addSpy).toHaveBeenCalledWith(`resize`, callback);
    expect(callback).not.toHaveBeenCalled();
    expect(result).toBe(true);

    addSpy.mockRestore();
  });

  it(`Should call the callback immediately and return false when window does not exist`, () => {
    vi.stubGlobal(`window`, undefined);
    const callback = vi.fn();

    const result = addWindowEventListener(`resize`, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(result).toBe(false);
  });
});

describe(`removeWindowEventListener`, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it(`Should remove the callback from window when window exists`, () => {
    const removeSpy = vi.spyOn(window, `removeEventListener`);
    const callback = vi.fn();

    removeWindowEventListener(`resize`, callback);

    expect(removeSpy).toHaveBeenCalledWith(`resize`, callback);

    removeSpy.mockRestore();
  });

  it(`Should do nothing when window does not exist`, () => {
    vi.stubGlobal(`window`, undefined);
    const callback = vi.fn();

    expect(() => removeWindowEventListener(`resize`, callback)).not.toThrow();
  });
});
