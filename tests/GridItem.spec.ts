// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick, reactive } from 'vue';
import { mount } from '@vue/test-utils';
import { EGridItemEvent } from '../src/core/griditem/enums/EGridItemEvents';
import { ECompactType } from '../src/core/gridlayout/enums/ECompactType';
import { GridItem, GridLayout, ILayoutItem } from '../src/components';
import { mountGrid, mountGridWithReactiveItem, restoreOffsetWidth, stubOffsetWidth } from './helpers/mountGrid';

const settle = async (): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    // eslint-disable-next-line no-await-in-loop
    await nextTick();
  }
};

const singleItemLayout = () => [{ i: `0`, x: 0, y: 0, w: 2, h: 2 }];

/**
 * Invokes the native drag/resize engine's own registered handler
 * directly (`handleDrag`/`handleResize` in the respective composable) —
 * the test-only `__nativeDragHandler`/`__nativeResizeHandler` hooks
 * `native-interaction.ts` stashes on the element are how tests reach
 * that handler without simulating a full pointerdown/move/up sequence
 * (including the drag-activation threshold) for every single assertion.
 * What's actually under test in this file is the composables' own
 * position/size math, RTL handling, and clamping — not the generic
 * pointer-event wiring itself, which is covered separately (both by
 * e2e, and structurally simple enough not to need per-assertion
 * coverage here).
 */
const dispatchDragEvent = (
  target: Element,
  type: `dragstart` | `dragmove` | `dragend`,
  overrides: Record<string, unknown> = {},
) => {
  Object.defineProperty(target, `offsetParent`, { configurable: true, value: document.body });
  document.body.getBoundingClientRect = () => ({
    bottom: 0, height: 0, left: 0, right: 0, toJSON: () => ({}), top: 0, width: 0, x: 0, y: 0,
  });
  (target as HTMLElement).getBoundingClientRect = () => ({
    bottom: 100, height: 95, left: 5, right: 100, toJSON: () => ({}), top: 5, width: 95, x: 5, y: 5,
  });

  const handler = (target as unknown as { __nativeDragHandler: (event: unknown) => void }).__nativeDragHandler;
  handler({ clientX: 0, clientY: 0, target, type, ...overrides });
};

const dispatchResizeEvent = (
  target: Element,
  type: `resizestart` | `resizemove` | `resizeend`,
  overrides: Record<string, unknown> = {},
) => {
  Object.defineProperty(target, `offsetParent`, { configurable: true, value: document.body });
  document.body.getBoundingClientRect = () => ({
    bottom: 0, height: 0, left: 0, right: 0, toJSON: () => ({}), top: 0, width: 0, x: 0, y: 0,
  });

  const handler = (target as unknown as { __nativeResizeHandler: (event: unknown) => void }).__nativeResizeHandler;
  handler({
    clientX: 0,
    clientY: 0,
    edges: { bottom: true, left: false, right: true, top: false },
    target,
    type,
    ...overrides,
  });
};

