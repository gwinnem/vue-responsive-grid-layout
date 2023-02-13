<template>
  <div
    ref="this$refsItem"
    class="vue-grid-item"
    :class="classObj"
    :style="styleObj">
    <slot :style="styleObj"></slot>
    <span
      v-if="resizableAndNotStatic"
      ref="handle"
      :class="resizableHandleClass"></span>
    <!--<span v-if="draggable" ref="dragHandle" class="vue-draggable-handle"></span>-->
  </div>
</template>
<script lang="ts">
  export default {
    name: `GridItem`,
  };
</script>
<script lang="ts" setup>
  import {
    ref, inject, computed, watch, onBeforeUnmount, onMounted, useSlots,
  } from 'vue';
  // import useCurrentInstance from "@/hooks/useInstance"
  import interact from '@interactjs/interact';
  import { Emitter } from 'mitt';
  import { Interactable } from '@interactjs/core/Interactable';
  import {
    setTopLeft, setTopRight, setTransformRtl, setTransform, Layout,
  } from '@/helpers/utils';
  import { getControlPosition, createCoreData } from '@/helpers/draggableUtils';
  import { getColsFromBreakpoint, Breakpoints } from '@/helpers/responsiveUtils';
  import { getDocumentDir, EventsData } from '@/helpers/DOM';

  import '@interactjs/auto-start';
  import '@interactjs/auto-scroll';
  import '@interactjs/actions/drag';
  import '@interactjs/actions/resize';
  import '@interactjs/modifiers';
  import '@interactjs/dev-tools';
  import useCurrentInstance from '@/hooks/useInstance';
  import { IGridLayoutProps } from './grid-layout-props.interface';
  import { ILayoutData } from './layout-data.interface';
  import { EGridItemEvent } from '../../core/enums/EGridItemEvents';

  const { proxy } = useCurrentInstance();

  // for parent's instance
  // const thisLayout: (Props & LayoutData) | undefined = inject("thisLayout")
  type TIns = (IGridLayoutProps & ILayoutData) | undefined
  const thisLayout = proxy?.$parent as TIns;
  // console.log(thisLayout)

  // eventBus
  const eventBus = inject(`eventBus`) as Emitter<{
    resizeEvent?: EventsData;
    dragEvent?: EventsData;
    updateWidth: number;
    setColNum: number;
    setRowHeight: number;
    setDraggable: boolean;
    setResizable: boolean;
    setBounded: boolean;
    setTransformScale: number;
    setMaxRows: number;
    compact?: undefined;
    directionchange: undefined;
  }>;
  // console.log(thisLayout, eventBus)

  const emit = defineEmits<{
    (e: EGridItemEvent.CONTAINER_RESIZED, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.MOVE, i: number | string, x: number, y: number): void;
    (e: EGridItemEvent.MOVED, i: number | string, x: number, y: number): void;
    (e: EGridItemEvent.RESIZE, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.RESIZED, i: number | string, h: number, w: number, height: number, width: number): void;
  }>();

  export interface IGridItemProps {
    isDraggable?: boolean | null;
    isResizable?: boolean | null;
    isBounded?: boolean | null;
    static?: boolean;
    minH?: number;
    minW?: number;
    maxH?: number;
    maxW?: number;
    x: number;
    y: number;
    w: number;
    h: number;
    i: string | number;
    dragIgnoreFrom?: string;
    dragAllowFrom?: string | null;
    resizeIgnoreFrom?: string;
    preserveAspectRatio?: boolean;
    dragOption?: {[key: string]: any};
    resizeOption?: {[key: string]: any};
  }
  interface IGridItemPosition {
    left?: number;
    right?: number;
    top: number;
    width: number;
    height: number;
  }
  interface IGridItemWidthHeight {
    width: number;
    height: number;
  }

  // Props Data
  const props = withDefaults(defineProps<IGridItemProps>(), {
    dragAllowFrom: null,
    dragIgnoreFrom: `a, button`,
    dragOption: () => ({}),
    isBounded: null,
    isDraggable: null,
    isResizable: null,
    maxH: Infinity,
    maxW: Infinity,
    minH: 1,
    minW: 1,
    preserveAspectRatio: false,
    resizeIgnoreFrom: `a, button`,
    resizeOption: () => ({}),
    static: false,
  });

  // item dom
  const this$refsItem = ref<HTMLElement>({} as HTMLElement);

  // self data
  const cols = ref<number>(1);
  const containerWidth = ref<number>(100);
  const rowHeight = ref<number>(30);
  const margin = ref<number[]>([10, 10]);
  const maxRows = ref<number>(Infinity);
  const draggable = ref<boolean | null>(null);
  const resizable = ref<boolean | null>(null);
  const transformScale = ref<number>(1);
  const useCssTransforms = ref<boolean>(true);
  const useStyleCursor = ref<boolean>(true);

  const isDragging = ref(false);
  const dragging = ref<IGridItemPosition | null>(null);
  const isResizing = ref(false);
  const resizing = ref<IGridItemWidthHeight | null>(null);
  const lastX = ref(NaN);
  const lastY = ref(NaN);
  const lastW = ref(NaN);
  const lastH = ref(NaN);
  const styleObj = ref({} as any);
  const rtl = ref(false);

  const dragEventSet = ref(false);
  const resizeEventSet = ref(false);

  const previousW = ref<number | null>(null);
  const previousH = ref<number | null>(null);
  const previousX = ref<number | null>(null);
  const previousY = ref<number | null>(null);
  const innerX = ref<number>(props.x);
  const innerY = ref<number>(props.y);
  const innerW = ref<number>(props.w);
  const innerH = ref<number>(props.h);

  const bounded = ref<boolean | null>(null);

  const interactObj = ref<Interactable | null>(null);
  // computed

  const resizableAndNotStatic = computed(() => {
    return resizable.value && !props.static;
  });
  const draggableOrResizableAndNotStatic = computed(() => {
    return (draggable.value || resizable.value) && !props.static;
  });
  const isAndroid = computed(() => {
    return navigator.userAgent.toLowerCase().indexOf(`android`) !== -1;
  });
  const renderRtl = computed(() => {
    return thisLayout?.isMirrored ? !rtl.value : rtl.value;
  });
  const classObj = computed(() => {
    return {
      cssTransforms: useCssTransforms.value,
      "disable-userselect": isDragging.value,
      "no-touch": isAndroid.value && draggableOrResizableAndNotStatic.value,
      "render-rtl": renderRtl.value,
      resizing: isResizing.value,
      static: props.static,
      "vue-draggable-dragging": isDragging.value,
      "vue-resizable": resizableAndNotStatic.value,
    };
  });

  const resizableHandleClass = computed(() => {
    if(renderRtl.value) {
      return `vue-resizable-handle vue-rtl-resizable-handle`;
    }
    return `vue-resizable-handle`;
  });

  // watch
  watch(
    () => props.isDraggable,
    val => {
      draggable.value = val;
    },
  );
  watch(
    () => props.static,
    () => {
      tryMakeDraggable();
      tryMakeResizable();
    },
  );
  watch(draggable, () => {
    tryMakeDraggable();
  });
  watch(
    () => props.isResizable,
    val => {
      resizable.value = val;
    },
  );
  watch(
    () => props.isBounded,
    val => {
      bounded.value = val;
    },
  );
  watch(resizable, () => {
    tryMakeResizable();
  });
  watch(rowHeight, () => {
    createStyle();
    emitContainerResized();
  });
  watch(cols, () => {
    tryMakeResizable();
    createStyle();
    emitContainerResized();
  });
  watch(containerWidth, () => {
    tryMakeResizable();
    createStyle();
    emitContainerResized;
  });
  watch(
    () => props.x,
    newVal => {
      innerX.value = newVal;
      createStyle();
    },
  );
  watch(
    () => props.y,
    newVal => {
      innerY.value = newVal;
      createStyle();
    },
  );
  watch(
    () => props.h,
    newVal => {
      innerH.value = newVal;
      createStyle();
      // this.emitContainerResized();
    },
  );
  watch(
    () => props.w,
    newVal => {
      innerW.value = newVal;
      createStyle();
      // wthis.emitContainerResized();
    },
  );
  watch(renderRtl, () => {
    // console.log("### renderRtl");
    tryMakeResizable();
    createStyle();
  });
  watch(
    () => props.minH,
    () => {
      tryMakeResizable();
    },
  );
  watch(
    () => props.maxH,
    () => {
      tryMakeResizable();
    },
  );
  watch(
    () => props.minW,
    () => {
      tryMakeResizable();
    },
  );
  watch(
    () => props.maxW,
    () => {
      tryMakeResizable();
    },
  );
  watch(
    () => thisLayout?.margin,
    newMargin => {
      if(!newMargin || (newMargin[0] === margin.value[0] && newMargin[1] === margin.value[1])) {
        return;
      }
      margin.value = newMargin.map(m => Number(m));
      createStyle();
      emitContainerResized();
    },
  );

  //
  function updateWidthHandler(width: number): void {
    updateWidth(width);
  }
  function compactHandler(layout?: Layout): void {
    selfCompact(layout);
  }
  function setDraggableHandler(isDraggable: boolean): void {
    if(props.isDraggable === null) {
      draggable.value = isDraggable;
    }
  }

  function setResizableHandler(isResizable: boolean): void {
    if(props.isResizable === null) {
      resizable.value = isResizable;
    }
  }
  function setBoundedHandler(isBounded: boolean): void {
    if(props.isBounded === null) {
      bounded.value = isBounded;
    }
  }

  function setTransformScaleHandler(tScale: number): void {
    transformScale.value = tScale;
  }

  function setRowHeightHandler(rHeight: number): void {
    rowHeight.value = rHeight;
  }

  function setMaxRowsHandler(mRows: number): void {
    maxRows.value = mRows;
  }

  function directionchangeHandler(): void {
    rtl.value = getDocumentDir() === `rtl`;
    selfCompact();
  }

  function setColNum(colNum: number): void {
    cols.value = colNum;
  }

  // eventbus
  eventBus.on(`updateWidth`, updateWidthHandler);
  eventBus.on(`compact`, compactHandler);
  eventBus.on(`setDraggable`, setDraggableHandler);
  eventBus.on(`setResizable`, setResizableHandler);
  eventBus.on(`setBounded`, setBoundedHandler);
  eventBus.on(`setTransformScale`, setTransformScaleHandler);
  eventBus.on(`setRowHeight`, setRowHeightHandler);
  eventBus.on(`setMaxRows`, setMaxRowsHandler);
  eventBus.on(`directionchange`, directionchangeHandler);
  eventBus.on(`setColNum`, setColNum);

  rtl.value = getDocumentDir() === `rtl`;

  onBeforeUnmount(() => {
    // Remove listeners
    eventBus.off(`updateWidth`, updateWidthHandler);
    eventBus.off(`compact`, compactHandler);
    eventBus.off(`setDraggable`, setDraggableHandler);
    eventBus.off(`setResizable`, setResizableHandler);
    eventBus.off(`setBounded`, setBoundedHandler);
    eventBus.off(`setTransformScale`, setTransformScaleHandler);
    eventBus.off(`setRowHeight`, setRowHeightHandler);
    eventBus.off(`setMaxRows`, setMaxRowsHandler);
    eventBus.off(`directionchange`, directionchangeHandler);
    eventBus.off(`setColNum`, setColNum);
    if(interactObj.value) {
      interactObj.value.unset(); // destroy interact intance
    }
  });

  onMounted(() => {
    if(thisLayout?.responsive && thisLayout.lastBreakpoint) {
      cols.value = getColsFromBreakpoint(thisLayout.lastBreakpoint, thisLayout?.cols as Breakpoints);
    } else {
      cols.value = thisLayout?.colNum as number;
    }
    rowHeight.value = thisLayout?.rowHeight as number;
    containerWidth.value = thisLayout?.width !== null ? (thisLayout?.width as number) : 100;
    margin.value = thisLayout?.margin !== undefined ? thisLayout.margin : [10, 10];
    maxRows.value = thisLayout?.maxRows as number;
    if(props.isDraggable === null) {
      draggable.value = thisLayout?.isDraggable as boolean;
    } else {
      draggable.value = props.isDraggable;
    }

    if(props.isResizable === null) {
      resizable.value = thisLayout?.isResizable as boolean;
    } else {
      resizable.value = props.isResizable;
    }
    if(props.isBounded === null) {
      bounded.value = thisLayout?.isBounded as boolean;
    } else {
      bounded.value = props.isBounded;
    }
    transformScale.value = thisLayout?.transformScale as number;
    useCssTransforms.value = thisLayout?.useCssTransforms as boolean;
    useStyleCursor.value = thisLayout?.useStyleCursor as boolean;
    createStyle();
  });
  // methods
  function createStyle(): void {
    if(props.x + props.w > cols.value) {
      innerX.value = 0;
      innerW.value = props.w > cols.value ? cols.value : props.w;
    } else {
      innerX.value = props.x;
      innerW.value = props.w;
    }
    const pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);

    if(isDragging.value) {
      pos.top = dragging.value?.top as number;
      //                    Add rtl support
      if(renderRtl.value) {
        pos.right = dragging.value?.left as number;
      } else {
        pos.left = dragging.value?.left as number;
      }
    }
    if(isResizing.value) {
      pos.width = resizing.value?.width as number;
      pos.height = resizing.value?.height as number;
    }

    let sty;
    // CSS Transforms support (default)
    if(useCssTransforms.value) {
      //                    Add rtl support
      if(renderRtl.value) {
        sty = setTransformRtl(pos.top, pos.right as number, pos.width, pos.height);
      } else {
        sty = setTransform(pos.top, pos.left as number, pos.width, pos.height);
      }
    } else {
      // top,left (slow)
      //                    Add rtl support
      if(renderRtl.value) {
        sty = setTopRight(pos.top, pos.right as number, pos.width, pos.height);
      } else {
        sty = setTopLeft(pos.top, pos.left as number, pos.width, pos.height);
      }
    }
    styleObj.value = sty;
  }
  function emitContainerResized(): void {
    // this.style has width and height with trailing 'px'. The
    // resized event is without them
    const styleProps = {} as IGridItemWidthHeight;
    for(const prop of [`width`, `height`]) {
      const val = styleObj.value[prop];
      const matches = val.match(/^(\d+)px$/);
      if(!matches) return;
      // eslint-disable-next-line prefer-destructuring
      styleProps[prop] = matches[1];
    }
    emit(EGridItemEvent.CONTAINER_RESIZED, props.i, props.h, props.w, styleProps.height, styleProps.width);
  }

  function handleResize(event: MouseEvent): void {
    if(props.static) return;
    const position = getControlPosition(event);
    // Get the current drag point from the event. This is used as the offset.
    if(position == null) return; // not possible but satisfies flow
    const { x, y } = position;

    const newSize = { height: 0, width: 0 };
    let pos;
    switch(event.type) {
      case `resizestart`: {
        tryMakeResizable();
        previousW.value = innerW.value;
        previousH.value = innerH.value;
        pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
        newSize.width = pos.width;
        newSize.height = pos.height;
        resizing.value = newSize;
        isResizing.value = true;
        break;
      }
      case `resizemove`: {
        //                        console.log("### resize => " + event.type + ", lastW=" + this.lastW + ", lastH=" + this.lastH);
        const coreEvent = createCoreData(lastW.value, lastH.value, x, y);
        if(renderRtl.value) {
          newSize.width = Number(resizing.value?.width) - coreEvent.deltaX / transformScale.value;
        } else {
          newSize.width = Number(resizing.value?.width) + coreEvent.deltaX / transformScale.value;
        }
        newSize.height = Number(resizing.value?.height) + coreEvent.deltaY / transformScale.value;

        /// console.log("### resize => " + event.type + ", deltaX=" + coreEvent.deltaX + ", deltaY=" + coreEvent.deltaY);
        resizing.value = newSize;
        break;
      }
      case `resizeend`: {
        // console.log("### resize end => x=" +this.innerX + " y=" + this.innerY + " w=" + this.innerW + " h=" + this.innerH);
        pos = calcPosition(innerX.value, innerY.value, innerW.value, innerH.value);
        newSize.width = pos.width;
        newSize.height = pos.height;
        //                        console.log("### resize end => " + JSON.stringify(newSize));
        resizing.value = null;
        isResizing.value = false;
        break;
      }
      default: {
        // Do nothing just to avoid linting complaints
      }
    }

    // Get new WH
    pos = calcWH(newSize.height, newSize.width);
    if(pos.w < props.minW) {
      pos.w = props.minW;
    }
    if(pos.w > props.maxW) {
      pos.w = props.maxW;
    }
    if(pos.h < props.minH) {
      pos.h = props.minH;
    }
    if(pos.h > props.maxH) {
      pos.h = props.maxH;
    }

    if(pos.h < 1) {
      pos.h = 1;
    }
    if(pos.w < 1) {
      pos.w = 1;
    }

    lastW.value = x;
    lastH.value = y;

    if(innerW.value !== pos.w || innerH.value !== pos.h) {
      emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }
    if(
      event.type === `resizeend`
      && (previousW.value !== innerW.value || previousH.value !== innerH.value)
    ) {
      emit(EGridItemEvent.RESIZED, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }
    const data = {
      eventType: event.type,
      h: pos.h,
      i: props.i,
      w: pos.w,
      x: innerX.value,
      y: innerY.value,
    };
    eventBus.emit(`resizeEvent`, data);
  }

  function handleDrag(event: MouseEvent): void {
    if(props.static) return;
    if(isResizing.value) return;

    const position = getControlPosition(event);

    // Get the current drag point from the event. This is used as the offset.
    if(position === null) return; // not possible but satisfies flow
    const { x, y } = position;

    // let shouldUpdate = false;
    const newPosition = { left: 0, top: 0 };
    switch(event.type) {
      case `dragstart`: {
        previousX.value = innerX.value;
        previousY.value = innerY.value;

        const tg = event.target as HTMLElement;
        const parentTg = tg.offsetParent as HTMLElement;
        const parentRect = parentTg.getBoundingClientRect();
        const clientRect = tg.getBoundingClientRect();

        const cLeft = clientRect.left / transformScale.value;
        const pLeft = parentRect.left / transformScale.value;
        const cRight = clientRect.right / transformScale.value;
        const pRight = parentRect.right / transformScale.value;
        const cTop = clientRect.top / transformScale.value;
        const pTop = parentRect.top / transformScale.value;

        if(renderRtl.value) {
          newPosition.left = (cRight - pRight) * -1;
        } else {
          newPosition.left = cLeft - pLeft;
        }
        newPosition.top = cTop - pTop;
        dragging.value = newPosition as IGridItemPosition;
        isDragging.value = true;
        break;
      }
      case `dragend`: {
        if(!isDragging.value) return;
        const tg = event.target as HTMLElement;
        const parentTg = tg.offsetParent as HTMLElement;
        const parentRect = parentTg.getBoundingClientRect();
        const clientRect = tg.getBoundingClientRect();

        const cLeft = clientRect.left / transformScale.value;
        const pLeft = parentRect.left / transformScale.value;
        const cRight = clientRect.right / transformScale.value;
        const pRight = parentRect.right / transformScale.value;
        const cTop = clientRect.top / transformScale.value;
        const pTop = parentRect.top / transformScale.value;

        //                        Add rtl support
        if(renderRtl.value) {
          newPosition.left = (cRight - pRight) * -1;
        } else {
          newPosition.left = cLeft - pLeft;
        }
        newPosition.top = cTop - pTop;
        //                        console.log("### drag end => " + JSON.stringify(newPosition));
        //                        console.log("### DROP: " + JSON.stringify(newPosition));
        dragging.value = null;
        isDragging.value = false;
        // shouldUpdate = true;
        break;
      }
      case `dragmove`: {
        const coreEvent = createCoreData(lastX.value, lastY.value, x, y);
        //                        Add rtl support
        if(renderRtl.value) {
          newPosition.left = Number(dragging.value?.left) - coreEvent.deltaX / transformScale.value;
        } else {
          newPosition.left = Number(dragging.value?.left) + coreEvent.deltaX / transformScale.value;
        }
        newPosition.top = Number(dragging.value?.top) + coreEvent.deltaY / transformScale.value;
        if(bounded.value) {
          const tg = event.target as HTMLElement;
          const parentTg = tg.offsetParent as HTMLElement;
          const bottomBoundary = parentTg.clientHeight - calcGridItemWHPx(props.h, rowHeight.value, margin.value[1]);
          newPosition.top = clamp(newPosition.top, 0, bottomBoundary);
          const colWidth = calcColWidth();
          const rightBoundary = containerWidth.value - calcGridItemWHPx(props.w, colWidth, margin.value[0]);
          newPosition.left = clamp(newPosition.left, 0, rightBoundary);
        }
        //                        console.log("### drag => " + event.type + ", x=" + x + ", y=" + y);
        //                        console.log("### drag => " + event.type + ", deltaX=" + coreEvent.deltaX + ", deltaY=" + coreEvent.deltaY);
        //                        console.log("### drag end => " + JSON.stringify(newPosition));
        dragging.value = newPosition as IGridItemPosition;
        break;
      }
      default: {
        // Do nothing just to avoid linting complaints
      }
    }

    // Get new XY
    let pos;
    if(renderRtl.value) {
      pos = calcXY(newPosition.top, newPosition.left);
    } else {
      pos = calcXY(newPosition.top, newPosition.left);
    }

    lastX.value = x;
    lastY.value = y;

    if(innerX.value !== pos.x || innerY.value !== pos.y) {
      emit(EGridItemEvent.MOVE, props.i, pos.x, pos.y);
    }
    if(
      event.type === `dragend`
      && (previousX.value !== innerX.value || previousY.value !== innerY.value)
    ) {
      emit(EGridItemEvent.MOVED, props.i, pos.x, pos.y);
    }
    const data = {
      eventType: event.type,
      h: innerH.value,
      i: props.i,
      w: innerW.value,
      x: pos.x,
      y: pos.y,
    };
    eventBus.emit(`dragEvent`, data);
  }
  function calcPosition(x: number, y: number, w: number, h: number): IGridItemPosition {
    const colWidth = calcColWidth();
    // add rtl support
    let out;
    if(renderRtl.value) {
      out = {
        height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin.value[1]),
        right: Math.round(colWidth * x + (x + 1) * margin.value[0]),
        top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
        // 0 * Infinity === NaN, which causes problems with resize constriants;
        // Fix this if it occurs.
        // Note we do it here rather than later because Math.round(Infinity) causes deopt
        width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin.value[0]),
      };
    } else {
      out = {
        height: h === Infinity ? h : Math.round(rowHeight.value * h + Math.max(0, h - 1) * margin.value[1]),
        left: Math.round(colWidth * x + (x + 1) * margin.value[0]),
        top: Math.round(rowHeight.value * y + (y + 1) * margin.value[1]),
        // 0 * Infinity === NaN, which causes problems with resize constriants;
        // Fix this if it occurs.
        // Note we do it here rather than later because Math.round(Infinity) causes deopt
        width: w === Infinity ? w : Math.round(colWidth * w + Math.max(0, w - 1) * margin.value[0]),
      };
    }

    return out;
  }
  /**
   * Translate x and y coordinates from pixels to grid units.
   * @param  {Number} top  Top position (relative to parent) in pixels.
   * @param  {Number} left Left position (relative to parent) in pixels.
   * @return {Object} x and y in grid units.
   */
  // TODO check if this function needs change in order to support rtl.
  function calcXY(top: number, left: number) {
    const colWidth = calcColWidth();

    // left = colWidth * x + margin * (x + 1)
    // l = cx + m(x+1)
    // l = cx + mx + m
    // l - m = cx + mx
    // l - m = x(c + m)
    // (l - m) / (c + m) = x
    // x = (left - margin) / (coldWidth + margin)
    let x = Math.round((left - margin.value[0]) / (colWidth + margin.value[0]));
    let y = Math.round((top - margin.value[1]) / (rowHeight.value + margin.value[1]));

    // Capping
    x = Math.max(Math.min(x, cols.value - innerW.value), 0);
    y = Math.max(Math.min(y, maxRows.value - innerH.value), 0);

    return { x, y };
  }

  // Helper for generating column width
  function calcColWidth(): number {
    const colWidth = (containerWidth.value - margin.value[0] * (cols.value + 1)) / cols.value;
    // console.log("### COLS=" + this.cols + " COL WIDTH=" + colWidth + " MARGIN " + this.margin[0]);
    return colWidth;
  }
  // This can either be called:
  // calcGridItemWHPx(w, colWidth, margin[0])
  // or
  // calcGridItemWHPx(h, rowHeight, margin[1])
  function calcGridItemWHPx(gridUnits: number, colOrRowSize: number, marginPx: number): number {
    if(!Number.isFinite(gridUnits)) return gridUnits;
    return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
  }
  // Similar to _.clamp
  function clamp(num: number, lowerBound: number, upperBound: number): number {
    return Math.max(Math.min(num, upperBound), lowerBound);
  }
  /**
   * Given a height and width in pixel values, calculate grid units.
   * @param  {Number} height Height in pixels.
   * @param  {Number} width  Width in pixels.
   * @param  {Boolean} autoSizeFlag  function autoSize identifier.
   * @return {Object} w, h as grid units.
   */
  function calcWH(height: number, width: number, autoSizeFlag = false): {w: number; h: number} {
    const colWidth = calcColWidth();

    // width = colWidth * w - (margin * (w - 1))
    // ...
    // w = (width + margin) / (colWidth + margin)
    let w = Math.round((width + margin.value[0]) / (colWidth + margin.value[0]));
    let h;
    if(!autoSizeFlag) {
      h = Math.round((height + margin.value[1]) / (rowHeight.value + margin.value[1]));
    } else {
      h = Math.ceil((height + margin.value[1]) / (rowHeight.value + margin.value[1]));
    }

    // Capping
    w = Math.max(Math.min(w, cols.value - innerX.value), 0);
    h = Math.max(Math.min(h, maxRows.value - innerY.value), 0);
    return { h, w };
  }
  function updateWidth(width: number, colNum?: number): void {
    containerWidth.value = width;
    if(colNum !== undefined && colNum !== null) {
      cols.value = colNum;
    }
  }
  function selfCompact(layout?: Layout): void {
    const a = layout;
    createStyle();
  }

  function tryMakeDraggable(): void {
    if(interactObj.value === null || interactObj.value === undefined) {
      interactObj.value = interact(this$refsItem.value);
      if(!useStyleCursor.value) {
        // @ts-ignore
        interactObj.value.styleCursor(false);
      }
    }
    if(draggable.value && !props.static) {
      const opts = {
        allowFrom: props.dragAllowFrom,
        ignoreFrom: props.dragIgnoreFrom,
        ...props.dragOption,
      };
      // @ts-ignore
      interactObj.value.draggable(opts);
      /* this.interactObj.draggable({allowFrom: '.vue-draggable-handle'}); */
      if(!dragEventSet.value) {
        dragEventSet.value = true;
        interactObj.value.on(`dragstart dragmove dragend`, event => {
          handleDrag(event);
        });
      }
    } else {
      // @ts-ignore
      interactObj.value.draggable({
        enabled: false,
      });
    }
  }
  function tryMakeResizable():void {
    if(interactObj.value === null || interactObj.value === undefined) {
      interactObj.value = interact(this$refsItem.value);
      if(!useStyleCursor.value) {
        // @ts-ignore
        interactObj.value.styleCursor(false);
      }
    }
    if(resizable.value && !props.static) {
      const maximum = calcPosition(0, 0, props.maxW, props.maxH);
      const minimum = calcPosition(0, 0, props.minW, props.minH);

      // console.log("### MAX " + JSON.stringify(maximum));
      // console.log("### MIN " + JSON.stringify(minimum));

      const opts = {
        // allowFrom: "." + this.resizableHandleClass.trim().replace(" ", "."),
        edges: {
          bottom: `.${resizableHandleClass.value.trim().replace(` `, `.`)}`,
          left: false,
          right: `.${resizableHandleClass.value.trim().replace(` `, `.`)}`,
          top: false,
        },
        ignoreFrom: props.resizeIgnoreFrom,
        restrictSize: {
          max: {
            height: maximum.height * transformScale.value,
            width: maximum.width * transformScale.value,
          },
          min: {
            height: minimum.height * transformScale.value,
            width: minimum.width * transformScale.value,
          },
        },
        ...props.resizeOption,
      };

      if(props.preserveAspectRatio) {
        // @ts-ignore
        opts.modifiers = [
          // @ts-ignore
          interact.modifiers.aspectRatio({
            ratio: `preserve`,
          }),
        ];
      }

      // @ts-ignore
      interactObj.value.resizable(opts);
      if(!resizeEventSet.value) {
        resizeEventSet.value = true;
        interactObj.value.on(`resizestart resizemove resizeend`, event => {
          handleResize(event);
        });
      }
    } else {
      // @ts-ignore
      interactObj.value.resizable({
        enabled: false,
      });
    }
  }
  const $slots = useSlots();
  function autoSize(): void {
    // ok here we want to calculate if a resize is needed
    previousW.value = innerW.value;
    previousH.value = innerH.value;

    // @ts-ignore
    const newSize = $slots?.default[0].elm.getBoundingClientRect();
    const pos = calcWH(newSize.height, newSize.width, true);
    if(pos.w < props.minW) {
      pos.w = props.minW;
    }
    if(pos.w > props.maxW) {
      pos.w = props.maxW;
    }
    if(pos.h < props.minH) {
      pos.h = props.minH;
    }
    if(pos.h > props.maxH) {
      pos.h = props.maxH;
    }

    if(pos.h < 1) {
      pos.h = 1;
    }
    if(pos.w < 1) {
      pos.w = 1;
    }

    // this.lastW = x; // basically, this is copied from resizehandler, but shouldn't be needed
    // this.lastH = y;

    if(innerW.value !== pos.w || innerH.value !== pos.h) {
      emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }
    if(previousW.value !== pos.w || previousH.value !== pos.h) {
      emit(EGridItemEvent.RESIZED, props.i, pos.h, pos.w, newSize.height, newSize.width);
      const data = {
        eventType: `resizeend`,
        h: pos.h,
        i: props.i,
        w: pos.w,
        x: innerX.value,
        y: innerY.value,
      };
      eventBus.emit(`resizeEvent`, data);
    }
  }

  defineExpose({
    autoSize,
    calcXY,
    dragging,
    ...props,
  });
