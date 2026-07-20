// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { EGridLayoutEvent } from '../src/core/gridlayout/enums/EGridLayoutEvents';
import { mountGrid, restoreOffsetWidth, stubOffsetWidth } from './helpers/mountGrid';

const settle = async (): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    // eslint-disable-next-line no-await-in-loop
    await nextTick();
  }
};

/**
 * The cross-grid zone registry (cross-grid-registry.ts) is a module-level
 * singleton by design — that's the whole point, it's what lets unrelated
 * GridLayout instances find each other. But that means it persists across
 * tests too: a grid mounted in one test and never unmounted stays
 * registered and discoverable by every later test in this file. Every
 * grid mounted below is tracked here and unmounted in `afterEach`, or a
 * later test can silently find an earlier test's still-registered zone
 * instead of its own (same rect, same layoutId reused across tests) and
 * produce results that look like a feature bug but are actually a test
 * isolation one.
 */
let mountedWrappers: ReturnType<typeof mountGrid>[] = [];

const track = (wrapper: ReturnType<typeof mountGrid>): ReturnType<typeof mountGrid> => {
  mountedWrappers.push(wrapper);
  return wrapper;
};

/** jsdom performs no real layout, so `getBoundingClientRect()` returns an all-zero rect by default — every grid would otherwise appear to occupy the exact same (zero-sized, origin) space. */
const stubGridRect = (wrapper: ReturnType<typeof mountGrid>, rect: Partial<DOMRect>): void => {
  const full = { bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0, toJSON: () => ({}), ...rect };
  (wrapper.element as HTMLElement).getBoundingClientRect = () => full as DOMRect;
};

