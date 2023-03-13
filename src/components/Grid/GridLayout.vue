<template>
  <div
    ref="refsLayout"
    class="vue-grid-layout"
    :class="{grid: props.showGridLines}"
    :dir="props.isMirrored ? 'rtl' : 'ltr'"
    :style="mergeStyle">
    <slot></slot>
    <GridItem
      v-show="isDragging"
      ref="defaultGridItem"
      class="vue-grid-placeholder grid"
      :h="placeholder.h"
      :i="placeholder.i"
      :show-close-button="showCloseButton"
      :use-border-radius="useBorderRadius"
      :w="placeholder.w"
      :x="placeholder.x"
      :y="placeholder.y" />
  </div>
</template>
<script lang="ts" setup>
  import {
    ref,
    onMounted,
    onBeforeUnmount,
    provide,
    onBeforeMount,
    nextTick,
    watch, computed,
  } from 'vue';
  import mitt, { Emitter, EventType } from 'mitt';
  import elementResizeDetectorMaker from 'element-resize-detector';
  import { ILayoutItem, TLayout } from './layout-definition';
  import { IPlaceholder } from '@/core/interfaces/layout-data.interface';
  import GridItem from './GridItem.vue';
  import {
    bottom,
    compact,
    getLayoutItem,
    moveElement,
    validateLayout,
    cloneLayout,
    getAllCollisions,
  } from '@/core/helpers/utils';
  import {
    getBreakpointFromWidth,
    getColsFromBreakpoint,
    findOrGenerateResponsiveLayout,
  } from '@/core/helpers/responsiveUtils';
  import { addWindowEventListener, removeWindowEventListener } from '@/core/helpers/DOM';
  import { EGridLayoutEvent } from '@/core/enums/EGridLayoutEvents';
  import { IBreakpoints, IColumns } from './grid-layout-props.interface';
  import { IEventsData } from '@/core/interfaces/eventBus.interfaces';
  import { EDragEvent } from '@/core/enums/EDragEvents';

  export interface IGridLayoutProps {
    autoSize?: boolean;
    borderRadiusPx?: number;
    breakpoints?: IBreakpoints;
    colNum?: number;
    cols?: IColumns;
    horizontalShift?: boolean;
    isBounded?: boolean;
    isDraggable?: boolean;
    isMirrored?: boolean;
    isResizable?: boolean;
    layout: TLayout;
    margin?: number[];
    maxRows?: number;
    preventCollision?: boolean;
    responsive?: boolean;
    responsiveLayouts?: { [key: string]: TLayout };
    restoreOnDrag?: boolean;
    rowHeight?: number;
    showCloseButton?: boolean;
    showGridLines?: boolean;
    transformScale?: number;
    useBorderRadius?: boolean;
    useCssTransforms?: boolean;
    verticalCompact?: boolean;
  }

  // Props Data
  const props = withDefaults(defineProps<IGridLayoutProps>(), {
    autoSize: true,
    borderRadiusPx: 8,
    breakpoints: (): IBreakpoints => ({
      xxl: 1600,
      // eslint-disable-next-line vue/sort-keys
      xl: 1400,
      // eslint-disable-next-line vue/sort-keys
      lg: 1200,
      md: 996,
      sm: 768,
      xs: 480,
      xxs: 0,
    }),
    colNum: 12,
    cols: (): IColumns => ({
      xxl: 12,
      // eslint-disable-next-line vue/sort-keys
      xl: 12,
      // eslint-disable-next-line vue/sort-keys
      lg: 12,
      md: 10,
      sm: 6,
      xs: 4,
      xxs: 2,
    }),
    horizontalShift: false,
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
    rowHeight: 150,
    showCloseButton: false,
    showGridLines: false,
    transformScale: 1,
    useBorderRadius: false,
    useCssTransforms: true,
    verticalCompact: true,
  });

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
  const layouts = ref<{ [key: string]: TLayout | any }>({}); // array to store all layouts from different breakpoints
  const lastBreakpoint = ref<string | null>(null); // store last active breakpoint
  const originalLayout = ref<TLayout>();
  const erd = ref<elementResizeDetectorMaker.Erd | null>(null);
  const positionsBeforeDrag = ref<{ [key: string]: string }>();

  const refsLayout = ref<HTMLElement>({} as HTMLElement);

  const defaultGridItem = ref();
  const colNum = ref(props.colNum);
  const eventBus: Emitter<{
    changeDirection: boolean;
    compact: void;
    dragEvent?: IEventsData;
    resizeEvent?: IEventsData;
    setColNum: number;
    setBounded: boolean;
    setDraggable: boolean;
    setMaxRows: number;
    setResizable: boolean;
    setRowHeight: number;
    updateWidth: number | null;
    setTransformScale: number;
  }> = mitt();

  provide(`eventBus`, eventBus);

  const emit = defineEmits<{
    (e: EGridLayoutEvent.LAYOUT_CREATED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_MOUNTED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_UPDATED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_READY, layout: TLayout): void;
    (e: EGridLayoutEvent.UPDATE_LAYOUT, layout: TLayout): void;
    (e: EGridLayoutEvent.BREAKPOINT_CHANGED, newBreakpoint: string, layout: TLayout): void;
    (e: EGridLayoutEvent.COLUMNS_CHANGED, colNum: number): void;
  }>();
  emit(EGridLayoutEvent.LAYOUT_CREATED, props.layout);

  const containerHeight = (): string => {
    if(!props.autoSize) {
      return ``;
    }
    return `${bottom(props.layout) * (props.rowHeight + props.margin[1]) + props.margin[1]}px`;
  };

  const updateHeight = (): void => {
    mergeStyle.value = {
      height: containerHeight(),
    };
  };

  // finds or generates new layouts for set breakpoints
  const responsiveGridLayout = (): void => {
    const newBreakpoint = getBreakpointFromWidth(props.breakpoints, width.value as number);
    const newCols = getColsFromBreakpoint(newBreakpoint, props.cols);
    colNum.value = newCols;
    emit(EGridLayoutEvent.COLUMNS_CHANGED, newCols);

    if(lastBreakpoint.value != null && !layouts.value[lastBreakpoint.value]) {
      layouts.value[lastBreakpoint.value] = cloneLayout(props.layout);
    }

    // Find or generate a new layout.
    const layout = findOrGenerateResponsiveLayout(
      originalLayout.value as TLayout,
      layouts.value,
      props.breakpoints,
      newBreakpoint,
      lastBreakpoint.value as string,
      newCols,
      props.verticalCompact,
    );

    layouts.value[newBreakpoint] = layout;

    if(lastBreakpoint.value !== newBreakpoint) {
      // noinspection TypeScriptValidateTypes
      emit(EGridLayoutEvent.BREAKPOINT_CHANGED, newBreakpoint, layout);
    }

    // new prop sync
    // noinspection TypeScriptValidateTypes
    emit(EGridLayoutEvent.UPDATE_LAYOUT, layout);

    lastBreakpoint.value = newBreakpoint;
    eventBus.emit(`setColNum`, getColsFromBreakpoint(newBreakpoint, props.cols));
  };

  const dragEvent = (
    eventName?: EventType,
    id?: string | number,
    x?: number,
    y?: number,
    h?: number,
    w?: number,
  ): void => {
    let l = getLayoutItem(props.layout, id);

    // GetLayoutItem sometimes returns null object
    if(l === undefined) {
      l = {
        x: 0,
        y: 0,
      } as ILayoutItem;
    }

    if(eventName === EDragEvent.DRAG_START && !props.verticalCompact) {
      // noinspection TypeScriptValidateTypes
      positionsBeforeDrag.value = props.layout.reduce(
        (result, { i, x: tmpX, y: tmpY }) => ({
          ...result,
          [i]: {
            tmpX,
            tmpY,
          },
        }),
        {},
      );
    }

    if(eventName === EDragEvent.DRAG_MOVE || eventName === EDragEvent.DRAG_START) {
      placeholder.value.i = id as string | number;
      placeholder.value.x = l.x as number;
      placeholder.value.y = l.y as number;
      placeholder.value.w = w as number;
      placeholder.value.h = h as number;
      nextTick(() => {
        isDragging.value = true;
      });
      eventBus.emit(`updateWidth`, width.value);
    } else {
      nextTick(() => {
        isDragging.value = false;
      });
    }

    // Move the element to the dragged location.
    const layout = moveElement(props.layout, l, x as number, y as number, true, props.horizontalShift as boolean, props.preventCollision);
    emit(EGridLayoutEvent.UPDATE_LAYOUT, layout);

    if(props.restoreOnDrag) {
      // Do not compact items more than in layout before drag
      // Set moved item as static to avoid to compact it
      l.isStatic = true;
      compact(props.layout, props.verticalCompact, positionsBeforeDrag.value);
      l.isStatic = false;
    } else {
      compact(props.layout, props.verticalCompact);
    }

    // needed because vue can't detect changes on array element properties
    eventBus.emit(`compact`);
    updateHeight();
    if(eventName === EDragEvent.DRAG_END) {
      positionsBeforeDrag.value = undefined;
      emit(EGridLayoutEvent.LAYOUT_UPDATED, layout);
    }
  };

  const resizeEvent = (
    eventName?: EventType,
    id?: string | number,
    x?: number,
    y?: number,
    h?: number,
    w?: number,
  ): void => {
    let l = getLayoutItem(props.layout, id);
    // getLayoutItem sometimes return null object
    if(l === undefined) {
      l = {
        h: 0,
        w: 0,
      } as ILayoutItem;
    }
    const internalW = Number(w);
    const internalH = Number(h);
    let hasCollisions;
    if(props.preventCollision) {
      const collisions = getAllCollisions(props.layout, {
        ...l,
        h: internalH,
        w: internalW,
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
      l.w = internalW;
      l.h = internalH;
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

    if(props.responsive) {
      responsiveGridLayout();
    }

    compact(props.layout, props.verticalCompact);
    eventBus.emit(`compact`);
    updateHeight();

    if(eventName === `resizeend`) {
      emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
    }
  };

  // Accessible references of functions for removing in beforeDestroy
  const resizeEventHandler = (data?: IEventsData): void => {
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
  };

  eventBus.on(`resizeEvent`, resizeEventHandler);

  const dragEventHandler = (data?: IEventsData): void => {
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
  };

  eventBus.on(`dragEvent`, dragEventHandler);

  // find difference in layouts
  const findDifference = (layout: TLayout, orgLayout: TLayout): ILayoutItem[] => {
    // Find values that are in result1 but not in result2
    const uniqueResultOne = layout.filter(obj => {
      return !orgLayout.some(obj2 => {
        return obj.i === obj2.i;
      });
    });

    // Find values that are in result2 but not in result1
    const uniqueResultTwo = orgLayout.filter(obj => {
      return !layout.some(obj2 => {
        return obj.i === obj2.i;
      });
    });

    // Combine the two arrays of unique entries#
    return uniqueResultOne.concat(uniqueResultTwo);
  };

  // clear all responsive layouts
  const initResponsiveFeatures = (): void => {
    layouts.value = { ...props.responsiveLayouts };
  };

  const layoutUpdate = (): void => {
    if(originalLayout.value !== undefined && props.layout.length > 0) {
      if(!originalLayout.value) {
        return;
      }
      const tmpLayout = originalLayout.value as TLayout;
      if(props.layout.length !== originalLayout.value?.length) {
        const diff = findDifference(props.layout, tmpLayout);
        if(diff.length > 0) {
          if(props.layout.length > tmpLayout.length) {
            originalLayout.value = tmpLayout.concat(diff);
          } else {
            originalLayout.value = tmpLayout.filter(obj => {
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
  };

  const onWindowResize = (): void => {
    // width.value = refsLayout.value.offsetWidth;
    // fix: when item ref or his parent is hidden, offsetWidth = 0
    const widthT = refsLayout.value.offsetWidth;
    if(widthT > 0) {
      width.value = widthT;
    }
    eventBus.emit(`resizeEvent`);
  };

  // life cycles methods and watches
  onBeforeUnmount(() => {
    eventBus.off(`resizeEvent`, resizeEventHandler);
    eventBus.off(`dragEvent`, dragEventHandler);
    removeWindowEventListener(`resize`, onWindowResize);
    if(erd.value) {
      erd.value?.uninstall(refsLayout.value);
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
          erd.value?.listenTo(refsLayout.value, () => {
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
          set before. That only occurs when mounting is
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
          investigate stable sizes of GridItem-s.
        */
        nextTick(() => {
          emit(EGridLayoutEvent.LAYOUT_READY, props.layout);
        });
      }
      updateHeight();
    });
  });

  watch(() => props.layout, () => {
    layoutUpdate();
  });

  watch(() => props.layout.length, () => {
    layoutUpdate();
  });

  watch(() => props.colNum, val => {
    eventBus.emit(`setColNum`, val);
  });

  watch(() => props.rowHeight, val => {
    eventBus.emit(`setRowHeight`, val);
  });

  watch(() => props.isDraggable, val => {
    eventBus.emit(`setDraggable`, val);
  });

  watch(() => props.isResizable, val => {
    eventBus.emit(`setResizable`, val);
  });

  watch(() => props.isBounded, val => {
    eventBus.emit(`setBounded`, val);
  });

  watch(() => props.isMirrored, val => {
    eventBus.emit(`changeDirection`, val);
  });

  watch(() => props.transformScale, val => {
    eventBus.emit(`setTransformScale`, val);
  });

  watch(() => props.responsive, val => {
    if(!val) {
      emit(EGridLayoutEvent.UPDATE_LAYOUT, originalLayout.value || []);
      eventBus.emit(`setColNum`, props.colNum);
    }
    onWindowResize();
  });

  watch(() => props.maxRows, val => {
    eventBus.emit(`setMaxRows`, val);
  });

  watch(() => props.margin, () => {
    updateHeight();
  });

  // Expose some property for this
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

  const rowHeightPx = computed((): string => {
    if(!props.rowHeight) {
      return `0`;
    }
    return `${props.rowHeight}px`;
  });
</script>

<style lang="scss" scoped>
@import "@/styles/variables";

.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}

.grid::before {
  content: '';
  background-size: calc(calc(100% - 5px) / v-bind(colNum)) v-bind(rowHeightPx);
  background-image: linear-gradient(
      to right,
      $grid-line-color 1px,
      transparent 1px
  ),
  linear-gradient(
      to bottom,
      $grid-line-color 1px,
      transparent 1px);
  height: calc(100% - 5px);
  width: calc(100% - 5px);
  position: absolute;
  background-repeat: repeat;
  margin: 5px;
}
</style>