</script>
<style>
.vue-grid-item {
  box-sizing: border-box;
  touch-action: none;
  transition: all 200ms ease;
  transition-property: left, top, right;
  /* add right for rtl */
}

.vue-grid-item.no-touch {
  -ms-touch-action: none;
  touch-action: none;
}

.vue-grid-item.cssTransforms {
  transition-property: transform;
  left: 0;
  right: auto;
}

.vue-grid-item.cssTransforms.render-rtl {
  left: auto;
  right: 0;
}

.vue-grid-item.resizing {
  opacity: 0.6;
  z-index: 3;
}

.vue-grid-item.vue-draggable-dragging {
  transition: none;
  z-index: 3;
}

.vue-grid-item.vue-grid-placeholder {
  background: red;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  -o-user-select: none;
  user-select: none;
}

.vue-grid-item > .vue-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=");
  background-position: bottom right;
  padding: 0 3px 3px 0;
  background-repeat: no-repeat;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: se-resize;
}

.vue-grid-item > .vue-rtl-resizable-handle {
  bottom: 0;
  left: 0;
  background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAuMDAwMDAwMDAwMDAwMDAyIiBoZWlnaHQ9IjEwLjAwMDAwMDAwMDAwMDAwMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KIDwhLS0gQ3JlYXRlZCB3aXRoIE1ldGhvZCBEcmF3IC0gaHR0cDovL2dpdGh1Yi5jb20vZHVvcGl4ZWwvTWV0aG9kLURyYXcvIC0tPgogPGc+CiAgPHRpdGxlPmJhY2tncm91bmQ8L3RpdGxlPgogIDxyZWN0IGZpbGw9Im5vbmUiIGlkPSJjYW52YXNfYmFja2dyb3VuZCIgaGVpZ2h0PSIxMiIgd2lkdGg9IjEyIiB5PSItMSIgeD0iLTEiLz4KICA8ZyBkaXNwbGF5PSJub25lIiBvdmVyZmxvdz0idmlzaWJsZSIgeT0iMCIgeD0iMCIgaGVpZ2h0PSIxMDAlIiB3aWR0aD0iMTAwJSIgaWQ9ImNhbnZhc0dyaWQiPgogICA8cmVjdCBmaWxsPSJ1cmwoI2dyaWRwYXR0ZXJuKSIgc3Ryb2tlLXdpZHRoPSIwIiB5PSIwIiB4PSIwIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+CiAgPC9nPgogPC9nPgogPGc+CiAgPHRpdGxlPkxheWVyIDE8L3RpdGxlPgogIDxsaW5lIGNhbnZhcz0iI2ZmZmZmZiIgY2FudmFzLW9wYWNpdHk9IjEiIHN0cm9rZS1saW5lY2FwPSJ1bmRlZmluZWQiIHN0cm9rZS1saW5lam9pbj0idW5kZWZpbmVkIiBpZD0ic3ZnXzEiIHkyPSItNzAuMTc4NDA3IiB4Mj0iMTI0LjQ2NDE3NSIgeTE9Ii0zOC4zOTI3MzciIHgxPSIxNDQuODIxMjg5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlPSIjMDAwIiBmaWxsPSJub25lIi8+CiAgPGxpbmUgc3Ryb2tlPSIjNjY2NjY2IiBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z181IiB5Mj0iOS4xMDY5NTciIHgyPSIwLjk0NzI0NyIgeTE9Ii0wLjAxODEyOCIgeDE9IjAuOTQ3MjQ3IiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiLz4KICA8bGluZSBzdHJva2UtbGluZWNhcD0idW5kZWZpbmVkIiBzdHJva2UtbGluZWpvaW49InVuZGVmaW5lZCIgaWQ9InN2Z183IiB5Mj0iOSIgeDI9IjEwLjA3MzUyOSIgeTE9IjkiIHgxPSItMC42NTU2NCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiM2NjY2NjYiIGZpbGw9Im5vbmUiLz4KIDwvZz4KPC9zdmc+);
  background-position: bottom left;
  padding-left: 3px;
  background-repeat: no-repeat;
  background-origin: content-box;
  cursor: sw-resize;
  right: auto;
}

.vue-grid-item.disable-userselect {
  user-select: none;
}
</style>