<!--
  The grid container. Owns the layout array, breakpoint/responsive state,
  and the `eventBus` it provides to every `GridItem` rendered in its
  default slot. See docs/ARCHITECTURE.md for the full `$parent`/eventBus
  contract between this component and `GridItem`, and
  docs/REFACTORING.md for the history behind some of the more defensive
  guards below (several were added after real, reproduced bugs).
-->
<template>
  <div
    ref="refsLayout"
    class="vue-grid-layout"
    :class="{ grid: props.showGridLines, 'vue-grid-layout--active-drag': isDragging }"
    :dir="props.isMirrored ? 'rtl' : 'ltr'"
    :style="[mergeStyle, transitionStyle, gridLinesStyle, resizeHandleStyle]"
    @click="backgroundClickHandler">
    <slot></slot>
    <GridItem
      v-show="isDragging"
      ref="defaultGridItem"
      class="vue-grid-placeholder"
      :enable-edit-mode="enableEditMode"
      :h="placeholder.h"
      :i="placeholder.i"
      :show-close-button="showCloseButton"
      :use-border-radius="useBorderRadius"
      :w="placeholder.w"
      :x="placeholder.x"
      :y="placeholder.y">
      <slot
        :is-dragging="isDragging"
        name="placeholder"
        :placeholder="placeholder"></slot>
    </GridItem>
    <div
      v-for="(guide, index) in alignmentGuideStyles"
      :key="`alignment-guide-${index}`"
      class="vue-grid-alignment-guide"
      :style="guide"></div>
  </div>
</template>
<script lang="ts">
  import {
    computed,
    defineComponent,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    provide,
    ref,
    toRef,
    toRefs,
    watch,
  } from 'vue';

  export default defineComponent({
    name: `GridLayout`,
  });

  // Module-level (not per-instance) counter, so every GridLayout that
  // doesn't set its own `layoutId` still gets a distinct one — needed for
  // cross-grid drag/drop (see cross-grid-registry.ts) to tell grids apart
  // in emitted event payloads even when nobody bothered to name them.
  let layoutIdCounter = 0;
  function generateLayoutId(): string {
    layoutIdCounter += 1;
    return `grid-layout-${layoutIdCounter}`;
  }
