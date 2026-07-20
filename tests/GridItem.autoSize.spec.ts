// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { EGridItemEvent } from '../src/core/griditem/enums/EGridItemEvents';
import { mountGrid, restoreOffsetWidth, stubOffsetWidth } from './helpers/mountGrid';

/**
 * autoSize()'s "happy path" — where the slot actually has a measurable
 * mounted element — can't be reached through GridItem's real slot
 * rendering in a test: calling the exposed `slots.default()` imperatively
 * (which is what autoSize() does) returns freshly created VNodes
 * disconnected from whatever the renderer actually mounted, so `.elm` is
 * never populated that way (see docs/REFACTORING.md #12 and
 * tests/GridItem.spec.ts's autoSize tests, which cover exactly that
 * no-op-instead-of-throwing behavior).
 *
 * To exercise the clamping/emit logic *after* a measurable element is
 * found — the part of autoSize() that's fully within this library's
 * control, as opposed to the VNode-timing limitation that isn't — this
 * file mocks `useSlots()` to return a fixed, already-measurable fake
 * element instead. Kept separate from GridItem.spec.ts so the `vi.mock`
 * only affects this file, not the tests relying on real Vue slot behavior.
 */
const fakeRect = { height: 250, width: 150 };
vi.mock(`vue`, async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue')>();
  return {
    ...actual,
    useSlots: () => ({
      default: () => [{ elm: { getBoundingClientRect: () => fakeRect } }],
    }),
  };
});

const settle = async (): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    // eslint-disable-next-line no-await-in-loop
    await nextTick();
  }
};

describe(`GridItem autoSize (happy path, via a mocked useSlots)`, () => {
  beforeEach(() => {
    stubOffsetWidth(1200);
  });

  afterEach(() => {
    restoreOffsetWidth();
  });

  it(`Should resize to the measured slot content and emit RESIZE/RESIZED`, async () => {
    const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 1, h: 1 }], {
      layoutProps: { margin: [10, 10], rowHeight: 100 },
    });
    await settle();

    const item = wrapper.findComponent({ name: `GridItem` });
    item.vm.autoSize();
    await settle();

    expect(item.emitted(EGridItemEvent.RESIZE)).toBeTruthy();
    expect(item.emitted(EGridItemEvent.RESIZED)).toBeTruthy();
  });

  it(`Should clamp the measured size to minW/maxW/minH/maxH`, async () => {
    const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], {
      itemProps: { maxH: 1, maxW: 1, minH: 1, minW: 1 },
      layoutProps: { margin: [10, 10], rowHeight: 100 },
    });
    await settle();

    const item = wrapper.findComponent({ name: `GridItem` });
    // fakeRect (150x250px) would normally resolve to more than 1 column/row
    // — minW/maxW/minH/maxH pinned to 1 should clamp it back down from the
    // item's starting 2x2 size.
    item.vm.autoSize();
    await settle();

    const resized = item.emitted(EGridItemEvent.RESIZED);
    expect(resized).toBeTruthy();
    const [, h, w] = resized![0];
    expect(w).toBe(1);
    expect(h).toBe(1);
  });

  it(`Should clamp the measured size up to minW/minH when it's too small`, async () => {
    const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 1, h: 1 }], {
      itemProps: { minH: 6, minW: 6 },
      layoutProps: { margin: [10, 10], rowHeight: 100 },
    });
    await settle();

    const item = wrapper.findComponent({ name: `GridItem` });
    // fakeRect (150x250px) resolves to roughly 2x3 grid units at these
    // layout settings — well under minW/minH: 6, so this exercises the
    // opposite clamp direction from the maxW/maxH test above.
    item.vm.autoSize();
    await settle();

    const resized = item.emitted(EGridItemEvent.RESIZED);
    expect(resized).toBeTruthy();
    const [, h, w] = resized![0];
    expect(w).toBe(6);
    expect(h).toBe(6);
  });

  it(`Should not emit a second RESIZED for an unchanged size on a repeat call`, async () => {
    const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 1, h: 1 }], {
      layoutProps: { margin: [10, 10], rowHeight: 100 },
    });
    await settle();

    const item = wrapper.findComponent({ name: `GridItem` });
    item.vm.autoSize();
    await settle();
    const firstCount = item.emitted(EGridItemEvent.RESIZED)?.length ?? 0;

    item.vm.autoSize();
    await settle();
    const secondCount = item.emitted(EGridItemEvent.RESIZED)?.length ?? 0;

    // previousW/H is updated on every call, so measuring the exact same
    // rect twice in a row shouldn't emit RESIZED the second time.
    expect(secondCount).toBe(firstCount);
  });
});
