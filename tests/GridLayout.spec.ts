// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, reactive } from 'vue';
import { mount } from '@vue/test-utils';
import GridLayout from '../src/components/Grid/GridLayout.vue';
import GridItem from '../src/components/Grid/GridItem.vue';
import { EGridLayoutEvent } from '../src/core/gridlayout/enums/EGridLayoutEvents';
import { ECompactType } from '../src/core/gridlayout/enums/ECompactType';
import { EErrorMessage } from '../src/core/common/enums/ErrorMessages';
import { mountGrid, restoreOffsetWidth, stubOffsetWidth } from './helpers/mountGrid';

const basicLayout = () => [
  { i: `0`, x: 0, y: 0, w: 2, h: 2 },
  { i: `1`, x: 2, y: 0, w: 2, h: 2 },
];

describe(`GridLayout`, () => {
  afterEach(() => {
    restoreOffsetWidth();
  });

  it(`Should render one .vue-grid-item per layout entry, plus the drag placeholder`, () => {
    const wrapper = mountGrid(basicLayout());

    // 2 real items + 1 internal placeholder item.
    expect(wrapper.findAll(`.vue-grid-item`)).toHaveLength(3);
    expect(wrapper.text()).toContain(`Item 0`);
    expect(wrapper.text()).toContain(`Item 1`);
  });

  it(`Should not throw on mount (regression: onWindowResize used to crash via a payload-less resizeEvent)`, async () => {
    const wrapper = mountGrid(basicLayout());
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.exists()).toBe(true);
  });

  it(`Should emit the layout lifecycle events in order`, async () => {
    const wrapper = mountGrid(basicLayout());
    await nextTick();
    await nextTick();
    await nextTick();

    const emittedEvents = Object.keys(wrapper.emitted());
    expect(emittedEvents).toContain(EGridLayoutEvent.LAYOUT_CREATED);
    expect(emittedEvents).toContain(EGridLayoutEvent.LAYOUT_BEFORE_MOUNT);
    expect(emittedEvents).toContain(EGridLayoutEvent.LAYOUT_MOUNTED);
    expect(emittedEvents).toContain(EGridLayoutEvent.LAYOUT_UPDATED);
  });

  it(`Should set dir="rtl" when isMirrored is true, and "ltr" otherwise`, () => {
    const ltr = mountGrid(basicLayout());
    expect(ltr.find(`.vue-grid-layout`).attributes(`dir`)).toBe(`ltr`);

    const rtl = mountGrid(basicLayout(), { layoutProps: { isMirrored: true } });
    expect(rtl.find(`.vue-grid-layout`).attributes(`dir`)).toBe(`rtl`);
  });

  it(`Should apply the "grid" class when showGridLines is true`, () => {
    const wrapper = mountGrid(basicLayout(), { layoutProps: { showGridLines: true } });

    expect(wrapper.find(`.vue-grid-layout`).classes()).toContain(`grid`);
  });

  it(`Should not apply the "grid" class by default`, () => {
    const wrapper = mountGrid(basicLayout());

    expect(wrapper.find(`.vue-grid-layout`).classes()).not.toContain(`grid`);
  });

  it(`Should compute a pixel container height from the layout when autoSize is true`, async () => {
    const wrapper = mountGrid(basicLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
    await nextTick();
    await nextTick();
    await nextTick();

    // bottom y-coordinate is 2 rows (h:2 items at y:0) -> 2 * (100 + 10) + 10 = 230px
    expect(wrapper.find(`.vue-grid-layout`).attributes(`style`)).toContain(`height: 230px`);
  });

  it(`Should render with no explicit height when autoSize is false`, async () => {
    const wrapper = mountGrid(basicLayout(), { layoutProps: { autoSize: false } });
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``).not.toContain(`height:`);
  });

  it(`Should emit breakpoint-changed when responsive is enabled`, async () => {
    stubOffsetWidth(500); // falls in the default "xs" breakpoint band (480-767)
    const wrapper = mountGrid(basicLayout(), { layoutProps: { responsive: true } });
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    const calls = wrapper.emitted(EGridLayoutEvent.BREAKPOINT_CHANGED);
    expect(calls).toBeTruthy();
    expect(calls?.[0][0]).toBe(`xs`);
  });

  it(`Should cap the responsive column count to colNum when colNum is the more restrictive value`, async () => {
    // Default breakpoints/cols resolve width 1300 to "lg" -> 12 columns,
    // but colNum: 2 here should win as the more restrictive cap — this
    // exercises useResponsiveLayout.ts's `colNum.value < colNumResponsive.value`
    // branch, previously untested. Asserting the exact resulting pixel
    // width would be fragile (depends on several ticks of eventBus
    // cascade settling); checking it resolves without error and still
    // reaches the expected breakpoint is the meaningful, stable part.
    stubOffsetWidth(1300);
    const wrapper = mountGrid(basicLayout(), { layoutProps: { colNum: 2, responsive: true } });
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    const calls = wrapper.emitted(EGridLayoutEvent.BREAKPOINT_CHANGED);
    expect(calls?.[0][0]).toBe(`lg`);
    expect(wrapper.find(`.vue-grid-item`).exists()).toBe(true);
  });

  it(`Should cache the outgoing layout when switching between breakpoints`, async () => {
    // Triggers useResponsiveLayout.ts's `lastBreakpoint != null &&
    // !layouts.value[lastBreakpoint]` branch, which only runs on a
    // *second* breakpoint transition (lastBreakpoint is null on the
    // first). Real width changes come from a ResizeObserver in
    // production; window's own 'resize' event is what GridLayout listens
    // for that ResizeObserver's callback to also trigger, so dispatching
    // it directly after re-stubbing offsetWidth is the most direct way to
    // simulate a second measurement without mocking ResizeObserver too.
    stubOffsetWidth(500); // "xs" band
    const wrapper = mountGrid(basicLayout(), { layoutProps: { responsive: true } });
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.lastBreakpoint).toBe(`xs`);

    stubOffsetWidth(1300); // "lg" band
    window.dispatchEvent(new Event(`resize`));
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.lastBreakpoint).toBe(`lg`);
    expect(wrapper.vm.layouts.xs).toBeTruthy();
  });

  it(`Should re-populate a breakpoint's cache entry if it was cleared since it was last active`, async () => {
    // useResponsiveLayout.ts's `lastBreakpoint != null &&
    // !layouts.value[lastBreakpoint]` branch only fires when the cache for
    // the *previously* active breakpoint has gone missing since — which
    // happens because initResponsiveFeatures() (resetting `layouts.value`
    // back to just the configured `responsiveLayouts`) is called again
    // whenever the layout prop's length changes, not just once at mount.
    // Changing the layout, then forcing another breakpoint check at the
    // *same* breakpoint via a window resize, reproduces that sequence.
    stubOffsetWidth(500); // "xs" band throughout this test
    const layout = basicLayout();
    const wrapper = mountGrid(layout, { layoutProps: { responsive: true } });
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.lastBreakpoint).toBe(`xs`);
    expect(wrapper.vm.layouts.xs).toBeTruthy();

    // Adding an item changes props.layout.length, triggering layoutUpdate()
    // -> initResponsiveFeatures(), which resets the layouts cache.
    await wrapper.setProps({ layout: [...layout, { i: `2`, x: 0, y: 4, w: 2, h: 2 }] });
    await nextTick();
    await nextTick();

    // Still "xs" (offsetWidth unchanged) — re-checking the breakpoint here
    // is what should re-populate the now-missing "xs" cache entry.
    window.dispatchEvent(new Event(`resize`));
    await nextTick();
    await nextTick();

    expect(wrapper.vm.lastBreakpoint).toBe(`xs`);
    expect(wrapper.vm.layouts.xs).toBeTruthy();
  });

  it(`Should not throw when a drag starts before the container has a measured width (regression)`, async () => {
    // Container width stays null/0 whenever offsetWidth hasn't resolved yet
    // (hidden tab, unmeasured modal, or simply before layout settles) — see
    // REFACTORING.md #11. Starting a drag in that state used to throw
    // inside a watcher for every item in the grid.
    const wrapper = mountGrid(basicLayout());
    await nextTick();
    await nextTick();
    await nextTick();

    expect(() => wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2)).not.toThrow();
  });

  it(`Should recompute container height when the layout prop changes (independent of slot content)`, async () => {
    const wrapper = mountGrid(basicLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
    await nextTick();
    await nextTick();
    await nextTick();

    await wrapper.setProps({ margin: [20, 20] });
    await nextTick();

    // bottom y-coordinate is 2 -> 2 * (100 + 20) + 20 = 260px
    expect(wrapper.find(`.vue-grid-layout`).attributes(`style`)).toContain(`height: 260px`);
  });

  describe(`mount-time layout validation`, () => {
    it(`Should throw when mounted with a layout that fails validation`, async () => {
      // The validation itself runs inside onMounted's own nested
      // nextTick(() => {...}) callback (settling props.layout after the
      // initial render before checking it) — a throw in there isn't
      // something a caller can catch with a normal try/catch around
      // mount(), since it happens in a detached microtask chain, not
      // synchronously during mount() or inside anything this test
      // itself awaits. It surfaces as a Node-level unhandledRejection
      // instead — listening for that directly is the only way to
      // observe it cleanly, rather than letting it show up as a
      // Vitest-reported "unhandled error" unrelated to any specific
      // assertion.
      const caught: unknown[] = [];
      const onUnhandledRejection = (reason: unknown): void => {
        caught.push(reason);
      };
      process.on(`unhandledRejection`, onUnhandledRejection);

      try {
        // Missing `h` — fails layoutValidator's required-keys check.
        mountGrid([{ i: `0`, w: 2, x: 0, y: 0 } as unknown as { i: string; h: number; w: number; x: number; y: number }]);
        await nextTick();
        await nextTick();
        await nextTick();
        await nextTick();
        // Node's unhandledRejection detection fires on a later
        // macrotask than Vue's own nextTick microtasks resolve on —
        // confirmed directly (an earlier version of this test using
        // only nextTick() saw the rejection reported by Vitest's own
        // error summary despite this test's own assertion already
        // having run and found nothing caught yet), not assumed.
        await new Promise((resolve) => { setTimeout(resolve, 0); });

        expect(caught).toHaveLength(1);
        expect((caught[0] as Error).message).toBe(EErrorMessage.INVALID_LAYOUT_VALIDATED);
      } finally {
        process.off(`unhandledRejection`, onUnhandledRejection);
      }
    });

    it(`Should not throw when mounted with a valid layout`, async () => {
      const caught: unknown[] = [];
      const onUnhandledRejection = (reason: unknown): void => {
        caught.push(reason);
      };
      process.on(`unhandledRejection`, onUnhandledRejection);

      try {
        mountGrid(basicLayout());
        await nextTick();
        await nextTick();
        await nextTick();
        await nextTick();

        expect(caught).toHaveLength(0);
      } finally {
        process.off(`unhandledRejection`, onUnhandledRejection);
      }
    });
  });

  describe(`layoutUpdate (reacting to layout prop length changes)`, () => {
    it(`Should return early without throwing when originalLayout is null (falsy but not undefined)`, async () => {
      // originalLayout.value !== undefined is checked first, so this
      // inner `!originalLayout.value` guard is only reachable for a
      // different falsy value entirely — null specifically, since
      // TLayout itself (an array) is always truthy. Not reachable
      // through any normal prop/mutation path (TypeScript's own typing
      // for originalLayout is `TLayout | undefined`), but exposed via
      // defineExpose, so directly settable in a test.
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.originalLayout = null;

      await expect(
        wrapper.setProps({
          layout: [...basicLayout(), { i: `2`, x: 0, y: 2, w: 2, h: 2 }],
        }),
      ).resolves.not.toThrow();
    });

    it(`Should not throw when an item is added to the layout after mount`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      await expect(
        wrapper.setProps({
          layout: [...basicLayout(), { i: `2`, x: 0, y: 2, w: 2, h: 2 }],
        }),
      ).resolves.not.toThrow();
    });

    it(`Should not throw when an item is removed from the layout after mount`, async () => {
      const threeItems = [...basicLayout(), { i: `2`, x: 0, y: 2, w: 2, h: 2 }];
      const wrapper = mountGrid(threeItems);
      await nextTick();
      await nextTick();
      await nextTick();

      await expect(wrapper.setProps({ layout: basicLayout() })).resolves.not.toThrow();
    });
  });

  describe(`placeholder slot`, () => {
    it(`Should render custom placeholder slot content instead of the default empty box`, () => {
      // v-show (not v-if) governs the placeholder's visibility, so its
      // content is present in the DOM regardless of whether a drag is
      // actually in progress — no need to simulate one just to check
      // the slot renders.
      const wrapper = mount(GridLayout, {
        props: { layout: basicLayout() },
        slots: {
          default: () => basicLayout().map((item) => h(GridItem, { ...item, key: item.i }, () => `Item ${item.i}`)),
          placeholder: () => h(`span`, { class: `custom-placeholder-content` }, `Dropping here`),
        },
      });

      const placeholderEl = wrapper.find(`.vue-grid-placeholder`);
      expect(placeholderEl.find(`.custom-placeholder-content`).exists()).toBe(true);
      expect(placeholderEl.text()).toContain(`Dropping here`);
    });

    it(`Should expose placeholder position/size and isDragging as scoped slot props`, () => {
      let scopedProps: { isDragging: boolean; placeholder: { h: number; w: number; x: number; y: number } } | undefined;
      const wrapper = mount(GridLayout, {
        props: { layout: basicLayout() },
        slots: {
          default: () => basicLayout().map((item) => h(GridItem, { ...item, key: item.i }, () => `Item ${item.i}`)),
          placeholder: (scope: typeof scopedProps) => {
            scopedProps = scope;
            return h(`span`, `Placeholder at ${scope.placeholder.x},${scope.placeholder.y}`);
          },
        },
      });

      expect(wrapper.find(`.vue-grid-placeholder`).exists()).toBe(true);
      expect(scopedProps).toBeDefined();
      expect(scopedProps).toHaveProperty(`isDragging`);
      expect(scopedProps?.placeholder).toHaveProperty(`x`);
      expect(scopedProps?.placeholder).toHaveProperty(`y`);
      expect(scopedProps?.placeholder).toHaveProperty(`w`);
      expect(scopedProps?.placeholder).toHaveProperty(`h`);
    });

    it(`Should render the default empty placeholder box when no placeholder slot is provided`, () => {
      const wrapper = mountGrid(basicLayout());

      const placeholderEl = wrapper.find(`.vue-grid-placeholder`);
      expect(placeholderEl.exists()).toBe(true);
      expect(placeholderEl.text()).toBe(``);
    });
  });

  describe(`compactNow / rearrange`, () => {
    it(`Should compact a layout with a gap when compactNow is called`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 5, w: 2, h: 2 },
      ], { layoutProps: { compactType: ECompactType.VERTICAL } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.compactNow();
      await nextTick();

      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `1`)?.y).toBe(2);
    });

    it(`Should still pull items upward to close a gap when compactType is NONE — a manual "tidy up" always tidies up, regardless of the ambient auto-compact setting`, async () => {
      // Regression test: compactNow() previously passed props.compactType
      // straight through to the compactor, making it a no-op whenever
      // compactType was NONE — exactly the scenario a manual "Tidy up"
      // button exists for in the first place (a layout that doesn't
      // auto-compact during drag/resize). Found via an e2e test exercising
      // this precise scenario.
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 5, w: 2, h: 2 },
      ], { layoutProps: { compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.compactNow();
      await nextTick();

      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `1`)?.y).toBe(2);
    });

    it(`Should emit LAYOUT_UPDATE and LAYOUT_UPDATED when compactNow runs`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      const callsBefore = wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATE)?.length ?? 0;
      wrapper.vm.compactNow();

      expect(wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATE)?.length ?? 0).toBeGreaterThan(callsBefore);
      expect(wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATED)).toBeTruthy();
    });

    it(`rearrange() should be an alias for compactNow()`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 5, w: 2, h: 2 },
      ], { layoutProps: { compactType: ECompactType.VERTICAL } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.rearrange();
      await nextTick();

      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `1`)?.y).toBe(2);
    });
  });

  describe(`compactor prop (pluggable compaction)`, () => {
    it(`Should default to null — a purely additive prop, not a new default behavior`, () => {
      const wrapper = mountGrid(basicLayout());
      expect(wrapper.props(`compactor`)).toBeNull();
    });

    it(`Should call a custom compactor on drag end instead of the built-in logic, and apply its returned layout`, async () => {
      const customCompactor = {
        compact: vi.fn((layout: unknown[]) => (layout as { i: string; y: number }[]).map((item) => (
          item.i === `1` ? { ...item, y: 99 } : item
        ))),
        type: `custom`,
      };
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 5, w: 2, h: 2 },
      ], { layoutProps: { compactor: customCompactor, compactType: ECompactType.VERTICAL } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      expect(customCompactor.compact).toHaveBeenCalled();
      // The built-in logic would have compacted item "1" to y:2 (see the
      // equivalent compactType:VERTICAL test above) — 99 only appears if
      // the custom compactor's own return value was actually applied,
      // not just called and ignored.
      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `1`)?.y).toBe(99);
    });

    it(`Should call a custom compactor on resize end`, async () => {
      const customCompactor = { compact: vi.fn((layout: unknown[]) => layout), type: `custom` };
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { compactor: customCompactor } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 4, 3);
      await nextTick();

      expect(customCompactor.compact).toHaveBeenCalled();
    });

    it(`compactNow() should still force real compaction in the custom compactor's own context, regardless of compactType being NONE`, async () => {
      // Same intent as the existing "manual tidy-up always tidies up"
      // regression test above, extended to the pluggable path — a
      // custom compactor receives the same forced-VERTICAL context
      // compactNow() has always used when compactType is NONE, whether
      // or not it chooses to honor it.
      const receivedContexts: { compactType: ECompactType }[] = [];
      const customCompactor = {
        compact: vi.fn((layout: unknown[], _cols: number, context: { compactType: ECompactType }) => {
          receivedContexts.push(context);
          return layout;
        }),
        type: `custom`,
      };
      const wrapper = mountGrid(basicLayout(), { layoutProps: { compactor: customCompactor, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.compactNow();

      expect(receivedContexts.at(-1)?.compactType).toBe(ECompactType.VERTICAL);
    });

    it(`Should pass positionsBeforeDrag as context.minPositions on drag end when restoreOnDrag is on`, async () => {
      const receivedContexts: { minPositions?: unknown }[] = [];
      const customCompactor = {
        compact: vi.fn((layout: unknown[], _cols: number, context: { minPositions?: unknown }) => {
          receivedContexts.push(context);
          return layout;
        }),
        type: `custom`,
      };
      const wrapper = mountGrid(basicLayout(), { layoutProps: { compactor: customCompactor, restoreOnDrag: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);

      expect(receivedContexts.at(-1)?.minPositions).toBeDefined();
    });
  });

  describe(`resizestart data integrity`, () => {
    it(`Should not corrupt an item's own h/w in the layout at resizestart, before anything has actually resized`, async () => {
      // Regression test for a real bug: the code shared by all three
      // resize event types (after the switch in handleResize) recomputes
      // size from `newSize.height`/`newSize.width`, which are only ever
      // populated by the resizemove/resizeend cases — for resizestart
      // they're still the initial `{ height: 0, width: 0 }`, and that
      // near-zero size (clamped up to the library's own 1x1 floor)
      // silently overwrote the item's real size in `props.layout` on
      // every single resizestart, before the user had moved anything at
      // all. Invisible for a single-item resize (resizemove/resizeend
      // immediately overwrite it with the real, correct size again) —
      // but multiSelect's own group-resize snapshot reads `props.layout`
      // exactly at this corrupted moment, so every passenger got resized
      // by a wrong delta. See docs/REFACTORING.md for the full account.
      const wrapper = mountGrid([{ h: 3, i: `0`, w: 4, x: 0, y: 0 }]);
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 3, 4);

      const item = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item.h).toBe(3);
      expect(item.w).toBe(4);
    });
  });

  describe(`enableUndoRedo`, () => {
    it(`Should default canUndo/canRedo to false when enableUndoRedo is off`, () => {
      const wrapper = mountGrid(basicLayout());
      expect(wrapper.vm.canUndo).toBe(false);
      expect(wrapper.vm.canRedo).toBe(false);
    });

    it(`Should no-op undo()/redo() entirely when enableUndoRedo is off, even with a drag committed`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }]);
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 4, 0, 2, 2);
      await nextTick();

      const beforeUndo = wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x;
      wrapper.vm.undo();
      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x).toBe(beforeUndo);
      // redo() should no-op the same way — nothing to redo, and
      // enableUndoRedo is off regardless.
      wrapper.vm.redo();
      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x).toBe(beforeUndo);
    });

    it(`Should restore the pre-drag position after a committed drag, via undo()`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 4, 0, 2, 2);
      await nextTick();
      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x).toBe(4);

      expect(wrapper.vm.canUndo).toBe(true);
      wrapper.vm.undo();
      await nextTick();

      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x).toBe(0);
    });

    it(`Should restore the undone change via redo()`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 4, 0, 2, 2);
      await nextTick();

      wrapper.vm.undo();
      await nextTick();
      expect(wrapper.vm.canRedo).toBe(true);

      wrapper.vm.redo();
      await nextTick();
      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x).toBe(4);
      expect(wrapper.vm.canRedo).toBe(false);
    });

    it(`Should no-op cleanly when dragend fires without a prior dragstart (commitDragEnd's own guard)`, async () => {
      // captureDragStart() unconditionally sets a snapshot on every
      // dragstart, regardless of enableUndoRedo — so commitDragEnd's
      // own "was anything actually captured" guard only matters for a
      // dragend that arrives with no matching dragstart at all, not a
      // normal drag with undo/redo simply turned off.
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragend`, `0`, 4, 0, 2, 2);
      await nextTick();

      expect(wrapper.vm.canUndo).toBe(false);
    });

    it(`Should clear the redo stack once a new change is committed after an undo`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 4, 0, 2, 2);
      await nextTick();

      wrapper.vm.undo();
      await nextTick();
      expect(wrapper.vm.canRedo).toBe(true);

      // A brand-new committed drag, not a redo — should invalidate the
      // now-stale redo entry (standard undo/redo semantics: a fresh
      // action after an undo discards the "future" that undo just
      // stepped back from).
      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 6, 0, 2, 2);
      await nextTick();

      expect(wrapper.vm.canRedo).toBe(false);
    });

    it(`Should undo an item addition (via the length watcher), restoring the original item count`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.layout.push({ i: `1`, x: 2, y: 0, w: 2, h: 2 });
      await nextTick();
      expect(wrapper.vm.layout.length).toBe(2);

      wrapper.vm.undo();
      await nextTick();

      expect(wrapper.vm.layout.length).toBe(1);
    });

    it(`Should grow originalLayout's own tracked length to match when an item is added (layoutUpdate's "layout grew" branch)`, async () => {
      // originalLayout is layoutUpdate()'s own record of the layout at
      // its last settled state — every other add-item test here checks
      // the visible layout array itself, not this internal tracking
      // state specifically growing to match via `tmpLayout.concat(diff)`.
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }]);
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.layout.push({ i: `1`, x: 2, y: 0, w: 2, h: 2 });
      await nextTick();
      await nextTick();

      expect(wrapper.vm.originalLayout.length).toBe(2);
      expect(wrapper.vm.originalLayout.some((item: { i: string }) => item.i === `1`)).toBe(true);
    });

    it(`Should fully revert two "y: Infinity" additions across two separate undos, without corrupting the snapshot — regression test`, async () => {
      // Bug fix: adding an item with `y: Infinity` (the common "place
      // past everything else, let compaction settle it" convention —
      // used by this project's own undo/redo example) used to corrupt
      // every undo/redo snapshot that referenced it. Root cause: the
      // `props.layout.length` watcher called `commitUndoPoint()`
      // (which clones the current layout into `lastSnapshot`) *before*
      // `layoutUpdate()` — the function that actually runs compaction
      // — so the clone captured the item's raw, still-`Infinity` `y`.
      // `cloneLayout`'s JSON round-trip silently turns `Infinity` into
      // `null` (JSON has no representation for it), permanently
      // corrupting that item in the snapshot. Reported directly:
      // after two adds and two undos, the second undo silently did
      // nothing instead of reverting the layout, confirmed via direct
      // instrumentation of `commitUndoPoint`/`undo` showing the
      // corrupted `y: null` in the stored snapshot. Fixed by running
      // `layoutUpdate()` before `commitUndoPoint()` in that watcher.
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.layout.push({ i: `1`, x: 0, y: Infinity, w: 2, h: 2 });
      await nextTick();
      wrapper.vm.layout.push({ i: `2`, x: 0, y: Infinity, w: 2, h: 2 });
      await nextTick();
      expect(wrapper.vm.layout.length).toBe(3);

      wrapper.vm.undo();
      await nextTick();
      expect(wrapper.vm.layout.length).toBe(2);

      wrapper.vm.undo();
      await nextTick();
      expect(wrapper.vm.layout.length).toBe(1);
      expect(wrapper.vm.canUndo).toBe(false);
    });

    it(`Should undo compactNow()'s own repositioning`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 5, w: 2, h: 2 },
      ], { layoutProps: { enableUndoRedo: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.compactNow();
      await nextTick();
      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `1`)?.y).toBe(2);

      wrapper.vm.undo();
      await nextTick();

      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `1`)?.y).toBe(5);
    });

    it(`Should not consume an undo slot for a drag that starts and ends with no actual change`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 0, 0, 2, 2);
      await nextTick();

      expect(wrapper.vm.canUndo).toBe(false);
    });

    it(`Should cap the undo stack at undoHistoryLimit, dropping the oldest entry`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { enableUndoRedo: true, undoHistoryLimit: 2 } });
      await nextTick();
      await nextTick();
      await nextTick();

      // Three separate committed drags — one more than the cap.
      for (const targetX of [1, 2, 3]) {
        wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
        wrapper.vm.dragEvent(`dragend`, `0`, targetX, 0, 2, 2);
        await nextTick();
      }

      // Undoing twice (the cap) should land on the *second* drag's
      // pre-state (x:1) — the very first drag's own pre-state (x:0)
      // should have been dropped once the cap was exceeded.
      wrapper.vm.undo();
      await nextTick();
      wrapper.vm.undo();
      await nextTick();

      expect(wrapper.vm.layout.find((item: { i: string }) => item.i === `0`)?.x).toBe(1);
      expect(wrapper.vm.canUndo).toBe(false);
    });
  });

  describe(`duplicateItem`, () => {
    it(`Should clone the item with a new, collision-safe id, placed below the source`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      const newId = wrapper.vm.duplicateItem(`0`);
      await nextTick();

      expect(newId).toBe(`0-copy`);
      const original = wrapper.vm.layout.find((item: { i: string }) => item.i === `0`);
      const copy = wrapper.vm.layout.find((item: { i: string }) => item.i === `0-copy`);
      expect(copy).toBeTruthy();
      expect(copy.w).toBe(original.w);
      expect(copy.h).toBe(original.h);
      expect(copy.x).toBe(original.x);
    });

    it(`Should not carry over the source item's own moved flag`, async () => {
      const wrapper = mountGrid([{ i: `0`, moved: true, x: 0, y: 0, w: 2, h: 2 }], {
        layoutProps: { compactType: ECompactType.NONE },
      });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.duplicateItem(`0`);
      await nextTick();

      const copy = wrapper.vm.layout.find((item: { i: string }) => item.i === `0-copy`);
      expect(copy.moved).not.toBe(true);
    });

    it(`Should generate a further-suffixed id when a previous copy already exists`, async () => {
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 2, h: 2 }], { layoutProps: { compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      const firstCopyId = wrapper.vm.duplicateItem(`0`);
      await nextTick();
      const secondCopyId = wrapper.vm.duplicateItem(`0`);
      await nextTick();

      expect(firstCopyId).toBe(`0-copy`);
      expect(secondCopyId).toBe(`0-copy-2`);
      expect(wrapper.vm.layout).toHaveLength(3);
    });

    it(`Should return null when the id doesn't match any item currently in the layout`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      expect(wrapper.vm.duplicateItem(`does-not-exist`)).toBeNull();
    });
  });

  describe(`scrollToItem / focusItem`, () => {
    it(`Should scroll the item's element into view when it exists`, async () => {
      const wrapper = mountGrid(basicLayout());
      const el = wrapper.find(`[data-grid-item-id="0"]`).element as HTMLElement;
      const scrollIntoViewSpy = vi.fn();
      el.scrollIntoView = scrollIntoViewSpy;

      await wrapper.vm.scrollToItem(`0`);

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({ behavior: `smooth`, block: `nearest`, inline: `nearest` });
    });

    it(`Should not throw when scrollToItem is called with an id that isn't currently rendered`, async () => {
      const wrapper = mountGrid(basicLayout());

      await expect(wrapper.vm.scrollToItem(`does-not-exist`)).resolves.not.toThrow();
    });

    it(`Should move focus to the item's element when it exists`, async () => {
      const wrapper = mountGrid(basicLayout());
      const el = wrapper.find(`[data-grid-item-id="0"]`).element as HTMLElement;
      const focusSpy = vi.spyOn(el, `focus`);

      await wrapper.vm.focusItem(`0`);

      expect(focusSpy).toHaveBeenCalled();
    });

    it(`Should not throw when focusItem is called with an id that isn't currently rendered`, async () => {
      const wrapper = mountGrid(basicLayout());

      await expect(wrapper.vm.focusItem(`does-not-exist`)).resolves.not.toThrow();
    });

    it(`Should scope the lookup to this grid's own container, not match an element from a different grid`, async () => {
      const wrapperA = mountGrid([{ i: `shared-id`, x: 0, y: 0, w: 2, h: 2 }]);
      const wrapperB = mountGrid([{ i: `shared-id`, x: 0, y: 0, w: 2, h: 2 }]);

      const elA = wrapperA.find(`[data-grid-item-id="shared-id"]`).element as HTMLElement;
      const elB = wrapperB.find(`[data-grid-item-id="shared-id"]`).element as HTMLElement;
      const focusSpyA = vi.spyOn(elA, `focus`);
      const focusSpyB = vi.spyOn(elB, `focus`);

      await wrapperA.vm.focusItem(`shared-id`);

      expect(focusSpyA).toHaveBeenCalled();
      expect(focusSpyB).not.toHaveBeenCalled();
    });

    it(`Should not throw when refsLayout isn't a valid HTMLElement (defensive — not expected in normal usage post-mount)`, async () => {
      const wrapper = mountGrid(basicLayout());
      // refsLayout is a real HTMLElement by the time a mounted component's
      // methods are reachable in normal usage; this simulates the guard's
      // other branch directly rather than trying to catch a real
      // component in a pre-mount state, which isn't reachable through
      // the public API once `wrapper.vm` exists at all. An empty object,
      // not null — still fails `instanceof HTMLElement` the same way,
      // but doesn't throw a TypeError if the component's own separately
      // pending ResizeObserver callback reads a property off it before
      // this test finishes (a real, previously-caught side effect of
      // this exact test using `null` instead — see docs/REFACTORING.md).
      wrapper.vm.refsLayout = {};

      await expect(wrapper.vm.scrollToItem(`0`)).resolves.not.toThrow();
      await expect(wrapper.vm.focusItem(`0`)).resolves.not.toThrow();
    });

    it(`Should find and focus/scroll a just-added item, even when called synchronously in the same handler that pushed it — the documented "jump to the widget you just added" use case`, async () => {
      // Regression test for a real, reported bug: "scrollToItem/
      // focusItem — not actually scrolling/focusing." Confirmed
      // directly first (in a real browser, via the demo app): after
      // clicking "add item", the newly-added item never received
      // focus at all — the browser's own default post-click focus
      // stayed on the button that was clicked. Traced to Vue's own
      // reactivity batching DOM updates asynchronously — calling these
      // synchronously right after pushing a new item into `layout`
      // (the exact, documented intended use) searched for an element
      // that didn't exist in the DOM yet, found nothing, and silently
      // did nothing. Fixed by having both methods await `nextTick()`
      // internally, so this exact call pattern — no `await` at the
      // call site — works correctly.
      // mountGrid's own slot function closures over the original array
      // argument passed to it — it doesn't re-evaluate reactively when
      // `layout` changes later (see mountGridWithReactiveItem's own doc
      // comment for the same limitation), so a genuinely reactive
      // mount is needed here to get a new item's real DOM element to
      // exist at all.
      const layout = reactive([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
      const wrapper = mount(GridLayout, {
        props: { layout },
        slots: {
          default: () => layout.map((item) => h(GridItem, { ...item, key: item.i }, () => `Item ${item.i}`)),
        },
      });
      const focusSpy = vi.spyOn(HTMLElement.prototype, `focus`);

      // Mirrors a real consumer's addItem(): push a brand new id, then
      // immediately call focusItem for it in the same synchronous
      // handler, with no nextTick() of its own in between.
      layout.push({ h: 2, i: `new-item`, w: 2, x: 4, y: 0 });
      await wrapper.vm.focusItem(`new-item`);

      const newEl = wrapper.find(`[data-grid-item-id="new-item"]`).element as HTMLElement;
      expect(focusSpy).toHaveBeenCalled();
      expect(focusSpy.mock.instances).toContain(newEl);

      focusSpy.mockRestore();
    });
  });

  describe(`multiSelect`, () => {
    it(`Should do nothing on click when multiSelect is off (the default)`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();

      await wrapper.find(`[data-grid-item-id="0"]`).trigger(`click`);
      await nextTick();

      expect(wrapper.vm.selectedItems).toStrictEqual([]);
      expect(wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)).toBeFalsy();
    });

    it(`Should select only the clicked item on a plain click, replacing any prior selection`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      await wrapper.find(`[data-grid-item-id="0"]`).trigger(`click`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);

      await wrapper.find(`[data-grid-item-id="1"]`).trigger(`click`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`1`]);
    });

    it(`Should emit SELECTION_CHANGED with the full current selection`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      await wrapper.find(`[data-grid-item-id="0"]`).trigger(`click`);
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)).toStrictEqual([[[`0`]]]);
    });

    it(`Should add to the selection additively on Shift+click, not replace it`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      await wrapper.find(`[data-grid-item-id="0"]`).trigger(`click`);
      await nextTick();
      await wrapper.find(`[data-grid-item-id="1"]`).trigger(`click`, { shiftKey: true });
      await nextTick();

      expect(wrapper.vm.selectedItems.sort()).toStrictEqual([`0`, `1`]);
    });

    it(`Should toggle an already-selected item off on Ctrl/Cmd+click`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      await wrapper.find(`[data-grid-item-id="0"]`).trigger(`click`);
      await wrapper.find(`[data-grid-item-id="1"]`).trigger(`click`, { ctrlKey: true });
      await nextTick();
      expect(wrapper.vm.selectedItems.sort()).toStrictEqual([`0`, `1`]);

      await wrapper.find(`[data-grid-item-id="1"]`).trigger(`click`, { metaKey: true });
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);
    });

    it(`Should clear the selection when clicking empty grid background`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      await wrapper.find(`[data-grid-item-id="0"]`).trigger(`click`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);

      await wrapper.find(`.vue-grid-layout`).trigger(`click`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([]);
    });

    it(`Should expose selectItem/deselectItem/toggleItemSelection/clearSelection directly`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      wrapper.vm.selectItem(`0`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);

      wrapper.vm.selectItem(`1`, true);
      await nextTick();
      expect(wrapper.vm.selectedItems.sort()).toStrictEqual([`0`, `1`]);

      wrapper.vm.deselectItem(`0`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`1`]);

      wrapper.vm.toggleItemSelection(`1`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([]);

      wrapper.vm.toggleItemSelection(`0`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);

      wrapper.vm.clearSelection();
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([]);
    });

    it(`Should apply the vue-grid-item-selected class only to selected items`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      wrapper.vm.selectItem(`0`);
      await nextTick();

      expect(wrapper.find(`[data-grid-item-id="0"]`).classes()).toContain(`vue-grid-item-selected`);
      expect(wrapper.find(`[data-grid-item-id="1"]`).classes()).not.toContain(`vue-grid-item-selected`);
    });

    it(`Should move every other selected item by the same delta when dragging a selected item (group move)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
        { i: `2`, x: 8, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      // Drag item 0 (anchor) from x:0 to x:2 — a delta of +2. Item 1
      // (also selected, not dragged) should move by the same +2. Item
      // 2 (not selected) should stay exactly where it was.
      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      const item2 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `2`);
      expect(item0.x).toBe(2);
      expect(item1.x).toBe(6);
      expect(item2.x).toBe(8);
    });

    it(`Should move every other selected item by the same delta during an in-progress dragmove, not only at dragend`, async () => {
      // Every other group-move test here only ever calls dragstart then
      // dragend directly — never dragmove in between — so the group
      // move logic's own "eventName === DRAG_MOVE" branch specifically
      // (as opposed to reaching the same code via DRAG_END) was never
      // actually exercised. This confirms real-time group move during
      // an active drag, not just the final committed position.
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragmove`, `0`, 3, 0, 2, 2);
      await nextTick();

      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item1.x).toBe(7);
    });

    it(`Should not move other items when only one item is selected (no group to move)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item1.x).toBe(4);
    });

    it(`Should resize every other selected item by the same w/h delta when resizing a selected item (group resize)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 4, 3);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item0.w).toBe(3);
      expect(item0.h).toBe(4);
      expect(item1.w).toBe(3);
      expect(item1.h).toBe(4);
    });

    it(`Should resize every other selected item during an in-progress resizemove, not only at resizeend`, async () => {
      // Every other group-resize test here only ever calls resizestart
      // then resizeend directly — never resizemove in between — so the
      // group resize logic's own "eventName === resizemove" branch
      // specifically (as opposed to reaching the same code via
      // resizeend) was never actually exercised.
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
      wrapper.vm.resizeEvent(`resizemove`, `0`, 0, 0, 3, 3);
      await nextTick();

      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item1.h).toBe(3);
      expect(item1.w).toBe(3);
    });

    it(`Bug fix: should not move a static passenger during group move, even though it's selected`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2, isStatic: true },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item1.x).toBe(4);
    });

    it(`Bug fix: should not move a passenger with isDraggable explicitly false during group move`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2, isDraggable: false },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item1.x).toBe(4);
    });

    it(`Bug fix: should not resize a static or non-resizable passenger during group resize`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2, isStatic: true },
        { i: `2`, x: 8, y: 0, w: 2, h: 2, isResizable: false },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      wrapper.vm.selectItem(`2`, true);
      await nextTick();

      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 4, 3);
      await nextTick();

      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      const item2 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `2`);
      expect(item1.w).toBe(2);
      expect(item1.h).toBe(2);
      expect(item2.w).toBe(2);
      expect(item2.h).toBe(2);
    });

    it(`Bug fix: group resize should clamp to a passenger's own minW/maxW/minH/maxH, not just a hard floor of 1`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 4, h: 4 },
        { i: `1`, x: 4, y: 0, w: 4, h: 4, minW: 3, maxW: 5, minH: 3, maxH: 5 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      // Shrink the anchor by 3 in both dimensions (4 -> 1) — item 1's
      // own minW/minH of 3 should stop it at 3, not follow all the way
      // down to 1 like the anchor does.
      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 4, 4);
      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 1, 1);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item0.w).toBe(1);
      expect(item0.h).toBe(1);
      expect(item1.w).toBe(3);
      expect(item1.h).toBe(3);
    });

    it(`Bug fix: group resize should clamp to a passenger's own maxW/maxH when growing`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2, maxW: 3, maxH: 3 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 6, 6);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item0.w).toBe(6);
      expect(item0.h).toBe(6);
      expect(item1.w).toBe(3);
      expect(item1.h).toBe(3);
    });

    it(`Bug fix: removing a selected item from the layout prunes it from selectedItemIds/selectedItems`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true } });
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();
      expect(wrapper.vm.selectedItems.sort()).toStrictEqual([`0`, `1`]);

      // Simulate a consumer removing item "0" from their own layout
      // array (e.g. via the close button's remove-grid-item event).
      wrapper.vm.layout.splice(
        wrapper.vm.layout.findIndex((entry: { i: string }) => entry.i === `0`),
        1,
      );
      await nextTick();

      expect(wrapper.vm.selectedItems).toStrictEqual([`1`]);
      expect(wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)!.at(-1)).toStrictEqual([[`1`]]);
    });

    it(`Should not prune or emit SELECTION_CHANGED when the layout changes but nothing selected was removed`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true } });
      await nextTick();

      wrapper.vm.selectItem(`0`);
      await nextTick();
      const emittedCountBefore = wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)!.length;

      // Remove item "1", which was never selected.
      wrapper.vm.layout.splice(
        wrapper.vm.layout.findIndex((entry: { i: string }) => entry.i === `1`),
        1,
      );
      await nextTick();

      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);
      expect(wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)!.length).toBe(emittedCountBefore);
    });

    it(`Should be a no-op with no emitted event when clearSelection is called on an already-empty selection`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      expect(wrapper.vm.selectedItems).toStrictEqual([]);
      wrapper.vm.clearSelection();
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)).toBeFalsy();
    });

    it(`Should be a no-op with no emitted event when deselectItem is called on an item that isn't selected`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { multiSelect: true } });
      await nextTick();

      wrapper.vm.selectItem(`0`);
      await nextTick();
      const emittedCountBefore = wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)!.length;

      // "1" was never selected — deselecting it should be a no-op.
      wrapper.vm.deselectItem(`1`);
      await nextTick();

      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);
      expect(wrapper.emitted(EGridLayoutEvent.SELECTION_CHANGED)!.length).toBe(emittedCountBefore);
    });

    it(`Should still allow selectItem/clearSelection to work programmatically even when multiSelect is off`, async () => {
      // The multiSelect prop only gates the click-driven UX
      // (itemClickedHandler/backgroundClickHandler); the exposed
      // methods themselves are a lower-level API a consumer can use
      // regardless.
      const wrapper = mountGrid(basicLayout());
      await nextTick();

      wrapper.vm.selectItem(`0`);
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([`0`]);

      wrapper.vm.clearSelection();
      await nextTick();
      expect(wrapper.vm.selectedItems).toStrictEqual([]);
    });

    it(`Should still respect preventCollision for the anchor item during a group move, while passengers move unconditionally (documented scope)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
        { i: `blocker`, x: 2, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, preventCollision: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      // Drag item "0" onto "blocker"'s space — preventCollision should
      // block the anchor itself.
      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.x).not.toBe(2);
    });

    it(`Should apply group move's delta from the already-snapped anchor position when combined with snapToGrid`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
        { i: `edge`, x: 10, y: 0, w: 2, h: 6 },
      ], { layoutProps: { multiSelect: true, snapThreshold: 2, snapToGrid: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      // Drag item "0" to x:7 — close enough to snap to "edge"'s left
      // edge (x:10) within the threshold of 2.
      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 9, 0, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      // Snapped to x:10, a delta of +10 from its start of 0 — item 1
      // should move by that same, already-snapped delta, not the
      // pre-snap +9.
      expect(item0.x).toBe(10);
      expect(item1.x).toBe(14);
    });

    it(`Should not throw when a selected id's item can't be found at group-move/resize snapshot time (defensive fallback)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`ghost`, true);
      await nextTick();

      expect(() => {
        wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
        wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
        wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
        wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 3, 3);
      }).not.toThrow();
    });

    it(`Should move every other selected item when a keyboard-driven arrow-key move is performed on a selected item (group move)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2 },
      ], { layoutProps: { multiSelect: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.selectItem(`0`);
      wrapper.vm.selectItem(`1`, true);
      await nextTick();

      const item0El = wrapper.find(`[data-grid-item-id="0"]`);
      await item0El.trigger(`keydown`, { key: `ArrowRight` });
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      const item1 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `1`);
      expect(item0.x).toBe(1);
      expect(item1.x).toBe(5);
    });
  });

  describe(`snapToGrid`, () => {
    it(`Should snap the dragged item's position to align with another item's edge, within threshold`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 5, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 6, w: 8, h: 2 },
      ], { layoutProps: { snapThreshold: 2, snapToGrid: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 5, 0, 2, 2);
      // Dragging toward x:2 — within 2 of item `1`'s left edge (x:0).
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 6, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.x).toBe(0);
    });

    it(`Should not snap when nothing is within threshold`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 5, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 6, w: 8, h: 2 },
      ], { layoutProps: { snapThreshold: 1, snapToGrid: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 5, 0, 2, 2);
      // Dragging to x:3 (edges at 3,5) — distance to item `1`'s edges
      // (0, 8) is 3 or 5 either way, comfortably outside threshold:1.
      wrapper.vm.dragEvent(`dragend`, `0`, 3, 6, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.x).toBe(3);
    });

    it(`Should not snap at all when snapToGrid is false (the default)`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 5, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 6, w: 8, h: 2 },
      ], { layoutProps: { compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 5, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 6, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.x).toBe(2);
    });

    it(`Should snap the dragged item's y position independently of x (the remaining untested axis at this integration level)`, async () => {
      // The x-snap test above never exercises the y adjustment branch —
      // its own drag target already shares item "1"'s y, so there's
      // nothing to snap on that axis. This isolates y specifically:
      // item "1"'s bottom edge is at y:2; dragging to y:3 (distance 1,
      // within threshold:2) should snap down to y:2. x stays far from
      // any edge throughout, so no x-snap interferes.
      const wrapper = mountGrid([
        { i: `0`, x: 10, y: 8, w: 2, h: 2 },
        { i: `1`, x: 0, y: 0, w: 2, h: 2 },
      ], { layoutProps: { snapThreshold: 2, snapToGrid: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 10, 8, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 10, 3, 2, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.y).toBe(2);
    });
  });

  describe(`showAlignmentGuides`, () => {
    it(`Should do nothing when showAlignmentGuides is false (the default)`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      // item `1` (x:2) dragged to x:0 would align with item `0` (x:0) —
      // but the feature is off by default, so no guide should appear.
      wrapper.vm.dragEvent(`dragstart`, `1`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragmove`, `1`, 0, 0, 2, 2);
      await nextTick();

      expect(wrapper.vm.alignmentGuides).toStrictEqual([]);
      expect(wrapper.findAll(`.vue-grid-alignment-guide`)).toHaveLength(0);
    });

    it(`Should show a guide when a dragged item's edge aligns with another item's edge`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), { layoutProps: { showAlignmentGuides: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      // item `1` starts at x:2; dragging it to x:0 aligns its left edge
      // with item `0`'s left edge (also x:0).
      wrapper.vm.dragEvent(`dragstart`, `1`, 2, 0, 2, 2);
      wrapper.vm.dragEvent(`dragmove`, `1`, 0, 0, 2, 2);
      await nextTick();

      expect(wrapper.vm.alignmentGuides).toContainEqual({ axis: `x`, position: 0 });
      expect(wrapper.findAll(`.vue-grid-alignment-guide`).length).toBeGreaterThan(0);
    });

    it(`Should clear guides when the drag ends`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { showAlignmentGuides: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `1`, 2, 0, 2, 2);
      wrapper.vm.dragEvent(`dragmove`, `1`, 0, 0, 2, 2);
      await nextTick();
      expect(wrapper.vm.alignmentGuides.length).toBeGreaterThan(0);

      wrapper.vm.dragEvent(`dragend`, `1`, 0, 0, 2, 2);
      await nextTick();
      expect(wrapper.vm.alignmentGuides).toStrictEqual([]);
    });

    it(`Should render guide lines with a pixel position derived from the grid-unit alignment`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { showAlignmentGuides: true, margin: [10, 10], rowHeight: 100 },
      });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `1`, 2, 0, 2, 2);
      wrapper.vm.dragEvent(`dragmove`, `1`, 0, 0, 2, 2);
      await nextTick();

      const guideEl = wrapper.find(`.vue-grid-alignment-guide`);
      expect(guideEl.exists()).toBe(true);
      // x:0 aligned edge -> left offset should just be the margin (10px),
      // matching the same grid-to-pixel formula used elsewhere.
      expect(guideEl.attributes(`style`)).toContain(`left: 10px`);
    });

    it(`Should not show a guide for a drag that doesn't align with anything`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { showAlignmentGuides: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      // item `1` (w:2,h:2) dragged to x:5,y:5 shares neither edge with
      // item `0` (x:0,y:0,w:2,h:2 — edges at 0/2 on both axes).
      wrapper.vm.dragEvent(`dragstart`, `1`, 2, 0, 2, 2);
      wrapper.vm.dragEvent(`dragmove`, `1`, 5, 5, 2, 2);
      await nextTick();

      expect(wrapper.vm.alignmentGuides).toStrictEqual([]);
    });

    it(`Should show a guide during a resize too, using the resized item's live width`, async () => {
      // Distinct from the drag tests above: resizeEvent is a separate
      // code path with its own updateAlignmentGuides call site — l.w/l.h
      // are confirmed already updated by the time it's reached (checked
      // directly, not assumed, since the equivalent assumption for the
      // drag call site turned out to be wrong there).
      const wrapper = mountGrid(basicLayout(), { layoutProps: { showAlignmentGuides: true, compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      // item `0` (x:0,w:2) resized to w:4 -> right edge at x:4, aligning
      // with item `1`'s right edge (x:2,w:2 -> right edge also at 4).
      wrapper.vm.resizeEvent(`resizestart`, `0`, 0, 0, 2, 2);
      wrapper.vm.resizeEvent(`resizemove`, `0`, 0, 0, 2, 4);
      await nextTick();

      expect(wrapper.vm.alignmentGuides).toContainEqual({ axis: `x`, position: 4 });
    });
  });

  describe(`showResizeHandles / resizeHandleColor`, () => {
    it(`Should not set --resize-handle-color when showResizeHandles is false (the default)`, () => {
      const wrapper = mountGrid(basicLayout());
      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).not.toContain(`--resize-handle-color`);
    });

    it(`Should set --resize-handle-color to the configured color when showResizeHandles is true`, () => {
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { resizeHandleColor: `red`, showResizeHandles: true },
      });
      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).toContain(`--resize-handle-color: red`);
    });
  });

  describe(`showGridLines`, () => {
    it(`Should size grid lines to match the actual colNum/rowHeight, not a hardcoded value`, async () => {
      // Regression test for docs/REFACTORING.md #63 — grid line spacing
      // used to be hardcoded to 6 columns / 70px rows regardless of the
      // grid's actual configuration.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { colNum: 4, margin: [10, 10], rowHeight: 100, showGridLines: true },
      });
      await nextTick();
      await nextTick();
      await nextTick();

      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      // colWidth at 1200px/4 cols/10px margin: (1200 - 5*10)/4 = 287.5;
      // column-size = colWidth + margin = 297.5px. row-size = rowHeight + margin = 110px.
      expect(style).toContain(`--grid-line-column-size: 297.5px`);
      expect(style).toContain(`--grid-line-row-size: 110px`);
    });

    it(`Should react when colNum/rowHeight change after mount`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { colNum: 4, margin: [10, 10], rowHeight: 100, showGridLines: true },
      });
      await nextTick();
      await nextTick();
      await nextTick();

      await wrapper.setProps({ colNum: 6, rowHeight: 50 });
      await nextTick();

      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      // colWidth at 1200px/6 cols/10px margin: (1200 - 7*10)/6 = 188.33...
      expect(style).toContain(`--grid-line-row-size: 60px`);
      expect(style).not.toContain(`--grid-line-row-size: 110px`);
    });

    it(`Should fall back to a safe 1px pattern (not throw) before the container is measured`, () => {
      // calcColWidth throws on an unmeasured/zero width — this guards
      // against that the same way alignmentGuideStyles does.
      expect(() => mountGrid(basicLayout(), { layoutProps: { showGridLines: true } })).not.toThrow();

      const wrapper = mountGrid(basicLayout(), { layoutProps: { showGridLines: true } });
      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).toContain(`--grid-line-column-size: 1px`);
      expect(style).toContain(`--grid-line-row-size: 1px`);
    });

    it(`Should apply the "grid" class only when showGridLines is true`, () => {
      const withLines = mountGrid(basicLayout(), { layoutProps: { showGridLines: true } });
      const withoutLines = mountGrid(basicLayout(), { layoutProps: { showGridLines: false } });

      expect(withLines.find(`.vue-grid-layout`).classes()).toContain(`grid`);
      expect(withoutLines.find(`.vue-grid-layout`).classes()).not.toContain(`grid`);
    });
  });

  describe(`transitionDurationMs / transitionTimingFunction`, () => {
    it(`Should apply the default duration/timing as CSS custom properties`, () => {
      const wrapper = mountGrid(basicLayout());

      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).toContain(`--grid-transition-duration: 200ms`);
      expect(style).toContain(`--grid-transition-timing: ease`);
    });

    it(`Should apply custom duration/timing as CSS custom properties`, () => {
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { transitionDurationMs: 500, transitionTimingFunction: `ease-out` },
      });

      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).toContain(`--grid-transition-duration: 500ms`);
      expect(style).toContain(`--grid-transition-timing: ease-out`);
    });

    it(`Should react when transitionDurationMs/transitionTimingFunction change after mount`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();

      await wrapper.setProps({ transitionDurationMs: 750, transitionTimingFunction: `linear` });
      await nextTick();

      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).toContain(`--grid-transition-duration: 750ms`);
      expect(style).toContain(`--grid-transition-timing: linear`);
    });

    it(`Should still apply the height transition alongside the custom properties (mergeStyle isn't clobbered)`, async () => {
      // Regression coverage: transitionStyle is a separate computed from
      // mergeStyle (which owns `height`), bound together in the template
      // as an array — confirms neither accidentally overwrites the
      // other's style properties.
      const wrapper = mountGrid(basicLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      const style = wrapper.find(`.vue-grid-layout`).attributes(`style`) ?? ``;
      expect(style).toContain(`--grid-transition-duration`);
      expect(style).toContain(`height:`);
    });
  });

  describe(`exposed props reactivity`, () => {
    it(`Should reflect a wholesale layout reassignment (not just in-place mutation) via the exposed layout`, async () => {
      // Regression test for docs/REFACTORING.md #65 — defineExpose used
      // to spread props with a plain {...props}, which captures each
      // prop's value once at expose time. In-place mutations to the
      // same array (e.g. a drag) stayed visible through that stale
      // reference, but a wholesale reassignment (v-model:layout set to
      // a brand new array — exactly what useLayoutStorage's load() does)
      // did not, leaving wrapper.vm.layout permanently stuck on
      // whatever array was current at expose time.
      const wrapper = mountGrid(basicLayout());
      await nextTick();

      expect(wrapper.vm.layout).toStrictEqual(basicLayout());

      const replacement = [{ h: 3, i: `new`, w: 3, x: 1, y: 1 }];
      await wrapper.setProps({ layout: replacement });
      await nextTick();

      expect(wrapper.vm.layout).toStrictEqual(replacement);
    });

    it(`Should still reflect in-place mutations to the layout array (the case that already worked)`, async () => {
      const layout = basicLayout();
      const wrapper = mountGrid(layout);
      await nextTick();

      layout[0].x = 5;
      await nextTick();

      expect(wrapper.vm.layout[0].x).toBe(5);
    });
  });

  describe(`prop watchers`, () => {
    it.each([
      [`colNum`, 6],
      [`rowHeight`, 200],
      [`isDraggable`, false],
      [`isResizable`, false],
      [`isBounded`, true],
      [`isMirrored`, true],
      [`transformScale`, 2],
      [`maxRows`, 4],
    ])(`Should not throw when %s changes after mount`, async (prop, value) => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      await expect(wrapper.setProps({ [prop]: value })).resolves.not.toThrow();
    });

    it(`Should re-emit the current layout and reset colNum when responsive is turned off`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { responsive: true, colNum: 8 } });
      await nextTick();
      await nextTick();
      await nextTick();

      const callsBeforeToggle = wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATE)?.length ?? 0;

      await wrapper.setProps({ responsive: false });
      await nextTick();

      // Strictly more calls than before the toggle — not just "at least
      // one exists somewhere," which could otherwise pass from an
      // unrelated LAYOUT_UPDATE emitted during mount rather than this
      // specific watcher actually firing.
      const updateCalls = wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATE);
      expect(updateCalls?.length ?? 0).toBeGreaterThan(callsBeforeToggle);
    });

    it(`Should emit an empty array (not throw) when responsive is turned off and originalLayout is falsy`, async () => {
      // originalLayout.value || [] — the fallback side, distinct from
      // the test above where originalLayout.value is already populated
      // (truthy) by the time the toggle runs, so that test alone never
      // actually exercises the `|| []` fallback itself.
      const wrapper = mountGrid(basicLayout(), { layoutProps: { responsive: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.originalLayout = undefined;

      await wrapper.setProps({ responsive: false });
      await nextTick();

      const updateCalls = wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATE);
      expect(updateCalls?.at(-1)).toStrictEqual([[]]);
    });

    it(`Should not throw when responsive is turned on (the other side of the same watcher)`, async () => {
      // Not asserting on LAYOUT_UPDATE's exact emit count here — unlike
      // the "turned off" case above, turning responsive *on* triggers
      // other, independent parts of the responsive-layout system
      // (initResponsiveFeatures and friends) that can also emit
      // LAYOUT_UPDATE for their own reasons, confounding a count-based
      // assertion specifically about this watcher's own conditional
      // branch. Reaching this branch at all (the `!val` check's false
      // side, skipping the emit block) is what this test is for.
      const wrapper = mountGrid(basicLayout(), { layoutProps: { responsive: false } });
      await nextTick();
      await nextTick();
      await nextTick();

      await expect(wrapper.setProps({ responsive: true })).resolves.not.toThrow();
    });
  });

  describe(`dragEvent (internal, exercised via the exposed method)`, () => {
    it(`Should emit MOVE_BLOCKED_BY_COLLISION when preventCollision fully blocks a drag`, async () => {
      // item `0` (x:0,w:2) dragged to x:2 would land exactly on item `1`
      // (x:2,w:2) — preventCollision blocks this entirely, item `0` stays
      // at x:0.
      const wrapper = mountGrid(basicLayout(), { layoutProps: { preventCollision: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 2, 0, 2, 2);
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.MOVE_BLOCKED_BY_COLLISION)).toStrictEqual([[`0`]]);
      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.x).toBe(0);
    });

    it(`Should not emit MOVE_BLOCKED_BY_COLLISION when a drag succeeds without preventCollision`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { preventCollision: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      // x:0 -> x:0 is not actually a move attempt at all.
      wrapper.vm.dragEvent(`dragend`, `0`, 0, 0, 2, 2);
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.MOVE_BLOCKED_BY_COLLISION)).toBeFalsy();
    });

    it(`Should fall back to a zeroed item when the dragged id is not found in the layout`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      expect(() => wrapper.vm.dragEvent(`dragstart`, `does-not-exist`, 0, 0, 2, 2)).not.toThrow();
    });

    it(`Should no-op when called with no id at all (mirrors resizeEvent's guard)`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      expect(() => wrapper.vm.dragEvent()).not.toThrow();
    });

    it(`Should take the default branch when the eventName does not match a known drag phase`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      expect(() => wrapper.vm.dragEvent(undefined, `0`, 1, 1, 2, 2)).not.toThrow();
    });

    it(`Should snapshot positions and emit DRAG_START when compactType is NONE`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.DRAG_START)).toBeTruthy();
    });

    it(`Should emit DRAG_START exactly once, with the correct item id, when compactType is NONE`, async () => {
      // Regression test: this used to also emit a second, hardcoded
      // DRAG_START(1) immediately before the real one whenever
      // compactType was NONE (formerly `verticalCompact: false`) — see
      // docs/REFACTORING.md #32. Using
      // an id other than "1" here specifically catches a regression back
      // to the hardcoded value, not just "some id was emitted".
      const wrapper = mountGrid(basicLayout(), { layoutProps: { compactType: ECompactType.NONE } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `1`, 0, 0, 2, 2);
      await nextTick();

      const calls = wrapper.emitted(EGridLayoutEvent.DRAG_START);
      expect(calls).toHaveLength(1);
      expect(calls?.[0]).toStrictEqual([`1`]);
    });

    it(`Should mark the placeholder as not dragging when the target position collides with a static item`, async () => {
      // Regression test for docs/REFACTORING.md #70 — this collision
      // check previously used the placeholder's own x/y, which still
      // mirrored the item's stale pre-drag position at this point in
      // dragEvent (moveElement(), later in the same function, is what
      // actually updates it). A position an item already validly
      // occupies can never collide with anything by definition, so the
      // check silently always took the no-collision branch regardless
      // of where the drag target actually was — this exact test existed
      // before the fix too, but only asserted `not.toThrow()`, which
      // passed either way and never caught it.
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2, isStatic: true },
      ]);
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      await nextTick();
      wrapper.vm.dragEvent(`dragmove`, `0`, 4, 0, 2, 2);
      await nextTick();
      await nextTick();

      expect(wrapper.vm.isDragging).toBe(false);
    });

    it(`Should keep isDragging true when the drag target doesn't collide with any static item`, async () => {
      const wrapper = mountGrid([
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 4, y: 0, w: 2, h: 2, isStatic: true },
      ]);
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      await nextTick();
      // x:8 doesn't overlap the static item at x:4-6.
      wrapper.vm.dragEvent(`dragmove`, `0`, 8, 0, 2, 2);
      await nextTick();
      await nextTick();

      expect(wrapper.vm.isDragging).toBe(true);
    });

    it(`Should keep the moved item static during compaction and emit DRAG_END events when restoreOnDrag is true`, async () => {
      const wrapper = mountGrid(basicLayout(), { layoutProps: { restoreOnDrag: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `0`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `0`, 1, 0, 2, 2);
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.DRAG_END)).toBeTruthy();
      expect(wrapper.emitted(EGridLayoutEvent.LAYOUT_UPDATED)).toBeTruthy();
    });

    it(`Should emit DRAG_END exactly once, with the correct item id`, async () => {
      // Regression test: dragend used to also emit a second, hardcoded
      // DRAG_END(1) at the very end of dragEvent(), after the correct one
      // already sent earlier in the same call via the switch statement —
      // see docs/REFACTORING.md #32. Using an id other than "1" here
      // specifically catches a regression back to the hardcoded value.
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.dragEvent(`dragstart`, `1`, 0, 0, 2, 2);
      wrapper.vm.dragEvent(`dragend`, `1`, 2, 0, 2, 2);
      await nextTick();

      const calls = wrapper.emitted(EGridLayoutEvent.DRAG_END);
      expect(calls).toHaveLength(1);
      expect(calls?.[0]).toStrictEqual([`1`]);
    });
  });

  describe(`resizeEvent (internal, exercised via the exposed method)`, () => {
    it(`Should no-op when called with no id at all`, async () => {
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      expect(() => wrapper.vm.resizeEvent()).not.toThrow();
    });

    it(`Should not throw when called with a valid-looking id that isn't in the current layout`, async () => {
      // getLayoutItem() returns undefined (rather than throwing) for a
      // structurally-valid id that just isn't present — a plausible
      // stale reference to an item already removed from the layout.
      // resizeEvent() falls back to a zero-sized placeholder item
      // rather than crashing on the undefined.
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      expect(() => wrapper.vm.resizeEvent(`resizemove`, `does-not-exist`, 0, 0, 2, 2)).not.toThrow();
    });

    it(`Should clamp width to the collision boundary when preventCollision is enabled`, async () => {
      // item `0` (x:0,w:2) growing to w:4 would overlap item `1` (x:2,w:2)
      // — this exercises GridLayout.vue's resizeEvent() preventCollision
      // branch, previously untested (see docs/REFACTORING.md).
      const wrapper = mountGrid(basicLayout(), { layoutProps: { preventCollision: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 2, 4);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      // Clamped to the collision boundary (item `1` starts at x:2), not
      // grown all the way to the requested w:4.
      expect(item0.w).toBe(2);
      expect(wrapper.emitted(EGridLayoutEvent.MOVE_BLOCKED_BY_COLLISION)).toStrictEqual([[`0`]]);
    });

    it(`Should clamp height to the collision boundary when preventCollision is enabled and the colliding item is below, not beside`, async () => {
      // Distinct from the width-collision test above: that one only
      // exercises the leastX side of this branch (the colliding item is
      // to the right, same row). This one collides with an item below
      // instead, exercising the matching leastY computation and height
      // clamp — the same "adjust to maximum allowed space" logic, the
      // other axis.
      const stackedLayout = [
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { i: `1`, x: 0, y: 4, w: 2, h: 2 },
      ];
      const wrapper = mountGrid(stackedLayout, {
        layoutProps: { preventCollision: true, compactType: ECompactType.NONE },
      });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 6, 2);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      // Clamped to the collision boundary (item `1` starts at y:4), not
      // grown all the way to the requested h:6.
      expect(item0.h).toBe(4);
    });

    it(`Should grow freely past where another item used to be once preventCollision allows it`, async () => {
      // Same setup as above but without preventCollision — width should
      // apply as requested, with the other item compacted out of the way
      // instead of the resize being blocked.
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 2, 4);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.w).toBe(4);
    });

    it(`Should apply a resize as requested when preventCollision is on but the resize doesn't actually collide with anything`, async () => {
      // Every other preventCollision resize test here has an actual
      // collision to clamp against — this specifically exercises the
      // other side: preventCollision on, but shrinking (not growing)
      // means there's genuinely nothing to collide with, so the
      // requested size should apply exactly as asked.
      const wrapper = mountGrid(basicLayout(), { layoutProps: { preventCollision: true } });
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.resizeEvent(`resizeend`, `0`, 0, 0, 1, 1);
      await nextTick();

      const item0 = wrapper.vm.layout.find((entry: { i: string }) => entry.i === `0`);
      expect(item0.w).toBe(1);
      expect(item0.h).toBe(1);
    });
  });

  it(`Should expose dragEvent, width and layouts for GridItem/consumer access`, () => {
    const wrapper = mountGrid(basicLayout());

    expect(typeof wrapper.vm.dragEvent).toBe(`function`);
    expect(wrapper.vm.layout).toStrictEqual(basicLayout());
  });

  it(`Should compute a taller container for a layout with a lower bottom edge`, async () => {
    const tallerLayout = [
      { i: `0`, x: 0, y: 0, w: 2, h: 2 },
      { i: `1`, x: 2, y: 4, w: 2, h: 2 }, // bottom edge at y+h = 6, vs. 2 for basicLayout()
    ];
    const wrapper = mountGrid(tallerLayout, {
      layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE },
    });
    await nextTick();
    await nextTick();
    await nextTick();

    // bottom y-coordinate is 6 -> 6 * (100 + 10) + 10 = 670px
    expect(wrapper.find(`.vue-grid-layout`).attributes(`style`)).toContain(`height: 670px`);
  });

  it(`Should call observe() on the ResizeObserver instance after mount`, async () => {
    const wrapper = mountGrid(basicLayout());
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    expect(wrapper.vm.erd).toBeTruthy();
    expect(wrapper.vm.erd.observe).toHaveBeenCalledWith(wrapper.element);
  });

  it(`Should re-run onWindowResize when the ResizeObserver's own callback fires`, async () => {
    // The global ResizeObserverMock (tests/setup.ts) is a no-op stub —
    // it never actually invokes the callback passed to its constructor,
    // since jsdom has no real layout engine to observe resizes from.
    // Overriding it locally here to capture that callback and invoke it
    // directly is the only way to exercise it — confirmed genuinely
    // uncovered otherwise even after 5 nextTicks (checked directly, not
    // assumed slow to settle), since observe() itself firing is a
    // separate statement from what its own callback does once invoked.
    let capturedCallback: (() => void) | undefined;
    const originalResizeObserver = globalThis.ResizeObserver;
    // Bug fix (Vitest 4): `vi.fn().mockImplementation(...)` used to work
    // as a stand-in constructor here (a mock function returning an
    // object, called via `new`, is valid plain JS — `new` uses the
    // returned object instead of `this`). Vitest 4's `vi.fn()` is no
    // longer constructable at all ("... is not a constructor"), so this
    // needs a real class now, matching `tests/setup.ts`'s own
    // `ResizeObserverMock` pattern, not a mocked function pretending to
    // be one.
    class CapturingResizeObserverMock {
      constructor(cb: () => void) {
        capturedCallback = cb;
      }
      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
    }
    globalThis.ResizeObserver = CapturingResizeObserverMock as unknown as typeof ResizeObserver;

    try {
      stubOffsetWidth(1200);
      mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();
      await nextTick();
      await nextTick();

      expect(capturedCallback).toBeDefined();
      expect(() => capturedCallback!()).not.toThrow();
    } finally {
      globalThis.ResizeObserver = originalResizeObserver;
      restoreOffsetWidth();
    }
  });

  it(`Should uninstall the resize-detector and remove listeners on unmount`, async () => {
    const wrapper = mountGrid(basicLayout());
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();
    await nextTick();

    // `not.toThrow()` alone would still pass even if `erd.value` were
    // never set (the `if(erd.value)` guard would just skip disconnect()
    // silently) — confirming it's actually truthy first, and that
    // disconnect() is genuinely called, is what actually exercises this
    // cleanup path rather than just not crashing regardless of it.
    expect(wrapper.vm.erd).toBeTruthy();
    const disconnectSpy = vi.spyOn(wrapper.vm.erd, `disconnect`);

    expect(() => wrapper.unmount()).not.toThrow();
    expect(disconnectSpy).toHaveBeenCalled();
  });

  describe(`allowOutsideDrop`, () => {
    const stubRect = (wrapper: ReturnType<typeof mountGrid>): void => {
      (wrapper.element as HTMLElement).getBoundingClientRect = () =>
        ({ bottom: 300, height: 300, left: 0, right: 1200, top: 0, width: 1200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    };

    const dragEventAt = (type: string, x: number, y: number): MouseEvent => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y });
      Object.defineProperty(event, `dataTransfer`, { configurable: true, value: { getData: () => `payload` } });
      return event;
    };

    afterEach(() => {
      restoreOffsetWidth();
    });

    it(`Should do nothing when allowOutsideDrop is false (the default)`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await nextTick();
      stubRect(wrapper);

      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 150));
      await nextTick();

      // No listener is attached at all when the prop is off — dragover
      // doing nothing means isDragging never gets set to true, and drop
      // never gets the chance to emit anything either.
      expect(wrapper.vm.isDragging).toBe(false);
      expect(wrapper.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)).toBeFalsy();
    });

    it(`Should show the live placeholder at the resolved grid position while an outside drag hovers, sized to outsideDropWidth/Height`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], outsideDropHeight: 3, outsideDropWidth: 4, rowHeight: 100 },
      });
      await nextTick();
      stubRect(wrapper);

      // colWidth for 1200px/12 cols/10px margin ≈ 89px; clientX 300 lands a few columns in.
      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
      await nextTick();

      expect(wrapper.vm.placeholder.w).toBe(4);
      expect(wrapper.vm.placeholder.h).toBe(3);
      expect(wrapper.vm.isDragging).toBe(true);
    });

    describe(`outsideDropAccept`, () => {
      it(`Should show the placeholder and accept the drop when outsideDropAccept returns true`, async () => {
        stubOffsetWidth(1200);
        const wrapper = mountGrid(basicLayout(), {
          layoutProps: { allowOutsideDrop: true, margin: [10, 10], outsideDropAccept: () => true, rowHeight: 100 },
        });
        await nextTick();
        stubRect(wrapper);

        wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
        await nextTick();
        expect(wrapper.vm.isDragging).toBe(true);

        wrapper.element.dispatchEvent(dragEventAt(`drop`, 300, 220));
        await nextTick();
        expect(wrapper.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)).toBeTruthy();
      });

      it(`Should not show the placeholder or accept the drop when outsideDropAccept returns false`, async () => {
        stubOffsetWidth(1200);
        const wrapper = mountGrid(basicLayout(), {
          layoutProps: { allowOutsideDrop: true, margin: [10, 10], outsideDropAccept: () => false, rowHeight: 100 },
        });
        await nextTick();
        stubRect(wrapper);

        wrapper.element.dispatchEvent(dragEventAt(`dragenter`, 300, 220));
        wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
        await nextTick();
        expect(wrapper.vm.isDragging).toBe(false);

        wrapper.element.dispatchEvent(dragEventAt(`drop`, 300, 220));
        await nextTick();
        expect(wrapper.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)).toBeFalsy();
      });

      it(`Should receive the native DataTransfer so it can check dataTransfer.types`, async () => {
        stubOffsetWidth(1200);
        const acceptSpy = vi.fn().mockReturnValue(true);
        const wrapper = mountGrid(basicLayout(), {
          layoutProps: { allowOutsideDrop: true, margin: [10, 10], outsideDropAccept: acceptSpy, rowHeight: 100 },
        });
        await nextTick();
        stubRect(wrapper);

        wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
        await nextTick();

        expect(acceptSpy).toHaveBeenCalledWith(expect.objectContaining({ getData: expect.any(Function) }));
      });
    });

    it(`Should emit ITEM_DROPPED_FROM_OUTSIDE with the resolved position, size, and dataTransfer on drop`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], rowHeight: 100 },
      });
      await nextTick();
      stubRect(wrapper);

      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
      await nextTick();
      wrapper.element.dispatchEvent(dragEventAt(`drop`, 300, 220));
      await nextTick();

      const calls = wrapper.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE);
      expect(calls).toHaveLength(1);
      const payload = calls?.[0][0] as { x: number; y: number; w: number; h: number; dataTransfer: { getData: () => string } };
      expect(payload.w).toBe(2);
      expect(payload.h).toBe(2);
      expect(payload.dataTransfer.getData()).toBe(`payload`);
      expect(wrapper.vm.isDragging).toBe(false);
    });

    it(`Should not add anything to layout on its own — only the consumer's own handler decides that`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], rowHeight: 100 },
      });
      await nextTick();
      stubRect(wrapper);
      const lengthBefore = wrapper.vm.layout.length;

      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
      wrapper.element.dispatchEvent(dragEventAt(`drop`, 300, 220));
      await nextTick();

      expect(wrapper.vm.layout).toHaveLength(lengthBefore);
    });

    it(`Should hide the placeholder once dragleave balances out every dragenter, but not before`, async () => {
      // The enter-count workaround for dragenter/dragleave firing on
      // every child element a drag passes over: entering twice (e.g.
      // once for the grid, once bubbling from a child) must not hide
      // the placeholder after only one matching dragleave.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], rowHeight: 100 },
      });
      await nextTick();
      stubRect(wrapper);

      wrapper.element.dispatchEvent(dragEventAt(`dragenter`, 300, 220));
      wrapper.element.dispatchEvent(dragEventAt(`dragenter`, 300, 220));
      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
      await nextTick();
      expect(wrapper.vm.isDragging).toBe(true);

      wrapper.element.dispatchEvent(dragEventAt(`dragleave`, 300, 220));
      await nextTick();
      expect(wrapper.vm.isDragging).toBe(true);

      wrapper.element.dispatchEvent(dragEventAt(`dragleave`, 300, 220));
      await nextTick();
      expect(wrapper.vm.isDragging).toBe(false);
    });

    it(`Should stop listening once allowOutsideDrop is toggled off reactively`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], rowHeight: 100 },
      });
      await nextTick();
      stubRect(wrapper);

      await wrapper.setProps({ allowOutsideDrop: false });
      await nextTick();

      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
      wrapper.element.dispatchEvent(dragEventAt(`drop`, 300, 220));
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)).toBeFalsy();
    });

    it(`Should start listening once allowOutsideDrop is toggled on reactively`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(basicLayout(), {
        layoutProps: { margin: [10, 10], rowHeight: 100 },
      });
      await nextTick();
      stubRect(wrapper);

      await wrapper.setProps({ allowOutsideDrop: true });
      await nextTick();

      wrapper.element.dispatchEvent(dragEventAt(`dragover`, 300, 220));
      wrapper.element.dispatchEvent(dragEventAt(`drop`, 300, 220));
      await nextTick();

      expect(wrapper.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)).toBeTruthy();
    });

    it(`Should respect compactType for an item the consumer adds from the emitted drop position — pulled up when VERTICAL, left in its dropped gap when NONE`, async () => {
      // The emitted x/y is just where the pointer was — same as any
      // other item's own x/y, once the consumer's own handler pushes
      // it into layout it goes through the exact same compaction path
      // as any other layout change, including respecting
      // compactType. Reported as "h/v compact toggle" missing from
      // the outside-drop examples — this confirms the underlying
      // behavior itself is already correct; docs/REFACTORING.md notes
      // adding the toggle to the examples themselves so this is
      // actually visible/testable there too.
      const compactLayout = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], rowHeight: 100, compactType: ECompactType.VERTICAL },
      });
      await nextTick();
      stubRect(compactLayout);
      // clientY 550 resolves to y:5 — well below the existing items
      // (y:0-1), leaving a real gap for compaction to pull it into.
      compactLayout.element.dispatchEvent(dragEventAt(`dragover`, 300, 550));
      compactLayout.element.dispatchEvent(dragEventAt(`drop`, 300, 550));
      await nextTick();
      const droppedAtGap = compactLayout.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)?.[0][0] as { x: number; y: number; w: number; h: number };
      expect(droppedAtGap.y).toBe(5);
      await compactLayout.setProps({
        layout: [...basicLayout(), { h: droppedAtGap.h, i: `dropped`, w: droppedAtGap.w, x: droppedAtGap.x, y: droppedAtGap.y }],
      });
      await nextTick();
      const settledCompact = compactLayout.vm.layout.find((entry: { i: string }) => entry.i === `dropped`);
      expect(settledCompact.y).toBe(2);

      const noCompactLayout = mountGrid(basicLayout(), {
        layoutProps: { allowOutsideDrop: true, margin: [10, 10], rowHeight: 100, compactType: ECompactType.NONE },
      });
      await nextTick();
      stubRect(noCompactLayout);
      noCompactLayout.element.dispatchEvent(dragEventAt(`dragover`, 300, 550));
      noCompactLayout.element.dispatchEvent(dragEventAt(`drop`, 300, 550));
      await nextTick();
      const droppedNoCompact = noCompactLayout.emitted(EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE)?.[0][0] as { x: number; y: number; w: number; h: number };
      await noCompactLayout.setProps({
        layout: [...basicLayout(), { h: droppedNoCompact.h, i: `dropped`, w: droppedNoCompact.w, x: droppedNoCompact.x, y: droppedNoCompact.y }],
      });
      await nextTick();
      const settledNoCompact = noCompactLayout.vm.layout.find((entry: { i: string }) => entry.i === `dropped`);
      expect(settledNoCompact.y).toBe(5);
    });

    it(`Should not throw when refsLayout is falsy while toggling allowOutsideDrop (setOutsideDropEnabled's defensive branch)`, async () => {
      // refsLayout starts as an always-truthy placeholder object (never
      // actually null/undefined in normal usage), so this guard isn't
      // reachable through any normal mount sequence — exposed via
      // defineExpose, so directly settable here to exercise it.
      const wrapper = mountGrid(basicLayout());
      await nextTick();
      await nextTick();
      await nextTick();
      await nextTick();
      await nextTick();

      wrapper.vm.refsLayout = null;

      await expect(wrapper.setProps({ allowOutsideDrop: true })).resolves.not.toThrow();
      await expect(wrapper.setProps({ allowOutsideDrop: false })).resolves.not.toThrow();
    });
  });
});