describe(`GridItem`, () => {
  afterEach(() => {
    restoreOffsetWidth();
  });

  describe(`rendering`, () => {
    it(`Should render custom #resize-handle slot content inside each of the 8 edge/corner spans, with the correct edge scoped prop`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        resizeHandleSlot: ({ edge }) => h(`i`, { class: `custom-handle-icon` }, edge),
      });
      await settle();

      const edges = [`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`];
      edges.forEach((edge) => {
        const hint = wrapper.find(`.vue-resize-hint--${edge}`);
        expect(hint.exists()).toBe(true);
        const icon = hint.find(`.custom-handle-icon`);
        expect(icon.exists()).toBe(true);
        expect(icon.text()).toBe(edge);
      });
    });

    it(`Should render the default (empty) resize hints when no #resize-handle slot is provided`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const hint = wrapper.find(`.vue-resize-hint--se`);
      expect(hint.exists()).toBe(true);
      expect(hint.element.children.length).toBe(0);
    });

    it(`Should default to editable (draggable/resizable classes present) when neither GridItem nor GridLayout override enableEditMode`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).toContain(`vue-draggable`);
      expect(item.classes()).toContain(`vue-resizable`);
    });

    it(`Should disable drag/resize for every item when GridLayout's own enableEditMode is false`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { enableEditMode: false } });
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).not.toContain(`vue-draggable`);
      expect(item.classes()).not.toContain(`vue-resizable`);
    });

    it(`Should let a specific GridItem's own enableEditMode override GridLayout's grid-wide false default`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { enableEditMode: true },
        layoutProps: { enableEditMode: false },
      });
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).toContain(`vue-draggable`);
      expect(item.classes()).toContain(`vue-resizable`);
    });

    it(`Should let a specific GridItem's own enableEditMode override GridLayout's grid-wide true default`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { enableEditMode: false },
        layoutProps: { enableEditMode: true },
      });
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).not.toContain(`vue-draggable`);
      expect(item.classes()).not.toContain(`vue-resizable`);
    });

    it(`Should render the default English ARIA/UI strings when ariaLabels isn't set`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { showCloseButton: true } });
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.attributes(`aria-roledescription`)).toBe(`Draggable, resizable item`);
      expect(item.text()).toContain(`Press arrow keys to move.`);
      expect(item.text()).toContain(`Press shift plus arrow keys to resize.`);
      expect(item.find(`.btn-close .visually-hidden`).text()).toBe(`Close`);
    });

    it(`Should use GridLayout's ariaLabels as a grid-wide override`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        layoutProps: { ariaLabels: { itemRoleDescription: `Elemento arrastrable`, moveInstruction: `Presiona las flechas para mover.` } },
      });
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.attributes(`aria-roledescription`)).toBe(`Elemento arrastrable`);
      expect(item.text()).toContain(`Presiona las flechas para mover.`);
      // Unset keys still fall back to the built-in English default.
      expect(item.text()).toContain(`Press shift plus arrow keys to resize.`);
    });

    it(`Should let a specific GridItem's own ariaLabels override GridLayout's grid-wide ones`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { ariaLabels: { moveInstruction: `Item-specific move text` } },
        layoutProps: { ariaLabels: { moveInstruction: `Grid-wide move text` } },
      });
      await settle();

      expect(wrapper.find(`.vue-grid-item`).text()).toContain(`Item-specific move text`);
    });

    it(`Should render the closeButton override in the close button's visually-hidden label`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { ariaLabels: { closeButton: `Cerrar` }, showCloseButton: true },
      });
      await settle();

      expect(wrapper.find(`.btn-close .visually-hidden`).text()).toBe(`Cerrar`);
    });

    it(`Should not set --resize-handle-color when showResizeHandles is null (default, inherit from GridLayout)`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).not.toContain(`--resize-handle-color`);
    });

    it(`Should set --resize-handle-color to the item's own color when showResizeHandles is explicitly true`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { resizeHandleColor: `blue`, showResizeHandles: true },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).toContain(`--resize-handle-color: blue`);
    });

    it(`Should fall back to the default resize-handle color when showResizeHandles is true but no color is set`, async () => {
      // The test above only ever exercises resizeHandleColor being
      // explicitly set — this isolates the other side of that same
      // `?? default` fallback.
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { showResizeHandles: true },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).toContain(`--resize-handle-color: rgb(94 94 94 / 45%)`);
    });

    it(`Should set --resize-handle-color to transparent when showResizeHandles is explicitly false, overriding a grid-level true default`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { showResizeHandles: false },
        layoutProps: { showResizeHandles: true },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).toContain(`--resize-handle-color: transparent`);
    });

    it(`Should apply draggable/resizable classes by default`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).toContain(`vue-draggable`);
      expect(item.classes()).toContain(`vue-resizable`);
    });

    it(`Should not apply draggable/resizable classes for a static item`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isStatic: true } });
      await settle();

      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).toContain(`vue-static`);
      expect(item.classes()).not.toContain(`vue-draggable`);
      expect(item.classes()).not.toContain(`vue-resizable`);
    });

    it(`Should render the eight resize cursor hint elements when the item is resizable`, async () => {
      // Regression test: hovering a resizable item previously showed no
      // visual affordance at all — the item body used the same cursor
      // everywhere, and the CSS meant to show a corner resize icon had
      // no corresponding template element to apply to. These hint
      // elements are purely cursor affordance (interact.js's own resize
      // activation is edge-proximity based, independent of any specific
      // element) — see docs/REFACTORING.md #42.
      //
      // Scoped to exclude .vue-grid-placeholder — GridLayout's own
      // internal drag-preview GridItem (always present in the DOM) is
      // also resizable-and-not-static by default, so it renders its own
      // eight hint elements too; a plain `.vue-resize-hint` selector
      // would count both items' worth (16), not just the real one's.
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const hints = wrapper.findAll(`.vue-grid-item:not(.vue-grid-placeholder) .vue-resize-hint`);
      expect(hints).toHaveLength(8);
      for (const direction of [`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`]) {
        expect(wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder) .vue-resize-hint--${direction}`).exists()).toBe(true);
      }
    });

    it(`Should not render resize cursor hints when the item isn't resizable`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isResizable: false } });
      await settle();

      expect(wrapper.findAll(`.vue-grid-item:not(.vue-grid-placeholder) .vue-resize-hint`)).toHaveLength(0);
    });

    it(`Should not render resize cursor hints for a static item, even if isResizable is true`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isResizable: true, isStatic: true } });
      await settle();

      expect(wrapper.findAll(`.vue-grid-item:not(.vue-grid-placeholder) .vue-resize-hint`)).toHaveLength(0);
    });

    it(`Should hide the close button by default (inherits GridLayout's own default of false)`, async () => {
      // Regression test: showCloseButton is typed `boolean | null` — the
      // same "inherit from GridLayout" sentinel isDraggable/isResizable/
      // isBounded use — but previously defaulted to `true` instead of
      // `null`, so every item showed a close button regardless of
      // GridLayout's own (correctly-`false`-by-default) setting unless a
      // consumer explicitly overrode it per item. See docs/REFACTORING.md #31.
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      expect(wrapper.find(`button.btn-close`).exists()).toBe(false);
    });

    it(`Should show the close button when explicitly set on the item`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { showCloseButton: true } });
      await settle();

      expect(wrapper.find(`button.btn-close`).exists()).toBe(true);
    });

    it(`Should inherit showCloseButton: true from GridLayout when the item doesn't set its own`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { showCloseButton: true } });
      await settle();

      expect(wrapper.find(`button.btn-close`).exists()).toBe(true);
    });

    it(`Should let a per-item showCloseButton override GridLayout's default`, async () => {
      // Scoped to exclude .vue-grid-placeholder — GridLayout's own
      // internal drag-preview GridItem (always present in the DOM,
      // v-show toggled) receives showCloseButton directly from
      // GridLayout's own prop, independent of this per-item override, so
      // it renders its own close button here too. A plain
      // `button.btn-close` selector would silently fall through to
      // match that one once the real item's own button stops existing.
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { showCloseButton: false },
        layoutProps: { showCloseButton: true },
      });
      await settle();

      expect(wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder) button.btn-close`).exists()).toBe(false);
    });

    it(`Should react when the item's own showCloseButton changes after mount`, async () => {
      const { itemState, wrapper } = mountGridWithReactiveItem({ i: `0`, x: 0, y: 0, w: 2, h: 2, showCloseButton: false } as unknown as ILayoutItem);
      await settle();
      expect(wrapper.find(`button.btn-close`).exists()).toBe(false);

      itemState.showCloseButton = true;
      await settle();
      expect(wrapper.find(`button.btn-close`).exists()).toBe(true);
    });

    it(`Should react when GridLayout's showCloseButton default changes after mount, for items that don't set their own`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();
      expect(wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder) button.btn-close`).exists()).toBe(false);

      await wrapper.setProps({ showCloseButton: true });
      await settle();
      expect(wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder) button.btn-close`).exists()).toBe(true);
    });

    it(`Should react when the item's own enableEditMode changes after mount`, async () => {
      const { itemState, wrapper } = mountGridWithReactiveItem({ i: `0`, x: 0, y: 0, w: 2, h: 2, enableEditMode: false } as unknown as ILayoutItem);
      await settle();
      const item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).not.toContain(`vue-draggable`);
      expect(item.classes()).not.toContain(`vue-resizable`);

      itemState.enableEditMode = true;
      await settle();
      const itemAfter = wrapper.find(`.vue-grid-item`);
      expect(itemAfter.classes()).toContain(`vue-draggable`);
      expect(itemAfter.classes()).toContain(`vue-resizable`);
    });

    it(`Should react when GridLayout's enableEditMode default changes after mount, for items that don't set their own`, async () => {
      // Regression test: this is exactly the class of bug
      // docs/REFACTORING.md #31 already found and fixed for
      // showCloseButton (changing it after mount never reached
      // already-rendered items) — the same watcher/eventBus cascade
      // now exists for enableEditMode, but nothing previously verified
      // it actually cascades rather than only working at initial mount.
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { enableEditMode: false } });
      await settle();
      const item = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(item.classes()).not.toContain(`vue-draggable`);
      expect(item.classes()).not.toContain(`vue-resizable`);

      await wrapper.setProps({ enableEditMode: true });
      await settle();
      const itemAfter = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(itemAfter.classes()).toContain(`vue-draggable`);
      expect(itemAfter.classes()).toContain(`vue-resizable`);
    });

    it(`Should not apply a border radius by default (inherits GridLayout's own default of false)`, async () => {
      // Regression test: useBorderRadius/borderRadiusPx are typed to
      // accept null (the same "inherit from GridLayout" sentinel
      // isDraggable/isResizable/isBounded/showCloseButton use) but
      // previously defaulted to concrete values (false/10) instead of
      // null — so a GridLayout-level borderRadiusPx/useBorderRadius
      // never reached any item that didn't also set its own copy of
      // these two props directly, which is exactly the "borderRadiusPx
      // doesn't work" report that surfaced this. See
      // docs/REFACTORING.md #47.
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`vue-use-radius`);
    });

    it(`Should inherit useBorderRadius: true and borderRadiusPx from GridLayout when the item doesn't set its own`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { borderRadiusPx: 25, useBorderRadius: true } });
      await settle();

      const item = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(item.classes()).toContain(`vue-use-radius`);
      expect(item.attributes(`style`)).toContain(`border-radius: 25px`);
    });

    it(`Should let a per-item useBorderRadius/borderRadiusPx override GridLayout's default`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { borderRadiusPx: 5, useBorderRadius: false },
        layoutProps: { borderRadiusPx: 25, useBorderRadius: true },
      });
      await settle();

      const item = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(item.classes()).not.toContain(`vue-use-radius`);
    });

    it(`Should ignore a GridLayout borderRadiusPx change after mount for an item that already has its own set`, async () => {
      // Distinct from both tests around this one: the override test
      // above only ever differs at mount time, never changing
      // GridLayout's borderRadiusPx afterward — so the eventBus
      // `setBorderRadiusPx` cascade handler never actually runs there.
      // This exercises that handler's own no-op branch specifically:
      // it fires (GridLayout's value did change), but the item's own
      // non-null borderRadiusPx means it should have no effect.
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { borderRadiusPx: 5, useBorderRadius: true },
        layoutProps: { borderRadiusPx: 10, useBorderRadius: true },
      });
      await settle();

      await wrapper.setProps({ borderRadiusPx: 40 });
      await settle();

      const item = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(item.attributes(`style`)).toContain(`border-radius: 5px`);
    });

    it(`Should react when GridLayout's useBorderRadius/borderRadiusPx default changes after mount, for items that don't set their own`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();
      expect(wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`).classes()).not.toContain(`vue-use-radius`);

      await wrapper.setProps({ borderRadiusPx: 25, useBorderRadius: true });
      await settle();
      const item = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(item.classes()).toContain(`vue-use-radius`);
      expect(item.attributes(`style`)).toContain(`border-radius: 25px`);
    });

    it(`Should update the applied radius when only the item's own borderRadiusPx changes after mount (useBorderRadius already on)`, async () => {
      // Distinct from the combined test above (which changes GridLayout's
      // own default, cascaded via the eventBus): this sets the item's
      // *own* borderRadiusPx/useBorderRadius directly, then changes just
      // borderRadiusPx on its own reactive watcher, exercising the
      // per-item prop path rather than the inherited-default path.
      stubOffsetWidth(1200);
      const { itemState, wrapper } = mountGridWithReactiveItem(
        { i: `0`, x: 0, y: 0, w: 2, h: 2, borderRadiusPx: 10, useBorderRadius: true },
        { margin: [10, 10], rowHeight: 100 },
      );
      await settle();
      expect(wrapper.find(`.vue-grid-item`).attributes(`style`)).toContain(`border-radius: 10px`);

      itemState.borderRadiusPx = 30;
      await settle();
      expect(wrapper.find(`.vue-grid-item`).attributes(`style`)).toContain(`border-radius: 30px`);
    });

    it(`Should hide the close button when showCloseButton is false`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { showCloseButton: false } });
      await settle();

      expect(wrapper.find(`button.btn-close`).exists()).toBe(false);
    });

    it(`Should hide the close button for a static item even if showCloseButton is true`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isStatic: true, showCloseButton: true } });
      await settle();

      expect(wrapper.find(`button.btn-close`).exists()).toBe(false);
    });

    it(`Should apply the border-radius class when useBorderRadius is true`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { useBorderRadius: true } });
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`vue-use-radius`);
    });

    it(`Should keep the close button's corner inset at the 4px default when useBorderRadius is off`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { showCloseButton: true, useBorderRadius: false } });
      await settle();

      expect(wrapper.find(`.vue-grid-item`).attributes(`style`)).toContain(`--close-button-inset: 4px`);
    });

    it(`Should grow the close button's corner inset as borderRadiusPx grows`, async () => {
      // Regression test: the close button used to stay pinned at a fixed
      // 4px from the item's true corner regardless of borderRadiusPx, so
      // it visually sat half over the rounded curve at larger radii
      // instead of staying clear of it (see docs/REFACTORING.md #33).
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { borderRadiusPx: 20, showCloseButton: true, useBorderRadius: true },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).toContain(`--close-button-inset`);
      expect(style).not.toContain(`--close-button-inset: 4px`);
    });

    it(`Should apply an absolute-positioning transform style derived from its grid coordinates`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 1, y: 0, w: 2, h: 2 }], { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`);
      expect(style).toContain(`position: absolute`);
      expect(style).toContain(`translate3d`);
    });

    it(`Should position via top/left instead of a transform when useCssTransforms is false`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 1, y: 0, w: 2, h: 2 }], {
        layoutProps: { margin: [10, 10], rowHeight: 100, useCssTransforms: false },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).toContain(`position: absolute`);
      expect(style).not.toContain(`translate3d`);
      expect(style).toContain(`top:`);
      expect(style).toContain(`left:`);
    });

    it(`Should position via top/right instead of a transform when useCssTransforms is false and mirrored (RTL)`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 1, y: 0, w: 2, h: 2 }], {
        layoutProps: { isMirrored: true, margin: [10, 10], rowHeight: 100, useCssTransforms: false },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(style).toContain(`position: absolute`);
      expect(style).not.toContain(`translate3d`);
      expect(style).toContain(`top:`);
      // The RTL/non-transform branch positions via `right`, not `left` —
      // distinct from the LTR test above.
      expect(style).toContain(`right:`);
      expect(style).not.toContain(`left:`);
    });

    it(`Should switch an already-mounted item between transform and top/left positioning when useCssTransforms changes reactively, not just at mount`, async () => {
      // Regression test for a real bug: every other similarly grid-wide
      // -inherited prop (isDraggable, isResizable, showCloseButton,
      // enableEditMode, rowHeight, margin, transformScale, etc.) has a
      // watcher pushing changes to already-mounted items via the
      // eventBus; useCssTransforms never did — it was only ever read
      // once, at mount. Toggling it afterward had no effect at all on
      // existing items. Reported as part of "Layout bounds &
      // rendering — description clarity, useCssTransforms." See
      // docs/REFACTORING.md.
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 1, y: 0, w: 2, h: 2 }], {
        layoutProps: { margin: [10, 10], rowHeight: 100, useCssTransforms: true },
      });
      await settle();

      const styleBefore = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleBefore).toContain(`translate3d`);

      await wrapper.setProps({ useCssTransforms: false });
      await settle();

      const styleAfter = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleAfter).not.toContain(`translate3d`);
      expect(styleAfter).toContain(`top:`);
      expect(styleAfter).toContain(`left:`);
      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`css-transforms`);

      // And back the other way, confirming it isn't a one-shot fluke.
      await wrapper.setProps({ useCssTransforms: true });
      await settle();

      const styleFinal = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleFinal).toContain(`translate3d`);
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`css-transforms`);
    });

    it(`Should clamp x/w back within bounds at mount when the item overflows the column count`, async () => {
      // An item whose x+w exceeds the current colNum (e.g. saved layout
      // data from a wider breakpoint, loaded directly at a narrower one)
      // should be pulled back to a valid position at mount, not rendered
      // overflowing or left to error out downstream.
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 3, y: 0, w: 4, h: 2 }], {
        layoutProps: { colNum: 4, margin: [10, 10], rowHeight: 100 },
      });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      // w (4) already equals colNum (4), so x is pulled to 0 rather than
      // the item being narrowed — matching the "prefer moving over
      // shrinking" behavior in this exact branch.
      expect(item.props(`x`)).toBe(3);
      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      // x=0 with a 10px margin means a 10px pixel offset, not 0 — the
      // margin is the left edge of column 0, not the container edge.
      expect(style).toContain(`translate3d(10px`);
    });

    it(`Should narrow w itself (not just move x) when even the full item's own w exceeds the column count`, async () => {
      // Distinct from the test above: there, w already equaled colNum,
      // so only x needed correcting. Here w itself is wider than colNum
      // can ever accommodate, so w must also be clamped down to fit —
      // the other side of the same ternary.
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 6, h: 2 }], {
        layoutProps: { colNum: 4, margin: [10, 10], rowHeight: 100 },
      });
      await settle();

      const style = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      // colWidth at 1200px/4 cols/10px margin: (1200 - 5*10)/4 = 287.5.
      // w clamped to 4 (the full colNum) gives width 287.5*4 + 3*10 = 1180.
      expect(style).toContain(`width: 1180px`);
    });

    it(`Should resolve its column count from the current responsive breakpoint at mount, for an item added after the grid already settled its breakpoint`, async () => {
      // Not reachable via a plain initial mount: GridItem's own onMounted
      // runs before GridLayout's (Vue mounts children before a parent's
      // own mount hook completes), and GridLayout only resolves
      // lastBreakpoint inside its own nested onMounted nextTicks — so a
      // freshly-mounted item alongside its grid always sees
      // lastBreakpoint still null at the point it reads $parent,
      // regardless of how many ticks are awaited afterward. Confirmed
      // directly (not assumed) before writing this test: a plain mount
      // logged `lastBreakpoint: null` even after settling. The actually-
      // reachable case is a *new* item added via v-for to a grid whose
      // breakpoint has already settled — e.g. adding a widget to an
      // existing responsive dashboard.
      //
      // Uses a reactive() layout array directly (mountGrid's own slot is
      // a plain closure over a non-reactive array, so pushing to it
      // wouldn't trigger the second item to actually render).
      // 1300px is clearly within the "lg" breakpoint's range (1200-1400)
      // rather than sitting exactly on its own boundary, where whether
      // >= or > applies at the threshold itself isn't this test's concern.
      stubOffsetWidth(1300);
      const layout = reactive([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
      const wrapper = mount(GridLayout, {
        props: { cols: { lg: 8, md: 6, sm: 4 }, layout, responsive: true, rowHeight: 100 },
        slots: {
          default: () =>
            layout.map((item) => h(GridItem, { ...item, key: item.i }, () => `Item ${item.i}`)),
        },
      });
      await settle();
      await settle();

      layout.push({ h: 2, i: `1`, w: 2, x: 0, y: 2 });
      await settle();

      const renderedItems = wrapper.findAll(`.vue-grid-item:not(.vue-grid-placeholder)`);
      expect(renderedItems).toHaveLength(2);

      // Verified through the rendered pixel width, not a resize
      // interaction: at 1300px container width, an 8-column grid (the
      // "lg" breakpoint) gives ~313px-wide 2-column items; the
      // layout's own (unused, in responsive mode) default colNum of 12
      // would give ~207px instead — different enough that picking up
      // the wrong column count is unambiguous.
      const style = renderedItems[1].attributes(`style`) ?? ``;
      expect(style).toContain(`width: 313px`);
    });

    it(`Should fall back to a default container width when the parent layout's own width is null at mount`, async () => {
      // The parent's own `width` ref legitimately starts out null before
      // its first real measurement (a grid inside a hidden tab/modal, or
      // simply before the container has been laid out at all) — GridItem
      // reads this once at mount via $parent, and should fall back to a
      // sane default rather than propagating null into its own
      // pixel-math and throwing.
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { margin: [10, 10], rowHeight: 100 } });
      await settle();

      expect(() => wrapper.find(`.vue-grid-item`).attributes(`style`)).not.toThrow();
    });
  });

  describe(`ITEM_CLICKED (multiSelect support)`, () => {
    it(`Should emit ITEM_CLICKED with the item's id and the native MouseEvent on a plain click`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      await wrapper.find(`.vue-grid-item`).trigger(`click`, { shiftKey: true });

      const item = wrapper.findComponent({ name: `GridItem` });
      const emitted = item.emitted(EGridItemEvent.ITEM_CLICKED);
      expect(emitted).toBeTruthy();
      expect(emitted![0][0]).toBe(`0`);
      expect((emitted![0][1] as MouseEvent).shiftKey).toBe(true);
    });

    it(`Should suppress ITEM_CLICKED for the trailing click a browser dispatches immediately after a drag ends`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      dispatchDragEvent(target, `dragend`);
      await settle();

      // The trailing click a real browser can still dispatch right
      // after mouseup/dragend, regardless of how far the pointer
      // actually moved in between.
      await wrapper.find(`.vue-grid-item`).trigger(`click`);

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.ITEM_CLICKED)).toBeFalsy();
    });

    it(`Should stop suppressing clicks once the current task following a drag has passed`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      dispatchDragEvent(target, `dragend`);
      await settle();

      // Let the suppression's own setTimeout(0) actually fire before
      // clicking again — a genuine, later click should go through.
      await new Promise((resolve) => { setTimeout(resolve, 10); });
      await wrapper.find(`.vue-grid-item`).trigger(`click`);

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.ITEM_CLICKED)).toBeTruthy();
    });

    it(`Should suppress ITEM_CLICKED for the trailing click immediately after a resize ends too`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(target, `resizestart`);
      await settle();
      dispatchResizeEvent(target, `resizeend`);
      await settle();

      await wrapper.find(`.vue-grid-item`).trigger(`click`);

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.ITEM_CLICKED)).toBeFalsy();
    });
  });

  describe(`close button`, () => {
    it(`Should emit remove-grid-item when clicked and enableEditMode is true`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { showCloseButton: true } });
      await settle();

      await wrapper.find(`button.btn-close`).trigger(`click`);

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.REMOVE_ITEM)).toStrictEqual([[`0`]]);
    });
  });

  describe(`dragging (via mocked interact.js)`, () => {
    it(`Should ignore a dragstart while a resize is already in progress`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(el, `resizestart`);

      dispatchDragEvent(el, `dragstart`);
      dispatchDragEvent(el, `dragmove`, { clientX: 50, clientY: 50 });

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVE)).toBeFalsy();
    });

    it(`Should not throw for an event type handleDrag doesn't recognize (the switch's default case)`, async () => {
      // Only dragstart/dragmove/dragend are ever actually dispatched
      // through normal drag interaction (native or otherwise) — this
      // default case is a defensive fallback for an event.type value
      // that shouldn't occur in practice. Reached here by calling the
      // handler directly with a fabricated event.type, not through any
      // real gesture.
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      Object.defineProperty(el, `offsetParent`, { configurable: true, value: document.body });
      const handler = (el as unknown as { __nativeDragHandler: (event: unknown) => void }).__nativeDragHandler;

      expect(() => handler({ clientX: 0, clientY: 0, target: el, type: `unrecognized-type` })).not.toThrow();
    });

    it(`Should not start a drag when the gesture begins on an element matching dragIgnoreFrom`, async () => {
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { dragIgnoreFrom: `.no-drag` },
        slotContent: () => h(`button`, { class: `no-drag` }, `ignored`),
      });
      await settle();

      const button = wrapper.find(`.no-drag`).element;
      button.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      button.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      button.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVE)).toBeFalsy();
    });

    it(`Should start auto-scroll tracking against the item's own scrollable ancestor when dragging with autoScroll on`, async () => {
      // Full scrollBy-gets-called behavior (the tick loop itself) is
      // covered in isolation, without Vue/jsdom timing involved at all,
      // in tests/native-interaction.spec.ts — this test covers the
      // integration point specifically: that a real drag lifecycle
      // actually starts/stops autoScroll tracking when the prop is on.
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { autoScroll: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element as HTMLElement;
      Object.defineProperty(el.parentElement, `scrollHeight`, { configurable: true, value: 800 });
      Object.defineProperty(el.parentElement, `clientHeight`, { configurable: true, value: 400 });
      const scrollBySpy = vi.fn();
      (el.parentElement as HTMLElement).scrollBy = scrollBySpy;
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `auto` } as CSSStyleDeclaration);

      expect(() => {
        dispatchDragEvent(el, `dragstart`, { clientX: 10, clientY: 10 });
        dispatchDragEvent(el, `dragmove`, { clientX: 10, clientY: 10 });
        dispatchDragEvent(el, `dragend`, { clientX: 10, clientY: 10 });
      }).not.toThrow();

      vi.restoreAllMocks();
    });

    it(`Should not scroll anything when dragging near an edge with autoScroll off (the default)`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element as HTMLElement;
      const parent = el.parentElement as HTMLElement;
      const scrollBySpy = vi.fn();
      parent.scrollBy = scrollBySpy;

      dispatchDragEvent(el, `dragstart`, { clientX: 10, clientY: 10 });
      dispatchDragEvent(el, `dragmove`, { clientX: 10, clientY: 10 });
      await settle();

      expect(scrollBySpy).not.toHaveBeenCalled();
      dispatchDragEvent(el, `dragend`, { clientX: 10, clientY: 10 });
    });

    it(`Should wire up the native drag/resize engines on mount unconditionally, not only as a side effect of a watcher noticing a value change`, async () => {
      // Regression test (docs/REFACTORING.md #38 follow-up): onMounted
      // only ever set refs like cols.value/draggable.value and relied on
      // a watch() elsewhere noticing the change to actually call
      // tryMakeDraggable()/tryMakeResizable() — if a ref's resolved value
      // happened to already equal its own default, the watcher would
      // never fire, and (before this) nothing else would ever call
      // either function, silently starving drag/resize setup entirely
      // rather than just delaying it. Explicit calls at the end of
      // onMounted remove that dependency on coincidence.
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element as unknown as {
        __nativeDragHandler?: unknown;
        __nativeResizeHandler?: unknown;
      };
      expect(el.__nativeDragHandler).toBeTypeOf(`function`);
      expect(el.__nativeResizeHandler).toBeTypeOf(`function`);
    });

    it(`Should not start a drag when isDraggable is false`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isDraggable: false } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVE)).toBeFalsy();
    });

    it(`Should not start a drag when isStatic is true, even with isDraggable true`, async () => {
      // isStatic overrides isDraggable entirely — a static item must never
      // become draggable regardless of what isDraggable says, since
      // anything relying on "isStatic implies un-draggable" (e.g. the
      // cross-grid dropzone example, which never expects a static item
      // to be an active drag source at all) depends on this holding at
      // the actual interaction-engine level, not just in GridLayout's
      // own collision/compaction logic.
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isDraggable: true, isStatic: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVE)).toBeFalsy();
    });

    it(`Should add dragging classes on dragstart and remove them on dragend`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();

      let item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).toContain(`vue-draggable-dragging`);
      expect(item.classes()).toContain(`disable-userselect`);

      dispatchDragEvent(target, `dragend`);
      await settle();

      item = wrapper.find(`.vue-grid-item`);
      expect(item.classes()).not.toContain(`vue-draggable-dragging`);
    });

    it(`Should emit item-moved on dragend when the grid position actually changed`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      // Move far enough right to cross into a different grid column.
      dispatchDragEvent(target, `dragmove`, { clientX: 300, clientY: 0 });
      await settle();
      dispatchDragEvent(target, `dragend`, { clientX: 300, clientY: 0 });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVED)).toBeTruthy();
    });

    it(`Should commit dragend's final position from the accumulated drag delta, not a fresh DOM measurement`, async () => {
      // Regression test (docs/REFACTORING.md #41): dragend used to
      // re-derive the final position via the target element's own
      // getBoundingClientRect() — exactly like dragstart does — rather
      // than using dragging.value, which dragmove already accumulates
      // correctly across the whole gesture. In a real browser, a fast
      // multi-step drag committed a position far short of where the
      // pointer actually ended up, because Vue's render (turning
      // dragging.value into an actual CSS transform) is asynchronous
      // relative to the synchronous burst of native mouse events —
      // dragend's fresh DOM read could capture a stale, earlier frame.
      //
      // dispatchDragEvent's mocked target has a *fixed*
      // getBoundingClientRect() regardless of clientX/clientY passed in
      // (see the helper above) — which makes this the right test double
      // for exactly this bug: if dragend ever again reads from that
      // fixed rect instead of dragging.value, its emitted position
      // would stop matching dragmove's, regardless of how far the drag
      // actually moved.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      dispatchDragEvent(target, `dragmove`, { clientX: 300, clientY: 0 });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      const [, moveX] = item.emitted(EGridItemEvent.MOVE)!.at(-1) as [string, number, number];

      dispatchDragEvent(target, `dragend`, { clientX: 300, clientY: 0 });
      await settle();

      const [, movedX] = item.emitted(EGridItemEvent.MOVED)!.at(-1) as [string, number, number];
      expect(movedX).toBe(moveX);
    });

    it(`Should ignore drag events entirely when enableEditMode is false`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { enableEditMode: false },
        layoutProps: { rowHeight: 100, margin: [10, 10] },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      dispatchDragEvent(target, `dragmove`, { clientX: 300, clientY: 0 });
      await settle();
      dispatchDragEvent(target, `dragend`, { clientX: 300, clientY: 0 });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVE)).toBeFalsy();
      expect(item.emitted(EGridItemEvent.MOVED)).toBeFalsy();
    });

    it(`Should ignore a dragend that arrives without a preceding dragstart`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      expect(() => dispatchDragEvent(target, `dragend`, { clientX: 100, clientY: 0 })).not.toThrow();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVED)).toBeFalsy();
    });

    it(`Should clamp the drag position to the container bounds when isBounded is true`, async () => {
      stubOffsetWidth(300);
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { isBounded: true },
        layoutProps: { colNum: 3, rowHeight: 100, margin: [10, 10] },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      // Drag far past the right/bottom edges of a small, bounded container.
      dispatchDragEvent(target, `dragmove`, { clientX: 5000, clientY: 5000 });
      await settle();

      expect(() => dispatchDragEvent(target, `dragend`, { clientX: 5000, clientY: 5000 })).not.toThrow();
      // The item should still be fully within the 3-column container, not
      // dragged off the edge.
      const item = wrapper.findComponent({ name: `GridItem` });
      const movedCalls = item.emitted(EGridItemEvent.MOVE) ?? [];
      const lastMove = movedCalls[movedCalls.length - 1];
      if (lastMove) {
        expect(lastMove[1]).toBeLessThanOrEqual(3);
      }
    });
  });

  describe(`resizing (via mocked interact.js)`, () => {
    it(`Should not render any resize-hint spans when enableEditMode is false, even with isResizable true`, async () => {
      // Distinct from isStatic (checked first in the same condition,
      // already covered elsewhere) — this exercises the
      // !enableEditMode && isResizable side specifically. Previously
      // dispatched a resize event and confirmed handleResize's own
      // early-return ignored it — no longer applicable now that the
      // resize-hint spans (the native engine's own hit targets) are
      // themselves `v-if`-gated on `editModeEnabled` (see
      // `resizableAndNotStatic`), so there's nothing to dispatch to at
      // all in this state, not an event arriving and being ignored.
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { enableEditMode: false, isResizable: true } });
      await settle();

      const realItem = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      for (const edgeClass of [`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`]) {
        expect(realItem.find(`.vue-resize-hint--${edgeClass}`).exists()).toBe(false);
      }
    });

    it(`Should not throw for an event type handleResize doesn't recognize (the switch's default case)`, async () => {
      // Same reasoning as the equivalent handleDrag test — only
      // resizestart/resizemove/resizeend are ever actually dispatched
      // through normal interaction, so this is a defensive fallback,
      // reached here by calling the handler directly with a fabricated
      // event.type, not through any real gesture.
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      Object.defineProperty(el, `offsetParent`, { configurable: true, value: document.body });
      const handler = (el as unknown as { __nativeResizeHandler: (event: unknown) => void }).__nativeResizeHandler;

      expect(() => handler({
        clientX: 0,
        clientY: 0,
        edges: { bottom: true, left: false, right: true, top: false },
        target: el,
        type: `unrecognized-type`,
      })).not.toThrow();
    });

    it(`Should clamp to an absolute floor of 1 grid unit even when minW/minH are set below it`, async () => {
      // Distinct from the minW/minH clamp itself (already covered
      // elsewhere) — minW/minH set to 0 here means that clamp alone
      // wouldn't prevent a sub-1 size; this exercises the separate,
      // unconditional `pos.h < 1`/`pos.w < 1` floor underneath it.
      // resizemove computes its delta from clientX/clientY movement
      // (via offsetXYFromParentOf), not a rect property directly — a
      // large negative movement shrinks the item drastically enough to
      // go below 1 grid unit even starting from a 2x2 item.
      const layout = [{ i: `0`, x: 0, y: 0, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { itemProps: { minH: 0, minW: 0 } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(el, `resizestart`);
      dispatchResizeEvent(el, `resizemove`, { clientX: -2000, clientY: -2000 });

      const item = wrapper.findComponent({ name: `GridItem` });
      const resizeCalls = item.emitted(EGridItemEvent.RESIZE);
      expect(resizeCalls).toBeTruthy();
      // emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height, newSize.width) —
      // args[1]/args[2] are pos.h/pos.w, the clamped grid-unit values;
      // args[3]/args[4] (newSize.height/width) are the raw, unclamped
      // pixel-derived values, which is what a first attempt at this
      // assertion checked by mistake and got a large negative number
      // back, looking like the clamp had failed when it actually hadn't.
      const lastCall = resizeCalls!.at(-1) as unknown[];
      expect(lastCall[1]).toBeGreaterThanOrEqual(1);
      expect(lastCall[2]).toBeGreaterThanOrEqual(1);
    });

    it(`Should populate all 8 resize-handle template refs when the item is resizable`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      for (const edgeClass of [`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`]) {
        expect(wrapper.find(`.vue-resize-hint--${edgeClass}`).exists()).toBe(true);
      }
    });

    it(`Should start auto-scroll tracking against the item's own scrollable ancestor when resizing with autoScroll on`, async () => {
      // See the matching drag test's own comment — full scrollBy
      // behavior is covered in isolation in
      // tests/native-interaction.spec.ts; this covers the integration
      // point that a real resize lifecycle starts/stops it.
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { autoScroll: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element as HTMLElement;
      Object.defineProperty(el.parentElement, `scrollHeight`, { configurable: true, value: 800 });
      Object.defineProperty(el.parentElement, `clientHeight`, { configurable: true, value: 400 });
      (el.parentElement as HTMLElement).scrollBy = vi.fn();
      vi.spyOn(window, `getComputedStyle`).mockReturnValue({ overflowX: `visible`, overflowY: `auto` } as CSSStyleDeclaration);

      expect(() => {
        dispatchResizeEvent(el, `resizestart`, { clientX: 10, clientY: 10 });
        dispatchResizeEvent(el, `resizemove`, { clientX: 10, clientY: 10 });
        dispatchResizeEvent(el, `resizeend`, { clientX: 10, clientY: 10 });
      }).not.toThrow();

      vi.restoreAllMocks();
    });

    it(`Should not render any resize-hint spans at all when isResizable is false`, async () => {
      // Found via a test that dispatched a pointer gesture on
      // `.vue-resize-hint--se` and got the *placeholder* GridItem's own
      // handle instead of the real item's (which correctly renders none
      // at all when not resizable) — `wrapper.find()` matches document
      // order, and the real item's own handles don't exist in the DOM
      // to match first. Confirms that absence directly instead.
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isResizable: false } });
      await settle();

      const realItem = wrapper.find(`.vue-grid-item:not(.vue-grid-placeholder)`);
      for (const edgeClass of [`n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`]) {
        expect(realItem.find(`.vue-resize-hint--${edgeClass}`).exists()).toBe(false);
      }
    });

    it(`Should preserve the aspect ratio while resizing when preserveAspectRatio is true`, async () => {
      // 4x4 grid units at this demo's colWidth/rowHeight starts as a
      // square (ratio 1) — growing only the right edge (a horizontal-only
      // gesture) should derive height from the new width via that ratio,
      // not leave height unchanged the way a non-aspect-locked resize
      // would.
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 4, h: 4 }], { itemProps: { preserveAspectRatio: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(el, `resizestart`, { clientX: 0, clientY: 0, edges: { bottom: false, left: false, right: true, top: false } });
      dispatchResizeEvent(el, `resizemove`, { clientX: 200, clientY: 0, edges: { bottom: false, left: false, right: true, top: false } });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      const resizeCalls = item.emitted(EGridItemEvent.RESIZE);
      expect(resizeCalls).toBeTruthy();
      const lastCall = resizeCalls!.at(-1) as unknown[];
      // args[1]/args[2] are pos.h/pos.w (grid units) — growing width
      // only should still grow height too, proportionally, not leave it
      // at the original 4.
      expect(lastCall[1]).toBeGreaterThan(4);
    });

    it(`Should derive width from height when only a vertical edge drives a preserveAspectRatio resize`, async () => {
      // Mirrors the test above but for the other single-axis case —
      // dragging only the bottom edge should derive width from the new
      // height, the reverse derivation direction from the width-driven
      // test.
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 4, h: 4 }], { itemProps: { preserveAspectRatio: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(el, `resizestart`, { clientX: 0, clientY: 0, edges: { bottom: true, left: false, right: false, top: false } });
      dispatchResizeEvent(el, `resizemove`, { clientX: 0, clientY: 200, edges: { bottom: true, left: false, right: false, top: false } });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      const resizeCalls = item.emitted(EGridItemEvent.RESIZE);
      expect(resizeCalls).toBeTruthy();
      const lastCall = resizeCalls!.at(-1) as unknown[];
      // args[2] is pos.w — growing height only should still grow width
      // too, proportionally, not leave it at the original 4.
      expect(lastCall[2]).toBeGreaterThan(4);
    });

    it(`Should derive height from width during a corner resize (both a horizontal and vertical edge driving at once)`, async () => {
      // Distinct from both single-axis tests above: a corner handle
      // (e.g. se/sw/ne/nw) drives both a horizontal and vertical edge
      // simultaneously — this exercises that third branch specifically,
      // including the top-edge position adjustment for corners where
      // the item's own top edge moves (edges.top true).
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 4, h: 4 }], { itemProps: { preserveAspectRatio: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(el, `resizestart`, { clientX: 0, clientY: 0, edges: { bottom: true, left: false, right: true, top: false } });
      dispatchResizeEvent(el, `resizemove`, { clientX: 200, clientY: 100, edges: { bottom: true, left: false, right: true, top: false } });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      const resizeCalls = item.emitted(EGridItemEvent.RESIZE);
      expect(resizeCalls).toBeTruthy();
      const lastCall = resizeCalls!.at(-1) as unknown[];
      expect(lastCall[1]).toBeGreaterThan(4);
      expect(lastCall[2]).toBeGreaterThan(4);
    });

    it(`Should add the resizing class while a resize is in progress`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(target, `resizestart`);
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`resizing`);
    });

    it(`Should emit resized on resizeend after growing from the bottom-right edge`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(target, `resizestart`);
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 200, clientY: 200 });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: 200, clientY: 200 });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.RESIZE)).toBeTruthy();
      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`resizing`);
    });

    it(`Should handle a resize constrained to only the right edge`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const rightOnly = { bottom: false, left: false, right: true, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: rightOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 200, clientY: 0, edges: rightOnly });
      await settle();

      expect(() => dispatchResizeEvent(target, `resizeend`, { clientX: 200, clientY: 0, edges: rightOnly })).not.toThrow();
    });

    it(`Should handle a resize constrained to only the bottom edge`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const bottomOnly = { bottom: true, left: false, right: false, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: bottomOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 0, clientY: 200, edges: bottomOnly });
      await settle();

      expect(() => dispatchResizeEvent(target, `resizeend`, { clientX: 0, clientY: 200, edges: bottomOnly })).not.toThrow();
    });

    it(`Should clamp the resized size to minW/maxW/minH/maxH`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { maxH: 3, maxW: 3, minH: 2, minW: 2 },
        layoutProps: { rowHeight: 100, margin: [10, 10] },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(target, `resizestart`);
      await settle();
      // A huge move should clamp to maxW/maxH rather than growing unbounded.
      dispatchResizeEvent(target, `resizemove`, { clientX: 5000, clientY: 5000 });
      await settle();

      expect(() => dispatchResizeEvent(target, `resizeend`, { clientX: 5000, clientY: 5000 })).not.toThrow();
    });

    it(`Should clamp a shrinking resize to minW/minH`, async () => {
      // The test above only exercises the maxW/maxH clamp direction
      // (growing); this covers the opposite pos.w < minW! / pos.h < minH!
      // branches by shrinking instead.
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 4, h: 4 }], {
        itemProps: { minH: 2, minW: 2 },
        layoutProps: { rowHeight: 100, margin: [10, 10] },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchResizeEvent(target, `resizestart`);
      await settle();
      // A huge negative move should clamp to minW/minH rather than
      // shrinking to nothing (or negative).
      dispatchResizeEvent(target, `resizemove`, { clientX: -5000, clientY: -5000 });
      await settle();

      expect(() => dispatchResizeEvent(target, `resizeend`, { clientX: -5000, clientY: -5000 })).not.toThrow();
    });

    // The following five directions (left, top, and the three corners that
    // include one of them) were previously empty stub branches — enabled
    // but non-functional. See docs/REFACTORING.md's resize-direction note.
    // Started away from x:0/y:0 so there's room to move left/up.
    const midGridLayout = () => [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];

    it(`Should grow width and move x left when resizing from the left edge`, async () => {
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, { layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const leftOnly = { bottom: false, left: true, right: false, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: leftOnly });
      await settle();
      // Dragging left (negative clientX delta) should widen the item and
      // pull its left edge — and so its grid x — leftward.
      dispatchResizeEvent(target, `resizemove`, { clientX: -150, clientY: 0, edges: leftOnly });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: -150, clientY: 0, edges: leftOnly });
      await settle();

      expect(layout[0].w).toBeGreaterThan(2);
      expect(layout[0].x).toBeLessThan(4);
      // Height/y are untouched by a left-only resize.
      expect(layout[0].h).toBe(2);
      expect(layout[0].y).toBe(4);
    });

    it(`Should grow width without moving x when resizing from the left edge while mirrored (RTL)`, async () => {
      // Regression test (docs/REFACTORING.md #53): in RTL, `x` maps to
      // `right` (distance from the container's right edge), not `left` —
      // dragging the left edge grows the item towards its own left, but
      // the right edge (the RTL anchor) doesn't move, so `x` shouldn't
      // either. This was previously hardcoded to always update `x` on
      // `edges.left` regardless of render direction, which is the LTR
      // case, not the RTL one.
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, {
        layoutProps: { isMirrored: true, margin: [10, 10], rowHeight: 100, compactType: ECompactType.NONE },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const leftOnly = { bottom: false, left: true, right: false, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: leftOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: -150, clientY: 0, edges: leftOnly });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: -150, clientY: 0, edges: leftOnly });
      await settle();

      expect(layout[0].w).toBeGreaterThan(2);
      expect(layout[0].x).toBe(4);
      expect(layout[0].h).toBe(2);
      expect(layout[0].y).toBe(4);
    });

    it(`Should grow width and move x when resizing from the right edge while mirrored (RTL)`, async () => {
      // The RTL mirror image of the left-edge test above: in RTL,
      // dragging the *right* edge is what moves the anchor (since
      // `right`, not `left`, is what `x` maps to) — previously this
      // never updated `x` at all, since the old code only ever checked
      // `edges.left`.
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, {
        layoutProps: { isMirrored: true, margin: [10, 10], rowHeight: 100, compactType: ECompactType.NONE },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const rightOnly = { bottom: false, left: false, right: true, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: rightOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 150, clientY: 0, edges: rightOnly });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: 150, clientY: 0, edges: rightOnly });
      await settle();

      expect(layout[0].w).toBeGreaterThan(2);
      expect(layout[0].x).toBeLessThan(4);
      expect(layout[0].h).toBe(2);
      expect(layout[0].y).toBe(4);
    });

    it(`Should grow height and move y up when resizing from the top edge`, async () => {
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, { layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const topOnly = { bottom: false, left: false, right: false, top: true };
      dispatchResizeEvent(target, `resizestart`, { edges: topOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 0, clientY: -150, edges: topOnly });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: 0, clientY: -150, edges: topOnly });
      await settle();

      expect(layout[0].h).toBeGreaterThan(2);
      expect(layout[0].y).toBeLessThan(4);
      // Width/x are untouched by a top-only resize.
      expect(layout[0].w).toBe(2);
      expect(layout[0].x).toBe(4);
    });

    it(`Should handle a resize constrained to the top-left corner`, async () => {
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, { layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const topLeft = { bottom: false, left: true, right: false, top: true };
      dispatchResizeEvent(target, `resizestart`, { edges: topLeft });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: -150, clientY: -150, edges: topLeft });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: -150, clientY: -150, edges: topLeft });
      await settle();

      expect(layout[0].w).toBeGreaterThan(2);
      expect(layout[0].h).toBeGreaterThan(2);
      expect(layout[0].x).toBeLessThan(4);
      expect(layout[0].y).toBeLessThan(4);
    });

    it(`Should handle a resize constrained to the bottom-left corner`, async () => {
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, { layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const bottomLeft = { bottom: true, left: true, right: false, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: bottomLeft });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: -150, clientY: 150, edges: bottomLeft });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: -150, clientY: 150, edges: bottomLeft });
      await settle();

      expect(layout[0].w).toBeGreaterThan(2);
      expect(layout[0].h).toBeGreaterThan(2);
      expect(layout[0].x).toBeLessThan(4);
      // Bottom edge growth doesn't move y.
      expect(layout[0].y).toBe(4);
    });

    it(`Should handle a resize constrained to the top-right corner`, async () => {
      stubOffsetWidth(1200);
      const layout = midGridLayout();
      const wrapper = mountGrid(layout, { layoutProps: { rowHeight: 100, margin: [10, 10], compactType: ECompactType.NONE } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const topRight = { bottom: false, left: false, right: true, top: true };
      dispatchResizeEvent(target, `resizestart`, { edges: topRight });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 150, clientY: -150, edges: topRight });
      await settle();
      dispatchResizeEvent(target, `resizeend`, { clientX: 150, clientY: -150, edges: topRight });
      await settle();

      expect(layout[0].w).toBeGreaterThan(2);
      expect(layout[0].h).toBeGreaterThan(2);
      expect(layout[0].y).toBeLessThan(4);
      // Right edge growth doesn't move x.
      expect(layout[0].x).toBe(4);
    });
  });

  describe(`GridLayout-level isDraggable/isResizable/isBounded cascade`, () => {
    // These three eventBus handlers (setDraggableHandler/
    // setResizableHandler/setBoundedHandler) react to GridLayout's own
    // isDraggable/isResizable/isBounded prop changing after mount, for
    // items that don't set their own value (the `props.isX === null`
    // guard in each). Distinct from the `reactive prop updates` tests
    // below, which change an *item's own* prop, not GridLayout's
    // grid-wide default — that never triggers these handlers at all.
    it(`Should update draggable state when GridLayout's own isDraggable prop changes, for an item without its own`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`vue-draggable`);

      await wrapper.setProps({ isDraggable: false });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`vue-draggable`);
    });

    it(`Should update resizable state when GridLayout's own isResizable prop changes, for an item without its own`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`vue-resizable`);

      await wrapper.setProps({ isResizable: false });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`vue-resizable`);
    });

    it(`Should ignore GridLayout's own isDraggable change for an item that already has its own isDraggable set`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isDraggable: true } });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`vue-draggable`);

      await wrapper.setProps({ isDraggable: false });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`vue-draggable`);
    });

    it(`Should clamp drag position to container bounds once GridLayout's own isBounded turns on, for an item without its own`, async () => {
      stubOffsetWidth(300);
      const wrapper = mountGrid(singleItemLayout(), {
        layoutProps: { colNum: 3, rowHeight: 100, margin: [10, 10] },
      });
      await settle();

      await wrapper.setProps({ isBounded: true });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      dispatchDragEvent(target, `dragstart`);
      await settle();
      dispatchDragEvent(target, `dragmove`, { clientX: 5000, clientY: 5000 });
      await settle();

      expect(() => dispatchDragEvent(target, `dragend`, { clientX: 5000, clientY: 5000 })).not.toThrow();
      const item = wrapper.findComponent({ name: `GridItem` });
      const movedCalls = item.emitted(EGridItemEvent.MOVE) ?? [];
      const lastMove = movedCalls[movedCalls.length - 1];
      if (lastMove) {
        expect(lastMove[1]).toBeLessThanOrEqual(3);
      }
    });
  });

  describe(`reactive prop updates`, () => {
    it.each([
      [`x`, 3],
      [`y`, 3],
      [`h`, 3],
      [`w`, 3],
      [`isStatic`, true],
      [`isDraggable`, false],
      [`isResizable`, false],
      [`isBounded`, true],
      [`minH`, 2],
      [`maxH`, 5],
      [`minW`, 2],
      [`maxW`, 5],
    ])(`Should not throw when %s changes after mount`, async (prop, value) => {
      stubOffsetWidth(1200);
      const { itemState } = mountGridWithReactiveItem(
        { i: `0`, x: 0, y: 0, w: 2, h: 2 },
        { rowHeight: 100, margin: [10, 10] },
      );
      await settle();

      itemState[prop] = value;
      await expect(settle()).resolves.not.toThrow();
    });

    it(`Should stop responding to drag gestures once isStatic toggles on reactively`, async () => {
      // Regression coverage for the same underlying guarantee the old
      // mock-call-count version of this test checked (draggability
      // genuinely reflects a live isStatic change, not just its value
      // at mount) — verified here via the actual observable behavior
      // instead, since the native engine reads live props on every
      // gesture rather than needing to be reconfigured.
      const { itemState, wrapper } = mountGridWithReactiveItem({ i: `0`, x: 0, y: 0, w: 2, h: 2 });
      await settle();

      itemState.isStatic = true;
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`vue-static`);

      const el = wrapper.find(`.vue-grid-item`).element;
      el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVE)).toBeFalsy();
    });

    it(`Should ignore a resize event that arrives after the item became static`, async () => {
      const { itemState, wrapper } = mountGridWithReactiveItem({ i: `0`, x: 0, y: 0, w: 2, h: 2 });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      itemState.isStatic = true;
      await settle();

      dispatchResizeEvent(target, `resizestart`);
      await settle();

      // The early-return guard in handleResize should have skipped adding
      // the resizing state entirely.
      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`resizing`);
    });

    it(`Should apply the render-rtl class when the parent layout is mirrored`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { isMirrored: true } });
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`render-rtl`);
    });

    it(`Should toggle render-rtl off, then back on, as isMirrored is toggled after mount`, async () => {
      // Regression test (docs/REFACTORING.md #39): renderRtl used to
      // reference GridLayout's frozen defineExpose snapshot of
      // isMirrored instead of the live, eventBus-cascaded value, and
      // double-negated against it — toggling isMirrored off frequently
      // left the item stuck rendering RTL exactly as it started,
      // reported as "mirrored RTL does not work when isMirrored is
      // switched off". This exercises the full round trip: on, off, on
      // again, checking the DOM class after each toggle.
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { isMirrored: true } });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`render-rtl`);

      await wrapper.setProps({ isMirrored: false });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`render-rtl`);

      await wrapper.setProps({ isMirrored: true });
      await settle();
      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`render-rtl`);
    });

    it(`Should apply render-rtl on initial mount when isMirrored starts true, without requiring a toggle first`, async () => {
      // Regression test: rtl.value was only ever set by the
      // changeDirection eventBus handler, which (without
      // { immediate: true }) never fires for a prop's starting value —
      // only for changes after mount. A layout mounting with
      // isMirrored: true from the start (not toggled into it) needs its
      // own initial resolution, same as isDraggable/isResizable/
      // isBounded/showCloseButton already have.
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { isMirrored: true } });
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`render-rtl`);
    });

    it(`Should never render RTL for an item with isMirrored: false, regardless of the layout's own mirrored state`, async () => {
      // Per-item opt-out ("whether this item participates in the parent
      // layout's RTL mirroring") — an opted-out item stays LTR, it
      // doesn't invert to the opposite of the layout.
      const wrapper = mountGrid(singleItemLayout(), {
        itemProps: { isMirrored: false },
        layoutProps: { isMirrored: true },
      });
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).not.toContain(`render-rtl`);
    });

    it(`Should update the live transform while dragging a mirrored item (RTL uses "right", folded into translate3d)`, async () => {
      // useCssTransforms (the default) folds RTL's "right" anchor into a
      // negative-X translate3d rather than a literal `right:` CSS
      // property (see setTransformRtl in core/helpers/utils.ts), so the
      // meaningful assertion here is that the transform actually changes
      // in response to the drag, not a literal string match.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), {
        layoutProps: { isMirrored: true, margin: [10, 10], rowHeight: 100 },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const styleBefore = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;

      dispatchDragEvent(target, `dragstart`);
      await settle();
      dispatchDragEvent(target, `dragmove`, { clientX: 50, clientY: 0 });
      await settle();

      const styleDuring = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleDuring).toContain(`translate3d`);
      expect(styleDuring).not.toBe(styleBefore);
      expect(() => dispatchDragEvent(target, `dragend`, { clientX: 50, clientY: 0 })).not.toThrow();
    });

    it(`Should update the live transform while resizing a mirrored item from the left edge`, async () => {
      // Verifies the RTL branch of the newly-added left-edge resize logic
      // (see docs/REFACTORING.md #25) at least runs and updates the live
      // transform without throwing — full RTL-direction correctness for
      // resize is flagged there as best-effort, not exhaustively verified.
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 4, y: 0, w: 2, h: 2 }], {
        layoutProps: { isMirrored: true, margin: [10, 10], rowHeight: 100 },
      });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const styleBefore = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;

      const leftOnly = { bottom: false, left: true, right: false, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: leftOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: -100, clientY: 0, edges: leftOnly });
      await settle();

      const styleDuring = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleDuring).toContain(`translate3d`);
      expect(styleDuring).not.toBe(styleBefore);
      expect(() => dispatchResizeEvent(target, `resizeend`, { clientX: -100, clientY: 0, edges: leftOnly })).not.toThrow();
    });

    it(`Should apply the no-touch class on Android when the item is draggable or resizable`, async () => {
      const originalUserAgent = navigator.userAgent;
      Object.defineProperty(navigator, `userAgent`, { configurable: true, value: `Android` });

      const wrapper = mountGrid(singleItemLayout());
      await settle();

      expect(wrapper.find(`.vue-grid-item`).classes()).toContain(`no-touch`);

      Object.defineProperty(navigator, `userAgent`, { configurable: true, value: originalUserAgent });
    });

    it(`Should not throw when navigator doesn't exist (SSR)`, async () => {
      // Regression test (docs/REFACTORING.md #51): isAndroid used to read
      // navigator.userAgent unguarded, from a computed referenced in a
      // template-bound class list — evaluated during any server-side
      // render, where `navigator` doesn't exist at all in Node < 21 (and
      // this project's own engines.node field explicitly supports Node
      // 18, which has no such global). Confirmed directly against a real
      // SSR render of the built package with `navigator` deleted, not
      // just reasoned about: it threw "navigator is not defined" and
      // crashed the entire render before the fix, succeeded after it.
      // Every mount in this suite runs in a jsdom/happy-dom environment
      // where navigator *does* exist, so this test has to explicitly
      // remove it to exercise the actual guard at all.
      //
      // Uses a direct save/restore rather than vi.stubGlobal +
      // vi.unstubAllGlobals() deliberately: the latter clears *every*
      // global vi.stubGlobal has ever touched, including tests/setup.ts's
      // own ResizeObserver stub other mounts in this suite depend on —
      // learned by hitting exactly that failure with the broader approach
      // first.
      const originalNavigator = globalThis.navigator;
      // @ts-expect-error -- intentionally simulating an environment where this global doesn't exist at all
      delete globalThis.navigator;

      expect(() => mountGrid(singleItemLayout())).not.toThrow();

      globalThis.navigator = originalNavigator;
    });

    it(`Should recompute style when the parent layout's margin changes after mount`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { margin: [10, 10], rowHeight: 100 } });
      await settle();

      const styleBefore = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;

      await wrapper.setProps({ margin: [40, 40] });
      await settle();

      const styleAfter = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleAfter).not.toBe(styleBefore);
    });

    it(`Should use the parent layout's new colNum for its own grid-unit math when colNum changes after mount`, async () => {
      // Regression coverage for GridItem's own cols.value staying in
      // sync with GridLayout's colNum after mount — prompted by a
      // `// TODO remove eventBus` comment that used to sit on one of
      // *two* `eventBus.emit('setColNum', ...)` call sites reachable
      // from a colNum change (GridLayout.vue's own colNum watcher, and
      // useResponsiveLayout.ts's `responsiveGridLayout()`, which that
      // same watcher also calls unconditionally). Traced the actual
      // call graph rather than assuming either way: the watcher's own
      // emit turned out to be genuinely redundant — responsiveGridLayout
      // always ends with its own emit of the same resolved value — so
      // removed *that* one specifically (see docs/REFACTORING.md #54).
      // This test guards the cascade itself continuing to work through
      // the remaining path, not the specific emit that was removed.
      //
      // Compares a reactive colNum change (this test) against a fresh
      // mount already at the target colNum (the test below), both
      // resized by the same pixel amount. Deliberately two separate
      // tests/mounts rather than one test mounting twice: the mocked
      // interact.js module tracks its "current" Interactable somewhat
      // globally, and a second mountGrid() call within the same test
      // produced flaky, hard-to-attribute failures reading from the
      // wrong instance — cleanly separating them avoids that entirely.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { colNum: 12, rowHeight: 100, margin: [10, 10] } });
      await settle();
      await wrapper.setProps({ colNum: 4 });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const rightOnly = { bottom: false, left: false, right: true, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: rightOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 150, clientY: 0, edges: rightOnly });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      const [, , resizedW] = item.emitted(EGridItemEvent.RESIZE)!.at(-1) as [string, number, number];
      // Verified directly (not guessed) against colNum 4's actual math at
      // a 1200px container: ~287.5px-wide columns mean a 150px resize
      // from w:2 resolves to w:3 — confirmed identical to a fresh mount
      // already at colNum 4 (the test below), which is the only way this
      // value could match if `cols.value` genuinely picked up the
      // reactive change rather than staying stale at colNum 12 from
      // mount.
      expect(resizedW).toBe(3);
    });

    it(`Should match a fresh mount already at that colNum, for the same reactive-change scenario above`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { colNum: 4, rowHeight: 100, margin: [10, 10] } });
      await settle();

      const target = wrapper.find(`.vue-grid-item`).element;
      const rightOnly = { bottom: false, left: false, right: true, top: false };
      dispatchResizeEvent(target, `resizestart`, { edges: rightOnly });
      await settle();
      dispatchResizeEvent(target, `resizemove`, { clientX: 150, clientY: 0, edges: rightOnly });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      const [, , resizedW] = item.emitted(EGridItemEvent.RESIZE)!.at(-1) as [string, number, number];
      expect(resizedW).toBe(3);
    });

    it(`Should no-op when the parent layout's margin "changes" to an equal value`, async () => {
      // Distinct from the test above: a new array reference with the same
      // [h, v] values shouldn't trigger a style recompute, since nothing
      // actually changed.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), { layoutProps: { margin: [10, 10], rowHeight: 100 } });
      await settle();

      const styleBefore = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;

      await wrapper.setProps({ margin: [10, 10] });
      await settle();

      const styleAfter = wrapper.find(`.vue-grid-item`).attributes(`style`) ?? ``;
      expect(styleAfter).toBe(styleBefore);
    });
  });

  describe(`lifecycle`, () => {
    it(`Should tear down the native drag/resize engines' own listeners when unmounted`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`).element;
      wrapper.unmount();

      // A pointer gesture dispatched after unmount shouldn't do anything
      // at all — confirms teardownDraggable()/teardownResizable() (the
      // native-engine replacement for interact.js's own .unset()) actually
      // removed the listeners, not just that the component stopped
      // rendering.
      expect(() => {
        el.dispatchEvent(new PointerEvent(`pointerdown`, { bubbles: true, button: 0, clientX: 0, clientY: 0, pointerId: 1 }));
        el.dispatchEvent(new PointerEvent(`pointermove`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
        el.dispatchEvent(new PointerEvent(`pointerup`, { bubbles: true, button: 0, clientX: 50, clientY: 50, pointerId: 1 }));
      }).not.toThrow();
    });
  });

  describe(`keyboard accessibility`, () => {
    it(`Should be focusable and describe itself for assistive tech when draggable or resizable`, async () => {
      const wrapper = mountGrid(singleItemLayout());
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      expect(el.attributes(`tabindex`)).toBe(`0`);
      expect(el.attributes(`role`)).toBe(`group`);
      expect(el.attributes(`aria-roledescription`)).toBeTruthy();
      expect(el.attributes(`aria-describedby`)).toBeTruthy();
    });

    it(`Should not be keyboard-focusable when static`, async () => {
      const wrapper = mountGrid(singleItemLayout(), { itemProps: { isStatic: true } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      expect(el.attributes(`tabindex`)).toBeUndefined();
      expect(el.attributes(`role`)).toBeUndefined();
    });

    it(`Should move the item by one grid unit per arrow key press`, async () => {
      const layout = [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight` });
      await settle();

      expect(layout[0].x).toBe(5);
      expect(layout[0].y).toBe(4);

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.MOVED)).toBeTruthy();
    });

    it(`Should clamp keyboard movement to the grid bounds`, async () => {
      const layout = [{ i: `0`, x: 0, y: 0, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowLeft` });
      await el.trigger(`keydown`, { key: `ArrowUp` });
      await settle();

      expect(layout[0].x).toBe(0);
      expect(layout[0].y).toBe(0);
    });

    it(`Should not move the item on arrow keys when isDraggable is false`, async () => {
      const layout = [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { itemProps: { isDraggable: false }, layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight` });
      await settle();

      expect(layout[0].x).toBe(4);
      expect(layout[0].y).toBe(4);
    });

    it(`Should resize the item by one grid unit per shift+arrow key press`, async () => {
      const layout = [{ i: `0`, x: 0, y: 0, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight`, shiftKey: true });
      await settle();

      expect(layout[0].w).toBe(3);
      expect(layout[0].h).toBe(2);

      const item = wrapper.findComponent({ name: `GridItem` });
      expect(item.emitted(EGridItemEvent.RESIZED)).toBeTruthy();
    });

    it(`Should clamp keyboard resize to minW/minH`, async () => {
      const layout = [{ i: `0`, x: 0, y: 0, w: 1, h: 1 }];
      const wrapper = mountGrid(layout, {
        itemProps: { minH: 1, minW: 1 },
        layoutProps: { compactType: ECompactType.NONE },
      });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowLeft`, shiftKey: true });
      await el.trigger(`keydown`, { key: `ArrowUp`, shiftKey: true });
      await settle();

      expect(layout[0].w).toBe(1);
      expect(layout[0].h).toBe(1);
    });

    it(`Should clamp keyboard resize to maxW/maxH`, async () => {
      // Distinct from the minW/minH test above, which only exercises
      // the `?? 1`/nullish-default side of these clamps — this exercises
      // the explicit-value side of `props.maxW ?? Infinity`/
      // `props.maxH ?? Infinity` instead.
      const layout = [{ i: `0`, x: 0, y: 0, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, {
        itemProps: { maxH: 2, maxW: 2 },
        layoutProps: { compactType: ECompactType.NONE },
      });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight`, shiftKey: true });
      await el.trigger(`keydown`, { key: `ArrowDown`, shiftKey: true });
      await settle();

      expect(layout[0].w).toBe(2);
      expect(layout[0].h).toBe(2);
    });

    it(`Should clamp keyboard resize to the grid's own boundary (colNum/maxRows), distinct from a maxW/maxH prop`, async () => {
      // A third, previously untested branch of resizeBy()'s own clamp:
      // `Math.min(w, cols.value - innerX.value, props.maxW ?? Infinity)`
      // has three competing terms, not two — the minW/minH and maxW/maxH
      // tests above only ever exercise the prop-based terms winning.
      // This confirms the grid-boundary term itself can be the actual
      // constraint: no maxW/maxH set at all, so only running out of
      // columns/rows stops the growth.
      const layout = [{ i: `0`, x: 1, y: 1, w: 1, h: 1 }];
      const wrapper = mountGrid(layout, {
        layoutProps: { colNum: 3, compactType: ECompactType.NONE, maxRows: 3 },
      });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      // First press: 1 -> 2, still within bounds (x:1 + w:2 = 3 = colNum).
      await el.trigger(`keydown`, { key: `ArrowRight`, shiftKey: true });
      await el.trigger(`keydown`, { key: `ArrowDown`, shiftKey: true });
      await settle();
      // Second press: would be 2 -> 3, exceeding colNum/maxRows — clamped
      // back down by the grid-boundary term, not a maxW/maxH prop (there
      // is none set here).
      await el.trigger(`keydown`, { key: `ArrowRight`, shiftKey: true });
      await el.trigger(`keydown`, { key: `ArrowDown`, shiftKey: true });
      await settle();

      expect(layout[0].w).toBe(2);
      expect(layout[0].h).toBe(2);
    });

    it(`Should not resize the item on shift+arrow keys when isResizable is false`, async () => {
      const layout = [{ i: `0`, x: 0, y: 0, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { itemProps: { isResizable: false }, layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight`, shiftKey: true });
      await settle();

      expect(layout[0].w).toBe(2);
      expect(layout[0].h).toBe(2);
    });

    it(`Should ignore keys other than the four arrows`, async () => {
      const layout = [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `Enter` });
      await settle();

      expect(layout[0].x).toBe(4);
      expect(layout[0].y).toBe(4);
    });

    it(`Should not hijack Ctrl/Alt/Meta+Arrow (OS/browser/assistive-tech shortcuts)`, async () => {
      const layout = [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { layoutProps: { compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { altKey: true, key: `ArrowRight` });
      await el.trigger(`keydown`, { ctrlKey: true, key: `ArrowRight` });
      await el.trigger(`keydown`, { key: `ArrowRight`, metaKey: true });
      await settle();

      expect(layout[0].x).toBe(4);
      expect(layout[0].y).toBe(4);
    });

    it(`Should move in the visually-correct direction when the layout is mirrored (RTL)`, async () => {
      // calcPosition's RTL branch increases `right` (so moves the item
      // visually *left*) as x increases — meaning a naive dx that ignores
      // render direction would make the physical ArrowRight key move a
      // mirrored item visually left. This asserts the fix: x should
      // *decrease* on ArrowRight when mirrored, since decreasing x moves
      // a right-anchored item toward the visual right.
      const layout = [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, { layoutProps: { isMirrored: true, compactType: ECompactType.NONE } });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight` });
      await settle();

      expect(layout[0].x).toBe(3);
    });

    it(`Should ignore keyboard events entirely when the item is static or enableEditMode is false`, async () => {
      const layout = [{ i: `0`, x: 4, y: 4, w: 2, h: 2 }];
      const wrapper = mountGrid(layout, {
        itemProps: { enableEditMode: false },
        layoutProps: { compactType: ECompactType.NONE },
      });
      await settle();

      const el = wrapper.find(`.vue-grid-item`);
      await el.trigger(`keydown`, { key: `ArrowRight` });
      await settle();

      expect(layout[0].x).toBe(4);
    });
  });

  describe(`autoSize`, () => {
    it(`Should call autoSize() when a ResizeObserver reports the slot content changed size (autoHeight prop)`, async () => {
      // The global ResizeObserverMock (tests/setup.ts) is a no-op stub —
      // it never actually invokes the callback passed to its
      // constructor. Overriding it locally here to capture that
      // callback and invoke it directly is the same technique used
      // elsewhere for GridLayout's own ResizeObserver (see
      // docs/REFACTORING.md), needed for the same reason: observe()
      // itself firing is a separate thing from what its own callback
      // does once invoked. GridLayout mounts its own, separate
      // ResizeObserver too (container-width tracking) — capturing every
      // constructor call and picking out the one observing this specific
      // wrapper element, rather than assuming there's only one call to
      // capture.
      const constructed: { callback: () => void; element?: Element }[] = [];
      const originalResizeObserver = globalThis.ResizeObserver;
      // Bug fix (Vitest 4): `vi.fn().mockImplementation(...)` used to
      // work as a stand-in constructor here (a mock function returning
      // an object, called via `new`, is valid plain JS — `new` uses the
      // returned object instead of `this`). Vitest 4's `vi.fn()` is no
      // longer constructable at all ("... is not a constructor"), so
      // this needs a real class now, matching `tests/setup.ts`'s own
      // `ResizeObserverMock` pattern, not a mocked function pretending
      // to be one.
      class CapturingResizeObserverMock {
        entry: { callback: () => void; element?: Element };
        constructor(cb: () => void) {
          this.entry = { callback: cb };
          constructed.push(this.entry);
        }
        disconnect = vi.fn();
        observe = vi.fn((el: Element) => { this.entry.element = el; });
        unobserve = vi.fn();
      }
      globalThis.ResizeObserver = CapturingResizeObserverMock as unknown as typeof ResizeObserver;

      try {
        stubOffsetWidth(1200);
        const wrapper = mountGrid(singleItemLayout(), {
          itemProps: { autoHeight: true },
          layoutProps: { rowHeight: 100, margin: [10, 10] },
          slotContent: () => h(`div`, { class: `content` }, `content`),
        });
        await settle();

        const wrapperEl = wrapper.find(`.vue-grid-item-auto-height-wrapper`).element;
        const match = constructed.find(entry => entry.element === wrapperEl);
        expect(match).toBeDefined();

        const item = wrapper.findComponent({ name: `GridItem` });
        match!.callback();

        // autoSize()'s own resizestart-equivalent emit fires unconditionally
        // once reached — confirms the observer's callback actually called
        // into autoSize(), not just that the observer itself was created.
        expect(item.emitted(EGridItemEvent.RESIZE)).toBeTruthy();
      } finally {
        globalThis.ResizeObserver = originalResizeObserver;
      }
    });

    it(`Should not set up a ResizeObserver for the slot content when autoHeight is false (the default)`, async () => {
      // observeSpy will still see calls from GridLayout's own,
      // unrelated ResizeObserver (container-width tracking) — checking
      // it was never called with the slot content element specifically,
      // not that it was never called at all.
      const observeSpy = vi.fn();
      const originalResizeObserver = globalThis.ResizeObserver;
      // Bug fix (Vitest 4): same class of fix as the test above — `vi.fn()`
      // is no longer constructable at all, so this needs a real class.
      class SpyingResizeObserverMock {
        disconnect = vi.fn();
        observe = observeSpy;
        unobserve = vi.fn();
      }
      globalThis.ResizeObserver = SpyingResizeObserverMock as unknown as typeof ResizeObserver;

      try {
        stubOffsetWidth(1200);
        const wrapper = mountGrid(singleItemLayout(), {
          layoutProps: { rowHeight: 100, margin: [10, 10] },
          slotContent: () => h(`div`, { class: `content` }, `content`),
        });
        await settle();

        const slotEl = wrapper.find(`.content`).element;
        expect(observeSpy.mock.calls.some(call => call[0] === slotEl)).toBe(false);
      } finally {
        globalThis.ResizeObserver = originalResizeObserver;
      }
    });

    it(`Should not throw and should not emit resize/resized when the slot content has no measurable element yet`, async () => {
      // See REFACTORING.md #12: calling the exposed slots.default() outside
      // of GridItem's own render pass returns fresh VNodes disconnected
      // from whatever the renderer actually mounted, so `.elm` is not
      // reliably available here — autoSize() should no-op rather than
      // throw in that case, which is what's being verified.
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), {
        layoutProps: { rowHeight: 100, margin: [10, 10] },
        slotContent: () => h(`div`, { class: `content` }, `content`),
      });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });

      expect(() => item.vm.autoSize()).not.toThrow();
      expect(item.emitted(EGridItemEvent.RESIZE)).toBeFalsy();
      expect(item.emitted(EGridItemEvent.RESIZED)).toBeFalsy();
    });

    it(`Should not throw when there is no default slot content at all`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid(singleItemLayout(), {
        layoutProps: { rowHeight: 100, margin: [10, 10] },
        slotContent: () => ``,
      });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });

      expect(() => item.vm.autoSize()).not.toThrow();
    });

    /**
     * autoSize()'s clamping logic (minW/maxW/minH/maxH, and the
     * unconditional floor of 1 underneath them) is otherwise unreachable
     * in tests — the exposed `slots.default()` call inside it returns
     * fresh VNodes disconnected from whatever the renderer actually
     * mounted when invoked outside GridItem's own render pass (see
     * docs/REFACTORING.md #12), so `.elm` is normally undefined and
     * autoSize() no-ops before ever reaching the clamps. Overriding the
     * component instance's own `$.slots.default` to inject a real `.elm`
     * with a controllable `getBoundingClientRect()` is the only way
     * found to exercise this, confirmed working by checking the emitted
     * RESIZE payload directly, not assumed from the technique alone.
     */
    const withMeasuredSlotSize = (
      item: ReturnType<typeof mountGrid>,
      rect: Partial<DOMRect>,
    ): void => {
      const fakeEl = document.createElement(`div`);
      fakeEl.getBoundingClientRect = () => ({
        bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0, toJSON: () => ({}), ...rect,
      }) as DOMRect;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = (item.vm as any).$;
      const original = instance.slots.default;
      instance.slots.default = (...args: unknown[]) => {
        const vnodes = original(...args);
        if (vnodes[0]) {
          vnodes[0].elm = fakeEl;
        }
        return vnodes;
      };
    };

    it(`Should clamp to an absolute floor of 1 grid unit when measured content is smaller`, async () => {
      // minW/minH explicitly 0 (not the withDefaults default of 1) —
      // otherwise the minW/minH clamp just above would already bring
      // pos.w/pos.h up to 1 before the separate, unconditional floor
      // check ever got a chance to matter, the same gap the handleResize
      // equivalent of this test needed the same fix for.
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 4, h: 4 }], {
        itemProps: { minH: 0, minW: 0 },
        layoutProps: { rowHeight: 100, margin: [10, 10] },
        slotContent: () => h(`div`, { class: `content` }, `content`),
      });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      // height must be exactly 0, not just small — autoSize's height
      // conversion uses Math.ceil (unlike width's Math.round), which
      // rounds any positive value up to at least 1 grid unit on its
      // own, before this floor check ever gets a chance to matter.
      withMeasuredSlotSize(item, { height: 0, width: 0 });

      item.vm.autoSize();

      const lastCall = item.emitted(EGridItemEvent.RESIZE)!.at(-1) as unknown[];
      expect(lastCall[1]).toBeGreaterThanOrEqual(1);
      expect(lastCall[2]).toBeGreaterThanOrEqual(1);
    });

    it(`Should clamp to maxW/maxH when measured content is larger than the configured max`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 1, h: 1 }], {
        itemProps: { maxH: 2, maxW: 2 },
        layoutProps: { rowHeight: 100, margin: [10, 10] },
        slotContent: () => h(`div`, { class: `content` }, `content`),
      });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      // A huge measured size — comfortably over maxW/maxH (2 grid units)
      // once converted through calcWH, regardless of exact column math.
      // Starting the item at 1x1 (not already at 2x2) so growing to the
      // clamped max is an actual size change and emits RESIZE at all.
      withMeasuredSlotSize(item, { height: 5000, width: 5000 });

      item.vm.autoSize();

      const lastCall = item.emitted(EGridItemEvent.RESIZE)!.at(-1) as unknown[];
      expect(lastCall[1]).toBe(2);
      expect(lastCall[2]).toBe(2);
    });

    it(`Should clamp to minW/minH when measured content is smaller than the configured min`, async () => {
      stubOffsetWidth(1200);
      const wrapper = mountGrid([{ i: `0`, x: 0, y: 0, w: 4, h: 4 }], {
        itemProps: { minH: 3, minW: 3 },
        layoutProps: { rowHeight: 100, margin: [10, 10] },
        slotContent: () => h(`div`, { class: `content` }, `content`),
      });
      await settle();

      const item = wrapper.findComponent({ name: `GridItem` });
      withMeasuredSlotSize(item, { height: 10, width: 10 });

      item.vm.autoSize();

      const lastCall = item.emitted(EGridItemEvent.RESIZE)!.at(-1) as unknown[];
      expect(lastCall[1]).toBe(3);
      expect(lastCall[2]).toBe(3);
    });
  });
});
