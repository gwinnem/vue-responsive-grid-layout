---
aside: false
---

# API

Every type, interface, and enum documented here is exported from the
package's main entry point:

```ts
import {
  GridLayout, GridItem, CustomCloseButton, CustomDragElement,
  EGridLayoutEvent, EGridItemEvent,
  useLayoutStorage, serializeLayout, deserializeLayout, useLayoutPresets,
  readOutsideDropPayload, exportLayoutAsSvg, DEFAULT_ARIA_LABELS,
  type IGridLayoutProps, type IGridItemProps,
  type ILayoutItem, type TLayout, type TResponsiveLayout,
  type IBreakpoints, type IColumns, type TBreakpoint, type TBreakpoints,
  type IUseLayoutStorage, type IUseLayoutStorageOptions,
  type IUseLayoutPresets, type IUseLayoutPresetsOptions,
  type IExportLayoutAsSvgOptions, type IGridAriaLabels,
  type IOutsideItemDropped, type ICrossGridItemDropped, type ICrossGridDropRejected,
  type IPlaceholder, type IAlignmentGuide, type IGridItemPosition,
} from 'vue-ts-responsive-grid-layout';
```

There's no default export, and nothing on the main entry above requires
reaching into an internal `@/core/...` *source* path — if you find
yourself needing to import from somewhere other than the package root
or the `/core` subpath below, that's worth
[filing an issue](https://github.com/gwinnem/vue-responsive-grid-layout/issues)
about.

## Interfaces

- [Component props](/api/interfaces-props) — `IGridLayoutProps`, `IGridItemProps`, `IBreakpoints`, `IColumns`, `IGridAriaLabels`, and the two utility components' prop types.
- [Layout](/api/interfaces-layout) — `ILayoutItemRequired`, `ILayoutItem`.
- [Event payload & exposed-state](/api/interfaces-events-and-state) — `IOutsideItemDropped`, `ICrossGridItemDropped`, `ICrossGridDropRejected`, `IPlaceholder`, `IAlignmentGuide`, `IGridItemPosition`.
- [eventBus](/api/interfaces-eventBus) — `IEventsData` (internal plumbing).

## Types

- [Layout & breakpoint types](/api/types-layout) — `TLayout`, `TLayoutItem`, `TResponsiveLayout`, `TBreakpoint`, `TBreakpoints`.

## Persistence

- [`useLayoutStorage`, `serializeLayout`, `deserializeLayout`, `useLayoutPresets`](/api/persistence) — save/load a `v-model:layout` ref to `localStorage` or any `Storage`-compatible backend, plus named presets for switching between several saved arrangements.

## Utilities

- [`readOutsideDropPayload`, `exportLayoutAsSvg`](/api/utilities) — a typed-payload helper for `allowOutsideDrop`, and a dependency-free grid-to-SVG export.

## Framework-agnostic core

- [`vue-ts-responsive-grid-layout/core`](/api/core) — a **separate entry point**, not part of the main package import above: the same collision detection, compaction, movement, and alignment math the components are built on, with zero Vue dependency and no live DOM required.

## Enums

- [`EGridLayoutEvent`](/api/GridLayout-enums) — event names emitted by `GridLayout`.
- [`EGridItemEvent`](/api/GridItem-enums) — event names emitted by `GridItem`.

Both enums are real (value) exports — usable as a type *and* to compare
against at runtime (e.g. `if (name === EGridItemEvent.RESIZED)`).