</script>
<script lang="ts" setup>
  import mitt, { EventType } from 'mitt';
  import { ILayoutItem, TLayout } from '@/components';
  import { TGridLayoutEventBus, IPlaceholder } from '@/core/gridlayout/interfaces/layout-data.interface';
  import GridItem from './GridItem.vue';
  import { cloneLayout, getLayoutItem } from '@/core/helpers/utils';
  import { getCompactor, ICompactorContext } from '@/core/gridlayout/helpers/compactor';
  import { ECompactType } from '@/core/gridlayout/enums/ECompactType';
  import { addWindowEventListener, removeWindowEventListener } from '@/core/helpers/DOM';
  import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';
  import { IBreakpoints, IColumns, IGridLayoutProps } from './grid-layout-props.interface';
  import { IEventsData } from '@/core/common/interfaces/event-bus.interfaces';
  import { EDragEvent } from '@/core/gridlayout/enums/EDragEvent';
  import { getAllCollisions, getFirstCollision } from '@/core/gridlayout/helpers/collision-helper';
  import { getBottomYCoordinate } from '@/core/gridlayout/helpers/grid-layout-helper';
  import { getAllStaticGridItems } from '@/core/common/helpers/grid-item-type-helpers';
  import { moveElement } from '@/core/gridlayout/helpers/move-helper';
  import { findAlignmentGuides, findSnapAdjustment, IAlignmentGuide } from '@/core/gridlayout/helpers/alignment-helper';
  import { calcColWidth } from '@/core/griditem/helpers/grid-item-calculate-helper';
  import { IOutsideItemDropped } from '@/core/gridlayout/interfaces/outside-drop.interfaces';
  import { layoutValidator } from '@/core/validators/layout-validator';
  import { EErrorMessage } from '@/core/common/enums/ErrorMessages';
  import { ICrossGridDropRejected, ICrossGridItemDropped } from '@/core/gridlayout/interfaces/cross-grid.interfaces';
  import { useCrossGridDrag } from './composables/useCrossGridDrag';
  import { useMultiSelect } from './composables/useMultiSelect';
  import { useOutsideDrop } from './composables/useOutsideDrop';
  import { useResponsiveLayout } from './composables/useResponsiveLayout';
  import { useUndoRedo } from './composables/useUndoRedo';

  // Props Data
  const props = withDefaults(defineProps<IGridLayoutProps>(), {
    allowCrossGridDrag: false,
    ariaLabels: () => ({}),
    autoSize: true,
    borderRadiusPx: 10,
    breakpoints: (): IBreakpoints => ({
      xxl: 1600,
       
      xl: 1400,
       
      lg: 1200,
      md: 996,
      sm: 768,
      xs: 480,
      xxs: 0,
    }),
    colNum: 12,
    cols: (): IColumns => ({
      xxl: 12,
       
      xl: 12,
       
      lg: 12,
      md: 10,
      sm: 6,
      xs: 4,
      xxs: 2,
    }),
    distributeEvenly: false,
    disableExternalDrop: false,
    enableEditMode: true,
    horizontalShift: false,
    isBounded: false,
    isDraggable: true,
    isMirrored: false,
    isResizable: true,
    layoutId: generateLayoutId,
    allowOutsideDrop: false,
    outsideDropWidth: 2,
    outsideDropHeight: 2,
    outsideDropAccept: null,
    margin: () => [10, 10],
    maxRows: Infinity,
    multiSelect: false,
    preventCollision: false,
    responsive: false,
    responsiveLayouts: () => ({}),
    restoreOnDrag: false,
    rowHeight: 150,
    showAlignmentGuides: false,
    snapToGrid: false,
    snapThreshold: 1,
    showCloseButton: false,
    showGridLines: false,
    showResizeHandles: false,
    resizeHandleColor: `rgb(94 94 94 / 45%)`,
    transformScale: 1,
    transitionDurationMs: 200,
    transitionTimingFunction: `ease`,
    useBorderRadius: false,
    useCssTransforms: true,
    compactor: null,
    enableUndoRedo: false,
    undoHistoryLimit: 50,
    compactType: ECompactType.VERTICAL,
  });

  const width = ref<number | null>(null);
  const mergeStyle = ref<{ [key: string]: string }>({});

  const lastLayoutLength = ref<number>(0);
  const isDragging = ref<boolean>(false);
  const placeholder = ref<IPlaceholder>({
    h: 0,
    i: '__grid_placeholder__',
    w: 0,
    x: 0,
    y: 0,
  });
  /** Populated during a drag/resize (when `showAlignmentGuides` is on) with every edge alignment found against the rest of `props.layout`; emptied on drag/resize end, or whenever an active item's position/size no longer aligns with anything. See `updateAlignmentGuides` below and `core/gridlayout/helpers/alignment-helper.ts` for what "alignment" means here. */
  const alignmentGuides = ref<IAlignmentGuide[]>([]);
  const originalLayout = ref<TLayout>();
  const erd = ref<ResizeObserver | null>(null);
  const positionsBeforeDrag = ref<Record<string | number, { x: number; y: number }>>();
  /**
   * Snapshot of every *other* selected item's own `x`/`y` at the start
   * of a group-move-eligible drag (the dragged item is itself part of a
   * multi-item selection) — a separate, dedicated snapshot from
   * `positionsBeforeDrag` above (that one is `restoreOnDrag`-specific
   * and conditionally populated), so this feature doesn't get coupled
   * to that one's own gating logic. Delta is computed from this
   * snapshot each time, not accumulated incrementally frame-to-frame,
   * to avoid drift.
   */
  const groupMoveStartPositions = ref<Map<string | number, { x: number; y: number }>>(new Map());
  /** Same idea as `groupMoveStartPositions` above, but for group resize — snapshots `w`/`h` instead of `x`/`y`. */
  const groupResizeStartSizes = ref<Map<string | number, { w: number; h: number }>>(new Map());

  const refsLayout = ref<HTMLElement>({} as HTMLElement);

  const defaultGridItem = ref();
  const colNum = toRef(props, 'colNum');
  const propsLayout = toRef(props, 'layout');

  // eventbus
  const eventBus: TGridLayoutEventBus = mitt();

  provide(`eventBus`, eventBus);

  const emit = defineEmits<{
    (e: EGridLayoutEvent.BREAKPOINT_CHANGED, newBreakpoint: string, layout: TLayout): void;
    (e: EGridLayoutEvent.COLUMNS_CHANGED, colNum: number): void;
    (e: EGridLayoutEvent.CROSS_GRID_DROP_REJECTED, payload: ICrossGridDropRejected): void;
    (e: EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED, payload: ICrossGridItemDropped): void;
    (e: EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE, payload: IOutsideItemDropped): void;
    (e: EGridLayoutEvent.DRAG_END, itemId: string | number): void;
    (e: EGridLayoutEvent.DRAG_MOVE, itemId: string | number): void;
    (e: EGridLayoutEvent.DRAG_START, itemId: string | number): void;
    (e: EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_CREATED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_MOUNTED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_UPDATE, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_UPDATED, layout: TLayout): void;
    (e: EGridLayoutEvent.LAYOUT_READY, layout: TLayout): void;
    (e: EGridLayoutEvent.MOVE_BLOCKED_BY_COLLISION, itemId: string | number): void;
    (e: EGridLayoutEvent.SELECTION_CHANGED, selectedItems: (string | number)[]): void;
  }>();
  emit(EGridLayoutEvent.LAYOUT_CREATED, props.layout);

  /** Computed CSS `height` for the grid container when `autoSize` is enabled — empty string (no explicit height) otherwise. */
  const containerHeight = (): string => {
    if(!props.autoSize) {
      return ``;
    }
    return `${getBottomYCoordinate(props.layout) * (props.rowHeight + props.margin[1]) + props.margin[1]}px`;
  };

  /** Recomputes `mergeStyle` (currently just `height`) — called whenever something that could change the container's required height changes. */
  const updateHeight = (): void => {
    mergeStyle.value = {
      height: containerHeight(),
    };
  };

  const { handleDragEnd: handleCrossGridDragEnd, handleDragStart: handleCrossGridDragStart, setCrossGridDragEnabled, teardown: teardownCrossGridDrag } = useCrossGridDrag({
    emit,
    eventBus,
    isDragging,
    originalLayout,
    props,
    refsLayout,
    updateHeight,
  });

  const { setOutsideDropEnabled } = useOutsideDrop({
    emit,
    isDragging,
    placeholder,
    props,
    refsLayout,
    width,
  });

  /**
   * Recomputes `alignmentGuides` from an in-progress drag/resize's live
   * position/size against the rest of `props.layout` — a no-op when
   * `showAlignmentGuides` is off, so there's no cost to the feature for
   * consumers who don't enable it. Called from both `dragEvent` and
   * `resizeEvent`'s move/start cases; `clearAlignmentGuides` (below)
   * handles the end case for both.
   */
  const updateAlignmentGuides = (id: string | number, x: number, y: number, w: number, h: number): void => {
    if(!props.showAlignmentGuides) {
      return;
    }
    alignmentGuides.value = findAlignmentGuides(props.layout, { h, i: id, w, x, y });
  };

  const clearAlignmentGuides = (): void => {
    alignmentGuides.value = [];
  };

  /**
   * Finds the DOM element for a given item id, scoped to this grid's own
   * container (`refsLayout.value`) rather than a global
   * `document.querySelector` — important for `allowCrossGridDrag`/
   * multi-grid pages, where more than one `GridLayout` on the same page
   * could otherwise have items sharing the same rendered attribute value
   * if a consumer reused an id across grids. Relies on `data-grid-item-id`
   * (set on `GridItem`'s own root element, matching its `i` prop) rather
   * than anything derived from position/index, so it keeps working
   * correctly regardless of layout order or filtering.
   */
  const findItemElement = (id: string | number): HTMLElement | null => {
    if(!(refsLayout.value instanceof HTMLElement)) {
      return null;
    }
    // Deliberately not a single interpolated `[data-grid-item-id="${id}"]`
    // selector, which would need CSS.escape() for an id containing
    // characters that aren't valid unescaped in an attribute selector
    // (quotes, for one) — CSS.escape isn't universally available (jsdom,
    // this project's own test environment, doesn't provide it), and
    // there's no need to depend on it when comparing the attribute value
    // in plain JS after a simple, fixed selector works just as well.
    const idAsString = String(id);
    const candidates = refsLayout.value.querySelectorAll<HTMLElement>(`[data-grid-item-id]`);
    return Array.from(candidates).find(el => el.getAttribute(`data-grid-item-id`) === idAsString) ?? null;
  };

  /**
   * Scrolls the item with the given id into view, if it's currently
   * rendered. A no-op (not a throw) when the id doesn't match any
   * rendered item — e.g. called right after removing that same item, a
   * plausible sequence for a "jump to the newly-added widget" flow that
   * also needs to handle the item no longer existing. `block: 'nearest'`
   * (not `'center'`) avoids yanking the whole page's scroll position for
   * an item that's already fully visible, only scrolling the minimum
   * amount needed when it's actually out of view.
   *
   * Bug fix: this used to search for the element synchronously, right
   * when called — but the documented, intended use ("jump to the
   * widget you just added") is calling this immediately after pushing
   * a new item into `layout`, in the very same handler. Vue's own
   * reactivity batches the DOM update for that asynchronously (a
   * microtask, not synchronous within the same call stack), so the new
   * item's element genuinely doesn't exist in the DOM yet at that
   * point — this silently found nothing and did nothing, in exactly
   * the scenario it was built for. Awaiting `nextTick()` first — a
   * consumer's own `await gridRef.scrollToItem(id)` isn't required for
   * this to work, since the fix lives inside the method itself now —
   * fixes this without requiring every caller to know about or manage
   * this timing themselves.
   */
  const scrollToItem = async (id: string | number): Promise<void> => {
    await nextTick();
    findItemElement(id)?.scrollIntoView({ behavior: `smooth`, block: `nearest`, inline: `nearest` });
  };

  /**
   * Moves keyboard focus to the item with the given id, if it's
   * currently rendered and focusable (draggable/resizable/non-static
   * items get `tabindex="0"`; a purely static, non-interactive item
   * never does, so focusing it wouldn't do anything meaningful even if
   * this tried). Same no-op-on-missing-id behavior as `scrollToItem`,
   * for the same reason — restoring focus after a keyboard-driven
   * remove/relocate is exactly the case where the previously-focused
   * item may no longer be the one you're now trying to focus. Same
   * `nextTick()` fix as `scrollToItem`, for the identical reason — see
   * its own doc comment above for the full explanation.
   */
  const focusItem = async (id: string | number): Promise<void> => {
    await nextTick();
    findItemElement(id)?.focus();
  };

  /**
   * Re-runs compaction on the current layout on demand — `compactLayout`
   * already runs internally after nearly every layout change (drag end,
   * resize end, item add/remove), but wasn't previously reachable for a
   * consumer to trigger manually. Useful for a "Tidy up" button, or for
   * re-compacting after a bulk programmatic layout edit that bypassed
   * drag/resize entirely (e.g. replacing `layout.value` wholesale via
   * `v-model`, which — unlike an in-place drag mutation — doesn't
   * automatically trigger this on its own unless the length also
   * changed; see `layoutUpdate`'s own length-based diff check above).
   * Mirrors the exact sequence of side effects the internal call sites
   * already use (compact, `compact` eventBus emit, height recompute,
   * both layout events), so a consumer sees the same reactive updates
   * either way.
   */
  /**
   * Runs compaction via `props.compactor` if one is set, falling back
   * to the built-in compactor matching `props.compactType` — the exact
   * behavior every trigger point used before either of these props
   * existed, a purely additive pair of overrides, not a new default
   * behavior. `compactTypeOverride` lets `compactNow()` keep forcing
   * real compaction regardless of `props.compactType` being `NONE`
   * (see its own comment below for why), whether or not a custom
   * compactor is in play, without every other call site needing to
   * pass anything.
   */
  const runCompaction = (minPositions?: ICompactorContext[`minPositions`], compactTypeOverride?: ECompactType): void => {
    const compactType = compactTypeOverride ?? props.compactType as ECompactType;
    if(props.compactor) {
      const compacted = props.compactor.compact(props.layout, props.colNum as number, { compactType, minPositions });
      // `v-model:layout` works by mutating this array in place, keeping
      // the parent's own bound reference in sync — reassigning
      // `props.layout` directly isn't just discouraged, Vue doesn't
      // allow it at all. A deliberate, checked exception, not an
      // oversight — see PRODUCTION_READINESS.md.
      // eslint-disable-next-line vue/no-mutating-props
      props.layout.splice(0, props.layout.length, ...compacted);
      return;
    }
    getCompactor(compactType).compact(props.layout, props.colNum as number, { compactType, minPositions });
  };

  const { canRedo, canUndo, captureDragStart, captureResizeStart, commitDragEnd, commitFromLastSnapshot, commitResizeEnd, commitUndoPoint, initLastSnapshot, redo, undo } = useUndoRedo({
    emit,
    props,
    runCompaction: () => runCompaction(),
    updateHeight,
  });

  const compactNow = (): void => {
    const beforeCompact = cloneLayout(props.layout);
    // Deliberately forces real compaction to happen even when
    // `props.compactType` is `NONE` — that prop only governs
    // *automatic* compaction during drag/resize; an explicit,
    // manually-triggered "tidy up" should always actually tidy up,
    // including pulling items together to close gaps, regardless of
    // whether automatic compaction happens to be off. Respects
    // whichever *direction* was already chosen (`HORIZONTAL`, either
    // `*_OVERLAP` variant) rather than always forcing `VERTICAL` — only
    // `NONE` specifically needs a fallback, since it has no "direction"
    // of its own to respect. Found (and fixed, back when this was a
    // boolean) by writing an e2e test for exactly this
    // "compaction off, scattered layout, click Tidy up" scenario:
    // passing `props.compactType` through unchanged made this a no-op
    // whenever it was `NONE` — precisely the case a manual tidy-up
    // button exists for in the first place.
    runCompaction(undefined, props.compactType === ECompactType.NONE ? ECompactType.VERTICAL : props.compactType as ECompactType);
    commitUndoPoint(beforeCompact);
    eventBus.emit(`compact`);
    updateHeight();
    emit(EGridLayoutEvent.LAYOUT_UPDATE, props.layout);
    emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
  };

  /** Alias for `compactNow()` — same operation, offered under the name `docs/FEATURE_RECOMMENDATIONS.md` originally suggested it under. */
  const rearrange = (): void => {
    compactNow();
  };

  /**
   * Clones the item with the given id, placing the copy directly below
   * the source item (`x` unchanged, `y: source.y + source.h`) and
   * letting the next compaction pass resolve any overlap that placement
   * causes — rather than trying to compute a collision-free spot
   * up front, which would need to duplicate logic `compactLayout`
   * already has. Copies every field except `i` (given a new,
   * collision-safe id below) and `moved` (compaction's own bookkeeping
   * flag, not part of the item's actual configuration — copying it
   * would carry over whatever value the source happened to have from
   * its last compaction pass, which isn't meaningful for a brand new
   * item that hasn't been through one yet).
   *
   * Returns the new item's id, or `null` if `id` doesn't match any item
   * currently in the layout — a plausible sequence for a "duplicate"
   * button wired up to an id that was already removed. Pairs naturally
   * with `scrollToItem`/`focusItem` for a "duplicate and jump to the
   * copy" flow.
   */
  const duplicateItem = (id: string | number): string | number | null => {
    const source = getLayoutItem(props.layout, id);
    if(!source) {
      return null;
    }

    // Collision-safe id: try `${id}-copy`, then `${id}-copy-2`, etc.,
    // rather than a timestamp — more readable in devtools/emitted
    // events, and just as collision-safe against the current layout.
    let suffix = 1;
    let newId = `${id}-copy`;
    const existingIds = new Set(props.layout.map(item => String(item.i)));
    while (existingIds.has(newId)) {
      suffix += 1;
      newId = `${id}-copy-${suffix}`;
    }

    const { i: _unusedId, moved: _unusedMoved, ...rest } = source;
    const duplicated: ILayoutItem = { ...rest, i: newId, y: source.y + source.h };
    // Same `v-model:layout` in-place-mutation pattern as runCompaction's
    // own custom-compactor path above — see that one's comment.
    // eslint-disable-next-line vue/no-mutating-props
    props.layout.push(duplicated);
    compactNow();

    return newId;
  };

  /**
   * Multi-select state (`multiSelect`) — see that prop's own doc
   * comment in `grid-layout-props.interface.ts` for the full design
   * scope (deliberately not collision-aware for passenger items during
   * a group move/resize). A `Set`, not a reactive array directly, so
   * `.has()` lookups (read every render by every `GridItem` via
   * `thisLayout` to decide its own `vue-grid-item-selected` class) stay
   * O(1) regardless of selection size.
   */
  const { backgroundClickHandler, clearSelection, deselectItem, itemClickedHandler, pruneSelection, selectedItemIds, selectedItems, selectItem, toggleItemSelection } = useMultiSelect({
    emit,
    props,
  });

  /**
   * CSS custom properties for `transitionDurationMs`/`transitionTimingFunction`,
   * applied on this element and inherited naturally by every `GridItem`
   * underneath it — deliberately not an eventBus cascade like
   * `borderRadiusPx`/`showCloseButton`/etc, since CSS custom properties
   * already inherit through the DOM without needing one. No per-item
   * override exists for the same reason: a consumer wanting a different
   * transition for one specific item can already do so by setting
   * `--grid-transition-duration`/`--grid-transition-timing` directly on
   * that `GridItem`'s own element via a scoped style, which naturally
   * takes precedence over the inherited value.
   */
  const transitionStyle = computed(() => ({
    '--grid-transition-duration': `${props.transitionDurationMs}ms`,
    '--grid-transition-timing': props.transitionTimingFunction,
  }));

  /**
   * `--resize-handle-color`, inherited naturally by every `GridItem`
   * underneath — same mechanism as `transitionStyle` above, not an
   * eventBus cascade. Only set when `showResizeHandles` is on: the CSS
   * itself defaults `.vue-resize-hint`'s background to `transparent`
   * when this custom property is unset, so simply not emitting it here
   * is what keeps the handles invisible-but-still-cursor-functional by
   * default, without needing a second variable to separately gate
   * visibility. A `GridItem` wanting its own override (rather than
   * inheriting this grid-level default) sets `--resize-handle-color`
   * directly on its own element via a scoped style, which naturally
   * takes precedence over the inherited value — same override pattern
   * `transitionStyle` documents above.
   */
  const resizeHandleStyle = computed(() => (
    props.showResizeHandles ? { '--resize-handle-color': props.resizeHandleColor } : {}
  ));

  /**
   * Grid line spacing, as CSS custom properties — replaces a previous
   * implementation that hardcoded `background-size` to a fixed 6
   * columns / 70px rows (see docs/REFACTORING.md #63), meaning grid
   * lines only ever lined up with the actual layout by coincidence,
   * for exactly one specific `colNum`/`rowHeight` combination. Computed
   * the same way `alignmentGuideStyles` derives pixel sizes from grid
   * units, for consistency. Guarded the same way too: `calcColWidth`
   * throws on an unmeasured/zero container width, so this falls back to
   * a 1x1px pattern (invisible-but-harmless, not a crash) until a real
   * measurement arrives, rather than being read unconditionally like
   * the bug that guard was written for the first time.
   */
  const gridLinesStyle = computed(() => {
    if(!width.value || width.value < 1) {
      return { '--grid-line-column-size': `1px`, '--grid-line-row-size': `1px` };
    }
    const colWidth = calcColWidth(width.value, props.margin[0], props.colNum as number);
    return {
      '--grid-line-column-size': `${colWidth + props.margin[0]}px`,
      '--grid-line-row-size': `${props.rowHeight + props.margin[1]}px`,
    };
  });

  /**
   * Converts `alignmentGuides`'s grid-unit positions into pixel offsets
   * for rendering — the same `position * (size + margin) + margin`
   * formula `containerHeight()`/`calcXY` already use elsewhere in this
   * file, for consistency with how every other grid-to-pixel conversion
   * here works. A vertical guide (`axis: 'x'`) spans the container's
   * full height at a computed `left`; a horizontal guide (`axis: 'y'`)
   * spans the full width at a computed `top`.
   */
  const alignmentGuideStyles = computed(() => {
    // Guard both against doing the work at all when there's nothing to
    // render (the common case — most renders have zero active guides),
    // and against calcColWidth's own validation throwing when the
    // container hasn't been measured yet (width.value still null/0),
    // which every component starts out as before its first real
    // measurement — confirmed this was a real, reachable case, not a
    // defensive guard against something that can't happen: it's exactly
    // what broke every other test in this file the first time this
    // computed was written without the guard, since accessing it in the
    // template evaluates the function body on every render regardless
    // of whether alignmentGuides.value is empty.
    if(alignmentGuides.value.length === 0 || !width.value || width.value < 1) {
      return [];
    }

    const colWidth = calcColWidth(width.value, props.margin[0], props.colNum as number);
    return alignmentGuides.value.map(guide => {
      if(guide.axis === `x`) {
        return {
          left: `${guide.position * (colWidth + props.margin[0]) + props.margin[0]}px`,
          top: `0`,
          height: `100%`,
          width: `1px`,
        };
      }
      return {
        left: `0`,
        top: `${guide.position * (props.rowHeight + props.margin[1]) + props.margin[1]}px`,
        height: `1px`,
        width: `100%`,
      };
    });
  });

  // Responsive breakpoint tracking (layouts cache, lastBreakpoint,
  // responsiveGridLayout/initResponsiveFeatures) lives in its own
  // composable — see docs/ARCHITECTURE.md.
  const {
    initResponsiveFeatures,
    lastBreakpoint,
    layouts,
    responsiveGridLayout,
  } = useResponsiveLayout({ colNum, emit, eventBus, originalLayout, props, width });

  /**
   * Handles a drag-progress report from a `GridItem` (relayed via
   * `dragEventHandler`/the eventBus, or called directly — it's exposed via
   * `defineExpose` for advanced/manual use). Moves the dragged item (and
   * cascades collisions via `moveElement`), updates the drag placeholder,
   * and emits the corresponding `EGridLayoutEvent.DRAG_*`/`LAYOUT_UPDATE*`
   * events.
   *
   * @param eventName The drag phase (`'dragstart' | 'dragmove' | 'dragend'`), or `undefined` for a bare "recompute" call.
   * @param id         The dragged item's id. A no-op if `undefined` (see the guard below).
   * @param x          New horizontal position, in grid units.
   * @param y          New vertical position, in grid units.
   * @param h          The dragged item's height, in grid units.
   * @param w          The dragged item's width, in grid units.
   */
  /**
   * Extracted from `dragEvent()` (see `docs/REFACTORING.md`'s code
   * review finding on `dragEvent`/`resizeEvent`'s own size) — magnetic
   * snapping (`snapToGrid`), distinct from `showAlignmentGuides`, which
   * only visualizes alignment without changing where the item lands.
   * Only meaningful during an actual drag phase (not the
   * `eventName === undefined` "no-op recompute" call), and only once
   * x/y/w/h are all defined. Returns the adjusted `{ x, y }` (or the
   * original values unchanged, if nothing snapped) — the caller is
   * responsible for using the returned values for everything from this
   * point on, so both the live placeholder during `DRAG_MOVE` and the
   * actual committed position on `DRAG_END` see the same,
   * already-snapped value.
   */
  const applySnapToGridAdjustment = (
    eventName: EventType | undefined,
    id: string | number,
    x: number | undefined,
    y: number | undefined,
    w: number | undefined,
    h: number | undefined,
  ): { x: number | undefined; y: number | undefined } => {
    let resultX = x;
    let resultY = y;
    if(
      props.snapToGrid
      && (eventName === EDragEvent.DRAG_MOVE || eventName === EDragEvent.DRAG_END)
      && x !== undefined && y !== undefined && w !== undefined && h !== undefined
    ) {
      const adjustment = findSnapAdjustment(props.layout, { h, i: id, w, x, y } as ILayoutItem, props.snapThreshold as number);
      if(adjustment.x !== undefined) {
        resultX = adjustment.x;
      }
      if(adjustment.y !== undefined) {
        resultY = adjustment.y;
      }
    }
    return { x: resultX, y: resultY };
  };

  /**
   * Extracted from `dragEvent()` (see `docs/REFACTORING.md`'s code
   * review finding on `dragEvent`/`resizeEvent`'s own size) —
   * `multiSelect`'s group move: dragging a selected item while more
   * than one is selected moves every other selected item by the same
   * delta. See `multiSelect`'s own doc comment for the full design
   * scope. Snapshotting happens on drag start, not lazily on first
   * move, so the very first dragmove already has a valid baseline to
   * compute a delta against. Mutates the passenger items in
   * `props.layout` directly (and `groupMoveStartPositions.value` on
   * drag start) — has no return value, since its whole effect is that
   * mutation.
   */
  const applyGroupMove = (
    eventName: EventType | undefined,
    id: string | number,
    x: number | undefined,
    y: number | undefined,
  ): void => {
    if(!(props.multiSelect && selectedItemIds.value.has(id) && selectedItemIds.value.size > 1)) {
      return;
    }
    if(eventName === EDragEvent.DRAG_START) {
      groupMoveStartPositions.value = new Map(
        Array.from(selectedItemIds.value, selectedId => {
          const selectedItem = getLayoutItem(props.layout, selectedId);
          return [selectedId, { x: selectedItem?.x ?? 0, y: selectedItem?.y ?? 0 }];
        }),
      );
    } else if(
      (eventName === EDragEvent.DRAG_MOVE || eventName === EDragEvent.DRAG_END)
      && x !== undefined && y !== undefined
      && groupMoveStartPositions.value.has(id)
    ) {
      const anchorStart = groupMoveStartPositions.value.get(id)!;
      const dx = x - anchorStart.x;
      const dy = y - anchorStart.y;
      groupMoveStartPositions.value.forEach((startPos, passengerId) => {
        if(passengerId === id) {
          return;
        }
        const passenger = getLayoutItem(props.layout, passengerId);
        // A passenger that's static, or explicitly not draggable, never
        // moves — the same guarantee a static item already has against
        // the normal collision-push cascade. Bug found post-release: an
        // earlier version moved these unconditionally, since selecting
        // an item doesn't itself require it to be draggable.
        if(passenger && !passenger.isStatic && passenger.isDraggable !== false) {
          passenger.x = Math.max(startPos.x + dx, 0);
          passenger.y = Math.max(startPos.y + dy, 0);
        }
      });
    }
  };

  /**
   * Extracted from `dragEvent()` (see `docs/REFACTORING.md`'s code
   * review finding on `dragEvent`/`resizeEvent`'s own size) — updates
   * the drag placeholder and alignment guides for the live drag
   * target, and decides whether `isDragging` should be `true` (a valid
   * drop target right now) or `false` (colliding with a static item),
   * for `DRAG_MOVE`/`DRAG_START` specifically. Any other phase (i.e.
   * `DRAG_END`, or the `eventName === undefined` "no-op recompute"
   * call) just settles `isDragging` back to `false`.
   *
   * Deliberately takes the live drag-target `x`/`y` (not
   * `l.x`/`l.y`, which still mirror the item's *pre-drag* position at
   * this point, since `moveElement()` — called after this, back in
   * `dragEvent` — is what actually updates them). Using the
   * placeholder's own stale x/y here previously computed alignment
   * guides against the wrong position, and made the static-collision
   * check below always take the no-collision path (a position an item
   * already validly occupies can never collide with anything) —
   * caught by tests asserting the exact expected guide, and that
   * `isDragging` actually becomes `false`, not just that calling this
   * doesn't throw.
   */
  const updateDragPlaceholderAndState = (
    eventName: EventType | undefined,
    id: string | number,
    l: ILayoutItem,
    x: number | undefined,
    y: number | undefined,
    w: number | undefined,
    h: number | undefined,
  ): void => {
    if(eventName !== EDragEvent.DRAG_MOVE && eventName !== EDragEvent.DRAG_START) {
      nextTick(() => {
        isDragging.value = false;
      });
      return;
    }

    placeholder.value.i = id;
    placeholder.value.x = l.x as number;
    placeholder.value.y = l.y as number;
    placeholder.value.w = w as number;
    placeholder.value.h = h as number;
    updateAlignmentGuides(id, x as number, y as number, w as number, h as number);

    const staticItem = getAllStaticGridItems(propsLayout.value);
    if(
      getFirstCollision(staticItem, {
        i: `index`,
        h: placeholder.value.h,
        w: placeholder.value.w,
        x: x as number,
        y: y as number,
      }) === undefined
    ) {
      nextTick(() => {
        isDragging.value = true;
      });
      eventBus.emit(`updateWidth`, width.value);
    } else {
      nextTick(() => {
        isDragging.value = false;
      });
    }
  };

  const dragEvent = (
    eventName?: EventType,
    id?: string | number,
    x?: number,
    y?: number,
    h?: number,
    w?: number,
    clientX?: number,
    clientY?: number,
  ): void => {
    // See the matching guard in resizeEvent() — dragEventHandler(undefined)
    // (triggered by an eventBus 'dragEvent' emit with no payload) would
    // otherwise hit getLayoutItem(props.layout, undefined), which throws
    // rather than returning undefined. Nothing currently emits 'dragEvent'
    // without a payload, but guarding here keeps this function safe on its
    // own rather than relying on every caller never doing so.
    if(id === undefined) {
      return;
    }

    if(eventName === `dragstart`) {
      captureDragStart();
    }

    let l = getLayoutItem(props.layout, id);

    // GetLayoutItem sometimes returns null object
    if(l === undefined) {
      l = {
        x: 0,
        y: 0,
      } as ILayoutItem;
    }

    const { x: snappedX, y: snappedY } = applySnapToGridAdjustment(eventName, id, x, y, w, h);

    // Group move (multiSelect) — see applyGroupMove's own doc comment
    // for the full design scope.
    applyGroupMove(eventName, id, snappedX, snappedY);

    // `handleCrossGridDragStart` is meant to run at dragstart specifically
    // (per its own doc comment) — arming `crossGridDraggedId` once, for
    // the whole gesture. Kept separate from the dragend-gated check
    // below rather than calling both together at dragend, matching
    // that original intent.
    if(eventName === `dragstart`) {
      handleCrossGridDragStart(id);
    }
    // Bug fix: this used to run unconditionally, on every single
    // dragEvent() call — including every `dragmove`, not just the
    // actual drop (`dragend`). `handleCrossGridDragEnd` reads
    // `clientX`/`clientY` directly off whatever event triggered this
    // call, and those are populated for every event type, not only
    // dragend — so the moment the pointer first crossed into another
    // grid's own rect *during* the drag (long before the user released
    // the mouse), the transfer committed right then, using that
    // mid-drag position (via `acceptDrop`'s own fixed placement +
    // compaction), not the position the user actually intended to drop
    // at. The item was then already gone from this grid's own layout
    // for the rest of that same gesture, which is what produced the
    // reported "drops onto a locked item, then snaps back to its
    // previous position instead of landing correctly" — the transfer
    // had already happened earlier in the same drag, using stale
    // coordinates, well before the pointer ever reached the locked
    // item's own position.
    if(eventName === `dragend` && handleCrossGridDragEnd(id, clientX, clientY, l)) {
      // Accepted by another grid — every side effect the accept path
      // needs already ran inside the composable (removing the item from
      // this grid's layout, compaction, the various emits,
      // isDragging/originalLayout updates). Nothing left here to move
      // or compact, since the item no longer belongs to this grid's
      // layout at all.
      return;
    }
    if(eventName === `dragstart` && props.compactType !== ECompactType.VERTICAL) {
      // Bug fix (docs/REFACTORING.md #16): this used to store `{ tmpX, tmpY }`
      // per item, but compactItem() (the only consumer, via the
      // restoreOnDrag branch below) reads `.y` — so with compaction off,
      // minPositions[item.i].y was always undefined, silently
      // disabling the "don't compact past pre-drag position" behavior
      // restoreOnDrag is supposed to provide. Storing `{ x, y }` directly
      // makes the producer and consumer agree on a shape again — `x`
      // matters for `ECompactType.HORIZONTAL`'s own restoreOnDrag, `y`
      // for every other non-`VERTICAL` type.
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
      // Bug fix (docs/REFACTORING.md #32): this used to also
      // `emit(EGridLayoutEvent.DRAG_START, 1)` here — a second,
      // hardcoded-wrong-id DRAG_START emission for the exact same
      // dragstart, firing immediately before the correct one below (via
      // the switch statement, with the real `id`). Any consumer reading
      // the id from the *first* DRAG_START payload — or simply counting
      // emissions — would have seen `1` instead of the actual dragged
      // item's id whenever verticalCompact was false. Removed; the
      // switch statement's own DRAG_START emission already covers this
      // exact condition (`eventName === 'dragstart'`) correctly.
    }

    // By this point `id` is guaranteed to be a valid, non-nullish
    // string/number: the `id === undefined` guard above already
    // returned early for that case, and getLayoutItem() above throws
    // for null (or an empty/negative string) rather than returning
    // normally. A `?? 0` fallback used to sit on each emit below,
    // apparently guarding against exactly those already-excluded cases —
    // confirmed genuinely unreachable (not just unlikely) before
    // removing it, since testing dead code doesn't add real coverage.
    // See docs/REFACTORING.md #55.
    switch(eventName) {
      case EDragEvent.DRAG_END: {
        emit(EGridLayoutEvent.DRAG_END, id);
        break;
      }
      case EDragEvent.DRAG_MOVE: {
        emit(EGridLayoutEvent.DRAG_MOVE, id);
        break;
      }
      case EDragEvent.DRAG_START: {
        emit(EGridLayoutEvent.DRAG_START, id);
        break;
      }
    }

    updateDragPlaceholderAndState(eventName, id, l, snappedX, snappedY, w, h);

    // Move the element to the dragged location.
    const preMoveX = l.x;
    const preMoveY = l.y;
    const layout = moveElement(
      props.layout,
      l,
      snappedX as number,
      snappedY as number,
      true,
      props.horizontalShift as boolean,
      props.preventCollision,
    );
    // moveElement() resets l.x/l.y back to their pre-move values (and
    // l.moved to false) when preventCollision blocks the move — the only
    // signal that happened is comparing against what was captured just
    // above, since moveElement's own return value is the same layout
    // array reference either way, accepted or blocked. Only emitted when
    // a move was actually attempted (the drag target genuinely differs
    // from the pre-move position) — otherwise every drag tick where the
    // pointer briefly pauses over its own current cell would look like a
    // "blocked" move too.
    if((snappedX !== preMoveX || snappedY !== preMoveY) && l.x === preMoveX && l.y === preMoveY) {
      emit(EGridLayoutEvent.MOVE_BLOCKED_BY_COLLISION, id as string | number);
    }
    emit(EGridLayoutEvent.LAYOUT_UPDATE, layout);

    if(props.restoreOnDrag) {
      // Do not compact items more than in layout before drag
      // Set moved item as static to avoid to compact it
      l.isStatic = true;
      runCompaction(positionsBeforeDrag.value);
      l.isStatic = false;
    } else {
      runCompaction();
    }

    // needed because vue can't detect changes on array element properties
    eventBus.emit(`compact`);
    updateHeight();
    if(eventName !== undefined && eventName === EGridLayoutEvent.DRAG_END) {
      commitDragEnd();
      positionsBeforeDrag.value = undefined;
      originalLayout.value = layout;
      clearAlignmentGuides();
      // Bug fix (docs/REFACTORING.md #32, same class): this used to also
      // `emit(EGridLayoutEvent.DRAG_END, 1)` here — a second,
      // hardcoded-wrong-id emission for the same dragend, firing after
      // the correct one the switch statement above already sent with the
      // real `id`. Removed for the same reason as DRAG_START's duplicate.
      emit(EGridLayoutEvent.LAYOUT_UPDATED, layout);
    }
  };

  /**
   * Handles a resize-progress report from a `GridItem` (relayed via
   * `resizeEventHandler`/the eventBus). Applies the new size (respecting
   * `preventCollision` if enabled), updates the drag placeholder, and
   * triggers a re-compaction.
   *
   * @param eventName The resize phase (`'resizestart' | 'resizemove' | 'resizeend'`), or `undefined` for a bare "recompute" call.
   * @param id         The resized item's id. A no-op if `undefined` (see docs/REFACTORING.md #18 — this guard is why every window resize doesn't crash).
   * @param x          The resized item's horizontal position, in grid units (unchanged by a resize, just threaded through).
   * @param y          The resized item's vertical position, in grid units.
   * @param h          New height, in grid units.
   * @param w          New width, in grid units.
   */
  /**
   * Extracted from `resizeEvent()` (see `docs/REFACTORING.md`'s code
   * review finding on `dragEvent`/`resizeEvent`'s own size) — applies
   * the requested new width/height to `l` directly, clamped to
   * whatever space is actually free when `preventCollision` is on.
   * Unlike the drag side (where a blocked move means "stayed exactly
   * where it was"), a blocked resize can still partially grow — so
   * `MOVE_BLOCKED_BY_COLLISION` fires whenever `preventCollision`
   * constrained the requested size at all, not only when it was fully
   * rejected. Mutates `l.w`/`l.h` directly — has no return value,
   * since its whole effect is that mutation.
   */
  const applyResizeSizeAndCollisionClamp = (
    l: ILayoutItem,
    id: string | number,
    w: number | undefined,
    h: number | undefined,
  ): void => {
    const internalW = Number(w);
    const internalH = Number(h);
    let hasCollisions;
    if(props.preventCollision) {
      const collisions = getAllCollisions(props.layout, {
        ...l,
        h: internalH,
        w: internalW,
      }).filter(layoutItem => layoutItem.i !== l?.i);
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

        emit(EGridLayoutEvent.MOVE_BLOCKED_BY_COLLISION, id);
      }
    }

    if(!hasCollisions) {
      // Set new width and height.
      l.w = internalW;
      l.h = internalH;
    }
  };

  /**
   * Extracted from `resizeEvent()` (see `docs/REFACTORING.md`'s code
   * review finding on `dragEvent`/`resizeEvent`'s own size) —
   * `multiSelect`'s group resize: the same snapshot-and-apply-delta
   * approach as `applyGroupMove` above, applied to w/h instead of x/y.
   * Same deliberate scope limit: no per-passenger collision/bounds
   * checking against non-selected items. Mutates the passenger items
   * in `props.layout` directly (and `groupResizeStartSizes.value` on
   * resize start) — has no return value, since its whole effect is
   * that mutation.
   */
  const applyGroupResize = (
    eventName: EventType | undefined,
    id: string | number,
    l: ILayoutItem,
  ): void => {
    if(!(props.multiSelect && selectedItemIds.value.has(id) && selectedItemIds.value.size > 1)) {
      return;
    }
    if(eventName === `resizestart`) {
      groupResizeStartSizes.value = new Map(
        Array.from(selectedItemIds.value, selectedId => {
          const selectedItem = getLayoutItem(props.layout, selectedId);
          return [selectedId, { h: selectedItem?.h ?? 1, w: selectedItem?.w ?? 1 }];
        }),
      );
    } else if((eventName === `resizemove` || eventName === `resizeend`) && groupResizeStartSizes.value.has(id)) {
      const anchorStart = groupResizeStartSizes.value.get(id)!;
      const dw = (l.w as number) - anchorStart.w;
      const dh = (l.h as number) - anchorStart.h;
      groupResizeStartSizes.value.forEach((startSize, passengerId) => {
        if(passengerId === id) {
          return;
        }
        const passenger = getLayoutItem(props.layout, passengerId);
        // A passenger that's static, or explicitly not resizable, never
        // resizes (same rationale as group move's own guard above).
        // Also clamps to the passenger's *own* minW/maxW/minH/maxH, not
        // just a hard floor of 1 — bug found post-release: an earlier
        // version applied the delta unconditionally, letting a group
        // resize violate a passenger's own documented size constraints.
        if(passenger && !passenger.isStatic && passenger.isResizable !== false) {
          passenger.w = Math.min(Math.max(startSize.w + dw, passenger.minW ?? 1), passenger.maxW ?? Infinity);
          passenger.h = Math.min(Math.max(startSize.h + dh, passenger.minH ?? 1), passenger.maxH ?? Infinity);
        }
      });
    }
  };

  /**
   * Extracted from `resizeEvent()` (see `docs/REFACTORING.md`'s code
   * review finding on `dragEvent`/`resizeEvent`'s own size) — the
   * resize counterpart to `updateDragPlaceholderAndState` above:
   * updates the drag placeholder and alignment guides for the live
   * resize target, for `resizestart`/`resizemove` specifically. Any
   * other phase (`resizeend`, or the `eventName === undefined` "no-op
   * recompute" call) clears the alignment guides and settles
   * `isDragging` back to `false`.
   */
  const updateResizePlaceholderAndState = (
    eventName: EventType | undefined,
    id: string | number,
    l: ILayoutItem,
    x: number | undefined,
    y: number | undefined,
  ): void => {
    if(eventName !== `resizestart` && eventName !== `resizemove`) {
      clearAlignmentGuides();
      nextTick(() => {
        isDragging.value = false;
      });
      return;
    }

    placeholder.value.i = id;
    placeholder.value.x = x as number;
    placeholder.value.y = y as number;
    placeholder.value.w = l.w as number;
    placeholder.value.h = l.h as number;
    updateAlignmentGuides(placeholder.value.i, placeholder.value.x, placeholder.value.y, placeholder.value.w, placeholder.value.h);
    nextTick(() => {
      isDragging.value = true;
    });
    eventBus.emit(`updateWidth`, width.value);
  };

  const resizeEvent = (
    eventName?: EventType,
    id?: string | number,
    x?: number,
    y?: number,
    h?: number,
    w?: number,
  ): void => {
    // Called with no id from resizeEventHandler(undefined) whenever the
    // eventBus 'resizeEvent' is emitted without a payload (onWindowResize
    // does this on every window resize and on initial mount, purely to let
    // GridItems recompute their own size). getLayoutItem() throws rather
    // than returning undefined for a missing id, so without this guard
    // every resize threw an uncaught error instead of being the no-op it
    // was intended to be.
    if(id === undefined) {
      return;
    }

    if(eventName === `resizestart`) {
      captureResizeStart();
    }

    let l = getLayoutItem(props.layout, id);
    // getLayoutItem sometimes return null object
    if(l === undefined) {
      l = {
        h: 0,
        w: 0,
      } as ILayoutItem;
    }
    applyResizeSizeAndCollisionClamp(l, id, w, h);

    // Group resize (multiSelect) — see applyGroupResize's own doc
    // comment for the full design scope.
    applyGroupResize(eventName, id, l);

    // Left/top-edge resizes change the item's position, not just its
    // size — the resize composable (useGridItemResize.ts) computes the
    // new grid-unit x/y and passes them through here exactly like it
    // always did for w/h. Right/bottom-only resizes pass the item's
    // unchanged position, so this is a no-op divide for the common case.
    // Not currently collision-aware the way the w/h path above is for
    // preventCollision — a resize that would drag an item's left/top edge
    // into another item isn't blocked yet. Worth revisiting alongside a
    // deeper preventCollision pass, not blocking this fix on that.
    if(x !== undefined) {
      l.x = x;
    }
    if(y !== undefined) {
      l.y = y;
    }

    updateResizePlaceholderAndState(eventName, id, l, x, y);

    runCompaction();
    eventBus.emit(`compact`);
    updateHeight();

    if(eventName === `resizeend`) {
      commitResizeEnd();
      clearAlignmentGuides();
      originalLayout.value = props.layout;
      emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
    }
  };

  // Accessible references of functions for removing in beforeDestroy
  /** eventBus `resizeEvent` listener — unpacks the `IEventsData` payload (or calls `resizeEvent()` bare, a no-op per the guard inside it) into `resizeEvent`'s positional arguments. */
  const resizeEventHandler = (data?: IEventsData): void => {
    if(!data) {
      resizeEvent();
    } else {
      const { eventType, i, x, y, h, w } = data;
      resizeEvent(eventType, i, x, y, h, w);
    }
  };

  eventBus.on(`resizeEvent`, resizeEventHandler);
  eventBus.on(`itemClicked`, itemClickedHandler);

  /**
   * eventBus `dragEvent` listener — see `resizeEventHandler` above for
   * the drag equivalent's shape, but unlike that one, this doesn't need
   * a no-payload guard: `resizeEventHandler` gets called with `undefined`
   * from `onWindowResize`'s `eventBus.emit('resizeEvent')` (every window
   * resize needs items to recompute their own size, regardless of
   * whether a drag/resize is in progress), but nothing anywhere emits
   * `dragEvent` without a payload — confirmed by grep across every
   * emitter (`useGridItemDrag.ts`, `useGridItemKeyboard.ts`), not
   * assumed from the shape looking similar to resizeEventHandler's.
   * `dragEvent` itself is only ever invoked with a real payload.
   */
  const dragEventHandler = (data: IEventsData): void => {
    const { eventType, i, x, y, h, w, clientX, clientY } = data;
    dragEvent(eventType, i, x, y, h, w, clientX, clientY);
  };

  eventBus.on(`dragEvent`, dragEventHandler);

  /**
   * Symmetric difference between two layouts by item id — the items
   * present in one but not the other. Used by `layoutUpdate` to find
   * which items were added/removed when the `layout` prop's length
   * changes, so `originalLayout` (the internally-tracked copy) can be
   * patched rather than fully replaced.
   */
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

  /**
   * Reconciles `originalLayout` with the `layout` prop whenever the prop
   * changes — patching in added/removed items via `findDifference` if the
   * length changed, then re-compacting and re-measuring height either way.
   * Wired to `watch(() => props.layout, ...)` and
   * `watch(() => props.layout.length, ...)` below.
   */
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

      runCompaction();
      eventBus.emit(`updateWidth`, width.value);
      updateHeight();
      originalLayout.value = props.layout;
      // emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);
    }
  };

  /**
   * Re-measures the container width, re-resolves the responsive
   * breakpoint if enabled, and pings every `GridItem` to recompute its own
   * size (via the payload-less `resizeEvent` emit — see
   * docs/REFACTORING.md #18 for why `resizeEvent`/`dragEvent` both guard
   * against an undefined id rather than assuming this is never called
   * without one). Bound to the browser's own `resize` event and also
   * called directly once at mount, and again once the `ResizeObserver`
   * attaches.
   */
  const onWindowResize = (): void => {
    // width.value = refsLayout.value.offsetWidth;
    // fix: when item ref or his parent is hidden, offsetWidth = 0
    const widthT = refsLayout.value.offsetWidth;
    if(widthT > 0) {
      width.value = widthT;
    }

    if(props.responsive) {
      responsiveGridLayout();
    }
    eventBus.emit(`resizeEvent`);
  };

  // life cycles methods and watches
  onBeforeUnmount(() => {
    eventBus.off(`resizeEvent`, resizeEventHandler);
    eventBus.off(`dragEvent`, dragEventHandler);
    eventBus.off(`itemClicked`, itemClickedHandler);
    removeWindowEventListener(`resize`, onWindowResize);
    if(erd.value) {
      erd.value.disconnect();
    }
    teardownCrossGridDrag();
    setOutsideDropEnabled(false);
  });

  onBeforeMount(() => {
    emit(EGridLayoutEvent.LAYOUT_BEFORE_MOUNT, props.layout);
  });

  /**
   * Validates the layout, then — across a few chained `nextTick()`s, so
   * each step can rely on the DOM having settled from the previous one —
   * initializes responsive features, measures the container, compacts the
   * layout, and finally attaches the `ResizeObserver`. See
   * docs/REFACTORING.md #3 for why `ResizeObserver` instead of
   * `element-resize-detector`.
   */

  watch(
    () => props.allowOutsideDrop,
    enabled => {
      setOutsideDropEnabled(enabled as boolean);
    },
  );

  watch(
    () => props.allowCrossGridDrag,
    val => {
      setCrossGridDragEnabled(val as boolean);
    },
  );

  onMounted(() => {
    emit(EGridLayoutEvent.LAYOUT_MOUNTED, props.layout);

    initLastSnapshot();
    setCrossGridDragEnabled(props.allowCrossGridDrag as boolean);
    setOutsideDropEnabled(props.allowOutsideDrop as boolean);

    nextTick(() => {
      const valid = layoutValidator(props.layout);
      if(!valid) {
        throw new Error(EErrorMessage.INVALID_LAYOUT_VALIDATED);
      }
      originalLayout.value = props.layout;
      nextTick(() => {
        initResponsiveFeatures();

        addWindowEventListener(`resize`, onWindowResize);
        onWindowResize();

        runCompaction();

        emit(EGridLayoutEvent.LAYOUT_UPDATED, props.layout);

        updateHeight();
        nextTick(() => {
          // Native ResizeObserver replaces element-resize-detector here —
          // every browser this project's browserslist targets has
          // supported it natively for years, so the ~70 KB (rendered)
          // element-resize-detector previously contributed to the bundle
          // is no longer needed. See docs/BUNDLE_ANALYSIS.md #3.
          erd.value = new ResizeObserver(() => {
            onWindowResize();
          });
          erd.value.observe(refsLayout.value);
        });
      });
    });
  });

  /**
   * Reacts to the container's measured width changing — pushes it to every
   * `GridItem` (`updateWidth` eventBus message) and, the first time it
   * goes from `null` to a real value (i.e. mount has fully settled),
   * emits `LAYOUT_READY` once every item has had a chance to apply that
   * width and stabilize its own size.
   */
  watch(width, (newVal, oldVal) => {
    nextTick(() => {
      eventBus.emit(`updateWidth`, newVal);
      if(oldVal === null) {
        /*
        If old val == null is when the width has never been
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

  watch(
    () => props.layout,
    () => {
      layoutUpdate();
    },
  );

  watch(
    () => props.layout.length,
    () => {
      // Bug fix (now lives in useUndoRedo.ts's own commitFromLastSnapshot/
      // commitUndoPoint, extracted from directly inside this file): this
      // used to call commitUndoPoint() before layoutUpdate() (which is
      // what actually runs compaction) — meaning the snapshot
      // commitUndoPoint clones into lastSnapshot captured the layout's
      // *raw, pre-compaction* state. For a freshly-added item using the
      // common `y: Infinity` placement convention (see compactItem's own
      // fix in src/core/helpers/utils.ts for the full account of that
      // bug), that raw state still had `y: Infinity` on it — and
      // `cloneLayout`'s JSON round-trip silently turns `Infinity` into
      // `null` (JSON has no representation for it), corrupting that
      // item permanently in every future undo/redo snapshot that
      // referenced it. Confirmed directly: after two adds and two
      // undos, the corrupted item's own `y` never resolved back to a
      // real number, and a subsequent undo silently no-op'd instead of
      // reverting the layout. Compacting first means the snapshot
      // clone always sees real, finalized coordinates.
      layoutUpdate();
      commitFromLastSnapshot();
      pruneSelection();
    },
  );

  // The watchers below all follow the same "setXxx" cascade pattern
  // documented in docs/ARCHITECTURE.md: when a GridLayout prop that a
  // GridItem might need to react to changes, push it down via the
  // eventBus rather than relying on GridItem re-reading the prop itself
  // (GridItem only has access to it once, at mount, via `$parent`/
  // `thisLayout` — see ARCHITECTURE.md for why). Each `setXxx` has a
  // matching `eventBus.on('setXxx', ...)` handler in GridItem.vue.
  watch(
    () => props.colNum,
    val => {
      // No `eventBus.emit('setColNum', ...)` here, unlike the other
      // watchers around it — genuinely not needed, not an oversight.
      // `responsiveGridLayout()` (called unconditionally below,
      // regardless of `props.responsive`) always ends with its own
      // `eventBus.emit('setColNum', colsCompute)` in
      // useResponsiveLayout.ts, computed from the *same* updated
      // `props.colNum` this watcher just observed. A second, separate
      // emit of the same value here previously sat behind a
      // `// TODO remove eventBus` comment — confirmed redundant by
      // tracing the actual call graph (not by reasoning about it from
      // the comment alone) before removing it, the same standard
      // applied to confirming #50's naming sweep didn't miss a
      // reference: temporarily removed, ran the full test suite
      // including a new test written specifically to catch a regression
      // here, confirmed it still passed. See docs/REFACTORING.md #54.
      emit(EGridLayoutEvent.COLUMNS_CHANGED, val);
      responsiveGridLayout();
    },
  );

  watch(
    () => props.rowHeight,
    val => {
      eventBus.emit(`setRowHeight`, val);
    },
  );

  watch(
    () => props.margin,
    val => {
      // Bug fix (see docs/REFACTORING.md #26): GridItem.vue previously
      // tried to pick this up via a `watch(() => thisLayout?.margin, ...)`
      // watcher, but `thisLayout` comes from `defineExpose({ ...props })`
      // spreading GridLayout's props — a one-time snapshot at expose time,
      // not a live reactive reference — so that watcher could never fire.
      // Every other cascaded layout-level setting (rowHeight, colNum,
      // etc.) already uses this eventBus pattern instead of relying on
      // `thisLayout` reactivity for anything past the initial mount.
      eventBus.emit(`setMargin`, val);
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
    () => props.showCloseButton,
    val => {
      // Bug fix (see docs/REFACTORING.md #31): GridItem.vue's own
      // showCloseButton prop defaulted to `true` instead of `null`
      // despite being typed `boolean | null` — the same "inherit from
      // GridLayout" sentinel isDraggable/isResizable/isBounded use — so
      // every item showed a close button by default regardless of this
      // prop, unless a consumer explicitly overrode it per item. This
      // watcher (and the matching resolution in GridItem.vue) is what
      // isDraggable/isResizable/isBounded already had and this prop
      // never did.
      eventBus.emit(`setShowCloseButton`, val);
    },
  );

  watch(
    () => props.enableEditMode,
    val => {
      // Same inherit pattern as showCloseButton above — a layout-level
      // "view mode" toggle, without needing to bind enableEditMode on
      // every GridItem individually. See ROADMAP.md's "layout-level
      // read-only/edit-mode toggle" item this closes.
      eventBus.emit(`setEnableEditMode`, val);
    },
  );

  watch(
    () => props.useBorderRadius,
    val => {
      // Same bug, same fix, one prop later (see docs/REFACTORING.md
      // #47): GridItem.vue's useBorderRadius/borderRadiusPx defaulted to
      // concrete values instead of null, so a GridLayout-level default
      // never reached any item that didn't also set its own copy of
      // these two props directly — exactly the "borderRadiusPx doesn't
      // work" report that surfaced this.
      eventBus.emit(`setUseBorderRadius`, val);
    },
  );

  watch(
    () => props.borderRadiusPx,
    val => {
      eventBus.emit(`setBorderRadiusPx`, val);
    },
  );

  watch(
    () => props.isMirrored,
    val => {
      eventBus.emit(`changeDirection`, val);
    },
  );

  watch(
    () => props.transformScale,
    val => {
      eventBus.emit(`setTransformScale`, val);
    },
  );

  // Bug fix: every other similarly grid-wide-inherited prop
  // (isDraggable, isResizable, isBounded, showCloseButton,
  // enableEditMode, useBorderRadius, borderRadiusPx, colNum, maxRows,
  // rowHeight, margin, transformScale — even isMirrored/rtl above) has
  // a watcher pushing changes to already-mounted items via the
  // eventBus; `useCssTransforms` never did. Toggling it after mount had
  // no effect at all on existing items — they kept whatever value was
  // read once, at their own mount time, permanently. Confirmed
  // directly via a unit test setting the prop post-mount and checking
  // the item's own `.css-transforms` class never changed. Reported as
  // part of "Layout bounds & rendering — description clarity,
  // useCssTransforms."
  watch(
    () => props.useCssTransforms,
    val => {
      eventBus.emit(`setUseCssTransforms`, val);
    },
  );

  watch(
    () => props.responsive,
    val => {
      if(!val) {
        emit(EGridLayoutEvent.LAYOUT_UPDATE, originalLayout.value || []);
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

  /**
   * This is what a child `GridItem` actually sees through `proxy.$parent`
   * (see `thisLayout` in `GridItem.vue` and docs/ARCHITECTURE.md) —
   * anything a `GridItem` needs to read from its parent layout must be
   * listed here, or it's silently `undefined` on the child's side. Also
   * what an external `ref` to a `<GridLayout>` instance sees (e.g. for
   * manually calling `dragEvent`).
   */
  defineExpose({
    // toRefs(props), not {...props} — a plain spread reads each prop's
    // *current* value once, at the moment defineExpose runs, producing
    // a static snapshot for anything that isn't mutated in place
    // afterward. `layout` specifically is often *reassigned* wholesale
    // (v-model:layout = someNewArray, e.g. after useLayoutStorage's
    // load()) rather than mutated in place — a plain spread would leave
    // consumers reading `gridRef.value.layout` stuck on whatever array
    // was current at expose time forever after, correctly reflecting
    // further in-place mutations (like drag) but never a reassignment.
    // toRefs keeps each exposed prop backed by a live ref instead, which
    // Vue's template-ref access auto-unwraps transparently for
    // consumers — see docs/REFACTORING.md #65 for how this was found
    // and confirmed (a repro test showing the exposed value diverging
    // from the actual reactive state after exactly this sequence).
    ...toRefs(props),
    defaultGridItem,
    dragEvent,
    scrollToItem,
    focusItem,
    compactNow,
    rearrange,
    duplicateItem,
    undo,
    redo,
    canUndo,
    canRedo,
    selectedItemIds,
    selectedItems,
    selectItem,
    deselectItem,
    toggleItemSelection,
    clearSelection,
    erd,
    isDragging,
    lastBreakpoint,
    lastLayoutLength,
    layouts,
    mergeStyle,
    transitionStyle,
    gridLinesStyle,
    resizeHandleStyle,
    originalLayout,
    placeholder,
    alignmentGuides,
    alignmentGuideStyles,
    width,
  });
</script>

<style lang="scss" scoped>
  @use '../../styles/variables' as *;

  .vue-grid-layout {
    // Bug fix: `isStatic` items are deliberately given `z-index: -1` (see
    // this file's own comment on `.vue-static` for why — so a dragged
    // item passing over a static one stays visible above it). That only
    // works correctly if THIS element establishes its own stacking
    // context; `position: relative` alone, with no `z-index` set on this
    // element itself, does not — meaning a negative z-index child's paint
    // order gets compared against the *entire page's* stacking order
    // instead of just its siblings here. Confirmed directly: a consumer
    // giving this element its own background (a common, reasonable thing
    // to do — VitePress's own example docs do exactly this) sat in front
    // of every static item regardless, since the child's negative
    // z-index had already escaped this element's own subtree by the time
    // it competed with that background. `isolation: isolate` establishes
    // a stacking context without any of `z-index`'s own side effects
    // (no risk of this element itself being reordered relative to
    // outside siblings that happen to set a competing z-index).
    isolation: isolate;
    position: relative;
    transition: height var(--grid-transition-duration, 200ms) var(--grid-transition-timing, ease);
  }

  // Bug fix: a cross-grid drag (`allowCrossGridDrag`) keeps the dragged
  // item a DOM child of its own *source* grid the entire time it's
  // being dragged — including while the pointer is visually hovering
  // over a completely different, sibling grid. `isolation: isolate`
  // above (a real, separate fix — see its own comment) means every
  // `.vue-grid-layout` is its own stacking context now, so without
  // this, the dragged item could never actually paint above a sibling
  // grid it's currently being dragged over: two sibling stacking
  // contexts with no z-index of their own stack purely by DOM order,
  // and the source grid (rendered first, in the common two-grids-side-
  // by-side layout every cross-grid example uses) loses to a target
  // grid that comes later in the DOM — confirmed directly, not assumed:
  // the dragged item visually disappeared behind the target grid's own
  // background the moment it crossed into that grid's own bounds.
  // Bumping the *source* grid's own z-index only while it has an active
  // drag in progress (`isDragging`, already tracked for the placeholder)
  // is enough: raising this one stacking context above its siblings
  // carries the dragged item up with it, with no effect at all once the
  // drag ends and this class is removed again.
  .vue-grid-layout--active-drag {
    z-index: 1;
  }

  .vue-grid-alignment-guide {
    background: $grid-alignment-guide-color;
    pointer-events: none;
    position: absolute;

    // Above every GridItem interaction state (dragging: 15, the
    // close button/resize corner markup: 20 — checked directly rather
    // than guessed, see GridItem.vue's own z-index values) so a guide
    // line is never visually covered by the item it's guiding, but
    // still below the close button/resize handles specifically, since
    // those need to stay clickable/visible above a guide that happens
    // to cross through them.
    z-index: 16;
  }

  .grid::before {
    background-image: linear-gradient(to right, var(--grid-line-color, rgb(128 128 128 / 30%)) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-line-color, rgb(128 128 128 / 30%)) 1px, transparent 1px);
    background-repeat: repeat;
    background-size: var(--grid-line-column-size, 1px) var(--grid-line-row-size, 1px);
    content: '';
    height: calc(100% - 5px);
    margin: 5px;
    position: absolute;
    width: calc(100% - 5px);
  }
</style>
