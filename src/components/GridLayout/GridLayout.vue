<template>
  <div
    ref="wrapper"
    class="vue-grid-layout"
    :style="mergedStyle">
    <GridItem
      v-show="isDragging"
      class="vue-grid-placeholder"
      v-bind="{ ...gridItemProps, ...placeholder }" />
    <slot :grid-item-props="{ ...gridItemProps }">
      <GridItem
        v-for="layoutItem in layout"
        :key="layoutItem.i"
        v-bind="{ ...gridItemProps, ...layoutItemOptional(layoutItem) }"
        @container-resized="emits(EGridLayoutEvent.CONTAINER_RESIZED, $event)"
        @move="emits(EGridLayoutEvent.ITEM_MOVE, $event)"
        @moved="emits(EGridLayoutEvent.ITEM_MOVED, $event)"
        @remove-grid-item="removeGridItemFromLayout"
        @resize="emits(EGridLayoutEvent.ITEM_RESIZE, $event)">
        <slot
          :item="layoutItem"
          name="gridItemContent"></slot>
      </GridItem>
    </slot>
  </div>
</template>

<script lang="ts" setup>
  import elementResizeDetectorMaker from 'element-resize-detector';
  import mitt from 'mitt';
  import {
    computed,
    defineEmits,
    defineProps,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    PropType,
    provide,
    ref,
    watch,
  } from 'vue';
  import { Events } from '@/core/types/globals';
  import GridItem from '../GridItem/GridItem.vue';
  import { emitterKey } from '@/core/symbols/symbols';
  import {
    TBreakpoints,
    TBreakpointsKeys,
    TLayout,
    TLayoutItemRequired,
    TRecordBreakpoint,
    TResponsiveLayout,
  } from '@/core/types/helpers';
  import { TGridLayoutEvent } from '@/core/types/components';
  import { addWindowEventListener, removeWindowEventListener } from '@/core/helpers/DOM';
  import {
    bottom,
    cloneLayout,
    compact,
    getAllCollisions,
    getLayoutItem,
    moveElement,
  } from '@/core/helpers/utils';
  import {
    findOrGenerateResponsiveLayout,
    getBreakpointFromWidth,
    getColsFromBreakpoint,
  } from '@/core/helpers/responsiveUtils';
  import { IGridLayoutGridItemItemProps } from '@/core/interfaces/gridlayout-griditem-props';
  import { EGridLayoutEvent } from '@/core/enums/EGridLayoutEvents';

  const props = defineProps({
    autoSize: {
      default: true,
      required: false,
      type: Boolean,
    },
    borderRadiusPx: {
      default: 8,
      required: false,
      type: Number,
    },
    breakpoints: {
      default: () => ({
        lg: 1200,
        md: 996,
        sm: 768,
        xs: 480,
        xxs: 0,
      }),
      required: false,
      type: Object as PropType<TBreakpoints>,
    },
    colNum: {
      default: 12,
      required: false,
      type: Number,
    },
    cols: {
      default: () => ({
        lg: 12,
        md: 10,
        sm: 6,
        xs: 4,
        xxs: 2,
      }),
      required: false,
      type: Object as PropType<TBreakpoints>,
    },
    horizontalShift: {
      default: false,
      required: false,
      type: Boolean,
    },
    isDraggable: {
      default: true,
      required: false,
      type: Boolean,
    },
    isResizable: {
      default: true,
      type: Boolean,
    },
    layout: {
      required: true,
      type: Array as PropType<TLayout>,
    },
    margin: {
      default: () => [10, 10],
      type: Array as PropType<number[]>,
    },
    maxRows: {
      default: Infinity,
      type: Number,
    },
    preventCollision: {
      default: false,
      type: Boolean,
    },
    responsive: {
      default: false,
      type: Boolean,
    },
    responsiveLayouts: {
      default: () => ({}),
      type: Object as PropType<TResponsiveLayout>,
    },
    rowHeight: {
      default: 150,
      required: false,
      type: Number,
    },
    showCloseButton: {
      default: true,
      required: false,
      type: Boolean,
    },
    useBootstrapBreakpoints: {
      default: false,
      required: false,
      type: Boolean,
    },
    useBorderRadius: {
      required: false,
      type: Boolean,
    },
    useCssTransforms: {
      default: true,
      type: Boolean,
    },
    verticalCompact: {
      default: true,
      type: Boolean,
    },
  });

  const emits = defineEmits<{
    (e: EGridLayoutEvent.CONTAINER_RESIZED, value: Event): void;
    (e: EGridLayoutEvent.ITEM_MOVE, value: Event): void;
    (e: EGridLayoutEvent.ITEM_MOVED, value: Event): void;
    (e: EGridLayoutEvent.ITEM_RESIZE, value: Event): void;
    (e: EGridLayoutEvent.ITEM_RESIZED): void;
    (e: EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_CREATED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_MOUNTED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_READY, layout: TLayout): void;
    (e: EGridLayoutEvent.UPDATE_BREAKPOINT, breakPoint: string, layout: TLayout): void;
    (e: EGridLayoutEvent.UPDATE_LAYOUT, layout: TLayout): void;
  }>();

  const emitter = mitt<Events>();

  provide(emitterKey, emitter);

  const layoutItemRequired: TLayoutItemRequired = {
    h: 0,
    i: -1,
    w: 0,
    x: 0,
    y: 0,
  };
  // TODO Verify these
  const layoutItemOptionalKeys = [
    `isDraggable`,
    `isResizable`,
    `maxH`,
    `maxW`,
    `minH`,
    `minW`,
    `moved`,
    `static`,
  ];

  const erd = ref(elementResizeDetectorMaker({
    callOnAdd: false,
    strategy: `scroll`,
  }));

  const isDragging = ref(false);
  const lastBreakpoint = ref<TBreakpointsKeys>(<`lg` | `md` | `sm` | `xs` | `xxs` | ``>``);
  const lastLayoutLength = ref(0);
  const layouts = ref<TRecordBreakpoint<TLayout>>({});
  const mergedStyle = ref({});
  const layout = ref(props.layout);
  const placeholder = ref({
    h: 0,
    i: -1,
    w: 0,
    x: 0,
    y: 0,
  });
  const width = ref(0);

  const wrapper = ref<HTMLDivElement | null>(null);

  const gridItemProps = computed<IGridLayoutGridItemItemProps>(() => ({
    borderRadiusPx: props.borderRadiusPx,
    breakpointCols: props.cols,
    colNum: props.colNum,
    containerWidth: width.value,
    isDraggable: props.isDraggable,
    isResizable: props.isResizable,
    lastBreakpoint: lastBreakpoint.value,
    margin: props.margin,
    maxRows: props.maxRows,
    responsive: props.responsive,
    rowHeight: props.rowHeight,
    showCloseButton: props.showCloseButton,
    useBorderRadius: props.useBorderRadius,
    useCssTransforms: props.useCssTransforms,
    width: width.value,
  }));

  // eslint-disable-next-line
  const findDifference = (layout: TLayout, originalLayout: TLayout): TLayout => {
    const uniqueResultOne = layout.filter(l => !originalLayout.some(ol => l.i === ol.i));
    const uniqueResultTwo = originalLayout.filter(ol => !layout.some(l => ol.i === l.i));

    return uniqueResultOne.concat(uniqueResultTwo);
  };

  const initResponsiveFeatures = (): void => {
    layouts.value = { ...props.responsiveLayouts };
  };

  const containerHeight = (): string | undefined => {
    if(!props.autoSize || !props.layout) return;

    const [, m2] = props.margin;

    // eslint-disable-next-line consistent-return
    return `${bottom(props.layout) * (props.rowHeight + m2) + m2}px`;
  };

  const updateHeight = (): void => {
    const height = containerHeight();

    mergedStyle.value = { height };
  };

  // eslint-disable-next-line
  const layoutItemOptional = (props: { [key: string]: any }): Record<string, unknown> => {
    const requiredKeys = Object.keys(layoutItemRequired);

    return (Object.keys(props) as (keyof typeof props)[])
      .reduce((acc, val) => {
        // TODO Refactor using filters instead
        if(layoutItemOptionalKeys.includes(val) || requiredKeys.includes(val)) {
          acc[val] = props[val];
        }
        return acc;
      }, {});
  };

  const layoutUpdate = (): void => {
    if(props.layout && layout.value) {
      if(props.layout.length !== layout.value.length) {
        const diff = findDifference(props.layout, layout.value);

        if(diff.length > 0) {
          if(props.layout.length > layout.value.length) {
            layout.value = layout.value.concat(diff);
          } else {
            layout.value = layout.value.filter(obj => {
              return !diff.some(obj2 => {
                return obj.i === obj2.i;
              });
            });
          }
        }

        lastLayoutLength.value = props.layout.length;
        initResponsiveFeatures();
      }

      compact(props.layout, props.verticalCompact);

      updateHeight();

      emits(EGridLayoutEvent.UPDATE_LAYOUT, props.layout);
      emitter.emit(`recalculate-styles`);
    }
  };

  /**
   * Removes a GridItem from the layout.
   * @param id {Number} The id of the GridItem to remove from the layout.
   */
  const removeGridItemFromLayout = (id: number): void => {
    layout.value = layout.value.filter(item => item.i !== id);
    compact(layout.value, props.verticalCompact);
    emits(EGridLayoutEvent.UPDATE_LAYOUT, layout.value);
  };

  /**
   * Event handler for window resize event.
   */
  const onWindowResize = (): void => {
    if(wrapper.value) {
      width.value = wrapper.value.offsetWidth;
    }

    // TODO Add fluid grid adjustments here
    // console.error(wrapper.value.clientWidth);
  };

  const responsiveGridLayout = (): void => {
    const newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value);
    const newCols = getColsFromBreakpoint(newBreakpoint, props.cols);

    if(lastBreakpoint.value && !layouts.value[lastBreakpoint.value]) {
      layouts.value[lastBreakpoint.value] = cloneLayout(props.layout);
    }

    const layoutResponsive = findOrGenerateResponsiveLayout(
      layout.value,
      layouts.value,
      props.breakpoints,
      newBreakpoint,
      newCols,
      props.verticalCompact,
    );

    layouts.value[newBreakpoint] = layoutResponsive;

    if(lastBreakpoint.value !== newBreakpoint) {
      emits(EGridLayoutEvent.UPDATE_BREAKPOINT, newBreakpoint, layout);
    }

    lastBreakpoint.value = newBreakpoint;

    emits(EGridLayoutEvent.UPDATE_LAYOUT, layout);
    emitter.emit(`set-col-num`, getColsFromBreakpoint(newBreakpoint, props.cols));
  };

  const resizeEvent = ([eventName, id, x, y, h, w]: TGridLayoutEvent): void => {
    const layoutItem = getLayoutItem(props.layout, id);
    const l = layoutItem ?? { ...layoutItemRequired };

    let hasCollisions;

    if(props.preventCollision) {
      const collisions = getAllCollisions(props.layout, {
        ...l,
        h,
        w,
      })
        .filter(item => item.i !== l.i);

      hasCollisions = collisions.length > 0;

      if(hasCollisions) {
        let leastX = Infinity;
        let leastY = Infinity;

        collisions.forEach(item => {
          if(item.x > l.x) leastX = Math.min(leastX, item.x);

          if(item.y > l.y) leastY = Math.min(leastY, item.y);
        });

        if(Number.isFinite(leastX)) l.w = leastX - l.x;

        if(Number.isFinite(leastY)) l.h = leastY - l.y;
      }
    }

    if(!hasCollisions) {
      l.w = w;
      l.h = h;
    }

    if(eventName === `resizestart` || eventName === `resizemove`) {
      placeholder.value.i = +id;
      placeholder.value.x = x;
      placeholder.value.y = y;
      placeholder.value.w = l.w;
      placeholder.value.h = l.h;

      nextTick(() => {
        isDragging.value = true;
      });
    } else {
      nextTick(() => {
        isDragging.value = false;
      });
    }

    if(props.responsive) responsiveGridLayout();

    compact(props.layout, props.verticalCompact);

    emitter.emit(`recalculate-styles`);
    updateHeight();

    if(eventName === `resizeend`) {
      emits(EGridLayoutEvent.UPDATE_LAYOUT, props.layout);
    }
  };

  const dragEvent = ([eventName, id, x, y, h, w]: TGridLayoutEvent): void => {
    const layoutItem = getLayoutItem(props.layout, id);
    const l = layoutItem ?? { ...layoutItemRequired };

    if(eventName === `dragmove` || eventName === `dragstart`) {
      placeholder.value.i = +id;
      placeholder.value.x = l.x;
      placeholder.value.y = l.y;
      placeholder.value.w = w;
      placeholder.value.h = h;
      nextTick(() => {
        isDragging.value = true;
      });
    } else {
      nextTick(() => {
        isDragging.value = false;
      });
    }

    emits(EGridLayoutEvent.UPDATE_LAYOUT, moveElement(props.layout, l, x, y, true, props.horizontalShift, props.preventCollision));

    compact(props.layout, props.verticalCompact);

    emitter.emit(`recalculate-styles`);
    updateHeight();

    if(eventName === `dragend`) {
      compact(props.layout, props.verticalCompact);
      emits(EGridLayoutEvent.UPDATE_LAYOUT, props.layout);
    }
  };

  const onCreated = (): void => {
    emits(EGridLayoutEvent.LAYOUT_CREATED, props.layout);

    emitter.on(`resize-event`, resizeEvent);
    emitter.on(`drag-event`, dragEvent);
  };

  onCreated();

  onBeforeUnmount(() => {
    removeWindowEventListener(`resize`, onWindowResize);

    if(erd.value && wrapper.value) {
      erd.value.uninstall(wrapper.value);
    }

    emitter.off(`resize-event`, resizeEvent);
    emitter.off(`drag-event`, dragEvent);
  });

  onBeforeMount(() => {
    emits(EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, props.layout);
  });

  onMounted(() => {
    emits(EGridLayoutEvent.LAYOUT_MOUNTED, props.layout);
    nextTick(() => {
      layout.value = props.layout;

      nextTick(() => {
        onWindowResize();
        initResponsiveFeatures();

        addWindowEventListener(`resize`, onWindowResize.bind(this));
        compact(props.layout, props.verticalCompact);

        emits(EGridLayoutEvent.UPDATE_LAYOUT, props.layout);
        updateHeight();

        if(wrapper.value) {
          erd.value.listenTo(wrapper.value, onWindowResize);
        }
      });
    });
  });

  watch(() => props.colNum, value => {
    emitter.emit(`set-col-num`, value);
  });

  watch(() => props.layout.length, () => {
    layoutUpdate();
    compact(props.layout, props.verticalCompact);
  });

  watch(() => props.margin, () => {
    updateHeight();
  });

  watch(() => props.responsive, value => {
    if(!value) {
      emits(EGridLayoutEvent.UPDATE_LAYOUT, layout.value);
      emitter.emit(`set-col-num`, props.colNum);
    }
    onWindowResize();
  });

  watch(() => width.value, (value, oldValue) => {
    nextTick(() => {
      if(oldValue === 0) {
        nextTick(() => {
          emits(EGridLayoutEvent.LAYOUT_READY, props.layout);
        });
      }

      if(props.responsive) responsiveGridLayout();

      updateHeight();
    });
  });
</script>

<style>
.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
