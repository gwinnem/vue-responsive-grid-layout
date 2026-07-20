import { Ref, ref } from 'vue';
import { TLayout } from '@/components';
import { cloneLayout } from '@/core/helpers/utils';
import { getBreakpointFromWidth, getColsFromBreakpoint } from '@/core/common/helpers/breakpoints-helper';
import { findOrGenerateResponsiveLayout } from '@/core/gridlayout/helpers/responsive-helper';
import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';
import { ECompactType } from '@/core/gridlayout/enums/ECompactType';
import { TGridLayoutEventBus } from '@/core/gridlayout/interfaces/layout-data.interface';
import { IGridLayoutProps } from '../grid-layout-props.interface';

/** Dependencies `useResponsiveLayout` needs from `GridLayout.vue`. */
export interface IUseResponsiveLayoutContext {
  /** `toRef(props, 'colNum')` — the user-configured column cap. */
  colNum: Ref<number>;
  /** Vue's own overloaded `defineEmits` type can't be narrowed past `any` here — see `useCrossGridDrag.ts`'s own `IUseCrossGridDragContext.emit` for the full rationale (tried and reverted two narrower alternatives, both broke real call-site assignment). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  emit: (...args: any[]) => void;
  eventBus: TGridLayoutEventBus;
  /** `GridLayout`'s own processed-layout ref, read and written by `responsiveGridLayout`. */
  originalLayout: Ref<TLayout | undefined>;
  props: IGridLayoutProps;
  /** The container's last measured pixel width. */
  width: Ref<number | null>;
}

/**
 * Encapsulates GridLayout's responsive-breakpoint behavior: tracking which
 * layout belongs to which breakpoint, finding-or-generating the layout for
 * a newly-entered breakpoint, and resetting that cache when
 * `responsiveLayouts` changes.
 *
 * Extracted from GridLayout.vue as part of the Phase 2 structural cleanup
 * — see docs/ARCHITECTURE.md and docs/REFACTORING.md.
 */
/** Return shape of {@link useResponsiveLayout}. */
export interface IUseResponsiveLayoutReturn {
  colNumResponsive: Ref<number | undefined>;
  initResponsiveFeatures: () => void;
  lastBreakpoint: Ref<string | null>;
  layouts: Ref<{ [key: string]: TLayout }>;
  responsiveGridLayout: () => void;
}

export function useResponsiveLayout(ctx: IUseResponsiveLayoutContext): IUseResponsiveLayoutReturn {
  const { colNum, emit, eventBus, originalLayout, props, width } = ctx;

  // Layout cache per breakpoint, and the currently active breakpoint.
  const layouts = ref<{ [key: string]: TLayout }>({});
  const lastBreakpoint = ref<string | null>(null);
  const colNumResponsive = ref(props.colNum);

  /**
   * Finds or generates the layout for the current container width's
   * breakpoint, and switches to it — emitting `breakpoint-changed` if the
   * breakpoint actually changed, and `update:layout` either way.
   */
  const responsiveGridLayout = (): void => {
    const newBreakpoint = getBreakpointFromWidth(props.breakpoints!, width.value as number);
    const newCols = getColsFromBreakpoint(newBreakpoint, props.cols!);
    // responsive cols
    colNumResponsive.value = newCols;

    let colsCompute = newCols;
    // max is colNum which is set by user
    if(colNum.value < colNumResponsive.value) {
      colsCompute = colNum.value;
    }

    if(lastBreakpoint.value != null && !layouts.value[lastBreakpoint.value]) {
      layouts.value[lastBreakpoint.value] = cloneLayout(props.layout);
    }

    // Find or generate a new layout.
    const layout = findOrGenerateResponsiveLayout(
      originalLayout.value as TLayout,
      layouts.value,
      props.breakpoints!,
      newBreakpoint,
      lastBreakpoint.value as string,
      colsCompute,
      props.compactType! as ECompactType,
      props.distributeEvenly!,
    );

    layouts.value[newBreakpoint] = cloneLayout(layout);

    if(lastBreakpoint.value !== newBreakpoint) {
      emit(EGridLayoutEvent.BREAKPOINT_CHANGED, newBreakpoint, layout);
    }

    // new prop sync
    originalLayout.value = layout;

    emit(EGridLayoutEvent.LAYOUT_UPDATE, layout);

    lastBreakpoint.value = newBreakpoint;
    eventBus.emit(`setColNum`, colsCompute);
  };

  /**
   * Reset the per-breakpoint layout cache to whatever the consumer passed
   * in via the `responsiveLayouts` prop. Called once at mount and whenever
   * responsive mode is (re-)entered.
   */
  const initResponsiveFeatures = (): void => {
    layouts.value = { ...props.responsiveLayouts };
  };

  /**
   * @returns
   * - `colNumResponsive` — not currently consumed by `GridLayout.vue` outside this composable; kept for potential external inspection/debugging.
   * - `initResponsiveFeatures` — called from `GridLayout.vue`'s `onMounted` and its `responsive` watcher.
   * - `lastBreakpoint` — re-exposed via `GridLayout`'s `defineExpose` for `GridItem`'s `$parent` access (see `docs/ARCHITECTURE.md`).
   * - `layouts` — re-exposed via `defineExpose`.
   * - `responsiveGridLayout` — called from `GridLayout.vue`'s `onWindowResize` and its `colNum`/`responsive` watchers.
   */
  return {
    colNumResponsive,
    initResponsiveFeatures,
    lastBreakpoint,
    layouts,
    responsiveGridLayout,
  };
}
