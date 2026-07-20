<!--
  A single draggable/resizable/static grid cell, rendered inside a
  `GridLayout`'s default slot. Dragging and resizing are each implemented
  in their own composable (`composables/useGridItemDrag.ts`/
  `useGridItemResize.ts`) — this file owns props/emits, the state shared
  between both composables and rendering (position/size in grid units,
  container measurements), and the watchers/eventBus wiring that ties it
  all together. See docs/ARCHITECTURE.md for the full picture, including
  the `$parent`/eventBus contract with `GridLayout`.
-->
<template>
  <div
    ref="gridItem"
    :aria-describedby="draggableOrResizableAndNotStatic ? `${uid}-instructions` : undefined"
    :aria-roledescription="draggableOrResizableAndNotStatic ? resolvedAriaLabels.itemRoleDescription : undefined"
    class="vue-grid-item"
    :class="classObj"
    :data-grid-item-id="props.i"
    :role="draggableOrResizableAndNotStatic ? `group` : undefined"
    :style="[styleObj, borderRadiusStyle, resizeHandleOverrideStyle]"
    :tabindex="draggableOrResizableAndNotStatic ? 0 : undefined"
    @click="handleItemClick"
    @keydown="handleKeydown">
    <button
      v-if="closeButtonEnabled && editModeEnabled && !isStatic"
      class="btn-close"
      type="button"
      @click="closeClicked(props.i)">
      <i
        aria-hidden="true"
        class="icon icon-cross"></i>
      <span class="visually-hidden">{{ resolvedAriaLabels.closeButton }}</span>
    </button>
    <span
      v-if="draggableOrResizableAndNotStatic"
      :id="`${uid}-instructions`"
      class="visually-hidden">
      {{ draggableAndNotStatic ? resolvedAriaLabels.moveInstruction : `` }}
      {{ resizableAndNotStatic ? resolvedAriaLabels.resizeInstruction : `` }}
    </span>
    <div
      v-if="props.autoHeight"
      ref="autoHeightWrapper"
      class="vue-grid-item-auto-height-wrapper">
      <slot :style="styleObj"></slot>
    </div>
    <slot
      v-else
      :style="styleObj"></slot>
    <template v-if="resizableAndNotStatic">
      <span
        ref="resizeHandleN"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--n"><slot
          :edge="`n`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleS"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--s"><slot
          :edge="`s`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleE"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--e"><slot
          :edge="`e`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleW"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--w"><slot
          :edge="`w`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleNE"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--ne"><slot
          :edge="`ne`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleNW"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--nw"><slot
          :edge="`nw`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleSE"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--se"><slot
          :edge="`se`"
          name="resize-handle"></slot></span>
      <span
        ref="resizeHandleSW"
        aria-hidden="true"
        class="vue-resize-hint vue-resize-hint--sw"><slot
          :edge="`sw`"
          name="resize-handle"></slot></span>
    </template>
  </div>
</template>
<script lang="ts">
  import { defineComponent } from 'vue';

  export default defineComponent({
    name: `GridItem`,
  });
