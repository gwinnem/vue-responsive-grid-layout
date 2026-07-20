// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { afterEach, describe, expect, it } from 'vitest';
import { createCoreData, offsetXYFromParentOf } from '../src/core/helpers/draggable-utils';

describe(`createCoreData`, () => {
  it(`Should return zero deltas and use x/y as last coords on the first move`, () => {
    const result = createCoreData(NaN, NaN, 10, 20);

    expect(result).toStrictEqual({
      deltaX: 0,
      deltaY: 0,
      lastX: 10,
      lastY: 20,
      x: 10,
      y: 20,
    });
  });

  it(`Should compute deltas against the last known position on subsequent moves`, () => {
    const result = createCoreData(10, 20, 15, 26);

    expect(result).toStrictEqual({
      deltaX: 5,
      deltaY: 6,
      lastX: 10,
      lastY: 20,
      x: 15,
      y: 26,
    });
  });

  it(`Should treat a negative delta correctly when moving up/left`, () => {
    const result = createCoreData(15, 26, 10, 20);

    expect(result).toStrictEqual({
      deltaX: -5,
      deltaY: -6,
      lastX: 15,
      lastY: 26,
      x: 10,
      y: 20,
    });
  });
});

describe(`offsetXYFromParentOf`, () => {
  afterEach(() => {
    // @ts-expect-error -- getBoundingClientRect isn't typed as
    // optional/deletable on Element's own DOM lib definition, but this is
    // exactly undoing a per-test override of it (see the tests below).
    delete document.body.getBoundingClientRect;
  });

  it(`Should ignore the actual bounding rect when the target's offsetParent is literally document.body`, () => {
    const target = document.createElement(`div`);
    document.body.appendChild(target);
    Object.defineProperty(target, `offsetParent`, { value: document.body });
    // Even if body's rect were non-zero, the {left:0, top:0} short-circuit
    // for this exact case means it must never be read.
    document.body.getBoundingClientRect = () => ({
      bottom: 0, height: 0, left: 999, right: 0, toJSON: () => ({}), top: 999, width: 0, x: 999, y: 999,
    });

    const event = { clientX: 50, clientY: 40, target } as unknown as MouseEvent;

    const result = offsetXYFromParentOf(event);

    expect(result).toStrictEqual({ x: 50, y: 40 });

    document.body.removeChild(target);
  });

  it(`Should fall back to document.body and read its bounding rect when the target has no offsetParent`, () => {
    const target = document.createElement(`div`);
    document.body.appendChild(target);
    // jsdom reports offsetParent as null for detached-from-layout elements;
    // the implementation falls back to document.body but — since the check
    // compares the *original* offsetParent, not the fallback — still reads
    // its bounding rect rather than short-circuiting to {left:0, top:0}.
    document.body.getBoundingClientRect = () => ({
      bottom: 0, height: 0, left: 8, right: 0, toJSON: () => ({}), top: 3, width: 0, x: 8, y: 3,
    });

    const event = { clientX: 50, clientY: 40, target } as unknown as MouseEvent;

    const result = offsetXYFromParentOf(event);

    expect(result).toStrictEqual({ x: 42, y: 37 });

    document.body.removeChild(target);
  });

  it(`Should offset against the parent's bounding rect and scroll position when offsetParent is a real element`, () => {
    const target = document.createElement(`div`);
    const parent = document.createElement(`div`);
    parent.appendChild(target);
    document.body.appendChild(parent);

    Object.defineProperty(target, `offsetParent`, { value: parent });
    parent.getBoundingClientRect = () => ({
      bottom: 0, height: 0, left: 10, right: 0, toJSON: () => ({}), top: 5, width: 0, x: 10, y: 5,
    });
    Object.defineProperty(parent, `scrollLeft`, { value: 3 });
    Object.defineProperty(parent, `scrollTop`, { value: 2 });

    const event = {
      clientX: 100,
      clientY: 80,
      target,
    } as unknown as MouseEvent;

    const result = offsetXYFromParentOf(event);

    // x = clientX + scrollLeft - parentRect.left = 100 + 3 - 10
    // y = clientY + scrollTop - parentRect.top   = 80 + 2 - 5
    expect(result).toStrictEqual({ x: 93, y: 77 });

    document.body.removeChild(parent);
  });
});
