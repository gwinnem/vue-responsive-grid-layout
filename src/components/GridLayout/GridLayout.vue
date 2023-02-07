<template>
  <div>
    <div
      ref="wrapper"
      class="vue-grid-layout"
      :style="mergedStyle">
      <GridItem
        v-show="isDragging"
        class="vue-grid-placeholder"
        v-bind="{ ...gridItemProps, ...placeholder }" />
      <slot :grid-item-props="{ ...gridItemProps, observer }">
        <GridItem
          v-for="layoutItem in layout"
          :key="layoutItem.i"
          :observer="observer"
          v-bind="{ ...gridItemProps, ...layoutItemOptional(layoutItem) }"
          @container-resized="emits(EGridLayoutEvent.CONTAINER_RESIZED, $event)"
          @move="emits(EGridLayoutEvent.ITEM_MOVE, $event)"
          @moved="emits(EGridLayoutEvent.ITEM_MOVED, $event)"
          @resize="emits(EGridLayoutEvent.ITEM_RESIZE, $event)">
          <slot
            :item="layoutItem"
            name="gridItemContent"></slot>
        </GridItem>
      </slot>
    </div>
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
    Breakpoints,
    BreakpointsKeys,
    Layout,
    LayoutItemRequired,
    RecordBreakpoint,
    ResponsiveLayout,
  } from '@/core/types/helpers';
  import { TGridLayoutEvent, TIntersectionObserverConfig } from '@/core/types/components';
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
    breakpointsValidator,
    intersectionObserverConfigValidator,
    layoutValidator,
    marginValidator,
  } from '@/core/helpers/propsValidators';
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
      type: Boolean,
    },
    breakpoints: {
      default: () => ({
        lg: 1200,
        md: 996,
        sm: 768,
        xs: 480,
        xxs: 0,
      }),
      type: Object as PropType<Breakpoints>,
      validator: breakpointsValidator,
    },
    colNum: {
      required: true,
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
      type: Object as PropType<Breakpoints>,
      validator: breakpointsValidator,
    },
    horizontalShift: {
      default: false,
      type: Boolean,
    },
    intersectionObserverConfig: {
      default: () => ({
        root: null,
        rootMargin: `8px`,
        threshold: 0.40,
      }),
      type: Object as PropType<TIntersectionObserverConfig>,
      validator: intersectionObserverConfigValidator,
    },
    isDraggable: {
      default: true,
      type: Boolean,
    },
    isResizable: {
      default: true,
      type: Boolean,
    },
    layout: {
      required: true,
      type: Array as PropType<Layout>,
      validator: layoutValidator,
    },
    margin: {
      default: () => [10, 10],
      type: Array as PropType<number[]>,
      validator: marginValidator,
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
      type: Object as PropType<ResponsiveLayout>,
      validator: (value: ResponsiveLayout) => {
        const layoutKeys = (Object.keys(value) as (keyof ResponsiveLayout)[]);

        if(!layoutKeys.length) return true;

        const validator = layoutKeys.map((k: BreakpointsKeys) => layoutValidator(value[k]));

        return !validator.includes(false);
      },
    },
    rowHeight: {
      default: 150,
      type: Number,
    },
    useCssTransforms: {
      default: true,
      type: Boolean,
    },
    useObserver: {
      default: false,
      type: Boolean,
    },
    verticalCompact: {
      default: true,
      type: Boolean,
    },
  });

  // emits
  const emits = defineEmits<{
    (e: EGridLayoutEvent.CONTAINER_RESIZED, value: Event): void;
    (e: EGridLayoutEvent.INTERSECTION_OBSERVE, value: []): void;
    (e: EGridLayoutEvent.INTERSECTION_UNOBSERVE, value: []): void;
    (e: EGridLayoutEvent.ITEM_MOVE, value: Event): void;
    (e: EGridLayoutEvent.ITEM_MOVED, value: Event): void;
    (e: EGridLayoutEvent.ITEM_RESIZE, value: Event): void;
    (e: EGridLayoutEvent.ITEM_RESIZED): void;
    (e: EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_CREATED, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_MOUNTED, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_READY, layout: Layout): void;
    (e: EGridLayoutEvent.UPDATE_BREAKPOINT, breakPoint: string, layout: string): void;
    (e: EGridLayoutEvent.UPDATE_LAYOUT, layout: Layout): void;
  }>();

  // const emit = defineEmits([
  //   `container-resized`,
  //   `intersection-observe`,
  //   `intersection-unobserve`,
  //   `item-move`,
  //   `item-moved`,
  //   `item-resize`,
  //   `item-resized`,
  //   `layout-before-mount`,
  //   `layout-created`,
  //   `layout-mounted`,
  //   `layout-ready`,
  //   `update:breakpoint`,
  //   `update:layout`,
  // ]);
  const emitter = mitt<Events>();

  provide(emitterKey, emitter);

  // options
  const layoutItemRequired: LayoutItemRequired = {
    h: 0,
    i: -1,
    w: 0,
    x: 0,
    y: 0,
  };
  const layoutItemOptionalKeys = [`minW`, `minH`, `maxW`, `maxH`, `moved`, `static`, `isDraggable`, `isResizable`];

  // data
  const erd = ref(elementResizeDetectorMaker({
    callOnAdd: false,
    strategy: `scroll`,
  }));
  const isDragging = ref(false);
  const lastBreakpoint = ref<BreakpointsKeys>(<`lg` | `md` | `sm` | `xs` | `xxs` | ``>``);
  const lastLayoutLength = ref(0);
  const layouts = ref<RecordBreakpoint<Layout>>({});
  const mergedStyle = ref({});
  const originalLayout = ref(props.layout);
  const placeholder = ref({
    h: 0,
    i: -1,
    w: 0,
    x: 0,
    y: 0,
  });
  const width = ref(0);
  let observer: IntersectionObserver;
  // refs
  const wrapper = ref<HTMLDivElement | null>(null);

  // computed
  const gridItemProps = computed<IGridLayoutGridItemItemProps>(() => ({
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
    useCssTransforms: props.useCssTransforms,
    width: width.value,
  }));

  // methods
  const observerCallback = (entries): void => {
    const observerItems = {
      observe: [],
      unobserve: [],
    };

    entries.forEach(({
      target,
      isIntersecting,
    }) => {
      if(isIntersecting) {
        observerItems.observe.push(target.__INTERSECTION_OBSERVER_INDEX__);
        return;
      }

      observerItems.unobserve.push(target.__INTERSECTION_OBSERVER_INDEX__);
    });

    emits(EGridLayoutEvent.INTERSECTION_OBSERVE, observerItems.observe);
    emits(EGridLayoutEvent.INTERSECTION_UNOBSERVE, observerItems.unobserve);
  };
  const findDifference = (layout: Layout, originalLayout: Layout): Layout => {
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
  const layoutItemOptional = (props: { [key: string]: any }): Record<string, unknown> => {
    const requiredKeys = Object.keys(layoutItemRequired);

    return (Object.keys(props) as (keyof typeof props)[])
      .reduce((acc, val) => {
        if(layoutItemOptionalKeys.includes(val) || requiredKeys.includes(val)) {
          acc[val] = props[val];
        }
        return acc;
      }, {});
  };
  const layoutUpdate = (): void => {
    if(props.layout && originalLayout.value) {
      if(props.layout.length !== originalLayout.value.length) {
        const diff = findDifference(props.layout, originalLayout.value);
        // TODO

        if(diff.length > 0) {
          if(props.layout.length > originalLayout.value.length) {
            originalLayout.value = originalLayout.value.concat(diff);
          } else {
            originalLayout.value = originalLayout.value.filter(obj => {
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
  const onWindowResize = (): void => {
    if(wrapper.value) {
      width.value = wrapper.value.offsetWidth;
    }
  };
  const responsiveGridLayout = (): void => {
    const newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value);
    const newCols = getColsFromBreakpoint(newBreakpoint, props.cols);

    if(lastBreakpoint.value && !layouts.value[lastBreakpoint.value]) {
      layouts.value[lastBreakpoint.value] = cloneLayout(props.layout);
    }

    const layout = findOrGenerateResponsiveLayout(
      originalLayout.value,
      layouts.value,
      props.breakpoints,
      newBreakpoint,
      // lastBreakpoint.value,
      newCols,
      props.verticalCompact,
    );

    layouts.value[newBreakpoint] = layout;

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
        .filter(
          layoutItem => layoutItem.i !== l.i,
        );

      hasCollisions = collisions.length > 0;

      if(hasCollisions) {
        let leastX = Infinity;
        let leastY = Infinity;

        collisions.forEach(layoutItem => {
          if(layoutItem.x > l.x) leastX = Math.min(leastX, layoutItem.x);

          if(layoutItem.y > l.y) leastY = Math.min(leastY, layoutItem.y);
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
  const createObserver = (): void => {
    observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: `8px`,
      threshold: 0.40,
      ...props.intersectionObserverConfig,
    });
  };
  const onCreated = (): void => {
    emits(EGridLayoutEvent.LAYOUT_CREATED, props.layout);

    emitter.on(`resize-event`, resizeEvent);
    emitter.on(`drag-event`, dragEvent);
  };

  // lifecycles
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
      originalLayout.value = props.layout;

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

        if(props.useObserver) {
          createObserver();
        }
      });
    });
  });

  // watch
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
      emits(EGridLayoutEvent.UPDATE_LAYOUT, originalLayout.value);
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
  watch(() => props.useObserver, value => {
    if(!value) {
      observer.disconnect();
      return;
    }

    createObserver();
  });
</script>

<style>
.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
