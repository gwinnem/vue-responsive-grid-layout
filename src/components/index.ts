/**
 * Public entry point for `vue-ts-responsive-grid-layout`.
 *
 * Everything a consumer needs — components, prop types, layout types, and
 * the event-name enums — is re-exported from here so `import { ... } from
 * 'vue-ts-responsive-grid-layout'` (or `@/components` inside this repo)
 * covers the whole public API without reaching into internal paths like
 * `@/core/...`, which are not part of the supported surface and may change
 * without notice.
 *
 * See docs/ARCHITECTURE.md for how GridLayout and GridItem relate to each
 * other, and each type/enum below for what it's for.
 */
import GridItem from './Grid/GridItem.vue';
import GridLayout from './Grid/GridLayout.vue';
import { DEFAULT_ARIA_LABELS, IGridAriaLabels } from '@/core/common/interfaces/aria-labels.interface';
import CustomCloseButton from './common/CustomCloseButton.vue';
import CustomDragElement from './common/CustomDragElement.vue';

import {
  ILayoutItem,
  ILayoutItemRequired,
  TBreakpoint,
  TBreakpoints,
  TLayout,
  TLayoutItem,
  TResponsiveLayout,
} from './Grid/layout-definition';
import { IGridItemProps } from './Grid/grid-item-props.interface';
import { IBreakpoints, IColumns, IGridLayoutProps } from './Grid/grid-layout-props.interface';
import { ICustomCloseButtonProps } from './common/CustomCloseButton.vue';
import { ICustomDragElementProps } from './common/CustomDragElement.vue';
import { deserializeLayout, serializeLayout } from '@/core/helpers/layout-storage';
import { readOutsideDropPayload } from '@/core/gridlayout/helpers/outside-drop-payload';
import { exportLayoutAsSvg, IExportLayoutAsSvgOptions } from '@/core/gridlayout/helpers/export-svg';
import {
  ICompactor,
  ICompactorContext,
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  getCompactor,
} from '@/core/gridlayout/helpers/compactor';
import { IUseLayoutStorage, IUseLayoutStorageOptions, useLayoutStorage } from '@/composables/useLayoutStorage';
import { IUseLayoutPresets, IUseLayoutPresetsOptions, useLayoutPresets } from '@/composables/useLayoutPresets';
import { IOutsideItemDropped } from '@/core/gridlayout/interfaces/outside-drop.interfaces';
import { ICrossGridDropRejected, ICrossGridItemDropped } from '@/core/gridlayout/interfaces/cross-grid.interfaces';
import { IPlaceholder } from '@/core/gridlayout/interfaces/layout-data.interface';
import { IAlignmentGuide } from '@/core/gridlayout/helpers/alignment-helper';
import { IGridItemPosition } from '@/core/griditem/interfaces/grid-item.interfaces';

// Enums carry runtime values (e.g. `EGridItemEvent.RESIZE === 'resize'`),
// not just types — re-exporting them with `export type` (as this file used
// to) makes TypeScript reject any attempt to use them as a value through
// this barrel ("cannot be used as a value because it was exported using
// 'export type'"), which defeats the point of exposing them at all. They're
// imported and re-exported as plain values below for exactly that reason.
import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
import { EGridLayoutEvent } from '@/core/gridlayout/enums/EGridLayoutEvents';
import { ECompactType } from '@/core/gridlayout/enums/ECompactType';

export {
  // Components
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout,
  // Enums — real (value) exports; see the comment above.
  EGridItemEvent,
  EGridLayoutEvent,
  ECompactType,
  // Layout persistence — see docs/FEATURE_RECOMMENDATIONS.md #2 for the
  // design rationale. serializeLayout/deserializeLayout are the pure,
  // storage-agnostic building blocks; useLayoutStorage wraps them for
  // the common localStorage-backed case.
  serializeLayout,
  deserializeLayout,
  useLayoutStorage,
  useLayoutPresets,
  // Outside-drop payload helper — see docs/FEATURE_RECOMMENDATIONS.md #2
  // (the ROADMAP.md typed-payload-convention item) for the design
  // rationale.
  readOutsideDropPayload,
  // Grid-to-image export — see ROADMAP.md's item for the design
  // rationale (a dependency-free SVG generator, not a DOM-screenshot
  // wrapper).
  exportLayoutAsSvg,
  // The five built-in compaction strategies behind the `compactor`
  // prop's own default (`null`) fallback, matching `compactType`'s own
  // five `ECompactType` values — exported so a custom compactor can
  // delegate back to one of these for part of a layout, rather than
  // reimplementing standard compaction from scratch. `getCompactor`
  // looks one of these up by `ECompactType` directly, the same mapping
  // `GridLayout` itself uses internally.
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  getCompactor,
  // Localizable UI/ARIA strings — the current English text, exported so
  // a consumer overriding one key can spread the rest from this rather
  // than retyping every default.
  DEFAULT_ARIA_LABELS,
};

export type {
  // Component prop types — useful for typing a wrapper component's own
  // props, or a `ref<InstanceType<typeof GridItem>>()`.
  IGridItemProps,
  IGridLayoutProps,
  ICustomCloseButtonProps,
  ICustomDragElementProps,
  // Layout data shapes.
  ILayoutItem,
  ILayoutItemRequired,
  TLayout,
  TLayoutItem,
  TResponsiveLayout,
  // Breakpoint / column configuration.
  IBreakpoints,
  IColumns,
  TBreakpoint,
  TBreakpoints,
  // Layout persistence.
  IUseLayoutStorage,
  IUseLayoutStorageOptions,
  IUseLayoutPresets,
  IUseLayoutPresetsOptions,
  // Grid-to-image export.
  IExportLayoutAsSvgOptions,
  // Pluggable compaction — see the `compactor` prop on `IGridLayoutProps`.
  ICompactor,
  ICompactorContext,
  // Localizable UI/ARIA strings.
  IGridAriaLabels,
  // Event payload types — for typing a consumer's own event handlers
  // without re-declaring these shapes by hand.
  IOutsideItemDropped,
  ICrossGridItemDropped,
  ICrossGridDropRejected,
  // Types of values exposed via `defineExpose` on `GridLayout`/`GridItem`
  // (`placeholder`, `alignmentGuides`, `dragging`) — for typing a
  // `ref<InstanceType<typeof GridLayout>>()`'s own read access to them,
  // or the scoped props of the `#placeholder` slot.
  IPlaceholder,
  IAlignmentGuide,
  IGridItemPosition,
};
