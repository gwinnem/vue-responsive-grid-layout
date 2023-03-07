<template>
  <div
    ref="gridItem"
    class="vue-grid-item"
    :class="classObj"
    :style="styleObj">
    <button
      v-if="showCloseButton && enableEditMode && !isStatic"
      class="btn-close"
      type="button"
      @click="closeClicked(props.i)">
      <i class="icon icon-cross"></i>
      <span class="visually-hidden">Close</span>
    </button>
    <span
      v-if="resizableAndNotStatic"
      ref="handle"
      :class="resizableHandleClass">
      <i class="icon icon-resize-se"></i>
    </span>
    <slot :style="styleObj"></slot>
  </div>
</template>
<script lang="ts" setup>
  import {
    ref, inject, computed, watch, onBeforeUnmount, onMounted, useSlots,
  } from 'vue';
  import interact from '@interactjs/interact';
  import { Emitter } from 'mitt';
  import { Interactable } from '@interactjs/core/Interactable';
  import {
    setTopLeft, setTopRight, setTransformRtl, setTransform,
  } from '@/core/helpers/utils';
  import { getControlPosition, createCoreData } from '@/core/helpers/draggableUtils';
  import { getColsFromBreakpoint } from '@/core/helpers/responsiveUtils';
  import { getDocumentDir } from '@/core/helpers/DOM';

  import '@interactjs/auto-start';
  import '@interactjs/auto-scroll';
  import '@interactjs/actions/drag';
  import '@interactjs/actions/resize';
  import '@interactjs/modifiers';
  import '@interactjs/dev-tools';
  import useCurrentInstance from '@/hooks/useInstance';
  import { IGridLayoutProps } from './grid-layout-props.interface';
  import { ILayoutData } from '@/core/interfaces/layout-data.interface';
  import { EGridItemEvent } from '@/core/enums/EGridItemEvents';
  import {
    ICalcWh,
    ICalcXy,
    IGridItemPosition,
    IGridItemWidthHeight,
  } from '@/core/interfaces/grid-item.interfaces';
  import { IEventsData } from '@/core/interfaces/eventBus.interfaces';
  import { TBreakpoints } from '@/components/Grid/layout-definition';

  export interface IGridItemProps {
    borderRadiusPx?: number;
    dragAllowFrom?: string | null;
    dragIgnoreFrom?: string;
    dragOption?: { [key: string]: any };
    enableEditMode?: boolean;
    h: number;
    i: string | number;
    isBounded?: boolean | null;
    isDraggable?: boolean | null;
    isMirrored?: boolean | null;
    isResizable?: boolean | null;
    isStatic?: boolean | null;
    maxW?: number;
    maxH?: number;
    minH?: number;
    minW?: number;
    preserveAspectRatio?: boolean;
    resizeIgnoreFrom?: string | null;
    resizeOption?: { [key: string]: any };
    showCloseButton?: boolean | null;
    useBorderRadius?: boolean | null;
    w: number;
    x: number;
    y: number;
  }

  const { proxy } = useCurrentInstance();

  // for parent's instance
  type TIns = (IGridLayoutProps & ILayoutData) | undefined
  const thisLayout = proxy?.$parent as TIns;

  // eventBus
  const eventBus = inject(`eventBus`) as Emitter<{
    resizeEvent?: IEventsData;
    dragEvent?: IEventsData;
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

  const emit = defineEmits<{
    (e: EGridItemEvent.CONTAINER_RESIZED, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.DRAG, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.DRAGGED, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.MOVE, i: number | string, x: number, y: number): void;
    (e: EGridItemEvent.MOVED, i: number | string, x: number, y: number): void;
    (e: EGridItemEvent.REMOVE_ITEM, i: string | number): void;
    (e: EGridItemEvent.RESIZE, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.RESIZED, i: number | string, h: number, w: number, height: number, width: number): void;
  }>();

  // Props Data
  const props = withDefaults(defineProps<IGridItemProps>(), {
    borderRadiusPx: 8,
    dragAllowFrom: null,
    dragIgnoreFrom: `a, button`,
    dragOption: () => ({}),
    enableEditMode: true,
    i: ``,
    isBounded: null,
    isDraggable: null,
    isMirrored: true,
    isResizable: null,
    isStatic: false,
    maxH: Infinity,
    maxW: Infinity,
    minH: 1,
    minW: 1,
    preserveAspectRatio: false,
    resizeIgnoreFrom: null,
    resizeOption: () => ({}),
    showCloseButton: true,
    useBorderRadius: false,
  });

  // item dom
  const gridItem = ref<HTMLElement>({} as HTMLElement);

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

  const isDragging = ref(false);
  const dragging = ref<IGridItemPosition | undefined>(undefined);
  const isResizing = ref(false);
  const resizing = ref<IGridItemWidthHeight | undefined>(undefined);
  const lastX = ref(NaN);
  const lastY = ref(NaN);
  const lastW = ref(NaN);
  const lastH = ref(NaN);
  const styleObj = ref({} as any);
  const rtl = ref(false);
  const dragEventSet = ref(false);
  const resizeEventSet = ref(false);

  const previousW = ref<number | undefined>(undefined);
  const previousH = ref<number | undefined>(undefined);
  const previousX = ref<number | undefined>(undefined);
  const previousY = ref<number | undefined>(undefined);
  const innerX = ref<number>(props.x);
  const innerY = ref<number>(props.y);
  const innerW = ref<number>(props.w);
  const innerH = ref<number>(props.h);

  const bounded = ref<boolean | null>(null);

  const interactObj = ref<Interactable | undefined>(undefined);

  const closeClicked = (id: string | number): void => {
    emit(EGridItemEvent.REMOVE_ITEM, id);
  };

  // computed
  const resizableAndNotStatic = computed(() => {
    return resizable.value && !props.isStatic && props.enableEditMode;
  });

  const draggableAndNotStatic = computed(() => {
    return draggable.value && !props.isStatic && props.enableEditMode;
  });

  const draggableOrResizableAndNotStatic = computed(() => {
    return (draggable.value || resizable.value) && !props.isStatic && props.enableEditMode;
  });

  const isAndroid = computed(() => {
    return navigator.userAgent.toLowerCase()
      .indexOf(`android`) !== -1;
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
      "vue-draggable": draggableAndNotStatic.value,
      "vue-draggable-dragging": isDragging.value,
      "vue-resizable": resizableAndNotStatic.value,
      "vue-static": props.isStatic,
      "vue-use-radius": props.useBorderRadius,
    };
  });

  // Helper for generating the correct css class for resizing a GridItem
  const resizableHandleClass = computed(() => {
    if(renderRtl.value) {
      return `vue-resizable-handle vue-rtl-resizable-handle`;
    }
    return `vue-resizable-handle`;
  });

  function calcGridItemWH(gridUnits: number, colOrRowSize: number, marginPx: number): number {
    if(!Number.isFinite(gridUnits)) return gridUnits;
    return Math.round(colOrRowSize * gridUnits + Math.max(0, gridUnits - 1) * marginPx);
  }

  // Similar to _.clamp
  function clamp(num: number, lowerBound: number, upperBound: number): number {
    return Math.max(Math.min(num, upperBound), lowerBound);
  }

  // Helper for generating column width
  function calcColWidth(): number {
    return (containerWidth.value - margin.value[0] * (cols.value + 1)) / cols.value;
  }

  /**
   * Translate x and y coordinates from pixels to grid units.
   * @param  {Number} top  Top position (relative to parent) in pixels.
   * @param  {Number} left Left position (relative to parent) in pixels.
   * @return {ICalcXy}     x and y in grid units.
   */
  // TODO check if this function needs change in order to support rtl.
  function calcXY(top: number, left: number): ICalcXy {
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

    return {
      x,
      y,
    };
  }

  function handleDrag(event: MouseEvent): void {
    if(props.isStatic) {
      return;
    }
    if(isResizing.value) {
      return;
    }

    const position = getControlPosition(event);

    // Get the current drag point from the event. This is used as the offset.
    if(position === null) {
      return; // not possible but satisfies flow
    }

    const {
      x,
      y,
    } = position;

    // let shouldUpdate = false;
    const newPosition = {
      left: 0,
      top: 0,
    };

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
        dragging.value = undefined;
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
          const bottomBoundary = parentTg.clientHeight - calcGridItemWH(props.h, rowHeight.value, margin.value[1]);
          newPosition.top = clamp(newPosition.top, 0, bottomBoundary);
          const colWidth = calcColWidth();
          const rightBoundary = containerWidth.value - calcGridItemWH(props.w, colWidth, margin.value[0]);
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
    let pos: ICalcXy;
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
    const data: IEventsData = {
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

  function tryMakeDraggable(): void {
    if(interactObj.value === null || interactObj.value === undefined) {
      interactObj.value = interact(gridItem.value);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interactObj.value.styleCursor(false);
    }
    if(draggable.value && !props.isStatic) {
      const opts = {
        allowFrom: props.dragAllowFrom,
        ignoreFrom: props.dragIgnoreFrom,
        ...props.dragOption,
      };

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interactObj.value.draggable({
        enabled: false,
      });
    }
  }

  /**
   * Given a height and width in pixel values, calculate grid units.
   * @param  {Number} height Height in pixels.
   * @param  {Number} width  Width in pixels.
   * @param  {Boolean} autoSizeFlag  function autoSize identifier.
   * @return {ICalcWh} w, h as grid units.
   */
  function calcWH(height: number, width: number, autoSizeFlag = false): ICalcWh {
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
    return {
      h,
      w,
    };
  }

  function tryMakeResizable(): void {
    if(interactObj.value === null || interactObj.value === undefined) {
      interactObj.value = interact(gridItem.value);
    }

    if(resizable.value && !props.isStatic) {
      const maximum = calcPosition(0, 0, props.maxW, props.maxH);
      const minimum = calcPosition(0, 0, props.minW, props.minH);
      // console.log(`### MAX ${JSON.stringify(maximum)}`);
      // console.log(`### MIN ${JSON.stringify(minimum)}`);

      const opts = {
        edges: {
          bottom: `.${resizableHandleClass.value.trim()
            .replace(` `, `.`)}`,
          left: false,
          right: `.${resizableHandleClass.value.trim()
            .replace(` `, `.`)}`,
          top: false,
        },
        ignoreFrom: props.resizeIgnoreFrom,
        modifiers: [],
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
        opts.modifiers = [
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          interact.modifiers.aspectRatio({
            ratio: `preserve`,
          }),
        ];
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interactObj.value.resizable(opts);
      if(!resizeEventSet.value) {
        resizeEventSet.value = true;
        interactObj.value.on(`resizestart resizemove resizeend`, event => {
          // eslint-disable-next-line no-use-before-define
          handleResize(event);
        });
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interactObj.value.resizable({
        enabled: false,
      });
    }
  }

  function handleResize(event: MouseEvent): void {
    if(props.isStatic) {
      return;
    }

    // Get the current drag point from the event. This is used as the offset.
    const position = getControlPosition(event);

    const {
      x,
      y,
    } = position;

    const newSize = {
      height: 0,
      width: 0,
    };
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
        resizing.value = undefined;
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
      // Add rtl support
      if(renderRtl.value) {
        sty = setTransformRtl(pos.top, pos.right as number, pos.width, pos.height);
      } else {
        sty = setTransform(pos.top, pos.left as number, pos.width, pos.height);
      }
    }

    if(!useCssTransforms.value) {
      // top,left (slow)
      // Add rtl support
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
    let styleProps: IGridItemWidthHeight = {
      height: 0,
      width: 0,
    };
    for(const prop of [`width`, `height`]) {
      const val = styleObj.value[prop];
      const matches = val.match(/^(\d+)px$/);
      if(!matches) {
        return;
      }
      // eslint-disable-next-line prefer-destructuring
      styleProps = matches[1];
    }
    emit(EGridItemEvent.CONTAINER_RESIZED, props.i, props.h, props.w, styleProps.height, styleProps.width);
  }

  function updateWidth(width: number, colNum?: number): void {
    containerWidth.value = width;
    if(colNum !== undefined && colNum !== null) {
      cols.value = colNum;
    }
  }

  function selfCompact(): void {
    createStyle();
  }

  // watch
  watch(() => props.isDraggable, val => {
    draggable.value = val;
  });

  watch(() => props.isStatic, () => {
    tryMakeDraggable();
    tryMakeResizable();
  });

  watch(draggable, () => {
    tryMakeDraggable();
  });

  watch(() => props.isResizable, val => {
    resizable.value = val;
  });

  watch(() => props.isBounded, val => {
    bounded.value = val;
  });

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
    emitContainerResized();
  });

  watch(() => props.x, newVal => {
    innerX.value = newVal;
    createStyle();
  });

  watch(() => props.y, newVal => {
    innerY.value = newVal;
    createStyle();
  });

  watch(() => props.h, newVal => {
    innerH.value = newVal;
    createStyle();
    // this.emitContainerResized();
  });

  watch(() => props.w, newVal => {
    innerW.value = newVal;
    createStyle();
    // wthis.emitContainerResized();
  });

  watch(renderRtl, () => {
    // console.log("### renderRtl");
    tryMakeResizable();
    createStyle();
  });

  watch(() => props.minH, () => {
    tryMakeResizable();
  });

  watch(() => props.maxH, () => {
    tryMakeResizable();
  });

  watch(() => props.minW, () => {
    tryMakeResizable();
  });

  watch(() => props.maxW, () => {
    tryMakeResizable();
  });

  watch(() => thisLayout?.margin, newMargin => {
    if(!newMargin || (newMargin[0] === margin.value[0] && newMargin[1] === margin.value[1])) {
      return;
    }
    margin.value = newMargin.map(m => Number(m));
    createStyle();
    emitContainerResized();
  });

  //
  function updateWidthHandler(width: number): void {
    updateWidth(width);
  }

  function compactHandler(): void {
    selfCompact();
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

  function directionChangeHandler(): void {
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
  eventBus.on(`directionchange`, directionChangeHandler);
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
    eventBus.off(`directionchange`, directionChangeHandler);
    eventBus.off(`setColNum`, setColNum);
    if(interactObj.value) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      interactObj.value.unset(); // destroy interact instance
    }
  });

  onMounted(() => {
    if(thisLayout?.responsive && thisLayout.lastBreakpoint) {
      cols.value = getColsFromBreakpoint(thisLayout.lastBreakpoint, thisLayout?.cols as TBreakpoints);
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
    createStyle();
  });

  const slots = useSlots();

  function autoSize(): void {
    // ok here we want to calculate if a resize is needed
    previousW.value = innerW.value;
    previousH.value = innerH.value;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const newSize = slots?.default[0].elm.getBoundingClientRect();
    const pos = calcWH(newSize.height, newSize.width, true);
    if(props.minW) {
      if(pos.w < props.minW) {
        pos.w = props.minW;
      }
    }

    if(props.maxW) {
      if(pos.w > props.maxW) {
        pos.w = props.maxW;
      }
    }

    if(props.minH) {
      if(pos.h < props.minH) {
        pos.h = props.minH;
      }
    }

    if(props.maxH) {
      if(pos.h > props.maxH) {
        pos.h = props.maxH;
      }
    }

    if(pos.h < 1) {
      pos.h = 1;
    }
    if(pos.w < 1) {
      pos.w = 1;
    }

    if(innerW.value !== pos.w || innerH.value !== pos.h) {
      emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height, newSize.width);
    }

    if(previousW.value !== pos.w || previousH.value !== pos.h) {
      emit(EGridItemEvent.RESIZED, props.i, pos.h, pos.w, newSize.height, newSize.width);

      const data: IEventsData = {
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

<style lang="scss" scoped>
@use "sass:math";
@import '../../styles/variables';

// Display a cross with CSS only.
//
// $size  : px or em
// $color : color
// $thickness : px
@mixin cross($size: 20px, $color: currentColor, $thickness: 1px) {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  position: relative;
  width: $size;
  height: $size;

  &:after,
  &:before {
    content: '';
    position: absolute;
    top: math.div(($size - $thickness), 2);
    left: 0;
    right: 0;
    height: $thickness;
    background: $color;
    border-radius: $thickness;
  }

  &:before {
    transform: rotate(45deg);
  }

  &:after {
    transform: rotate(-45deg);
  }

  span {
    display: block;
  }

}

.vue-grid-item .resizing {
  opacity: 0.9;
}

.vue-grid-item {
  box-sizing: border-box;
  color: $grid-item-text-color;
  cursor: default !important;
  font-size: $grid-item-font-size;
  touch-action: none;
  transition: all 200ms ease;
  transition-property: left, top, right;

  &.vue-static {
    background-color: $grid-item-static-bg-color;
  }

  &.no-touch {
    touch-action: none;
  }

  &.vue-use-radius {
    border-radius: $grid-item-border-radius;
  }

  &.css-transforms {
    left: 0;
    right: auto;
    transition-property: transform;
  }

  &.resizing {
    opacity: .6;
    z-index: 3;
  }

  &.vue-draggable {
    cursor: grab !important;
  }

  &.vue-draggable-dragging {
    cursor: grabbing !important;
    transition: none;
    z-index: 3;
  }

  &.vue-grid-placeholder {
    background: $grid-item-placeholder-bg-color;
    opacity: $grid-item-placeholder-opacity;
    transition-duration: 100ms;
    user-select: none;
    z-index: 2;
  }

  &.disable-user-select {
    user-select: none;
  }
}

.vue-resizable-handle {
  background-origin: content-box;
  background-position: bottom right;
  background-repeat: no-repeat;
  bottom: 5px;
  box-sizing: border-box;
  cursor: se-resize;
  height: 20px;
  padding: 0 3px 3px 0;
  position: absolute;
  right: -3px;
  width: 20px;
  z-index: 20;

  & > .icon {
    box-sizing: border-box;
    display: inline-block;
    font-size: inherit;
    font-style: normal;
    height: 1em;
    position: relative;
    text-indent: -9999px;
    vertical-align: middle;
    width: 1em;

    &::before,
    &::after {
      content: "";
      display: block;
      left: 50%;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
    }

    &.icon-resize-se {
      &::before {
        border: 3px solid black;
        border-bottom: 0;
        border-right: 0;
        height: .65em;
        width: .65em;
      }
    }

    &.icon-resize-se {
      &::before {
        transform: translate(-75%, -50%) rotate(180deg);
      }
    }
  }
}

.btn-close {
  align-items: center;
  background: red;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-flow: column nowrap;
  height: 24px;
  justify-content: center;
  margin: 0;
  padding: 0;
  position: absolute;
  right: 4px;
  top: 4px;
  transition: all 150ms;
  width: 24px;
  z-index: 20;

  & > .icon-cross {
    @include cross(16px, #fff, 4px);
  }

  &:hover,
  &:focus {
    background: #1481b4;
    transform: rotateZ(90deg);
  }
}

</style>