describe(`GridLayout cross-grid drag/drop (allowCrossGridDrag)`, () => {
  afterEach(() => {
    mountedWrappers.forEach(wrapper => wrapper.unmount());
    mountedWrappers = [];
    restoreOffsetWidth();
  });

  it(`Should move an item from the source grid into the target grid on a successful cross-grid drop`, async () => {
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-1` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-1` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    // clientX/clientY (250, 50) land over the target grid, not the
    // source — passed directly as dragEvent's own arguments (mirroring
    // interact.js's own event data), not via a separate global listener.
    source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeUndefined();
    expect(target.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.emitted(EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED)).toBeTruthy();
    expect(target.emitted(EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED)?.[0][0]).toMatchObject({ sourceLayoutId: `source-1` });
  });

  it(`Should not transfer the item on a dragmove that happens to cross into another grid's rect — only on the actual dragend`, async () => {
    // Regression test for a real bug: the cross-grid transfer check ran
    // unconditionally on every dragEvent() call, not gated to dragend
    // specifically — since dragmove events carry clientX/clientY too,
    // the moment the pointer first crossed into another grid's own rect
    // *during* the drag (long before the user released the mouse), the
    // transfer committed right then, using that mid-drag position, not
    // wherever the user actually intended to drop. Reported as "drag
    // item back onto a locked item, it doesn't land there, instead it
    // returns to its previous location" — the transfer had already
    // happened earlier in the same drag, using stale coordinates.
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-2` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-2` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    // A dragmove whose clientX/clientY happen to land over the target
    // grid — should not transfer anything yet, unlike dragend doing the
    // exact same thing.
    source.vm.dragEvent(`dragmove`, `a`, 0, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeUndefined();
    expect(target.emitted(EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED)).toBeFalsy();

    // The same drag, now actually ending over the target grid — this
    // one should transfer.
    source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeUndefined();
    expect(target.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
  });

  it(`Should not throw when a target grid's refsLayout isn't a valid HTMLElement (getRect's defensive branch)`, async () => {
    // getRect() guards against refsLayout.value not being a real
    // HTMLElement — not reachable through any normal mount/unmount
    // sequence, but exposed via defineExpose, so directly settable here
    // to exercise it. An empty object, not null — same reasoning as the
    // equivalent GridLayout.vue test (see docs/REFACTORING.md #70):
    // still fails `instanceof HTMLElement` the same way, without risking
    // a TypeError from some other, unrelated pending callback reading a
    // property off it.
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-getrect` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-getrect` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    // addEventListener/removeEventListener no-ops too — allowOutsideDrop
    // defaults to false in this test, but its own onMounted/unmount
    // hooks still unconditionally call setOutsideDropEnabled, which
    // needs these to exist even when disabled (an empty object without
    // them broke unmount's own cleanup with an unrelated TypeError,
    // caught directly rather than assumed fine).
    target.vm.refsLayout = { addEventListener: () => {}, removeEventListener: () => {} };

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    expect(() => source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50)).not.toThrow();
    await settle();

    // getRect() returning null for the target means findCrossGridZoneAt
    // never matches it — the item stays in its source grid, exactly as
    // if no other grid were registered at that point at all.
    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
  });

  it(`Should reject the drop and keep the item in its source grid when the target has disableExternalDrop`, async () => {
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-2` },
    }));
    const target = track(mountGrid([], {
      layoutProps: { allowCrossGridDrag: true, disableExternalDrop: true, layoutId: `target-2` },
    }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    source.vm.dragEvent(`dragend`, `a`, 1, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.vm.layout).toHaveLength(0);
    const rejected = target.emitted(EGridLayoutEvent.CROSS_GRID_DROP_REJECTED);
    expect(rejected).toBeTruthy();
    expect(rejected?.[0][0]).toStrictEqual({ itemId: `a`, sourceLayoutId: `source-2` });
  });

  it(`Should not attempt a cross-grid move when the drop position isn't over any other grid`, async () => {
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-3` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-3` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    // Nowhere near either grid.
    source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 9999, 9999);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.vm.layout).toHaveLength(0);
    expect(target.emitted(EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED)).toBeFalsy();
    expect(target.emitted(EGridLayoutEvent.CROSS_GRID_DROP_REJECTED)).toBeFalsy();
  });

  it(`Should not attempt a cross-grid move when clientX/clientY are missing from the drag event`, async () => {
    // Regression guard for the fix itself: if the event data doesn't
    // carry clientX/clientY for some reason, this must degrade to
    // "no zone found" (NaN comparisons are always false), not throw or
    // match a zone by accident.
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-missing-coords` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-missing-coords` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    expect(() => source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2)).not.toThrow();
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.vm.layout).toHaveLength(0);
  });

  it(`Should not participate in cross-grid drag/drop at all when allowCrossGridDrag is false (the default)`, async () => {
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }]));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-4` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.vm.layout).toHaveLength(0);
  });

  it(`Should generate a distinct layoutId automatically when none is provided`, async () => {
    stubOffsetWidth(1200);
    const a = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true } }));
    const b = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true } }));
    await settle();

    expect(a.vm.layoutId).toBeTruthy();
    expect(b.vm.layoutId).toBeTruthy();
    expect(a.vm.layoutId).not.toBe(b.vm.layoutId);
  });

  it(`Should deregister its cross-grid zone on unmount`, async () => {
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `source-unmount-test` },
    }));
    const target = mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `target-unmount-test` } });
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    target.unmount(); // deliberately not tracked/re-unmounted — this is the point of the test

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    expect(() => source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50)).not.toThrow();
    await settle();

    // The unmounted target can no longer be found/dropped into — the item
    // should simply complete its normal (internal) drag within source.
    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
  });

  it(`Should stop accepting drops once allowCrossGridDrag is toggled off reactively`, async () => {
    // Regression test: registration originally only happened once, in
    // onMounted — toggling the prop off after mount (exactly what a
    // consumer-facing on/off control does, e.g. the "Cross-grid drop
    // restrictions" example) silently did nothing, leaving a "disabled"
    // grid still fully registered and droppable.
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `toggle-source` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: true, layoutId: `toggle-target` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    await target.setProps({ allowCrossGridDrag: false });
    await settle();

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
    expect(target.vm.layout).toHaveLength(0);
  });

  it(`Should start accepting drops once allowCrossGridDrag is toggled on reactively`, async () => {
    stubOffsetWidth(1200);
    const source = track(mountGrid([{ i: `a`, x: 0, y: 0, w: 2, h: 2 }], {
      layoutProps: { allowCrossGridDrag: true, layoutId: `toggle-on-source` },
    }));
    const target = track(mountGrid([], { layoutProps: { allowCrossGridDrag: false, layoutId: `toggle-on-target` } }));
    await settle();

    stubGridRect(source, { bottom: 100, left: 0, right: 100, top: 0 });
    stubGridRect(target, { bottom: 100, left: 200, right: 300, top: 0 });

    await target.setProps({ allowCrossGridDrag: true });
    await settle();

    source.vm.dragEvent(`dragstart`, `a`, 0, 0, 2, 2);
    source.vm.dragEvent(`dragend`, `a`, 0, 0, 2, 2, 250, 50);
    await settle();

    expect(source.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeUndefined();
    expect(target.vm.layout.find((entry: { i: string }) => entry.i === `a`)).toBeTruthy();
  });
});
