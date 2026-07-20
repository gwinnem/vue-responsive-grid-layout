import { h, reactive } from 'vue';
import { mount, MountingOptions } from '@vue/test-utils';
import { GridItem, GridLayout, ILayoutItem, TLayout } from '../../src/components';

/**
 * jsdom performs no real layout, so `offsetWidth` is always 0 by default.
 * GridLayout falls back to a default container width of 100 when the
 * measured width is 0 (see GridItem's onMounted), which is enough for
 * rendering assertions but not for tests that need realistic column widths.
 * Call this before mounting to simulate a real container width.
 */
export function stubOffsetWidth(width: number): void {
  Object.defineProperty(HTMLElement.prototype, `offsetWidth`, {
    configurable: true,
    value: width,
  });
}

export function restoreOffsetWidth(): void {
  // @ts-expect-error -- offsetWidth isn't typed as optional/deletable on
  // HTMLElement's own DOM lib definition, but this is exactly undoing the
  // Object.defineProperty override in stubOffsetWidth() above.
  delete HTMLElement.prototype.offsetWidth;
}

interface IMountGridOptions {
  itemProps?: Record<string, unknown>;
  layoutProps?: Record<string, unknown>;
  slotContent?: (item: ILayoutItem) => ReturnType<typeof h>;
  /** When provided, passed as GridItem's own named `#resize-handle` slot (in addition to the default slot), receiving the same `{ edge }` scoped prop a real consumer template would. */
  resizeHandleSlot?: (scope: { edge: string }) => ReturnType<typeof h>;
}

/**
 * Vue Test Utils' `wrapper.setProps()` only works on the root mounted
 * component, not on a descendant found via `findComponent` — which rules it
 * out for a GridItem rendered through GridLayout's slot. To test GridItem's
 * own prop watchers, mount with the item's props on a `reactive()` object
 * instead and mutate that directly; GridLayout's slot re-evaluates on every
 * reactive dependency change exactly like a real `v-for`-driven usage would.
 */
export function mountGridWithReactiveItem(
  item: ILayoutItem,
  layoutProps: Record<string, unknown> = {},
) {
  const itemState = reactive({ ...item });
  const wrapper = mount(GridLayout, {
    props: {
      layout: [itemState] as unknown as TLayout,
      ...layoutProps,
    },
    slots: {
      default: () => h(GridItem, { ...itemState }, () => `Item ${itemState.i}`),
    },
  } as MountingOptions<Record<string, unknown>>);

  return { itemState, wrapper };
}

/**
 * Mounts a real GridLayout with real GridItem children for each entry in
 * `layout` — the same shape as actual library usage (see demo/views/*.vue),
 * so $parent/eventBus/provide-inject wiring all behaves like production.
 */
export function mountGrid(layout: TLayout, options: IMountGridOptions = {}) {
  return mount(GridLayout, {
    props: {
      layout,
      ...options.layoutProps,
    },
    slots: {
      default: () =>
        layout.map((item: ILayoutItem) =>
          h(
            GridItem,
            {
              ...item,
              ...options.itemProps,
              key: item.i,
            },
            {
              default: () => (options.slotContent ? options.slotContent(item) : `Item ${item.i}`),
              ...(options.resizeHandleSlot ? { 'resize-handle': options.resizeHandleSlot } : {}),
            },
          ),
        ),
    },
  } as MountingOptions<Record<string, unknown>>);
}