</script>
<script lang="ts" setup>
  import { computed, getCurrentInstance, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { setTopLeft, setTopRight, setTransform, setTransformRtl } from '@/core/helpers/utils';
  import { resolveAriaLabels } from '@/core/common/interfaces/aria-labels.interface';
  import useCurrentInstance from '@/hooks/useInstance';
  import { IColumns, IGridLayoutProps } from './grid-layout-props.interface';
  import { IGridItemProps } from './grid-item-props.interface';
  import { ILayoutData } from '@/core/gridlayout/interfaces/layout-data.interface';
  import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
  import { TGridItemEventBus, IGridItemWidthHeight } from '@/core/griditem/interfaces/grid-item.interfaces';
  import { getColsFromBreakpoint } from '@/core/common/helpers/breakpoints-helper';
  import { useGridItemDrag } from './composables/useGridItemDrag';
  import { useGridItemResize } from './composables/useGridItemResize';
  import { useGridItemKeyboard } from './composables/useGridItemKeyboard';

  const { proxy } = useCurrentInstance();

  // for parent's instance
  /** The shape of what `GridLayout`'s `defineExpose(...)` actually exposes — see docs/ARCHITECTURE.md. */
  type TIns = (IGridLayoutProps & ILayoutData) | undefined;
  /** The parent `GridLayout` instance, as seen through `$parent` — only reliable because `GridItem` is always rendered as `GridLayout`'s direct child (via its default slot). Read once at mount (see `onMounted` below); not reactive, so later updates arrive via the `eventBus` cascade instead. */
  const thisLayout = proxy?.$parent as TIns;

  // eventBus
  /** Injected from `GridLayout`'s `provide('eventBus', ...)`. See docs/ARCHITECTURE.md for the full message table. */
  const eventBus = inject(`eventBus`) as TGridItemEventBus;

  // Note: DRAG/DRAGGED are declared here but never actually emitted — MOVE/
  // MOVED fire instead. See docs/REFACTORING.md #20.
  const emit = defineEmits<{
    (
      e: EGridItemEvent.CONTAINER_RESIZED,
      i: number | string,
      h: number,
      w: number,
      height: number,
      width: number,
    ): void;
    (e: EGridItemEvent.DRAG, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.DRAGGED, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.MOVE, i: number | string, x: number, y: number): void;
    (e: EGridItemEvent.MOVED, i: number | string, x: number, y: number): void;
    (e: EGridItemEvent.REMOVE_ITEM, i: string | number): void;
    (e: EGridItemEvent.RESIZE, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.RESIZED, i: number | string, h: number, w: number, height: number, width: number): void;
    (e: EGridItemEvent.ITEM_CLICKED, i: number | string, event: MouseEvent): void;
  }>();

  // Props Data
  const props = withDefaults(defineProps<IGridItemProps>(), {
    autoScroll: false,
    ariaLabels: () => ({}),
    autoHeight: false,
    borderRadiusPx: null,
    dragAllowFrom: null,
    dragIgnoreFrom: `a, button`,
    enableEditMode: null,
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
    resizeHandleColor: null,
    showResizeHandles: null,
    showCloseButton: null,
    useBorderRadius: null,
  });

  // item dom
  /** Template ref to the item's root element — the native drag engine's target, and what `autoSize`/rendering measure against. */
  const gridItem = ref<HTMLElement>({} as HTMLElement);
  /** Only populated when `autoHeight` is true — the wrapper `setupAutoHeight()` observes for size changes. `null` otherwise, matching the template's `v-if`. */
  const autoHeightWrapper = ref<HTMLElement | null>(null);

  /** Template refs to the 8 resize-hint spans — the native resize engine's own hit targets (see `@/core/helpers/native-interaction.ts`). Bound in the template below, one per edge/corner. */
  const resizeHandleN = ref<HTMLElement | null>(null);
  const resizeHandleS = ref<HTMLElement | null>(null);
  const resizeHandleE = ref<HTMLElement | null>(null);
  const resizeHandleW = ref<HTMLElement | null>(null);
  const resizeHandleNE = ref<HTMLElement | null>(null);
  const resizeHandleNW = ref<HTMLElement | null>(null);
  const resizeHandleSE = ref<HTMLElement | null>(null);
  const resizeHandleSW = ref<HTMLElement | null>(null);
  const resizeHandleRefs = {
    e: resizeHandleE,
    n: resizeHandleN,
    ne: resizeHandleNE,
    nw: resizeHandleNW,
    s: resizeHandleS,
    se: resizeHandleSE,
    sw: resizeHandleSW,
    w: resizeHandleW,
  };

  /**
   * A stable, unique-per-instance id for the `aria-describedby` keyboard
   * instructions element below. Built from the component instance's own
   * `uid` (present on every Vue 3 instance since 3.0) rather than Vue 3.5's
   * `useId()`, since this package's peer dependency is `^3.0.0`.
   */
  const uid = `grid-item-${getCurrentInstance()?.uid}`;

  // self data — shared layout state read by both interaction composables and
  // by this component's own rendering (classObj/createStyle below).
  /** Current column count, resolved from the parent layout at mount and pushed via the `setColNum` eventBus message thereafter. */
  const cols = ref<number>(1);
  /** The container's last known-good measured pixel width — see `updateWidth` below for why "known-good" matters. */
  const containerWidth = ref<number>(100);
  /** Height of one grid row, in pixels, resolved from the parent layout. */
  const rowHeight = ref<number>(30);
  /** `[horizontal, vertical]` spacing between items, in pixels. */
  const margin = ref<number[]>([10, 10]);
  /** Maximum number of rows the layout may grow to. */
  const maxRows = ref<number>(Infinity);
  /** CSS transform scale factor to compensate for in pixel math. */
  const transformScale = ref<number>(1);
  /** Whether to position via CSS transforms (fast path) or `top`/`left` (slow path) — see `createStyle`. */
  const useCssTransforms = ref<boolean>(true);
  /** The computed inline style applied to the item's root element. */
  const styleObj = ref({} as Record<string, string | number>);
  /** Whether this item renders right-to-left, pushed down from the parent layout's `isMirrored` prop via the `changeDirection` eventBus message. */
  const rtl = ref(false);
  /** Restricts dragging to within the container's bounds; resolved from this item's `isBounded` prop or the parent layout's default. */
  const bounded = ref<boolean | null>(null);
  /** Whether the close button renders; resolved from this item's `showCloseButton` prop or the parent layout's default — same `null`-means-inherit pattern as `bounded`/`draggable`/`resizable` (see docs/REFACTORING.md #31 for why this needed fixing rather than already working). */
  const closeButtonEnabled = ref<boolean | null>(null);
  /** Master interactivity switch; resolved from this item's `enableEditMode` prop or the parent layout's default — same inherit pattern as `closeButtonEnabled` above. See ROADMAP.md's "layout-level read-only/edit-mode toggle" item. */
  const editModeEnabled = ref<boolean | null>(null);
  /** Whether `borderRadiusPx` is actually applied; resolved from this item's `useBorderRadius` prop or the parent layout's default — same inherit pattern as `closeButtonEnabled` above (see docs/REFACTORING.md #47). */
  const useBorderRadiusResolved = ref<boolean | null>(null);
  /** The border radius, in pixels, actually applied when `useBorderRadiusResolved` is true; resolved from this item's `borderRadiusPx` prop or the parent layout's default. */
  const borderRadiusPxResolved = ref<number | null>(null);

  /**
   * Defines start position in grid unit along the x-axis.
   */
  const innerX = ref<number>(props.x);

  /**
   * Defines start position in grid units along the y-axis.
   */
  const innerY = ref<number>(props.y);

  /**
   * Defines the width in grid units.
   */
  const innerW = ref<number>(props.w);

  /**
   * Defines the height in grid units.
   */
  const innerH = ref<number>(props.h);

  /**
   * Whether this item should currently render right-to-left.
   *
   * Bug fix (docs/REFACTORING.md #39): this used to be
   * `thisLayout?.isMirrored ? !rtl.value : rtl.value` — two bugs at once.
   * First, `thisLayout?.isMirrored` reads `GridLayout`'s `defineExpose({
   * ...props })` snapshot, which is frozen at the moment `defineExpose`
   * runs during setup (see finding #26, the same root cause for
   * `margin`) — so it never reflected `isMirrored` changing after mount at
   * all, only ever the value it happened to start at. Second, even
   * ignoring that, it read the *layout's* `isMirrored` to decide whether
   * to negate `rtl.value` — but `rtl.value` already *is* the layout's
   * (correctly live-cascaded, via `changeDirectionHandler` below)
   * mirrored state, so this was negating a value against a frozen copy of
   * itself. Toggling `isMirrored` off would frequently leave `renderRtl`
   * stuck exactly where it started, which is what "mirrored RTL does not
   * work when isMirrored is switched off" looks like from the outside.
   *
   * What actually needs combining here is `rtl.value` (the layout's live
   * mirrored state) with `props.isMirrored` — this *item's own* prop,
   * documented as "whether this item participates in the parent layout's
   * RTL mirroring" (default `true`). An item that opts out
   * (`isMirrored: false`) simply never renders RTL, regardless of the
   * layout's state — it does not invert it.
   */
  const renderRtl = computed(() => {
    return props.isMirrored ? rtl.value : false;
  });

  // Dragging and resizing are each encapsulated in their own composable — see
  // docs/ARCHITECTURE.md for why the boundary is drawn where it is, and
  // docs/REFACTORING.md for the history. Resize is created first because drag
  // needs to know when a resize is in progress (see IGridItemDragContext).
  const sharedContext = {
    autoHeightWrapper,
    bounded,
    cols,
    editModeEnabled,
    containerWidth,
    emit,
    eventBus,
    gridItem,
    innerH,
    innerW,
    innerX,
    innerY,
    resizeHandleRefs,
    margin,
    maxRows,
    props,
    renderRtl,
    rowHeight,
    transformScale,
  };

  const {
    autoSize,
    calcPosition,
    isResizing,
    resizable,
    resizing,
    setupAutoHeight,
    teardownAutoHeight,
    teardownResizable,
    tryMakeResizable,
  } = useGridItemResize(sharedContext);

  // isResizing is threaded into the drag context so handleDrag can bail out
  // while a resize is active (see IGridItemDragContext) — this composable
  // must be created after useGridItemResize, above.
  const {
    calcXY,
    draggable,
    dragging,
    isDragging,
    teardownDraggable,
    tryMakeDraggable,
  } = useGridItemDrag({ ...sharedContext, isResizing });

  // Created last since it needs both composables' resolved draggable/
  // resizable state — see docs/ACCESSIBILITY.md.
  const { handleKeydown } = useGridItemKeyboard({ ...sharedContext, draggable, resizable });

  /**
   * `ITEM_CLICKED` support for `multiSelect` — suppresses the trailing
   * native `click` event a browser can still dispatch immediately after a
   * drag/resize gesture ends (a `click` fires on `mouseup` regardless of
   * how much the pointer moved in between; it isn't gated on movement
   * distance the way starting a drag is). Watches `isDragging`/
   * `isResizing` for a true-to-false transition and suppresses the next
   * `click` for the remainder of the current task — a `setTimeout(0)`,
   * not `nextTick()`, since `nextTick` is a microtask that can resolve
   * before the browser's own trailing `click` (a macrotask-scheduled
   * event) actually fires, which would defeat the suppression entirely.
   */
  let suppressNextClick = false;
  const armClickSuppression = (was: boolean, is: boolean): void => {
    if(was && !is) {
      suppressNextClick = true;
      setTimeout(() => {
        suppressNextClick = false;
      }, 0);
    }
  };
  watch(isDragging, (val, oldVal) => armClickSuppression(oldVal, val));
  watch(isResizing, (val, oldVal) => armClickSuppression(oldVal, val));

  const handleItemClick = (event: MouseEvent): void => {
    if(suppressNextClick) {
      return;
    }
    emit(EGridItemEvent.ITEM_CLICKED, props.i, event);
    eventBus.emit(`itemClicked`, {
      ctrlKey: event.ctrlKey,
      i: props.i,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });
  };

  /**
   * Handler for click event on the close button.
   * @param {string}   id   Id of the GridItem.
   */
  const closeClicked = (id: string | number): void => {
    if(editModeEnabled.value) {
      emit(EGridItemEvent.REMOVE_ITEM, id);
    }
  };

  // computed
  /** `true` when the item is resizable, not static, and edit mode is on — drives the `vue-resizable` class. */
  const resizableAndNotStatic = computed(() => {
    return resizable.value && !props.isStatic && editModeEnabled.value;
  });

  /** `true` when the item is draggable, not static, and edit mode is on — drives the `vue-draggable` class. */
  const draggableAndNotStatic = computed(() => {
    return draggable.value && !props.isStatic && editModeEnabled.value;
  });

  /** `true` when the item is either draggable or resizable, not static, and edit mode is on — used for the Android `no-touch` class. */
  const draggableOrResizableAndNotStatic = computed(() => {
    return (draggable.value || resizable.value) && !props.isStatic && editModeEnabled.value;
  });

  /** Crude Android detection via user-agent sniffing, used only to apply the `no-touch` class (Android's default touch-action handling needs an explicit override for drag/resize to feel right). Guarded for SSR (see docs/REFACTORING.md #51): `navigator` doesn't exist in a Node.js render, and this is referenced from a template-bound `computed` (`classObj`'s `no-touch` entry), so an unguarded read here throws and takes down the entire server-side render, not just this component. Defaults to `false` server-side — the client re-hydrates and re-evaluates this correctly once real browser JS runs, so nothing is permanently lost by not knowing the answer during SSR. */
  const isAndroid = computed(() => {
    if(typeof navigator === `undefined`) {
      return false;
    }
    return navigator.userAgent.toLowerCase().indexOf(`android`) !== -1;
  });

  /**
   * `borderRadiusPx` was previously a declared prop with no effect at all —
   * `.vue-use-radius`'s border-radius was hardcoded to a fixed SCSS
   * variable regardless of what this prop was set to (see
   * docs/REFACTORING.md). Wiring it up here as an inline style, applied
   * only when `useBorderRadius` is on (matching the `vue-use-radius` class
   * condition), keeps the SCSS default for anyone not using the prop while
   * making it actually configurable for anyone who is.
   *
   * Also sets `--close-button-inset`, a CSS custom property the close
   * button's `top`/`right`/`left` position reads (see the `.btn-close`
   * rules below) instead of a hardcoded `4px`. Without this, the button
   * stays pinned 4px from the item's true corner regardless of how rounded
   * that corner actually is — at a large `borderRadiusPx`, the corner's
   * visible curve extends well past 4px, so the button ends up sitting
   * half over the curve instead of clear of it. The inset grows with the
   * radius using the standard "distance from a square corner to a
   * radius-R arc, measured along each edge" formula (`R × (1 - cos45°)`,
   * i.e. `R × ~0.293`) on top of the original 4px baseline, capped so an
   * extreme radius doesn't push the button off the item entirely for a
   * small item. A custom property (rather than an inline `top`/`right`
   * style) is what lets this coexist with the existing RTL `!important`
   * overrides below without a specificity fight — the property is what's
   * dynamic, not the rule that reads it.
   */
  /**
   * Merges built-in English defaults <- `GridLayout`'s own `ariaLabels`
   * (read via `thisLayout`, the same `$parent` access
   * `closeButtonEnabled`'s initial resolution uses) <- this item's own
   * `ariaLabels` override. Not re-resolved via an eventBus cascade the
   * way `showCloseButton`/etc are — these are static text, not something
   * a consumer plausibly changes reactively after mount the way a
   * boolean toggle might, so `thisLayout?.ariaLabels` being read directly
   * in a computed (which *is* still reactive to it, just without a
   * dedicated event) is a simpler match for what this actually needs.
   */
  const resolvedAriaLabels = computed(() => resolveAriaLabels(thisLayout?.ariaLabels, props.ariaLabels));

  const borderRadiusStyle = computed(() => {
    const style: Record<string, string> = useBorderRadiusResolved.value
      ? { borderRadius: `${borderRadiusPxResolved.value}px` }
      : {};

    const inset = useBorderRadiusResolved.value
      ? Math.min(4 + Math.round(Number(borderRadiusPxResolved.value) * 0.293), 24)
      : 4;
    style[`--close-button-inset`] = `${inset}px`;

    return style;
  });

  /**
   * `showResizeHandles`/`resizeHandleColor` inherit from `GridLayout`'s own
   * CSS custom property by default (`null`, the withDefaults value for
   * both) — nothing set here at all, letting the inherited
   * `--resize-handle-color` from the parent grid's own element apply
   * naturally through the DOM. An explicit override (either prop set to a
   * real value, not null) sets `--resize-handle-color` directly on this
   * item's own element instead, which takes precedence over the inherited
   * value the same way `borderRadiusStyle`'s `--close-button-inset`
   * override works. `showResizeHandles: false` specifically needs to set
   * `transparent` explicitly (not just omit the property) to actually
   * override a grid-level default of `true` for this one item — omitting
   * it would just let the inherited (visible) value show through.
   */
  const resizeHandleOverrideStyle = computed(() => {
    if(props.showResizeHandles === null) {
      return {};
    }
    if(props.showResizeHandles === false) {
      return { '--resize-handle-color': `transparent` };
    }
    return { '--resize-handle-color': props.resizeHandleColor ?? `rgb(94 94 94 / 45%)` };
  });

  /**
   * Computing css classes to add to the GridItem.
   */
  /**
   * Whether this item is part of `GridLayout`'s current multi-selection
   * (`multiSelect`) — read reactively via `thisLayout`'s exposed
   * `selectedItemIds` (a `Set`, for an O(1) `.has()` check on every
   * render rather than an array scan). `false` whenever `multiSelect` is
   * off, since `selectedItemIds` then simply never gets anything added
   * to it (`itemClickedHandler`'s own early-return in `GridLayout.vue`).
   */
  const isSelected = computed(() => {
    return thisLayout?.selectedItemIds?.has(props.i) ?? false;
  });

  const classObj = computed(() => {
    return {
      'css-transforms': useCssTransforms.value,
      'disable-userselect': isDragging.value,
      'no-touch': isAndroid.value && draggableOrResizableAndNotStatic.value,
      'render-rtl': renderRtl.value,
      resizing: isResizing.value,
      'vue-draggable': draggableAndNotStatic.value,
      'vue-draggable-dragging': isDragging.value,
      'vue-grid-item-selected': isSelected.value,
      'vue-resizable': resizableAndNotStatic.value,
      'vue-static': props.isStatic,
      'vue-use-radius': useBorderRadiusResolved.value,
    };
  });

  /**
   * Recomputes `styleObj` — the item's inline position/size style — from
   * its current grid-unit position, clamped to the container's column
   * count, and overridden with live pixel values while a drag or resize is
   * in progress. Called from nearly every watcher below, since almost
   * anything (props, container width, RTL state, drag/resize progress) can
   * change the resulting style.
   */
  const createStyle = (): void => {
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
      // Add rtl support
      if(renderRtl.value) {
        pos.right = dragging.value?.left as number;
      } else {
        pos.left = dragging.value?.left as number;
      }
    }
    if(isResizing.value) {
      pos.width = resizing.value?.width as number;
      pos.height = resizing.value?.height as number;
      // Left/top-edge resizes move the item's anchor point too, not just
      // its size — mirror dragging's approach of reading the live value
      // during the interaction, and let the eventBus/layout-array round
      // trip (see GridLayout.vue's resizeEvent()) commit it once resizeend
      // fires. Right/bottom-only resizes leave these untouched, since
      // resizing.value.left/top/right don't change in that case.
      if(renderRtl.value) {
        if(resizing.value?.right !== undefined) {
          pos.right = resizing.value.right;
        }
      } else if(resizing.value?.left !== undefined) {
        pos.left = resizing.value.left;
      }
      if(resizing.value?.top !== undefined) {
        pos.top = resizing.value.top;
      }
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
    styleObj.value = sty as unknown as Record<string, string | number>;
  };

  /**
   * Parses the pixel `width`/`height` back out of `styleObj` (stripping the
   * trailing `px`) and emits `EGridItemEvent.CONTAINER_RESIZED` with them.
   * Silently does nothing if `styleObj` doesn't have plain `NNpx` values yet
   * (e.g. before the first `createStyle()` call).
   */
  const emitContainerResized = (): void => {
    // this.style has width and height with trailing 'px'. The
    // resized event is without them
    let styleProps: IGridItemWidthHeight = {
      height: 0,
      width: 0,
    };
    for(const prop of [`width`, `height`]) {
      const val = styleObj.value[prop];
      const matches = String(val).match(/^(\d+)px$/);
      if(!matches) {
        return;
      }
       
      styleProps = matches[1] as unknown as IGridItemWidthHeight;
    }
    emit(EGridItemEvent.CONTAINER_RESIZED, props.i, props.h, props.w, styleProps.height, styleProps.width);
  };

  /**
   * Applies a new container width pushed down from `GridLayout` via the
   * `updateWidth` eventBus message. (Previously took an optional second
   * `colNum` argument too, but no caller ever passed one — column count
   * changes are handled entirely by the dedicated `setColNum` message
   * instead. Removed as dead code rather than tested — see
   * docs/REFACTORING.md #55.)
   */
  const updateWidth = (width: number): void => {
    // GridLayout emits 'updateWidth' with its own `width` ref, which starts
    // out (and can remain) null/0 whenever the container hasn't been measured
    // yet — e.g. a grid inside a hidden tab/modal, or a drag/resize starting
    // before layout has stabilized. Propagating that straight into
    // containerWidth used to make every position/size calculation
    // (calcColWidth) throw as soon as a drag or resize began in that state.
    // Ignoring non-positive widths here keeps the last known-good width
    // instead, and calculations resume normally once a real width arrives.
    if(Number.isFinite(width) && width > 0) {
      containerWidth.value = width;
    }
  };

  /** Recomputes this item's style in response to the eventBus `compact` message (emitted by `GridLayout` after any layout-wide change, since Vue can't detect in-place array-element mutations on its own). */
  const selfCompact = (): void => {
    createStyle();
  };

  // watch
  // Most of what follows falls into one of three shapes:
  //  - a prop watcher that just re-syncs a local ref (isDraggable -> draggable, etc.)
  //  - a watcher that calls tryMakeDraggable()/tryMakeResizable() because
  //    something changed that interact.js needs to know about
  //  - a watcher that calls createStyle() (and often emitContainerResized())
  //    because something changed that affects the item's rendered position/size
  // Individual watchers are only commented where they do something beyond these.
  watch(
    () => props.isDraggable,
    val => {
      draggable.value = val;
    },
  );

  watch(
    () => props.isStatic,
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

  watch(
    () => props.showCloseButton,
    val => {
      closeButtonEnabled.value = val;
    },
  );

  watch(
    () => props.enableEditMode,
    val => {
      editModeEnabled.value = val;
    },
  );

  watch(
    () => props.useBorderRadius,
    val => {
      useBorderRadiusResolved.value = val;
    },
  );

  watch(
    () => props.borderRadiusPx,
    val => {
      borderRadiusPxResolved.value = val;
    },
  );

  // `{ flush: 'post' }` — not the default ('pre') — matters here
  // specifically: the 8 resize-hint spans `tryMakeResizable()` needs are
  // `v-if`-gated on the resolved `resizable` state, so this watcher must
  // run *after* Vue has actually updated the DOM to reflect the new
  // value, not before it (the default timing), or it can still find zero
  // handles the same way the very first call from onMounted can (see
  // tryMakeResizable's own comment on that).
  watch(resizable, () => {
    tryMakeResizable();
  }, { flush: `post` });

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
    },
  );

  watch(
    () => props.w,
    newVal => {
      innerW.value = newVal;
      createStyle();
    },
  );

  watch(renderRtl, () => {
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

  // eventBus handlers — one per message GridLayout can push down (see the
  // table in docs/ARCHITECTURE.md). The `setDraggable`/`setResizable`/
  // `setBounded` handlers only apply the pushed value when this item's own
  // prop is `null` — an explicit per-item prop always wins over the parent
  // layout's cascade.
  const updateWidthHandler = (width: number): void => {
    updateWidth(width);
  };

  const compactHandler = (): void => {
    selfCompact();
  };

  const setDraggableHandler = (isDraggable: boolean): void => {
    if(props.isDraggable === null) {
      draggable.value = isDraggable;
    }
  };

  const setResizableHandler = (isResizable: boolean): void => {
    if(props.isResizable === null) {
      resizable.value = isResizable;
    }
  };

  const setBoundedHandler = (isBounded: boolean): void => {
    if(props.isBounded === null) {
      bounded.value = isBounded;
    }
  };

  const setShowCloseButtonHandler = (val: boolean): void => {
    if(props.showCloseButton === null) {
      closeButtonEnabled.value = val;
    }
  };

  const setEnableEditModeHandler = (val: boolean): void => {
    if(props.enableEditMode === null) {
      editModeEnabled.value = val;
    }
  };

  const setUseBorderRadiusHandler = (val: boolean): void => {
    if(props.useBorderRadius === null) {
      useBorderRadiusResolved.value = val;
    }
  };

  const setBorderRadiusPxHandler = (val: number): void => {
    if(props.borderRadiusPx === null) {
      borderRadiusPxResolved.value = val;
    }
  };

  const setTransformScaleHandler = (tScale: number): void => {
    transformScale.value = tScale;
  };

  /**
   * Bug fix: no handler for this existed at all — see GridLayout.vue's
   * own new watcher for the full explanation. Calls createStyle()
   * afterward (mirroring setMarginHandler's own pattern below), since
   * `useCssTransforms` decides which of `setTransform`/`setTopLeft`
   * createStyle() actually applies — the CSS class alone (bound directly
   * to the ref in classObj) would otherwise update on its own, but the
   * item's real inline positioning style would stay stuck on whichever
   * mechanism was active at mount.
   */
  const setUseCssTransformsHandler = (val: boolean): void => {
    useCssTransforms.value = val;
    createStyle();
  };

  const setRowHeightHandler = (rHeight: number): void => {
    rowHeight.value = rHeight;
  };

  /** Applies a margin change and immediately recomputes style/emits container-resized, matching the pattern createStyle-affecting handlers use elsewhere in this file. */
  const setMarginHandler = (newMargin: number[]): void => {
    if(!newMargin || (newMargin[0] === margin.value[0] && newMargin[1] === margin.value[1])) {
      return;
    }
    margin.value = newMargin.map(m => Number(m));
    createStyle();
    emitContainerResized();
  };

  const setMaxRowsHandler = (mRows: number): void => {
    maxRows.value = mRows;
  };

  /** Applies an RTL direction change and immediately recomputes style — direction changes need to take effect visually right away, unlike most other cascaded settings. */
  const changeDirectionHandler = (isMirrored: boolean): void => {
    rtl.value = isMirrored;
    selfCompact();
  };

  const setColNum = (colNum: number): void => {
    cols.value = colNum;
  };

  // eventbus
  eventBus.on(`changeDirection`, changeDirectionHandler);
  eventBus.on(`compact`, compactHandler);
  eventBus.on(`setBounded`, setBoundedHandler);
  eventBus.on(`setShowCloseButton`, setShowCloseButtonHandler);
  eventBus.on(`setEnableEditMode`, setEnableEditModeHandler);
  eventBus.on(`setUseBorderRadius`, setUseBorderRadiusHandler);
  eventBus.on(`setBorderRadiusPx`, setBorderRadiusPxHandler);
  eventBus.on(`setColNum`, setColNum);
  eventBus.on(`setDraggable`, setDraggableHandler);
  eventBus.on(`setMaxRows`, setMaxRowsHandler);
  eventBus.on(`setResizable`, setResizableHandler);
  eventBus.on(`setRowHeight`, setRowHeightHandler);
  eventBus.on(`setMargin`, setMarginHandler);
  eventBus.on(`setTransformScale`, setTransformScaleHandler);
  eventBus.on(`setUseCssTransforms`, setUseCssTransformsHandler);
  eventBus.on(`updateWidth`, updateWidthHandler);

  onBeforeUnmount(() => {
    teardownAutoHeight();
    // Remove listeners
    eventBus.off(`changeDirection`, changeDirectionHandler);
    eventBus.off(`compact`, compactHandler);
    eventBus.off(`setBounded`, setBoundedHandler);
    eventBus.off(`setShowCloseButton`, setShowCloseButtonHandler);
    eventBus.off(`setEnableEditMode`, setEnableEditModeHandler);
    eventBus.off(`setUseBorderRadius`, setUseBorderRadiusHandler);
    eventBus.off(`setBorderRadiusPx`, setBorderRadiusPxHandler);
    eventBus.off(`setColNum`, setColNum);
    eventBus.off(`setDraggable`, setDraggableHandler);
    eventBus.off(`setMaxRows`, setMaxRowsHandler);
    eventBus.off(`setResizable`, setResizableHandler);
    eventBus.off(`setRowHeight`, setRowHeightHandler);
    eventBus.off(`setMargin`, setMarginHandler);
    eventBus.off(`setTransformScale`, setTransformScaleHandler);
    eventBus.off(`setUseCssTransforms`, setUseCssTransformsHandler);
    eventBus.off(`updateWidth`, updateWidthHandler);
    teardownDraggable();
    teardownResizable();
  });

  /**
   * Reads this item's initial layout/interactivity state from `thisLayout`
   * (the parent `GridLayout`'s exposed state, via `$parent` — see
   * docs/ARCHITECTURE.md) and this item's own props, preferring the prop
   * when it's set and falling back to the parent layout's default when it's
   * `null`. This is the *only* point where `thisLayout` is read directly for
   * most of these fields — after mount, updates arrive via the eventBus
   * `setXxx` cascade instead (see the handlers above), since `$parent` isn't
   * reactive.
   */
  onMounted(() => {
    if(thisLayout?.responsive && thisLayout.lastBreakpoint) {
      cols.value = getColsFromBreakpoint(thisLayout.lastBreakpoint, thisLayout?.cols as IColumns);
    } else {
      cols.value = thisLayout?.colNum as number;
    }
    rowHeight.value = thisLayout?.rowHeight as number;
    containerWidth.value = thisLayout?.width !== null ? (thisLayout?.width as number) : 100;
    margin.value = thisLayout?.margin !== undefined ? thisLayout.margin : [10, 10];
    maxRows.value = thisLayout?.maxRows as number;
    // Bug fix (docs/REFACTORING.md #39): rtl.value was previously only
    // ever set by changeDirectionHandler, reacting to the eventBus
    // `changeDirection` message GridLayout emits from a `watch()` on its
    // own `isMirrored` prop — a watcher that, without `{ immediate: true }`,
    // never fires for the prop's *starting* value, only later changes. A
    // layout mounting with `isMirrored: true` from the start (rather than
    // toggling into it) left rtl.value stuck at its own default (`false`)
    // until the first actual change. This mirrors the thisLayout snapshot
    // being safe to read here specifically — at mount, it's still current;
    // it only goes stale for changes *after* this point, which the
    // eventBus cascade already handles correctly.
    rtl.value = thisLayout?.isMirrored as boolean;

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

    if(props.showCloseButton === null) {
      closeButtonEnabled.value = thisLayout?.showCloseButton as boolean;
    } else {
      closeButtonEnabled.value = props.showCloseButton;
    }

    if(props.enableEditMode === null) {
      editModeEnabled.value = thisLayout?.enableEditMode as boolean;
    } else {
      editModeEnabled.value = props.enableEditMode;
    }

    if(props.useBorderRadius === null) {
      useBorderRadiusResolved.value = thisLayout?.useBorderRadius as boolean;
    } else {
      useBorderRadiusResolved.value = props.useBorderRadius;
    }

    if(props.borderRadiusPx === null) {
      borderRadiusPxResolved.value = thisLayout?.borderRadiusPx as number;
    } else {
      borderRadiusPxResolved.value = props.borderRadiusPx;
    }

    transformScale.value = thisLayout?.transformScale as number;
    useCssTransforms.value = thisLayout?.useCssTransforms as boolean;
    createStyle();

    // Explicit, guaranteed calls — not just relying on the watchers above
    // to fire as a side effect of the ref assignments in this function.
    // Those watchers only fire when a value actually *changes*; if e.g.
    // `cols.value` happened to already equal what it's being set to here
    // (or any of the other refs these two functions depend on), the
    // watcher would silently never fire, and — before this — nothing else
    // would ever call tryMakeDraggable()/tryMakeResizable() at all. That
    // starves drag/resize setup entirely rather than just delaying it,
    // since there's no guarantee some *other* later change ever comes
    // along to trigger it by coincidence. Calling both directly here,
    // after every ref this component resolves from `thisLayout` is set and
    // once `gridItem.value` is guaranteed to be the real mounted element,
    // removes that dependency on chance entirely.
    tryMakeDraggable();
    tryMakeResizable();
    setupAutoHeight();
  });

  /**
   * What an external `ref` to a `<GridItem>` instance sees — `autoSize` (the
   * "resize to fit content" feature, see docs/REFACTORING.md #12 for its
   * current limitations), `calcXY` (pixel-to-grid-unit conversion, exposed
   * for advanced/manual use), `dragging` (live drag position), and every
   * prop.
   */
  defineExpose({
    autoSize,
    calcXY,
    dragging,
    ...props,
  });
</script>
<style lang="scss" scoped>
@use 'sass:math';
@use '../../styles/variables' as *;

// Bug fix: used on two elements (the close button's accessible label, and
// the keyboard-instructions element) but never actually defined anywhere
// in the library — see docs/ACCESSIBILITY.md. Without this, both render
// as plain visible text instead of being hidden-but-still-announced to
// screen readers. Standard "visually hidden" pattern (clips to a 1x1 box
// instead of `display: none`, which would also hide it from screen
// readers, defeating the purpose).
.visually-hidden {
  border: 0;
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

// Display a cross with CSS only.
// $size  : px or em
// $color : color
// $thickness : px
@mixin cross($size: 20px, $color: currentColor, $thickness: 1px) {
  background: none;
  border: 0;
  height: $size;
  margin: 0;
  padding: 0;
  position: relative;
  width: $size;

  &:after,
  &:before {
    background: $color;
    border-radius: $thickness;
    content: '';
    height: $thickness;
    left: 0;
    position: absolute;
    right: 0;
    top: math.div(($size - $thickness), 2);
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
  cursor: default;
  font-size: $grid-item-font-size;
  touch-action: none;
  transition: all var(--grid-transition-duration, 200ms) var(--grid-transition-timing, ease);
  transition-property: left, top, right;

  &.vue-draggable {
    cursor: move;
  }

  // Cursor-only affordance for resizing — there's no visible handle
  // element at all (a `.vue-resizable-handle` class existed in this
  // stylesheet at one point, styling a corner icon, but nothing in the
  // template ever rendered an element with that class — removed as dead
  // CSS, see docs/REFACTORING.md #3). Actual resize activation is
  // edge-proximity based, independent of any handle element — see
  // useGridItemResize.ts's `edges: { bottom: true, left: true, right:
  // true, top: true }`). Before this, hovering anywhere on a resizable
  // item showed the same cursor as everywhere else, with no visual hint
  // that dragging from an edge does something different than dragging
  // the body. Sized to 10px, matching interact.js's own default resize
  // margin for mouse input (`resize.defaultMargin` — 20px for
  // touch/pointer input, but 10px is a reasonable single value for a
  // purely visual hint that doesn't need to be pixel-perfect against
  // whichever input type is actually in use).
  // Only rendered when autoHeight is true — fills the item exactly like
  // an unwrapped <slot> would, so wrapping it changes nothing visually;
  // it exists purely to give setupAutoHeight() a stable DOM node to
  // observe (see useGridItemResize.ts's own comment for why this is
  // needed instead of reading the slot content some other way).
  // Bug fix: `height: 100%` constrained this wrapper to exactly its
  // parent GridItem's own current (fixed) height — meaning it could
  // never actually grow past that, regardless of how much content was
  // inside it, so its own bounding rect (what autoSize() measures) was
  // always the parent's existing size, never the content's real size.
  // The ResizeObserver watching this element for a size change
  // therefore never fired for growing content either, since a fixed
  // percentage of a fixed parent height doesn't change on its own —
  // both the automatic ResizeObserver-driven path and any manually
  // invoked `autoSize()` call read the same wrong, unchanging number.
  // `height: auto` lets the wrapper size itself to its actual content
  // instead, so both correctly reflect (and detect changes in) how
  // tall the content genuinely is.
  .vue-grid-item-auto-height-wrapper {
    height: auto;
    width: 100%;
  }

  .vue-resize-hint {
    align-items: center;
    background: var(--resize-handle-color, transparent);
    border-radius: 2px;
    display: flex;
    justify-content: center;

    // Custom #resize-handle slot content (an icon, typically) is free
    // to render larger than this span's own small hit-area without
    // being clipped — the hit-area's size is what matters for the
    // cursor/interaction affordance, not for bounding whatever a
    // consumer chooses to render inside it.
    overflow: visible;
    position: absolute;
    z-index: 15;
  }

  .vue-resize-hint--n,
  .vue-resize-hint--s {
    cursor: ns-resize;
    height: 10px;
    left: 10px;
    right: 10px;
  }

  .vue-resize-hint--n {
    top: 0;
  }

  .vue-resize-hint--s {
    bottom: 0;
  }

  .vue-resize-hint--e,
  .vue-resize-hint--w {
    bottom: 10px;
    cursor: ew-resize;
    top: 10px;
    width: 10px;
  }

  .vue-resize-hint--e {
    right: 0;
  }

  .vue-resize-hint--w {
    left: 0;
  }

  .vue-resize-hint--ne,
  .vue-resize-hint--sw {
    cursor: nesw-resize;
    height: 10px;
    width: 10px;
  }

  .vue-resize-hint--ne {
    right: 0;
    top: 0;
  }

  .vue-resize-hint--sw {
    bottom: 0;
    left: 0;
  }

  .vue-resize-hint--nw,
  .vue-resize-hint--se {
    cursor: nwse-resize;
    height: 10px;
    width: 10px;
  }

  .vue-resize-hint--nw {
    left: 0;
    top: 0;
  }

  .vue-resize-hint--se {
    bottom: 0;
    right: 0;
  }

  &:hover {
    border: solid 1px #000;
  }

  // Visible focus indicator for the keyboard move/resize support added in
  // useGridItemKeyboard.ts — without this, a keyboard user can focus and
  // operate an item but never see which one is focused. `:focus-visible`
  // (not plain `:focus`) so mouse/touch interaction doesn't show it.
  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
  }

  &.vue-static {
    background-color: $grid-item-static-bg-color;

    // Bug fix: a dragged item had no z-index boost at all, so a static
    // item rendered later in the consumer's own v-for (later DOM order
    // paints on top by default) would visually cover the item being
    // dragged over it — hiding it exactly when the user most needs to
    // see it. The natural fix (toggling z-index reactively on the
    // dragged item itself, tied to `isDragging`) was tried and
    // reverted: it broke `multiSelect`'s group move in a real browser
    // — traced to the actual mechanism this time, not left a mystery.
    // Changing z-index (or any property affecting the element's own
    // stacking/compositing) on an element mid-gesture, while it still
    // has active `setPointerCapture` from `pointerdown` (established
    // well before `dragstart`/`isDragging` ever fires, at the
    // activation-threshold crossing), causes the browser to silently
    // release that capture — verified directly: with the reactive
    // z-index in place, the drag's own event trace showed a single
    // `dragmove` followed immediately by a malformed `dragend` at
    // stale, unrelated coordinates, instead of the normal run of
    // `dragmove`s ending in a `dragend` at the final position. Since
    // `isStatic` never toggles mid-gesture — a static item is never
    // the one being dragged, and its own state doesn't change while
    // something else is — giving static items a permanently *lower*
    // z-index instead achieves the same visual result (a dragged item
    // stays visible over a static one) without ever mutating any
    // stacking-related property on the item actually holding pointer
    // capture.
    z-index: -1;
  }

  // Deliberately the same outline color/style as :focus-visible above,
  // for visual consistency between "focused via keyboard" and
  // "selected via multiSelect" — a consumer overriding one look should
  // usually want to override both. box-shadow (inset), not border or
  // outline directly: doesn't shift layout (no added width the way a
  // border would) and doesn't get clipped by rounded corners the way
  // outline sometimes does with useBorderRadius on.
  &.vue-grid-item-selected {
    box-shadow: inset 0 0 0 2px #2563eb;
  }

  &.no-touch {
    touch-action: none;
  }

  &.vue-use-radius {
    border-radius: $grid-item-border-radius;
  }

  &.css-transforms {
    left: auto;
    right: auto;

    // Previously a hardcoded, independent 400ms (2x the base rule's own
    // previous 200ms) — now unified under the same configurable value as
    // every other movement transition. GridLayout always sets
    // `--grid-transition-duration` explicitly (even at its own default),
    // so the `200ms` fallback here only matters for the edge case of a
    // GridItem rendered with no GridLayout ancestor at all; it's not
    // reachable in normal usage. See docs/REFACTORING.md #58 for why the
    // previous 400ms/200ms split was treated as an inconsistency to
    // remove rather than a ratio worth preserving.
    transition-duration: var(--grid-transition-duration, 200ms);
    transition-property: transform;
  }

  &.resizing {
    opacity: 0.6;
    z-index: 3;
  }

  &.vue-grid-placeholder {
    background: $grid-item-placeholder-bg-color;
    opacity: $grid-item-placeholder-opacity;

    // Previously a hardcoded, independent 100ms (half the base rule's own
    // previous 200ms, presumably so the placeholder snapped into place
    // faster than the dragged item's own movement) — now unified under
    // the same configurable value. See the `.css-transforms` comment
    // above for why the fallback here is effectively unreachable in
    // normal usage, and docs/REFACTORING.md #58 for the full reasoning.
    transition-duration: var(--grid-transition-duration, 200ms);
    user-select: none;
    z-index: 2;
  }

  &.disable-user-select {
    user-select: none;
  }

  &.render-rtl {
    &>.btn-close {
      align-items: center;
      background: red;
      border: 0;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      flex-flow: column nowrap;
      height: 24px;
      justify-content: center;
      left: var(--close-button-inset, 4px) !important;
      margin: 0;
      padding: 0;
      position: absolute;
      right: auto !important;
      top: var(--close-button-inset, 4px);
      transition: all 150ms;
      width: 24px;
      z-index: 20;

      &>.icon-cross {
        @include cross(16px, #fff, 4px);
      }

      &:hover,
      &:focus {
        background: #1481b4;
        transform: rotateZ(90deg);
      }
    }
  }

  &>.btn-close {
    align-items: center;
    background: red;
    border: 0;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    flex-flow: column nowrap;
    height: 24px;
    justify-content: center;
    left: auto;
    margin: 0;
    padding: 0;
    position: absolute;
    right: var(--close-button-inset, 4px);
    top: var(--close-button-inset, 4px);
    transition: all 150ms;
    width: 24px;
    z-index: 20;

    &>.icon-cross {
      @include cross(16px, #fff, 4px);
    }

    &:hover,
    &:focus {
      background: #1481b4;
      transform: rotateZ(90deg);
    }
  }
}
</style>
