<template>
  <div
    ref="this$refsLayout"
    class="vue-grid-layout"
    :style="mergeStyle">
    <slot></slot>
    <GridItem
      v-show="isDragging"
      ref="defaultGridItem"
      class="vue-grid-placeholder"
      :h="placeholder.h"
      :i="placeholder.i"
      :w="placeholder.w"
      :x="placeholder.x"
      :y="placeholder.y" />
  </div>
</template>
<script lang="ts">
  export default {
    name: `GridLayout`,
  };
</script>
<script lang="ts" setup>
  import {
    ref,
    onMounted,
    onBeforeUnmount,
    provide,
    onBeforeMount,
    nextTick,
    watch,
  } from 'vue';
  import mitt, { Emitter, EventType } from 'mitt';
  import elementResizeDetectorMaker from 'element-resize-detector';
  import { IPlaceholder } from './layout-data.interface';
  import GridItem from './GridItem.vue';
  import {
    bottom,
    compact,
    getLayoutItem,
    moveElement,
    validateLayout,
    cloneLayout,
    getAllCollisions,
    Layout,
    LayoutItem,
  } from '@/helpers/utils';
  import {
    getBreakpointFromWidth,
    getColsFromBreakpoint,
    findOrGenerateResponsiveLayout,
  } from '@/helpers/responsiveUtils';
  import { addWindowEventListener, removeWindowEventListener, EventsData } from '@/helpers/DOM';
  import { EGridLayoutEvent } from '@/core/enums/EGridLayoutEvents';

  export interface IGridLayoutProps {
    autoSize?: boolean;
    breakpoints?: { xxl: number; xl: number; lg: number; md: number; sm: number; xs: number; xxs: number };
    colNum?: number;
    cols?: { xxl: number; xl: number; lg: number; md: number; sm: number; xs: number; xxs: number };
    isBounded?: boolean;
    isDraggable?: boolean;
    isMirrored?: boolean;
    isResizable?: boolean;
    layout: Layout;
    margin?: number[];
    maxRows?: number;
    preventCollision?: boolean;
    responsive?: boolean;
    responsiveLayouts?: { [key: string]: any };
    restoreOnDrag?: boolean;
    rowHeight?: number;
    showCloseButton?: boolean;
    transformScale?: number;
    useBorderRadius?: boolean;
    useCssTransforms?: boolean;
    useStyleCursor?: boolean;
    verticalCompact?: boolean;
  }

  // Props Data
  const props = withDefaults(defineProps<IGridLayoutProps>(), {
    autoSize: true,
    breakpoints: () => ({
      xxl: 1600,
      xl: 1400,
      lg: 1200,
      md: 996,
      sm: 768,
      xs: 480,
      xxs: 0,
    }),
    colNum: 12,
    cols: () => ({
      xxl: 12,
      xl: 12,
      lg: 12,
      md: 10,
      sm: 6,
      xs: 4,
      xxs: 2,
    }),
    isBounded: false,
    isDraggable: true,
    isMirrored: false,
    isResizable: true,
    margin: () => [10, 10],
    maxRows: Infinity,
    preventCollision: false,
    responsive: false,
    responsiveLayouts: () => ({}),
    restoreOnDrag: false,
    rowHeight: 100,
    showCloseButton: false,
    transformScale: 1,
    useBorderRadius: false,
    useCssTransforms: true,
    useStyleCursor: true,
    verticalCompact: true,
  });

  // self data
  const width = ref<number | null>(null);
  const mergeStyle = ref<{ [key: string]: string }>({});

  const lastLayoutLength = ref<number>(0);
  const isDragging = ref<boolean>(false);
  const placeholder = ref<IPlaceholder>({
    h: 0,
    i: -1,
    w: 0,
    x: 0,
    y: 0,
  });
  const layouts = ref<{ [key: string]: Layout | any }>({}); // array to store all layouts from different breakpoints
  const lastBreakpoint = ref<string | null>(null); // store last active breakpoint
  const originalLayout = ref<Layout | null>(null);
  const erd = ref<elementResizeDetectorMaker.Erd | null>(null);
  const positionsBeforeDrag = ref<{ [key: string]: string }>();
  // layout dom
  const this$refsLayout = ref<HTMLElement>({} as HTMLElement);
  // default grid item
  const defaultGridItem = ref();
  const colNum = ref(props.colNum);
  const eventBus: Emitter<{
    resizeEvent?: EventsData;
    dragEvent?: EventsData;
    updateWidth: number | null;
    setColNum: number;
    setRowHeight: number;
    setDraggable: boolean;
    setResizable: boolean;
    setBounded: boolean;
    setTransformScale: number;
    setMaxRows: number;
    compact: void;
  }> = mitt();

  provide(`eventBus`, eventBus);

  const emit = defineEmits<{
    (e: EGridLayoutEvent.LAYOUT_CREATED, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_MOUNTED, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_UPDATED, layout: Layout): void;
    (e: EGridLayoutEvent.LAYOUT_READY, layout: Layout): void;
    (e: EGridLayoutEvent.UPDATE_LAYOUT, layout: Layout): void;
    (e: EGridLayoutEvent.BREAKPOINT_CHANGED, newBreakpoint: string, layout: Layout): void;
    (e: EGridLayoutEvent.COLUMNS_CHANGED, colNum: number): void;
  }>();

  // Accessible references of functions for removing in beforeDestroy
  function resizeEventHandler(data?: EventsData): void {
    if(!data) {
      resizeEvent();
    } else {
      const {
        eventType,
        i,
        x,
        y,
        h,
        w,
      } = data;
      resizeEvent(eventType, i, x, y, h, w);
    }
  }

  function dragEventHandler(data?: EventsData): void {
    if(!data) {
      dragEvent();
    } else {
      const {
        eventType,
        i,
        x,
        y,
        h,
        w,
      } = data;
      dragEvent(eventType, i, x, y, h, w);
    }
  }

  eventBus.on(`resizeEvent`, resizeEventHandler);
  eventBus.on(`dragEvent`, dragEventHandler);
  emit(EGridLayoutEvent.LAYOUT_CREATED, props.layout);

  onBeforeUnmount(() => {
    eventBus.off(`resizeEvent`, resizeEventHandler);
    eventBus.off(`dragEvent`, dragEventHandler);
    removeWindowEventListener(`resize`, onWindowResize);
    if(erd.value) {
      erd.value.uninstall(this$refsLayout.value);
    }
  });

  onBeforeMount(() => {
    emit(EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, props.layout);
  });
  onMounted(() => {
    emit(EGridLayoutEvent.LAYOUT_MOUNTED, props.layout);
    nextTick(() => {
      validateLayout(props.layout);

      originalLayout.value = props.layout;
      nextTick(() => {
        initResponsiveFeatures();

        onWindowResize();

        // self.width = self.$el.offsetWidth;
        addWindowEventListener(`resize`, onWindowResize);

        compact(props.layout, props.verticalCompact);

        emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);

        updateHeight();
        nextTick(() => {
          erd.value = elementResizeDetectorMaker({
            callOnAdd: false,
            strategy: `scroll`, // <- For ultra performance.
            // See https://github.com/wnr/element-resize-detector/issues/110 about callOnAdd.
          });
          erd.value.listenTo(this$refsLayout.value, () => {
            onWindowResize();
          });
        });
      });
    });
  });

  watch(width, (newVal, oldVal) => {
    nextTick(() => {
      eventBus.emit(`updateWidth`, newVal);
      if(oldVal === null) {
        /*
          If oldval == null is when the width has never been
          set before. That only occurs when mouting is
          finished, and onWindowResize has been called and
          this.width has been changed the first time after it
          got set to null in the constructor. It is now time
          to issue layout-ready events as the GridItems have
          their sizes configured properly.

          The reason for emitting the layout-ready events on
          the next tick is to allow for the newly-emitted
          updateWidth event (above) to have reached the
          children GridItem-s and had their effect, so we're
          sure that they have the final size before we emit
          layout-ready (for this GridLayout) and
          item-layout-ready (for the GridItem-s).

          This way any client event handlers can reliably
          invistigate stable sizes of GridItem-s.
        */
        nextTick(() => {
          emit(EGridLayoutEvent.LAYOUT_READY, props.layout);
        });
      }
      updateHeight();
    });
  });
  watch(
    () => props.layout,
    () => {
      layoutUpdate();
    },
  );
  watch(
    () => props.layout.length,
    () => {
      layoutUpdate();
    },
  );

  watch(
    () => props.colNum,
    val => {
      eventBus.emit(`setColNum`, val);
    },
  );
  watch(
    () => props.rowHeight,
    val => {
      eventBus.emit(`setRowHeight`, val);
    },
  );
  watch(
    () => props.isDraggable,
    val => {
      eventBus.emit(`setDraggable`, val);
    },
  );
  watch(
    () => props.isResizable,
    val => {
      eventBus.emit(`setResizable`, val);
    },
  );
  watch(
    () => props.isBounded,
    val => {
      eventBus.emit(`setBounded`, val);
    },
  );

  watch(
    () => props.transformScale,
    val => {
      eventBus.emit(`setTransformScale`, val);
    },
  );
  watch(
    () => props.responsive,
    val => {
      if(!val) {
        emit(EGridLayoutEvent.UPDATE_LAYOUT, originalLayout.value || []);
        eventBus.emit(`setColNum`, props.colNum);
      }
      onWindowResize();
    },
  );
  watch(
    () => props.maxRows,
    val => {
      eventBus.emit(`setMaxRows`, val);
    },
  );
  watch(
    () => props.margin,
    () => {
      updateHeight();
    },
  );

  // methods
  function layoutUpdate(): void {
    if(props.layout !== undefined && originalLayout.value !== null) {
      if(props.layout.length !== originalLayout.value.length) {
        // console.log("### LAYOUT UPDATE!", this.layout.length, this.originalLayout.length);

        const diff = findDifference(props.layout, originalLayout.value);
        if(diff.length > 0) {
          // console.log(diff);
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
      eventBus.emit(`updateWidth`, width.value);
      updateHeight();
      emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
    }
  }

  function updateHeight(): void {
    mergeStyle.value = {
      height: containerHeight(),
    };
  }

  function onWindowResize(): void {
    if(this$refsLayout.value !== null && this$refsLayout.value !== undefined) {
      width.value = this$refsLayout.value.offsetWidth;
    }
    eventBus.emit(`resizeEvent`);
  }

  function containerHeight(): string {
    if(!props.autoSize) {
      return ``;
    }
    return `${bottom(props.layout) * (props.rowHeight + props.margin[1]) + props.margin[1]}px`;
  }

  function dragEvent(
    eventName?: EventType,
    id?: string | number,
    x?: number,
    y?: number,
    h?: number,
    w?: number,
  ): void {
    // console.log(eventName + " id=" + id + ", x=" + x + ", y=" + y);
    let l = getLayoutItem(props.layout, id);

    // GetLayoutItem sometimes returns null object
    if(l === undefined || l === null) {
      l = {
        x: 0,
        y: 0,
      } as LayoutItem;
    }

    if(eventName === `dragstart` && !props.verticalCompact) {
      // noinspection TypeScriptValidateTypes
      positionsBeforeDrag.value = props.layout.reduce(
        (result, { i, x, y }) => ({
          ...result,
          [i]: {
            x,
            y,
          },
        }),
        {},
      );
    }

    if(eventName === `dragmove` || eventName === `dragstart`) {
      placeholder.value.i = id as string | number;
      placeholder.value.x = l.x as number;
      placeholder.value.y = l.y as number;
      placeholder.value.w = w as number;
      placeholder.value.h = h as number;
      nextTick(() => {
        isDragging.value = true;
      });
      // this.$broadcast("updateWidth", this.width);
      eventBus.emit(`updateWidth`, width.value);
    } else {
      nextTick(() => {
        isDragging.value = false;
      });
    }

    // Move the element to the dragged location.
    // this.layout = moveElement(this.layout, l, x, y, true, this.preventCollision)
    const layout = moveElement(props.layout, l, x, y, true, props.preventCollision);
    emit(EGridLayoutEvent.UPDATE_LAYOUT, layout);

    if(props.restoreOnDrag) {
      // Do not compact items more than in layout before drag
      // Set moved item as static to avoid to compact it
      l.static = true;
      compact(props.layout, props.verticalCompact, positionsBeforeDrag.value);
      l.static = false;
    } else {
      compact(props.layout, props.verticalCompact);
    }

    // needed because vue can't detect changes on array element properties
    eventBus.emit(`compact`);
    updateHeight();
    if(eventName === `dragend`) {
      positionsBeforeDrag.value = undefined;
      emit(EGridLayoutEvent.LAYOUT_UPDATED, layout);
    }
  }

  function resizeEvent(
    eventName?: EventType,
    id?: string | number,
    x?: number,
    y?: number,
    h?: number,
    w?: number,
  ): void {
    let l = getLayoutItem(props.layout, id);
    // getLayoutItem sometimes return null object
    if(l === undefined || l === null) {
      l = {
        h: 0,
        w: 0,
      } as LayoutItem;
    }
    w = Number(w);
    h = Number(h);
    let hasCollisions;
    if(props.preventCollision) {
      const collisions = getAllCollisions(props.layout, {
        ...l,
        h,
        w,
      })
        .filter(
          layoutItem => layoutItem.i !== l?.i,
        );
      hasCollisions = collisions.length > 0;

      // If we're colliding, we need adjust the placeholder.
      if(hasCollisions) {
        // adjust w && h to maximum allowed space
        let leastX = Infinity;
        let leastY = Infinity;
        collisions.forEach(layoutItem => {
          if(layoutItem.x > Number(l?.x)) leastX = Math.min(leastX, layoutItem.x);
          if(layoutItem.y > Number(l?.y)) leastY = Math.min(leastY, layoutItem.y);
        });

        if(Number.isFinite(leastX)) l.w = leastX - l.x;
        if(Number.isFinite(leastY)) l.h = leastY - l.y;
      }
    }

    if(!hasCollisions) {
      // Set new width and height.
      l.w = w;
      l.h = h;
    }

    if(eventName === `resizestart` || eventName === `resizemove`) {
      placeholder.value.i = id as string | number;
      placeholder.value.x = x as number;
      placeholder.value.y = y as number;
      placeholder.value.w = l.w as number;
      placeholder.value.h = l.h as number;
      nextTick(() => {
        isDragging.value = true;
      });
      eventBus.emit(`updateWidth`, width.value);
    } else {
      nextTick(() => {
        isDragging.value = false;
      });
    }

    if(props.responsive) responsiveGridLayout();

    compact(props.layout, props.verticalCompact);
    eventBus.emit(`compact`);
    updateHeight();

    if(eventName === `resizeend`) {
      emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
    }
  }

  // finds or generates new layouts for set breakpoints
  function responsiveGridLayout(): void {
    const newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value as number);
    const newCols = getColsFromBreakpoint(newBreakpoint, props.cols);
    colNum.value = newCols;
    emit(EGridLayoutEvent.COLUMNS_CHANGED, newCols);
    // save actual layout in layouts
    if(lastBreakpoint.value != null && !layouts.value[lastBreakpoint.value]) {
      layouts.value[lastBreakpoint.value] = cloneLayout(props.layout);
    }

    // Find or generate a new layout.
    const layout = findOrGenerateResponsiveLayout(
      originalLayout.value as Layout,
      layouts.value,
      props.breakpoints,
      newBreakpoint,
      lastBreakpoint.value as string,
      newCols,
      props.verticalCompact,
    );

    // Store the new layout.
    layouts.value[newBreakpoint] = layout;

    if(lastBreakpoint.value !== newBreakpoint) {
      emit(EGridLayoutEvent.BREAKPOINT_CHANGED, newBreakpoint, layout);
    }

    // new prop sync
    emit(EGridLayoutEvent.UPDATE_LAYOUT, layout);

    lastBreakpoint.value = newBreakpoint;
    eventBus.emit(`setColNum`, getColsFromBreakpoint(newBreakpoint, props.cols));
  }

  // clear all responsive layouts
  function initResponsiveFeatures(): void {
    layouts.value = { ...props.responsiveLayouts };
  }

  // find difference in layouts
  function findDifference(layout: Layout, originalLayout: Layout): LayoutItem[] {
    // Find values that are in result1 but not in result2
    const uniqueResultOne = layout.filter(obj => {
      return !originalLayout.some(obj2 => {
        return obj.i === obj2.i;
      });
    });

    // Find values that are in result2 but not in result1
    const uniqueResultTwo = originalLayout.filter(obj => {
      return !layout.some(obj2 => {
        return obj.i === obj2.i;
      });
    });

    // Combine the two arrays of unique entries#
    return uniqueResultOne.concat(uniqueResultTwo);
  }

  // Expose some property for this
  // TODO Refactor this away
  defineExpose({
    ...props,
    defaultGridItem,
    dragEvent,
    erd,
    isDragging,
    lastBreakpoint,
    lastLayoutLength,
    layouts,
    mergeStyle,
    originalLayout,
    placeholder,
    width,
  });
</script>

<style lang="scss" scoped>
.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}
</style>
