# Framework-agnostic core

`vue-ts-responsive-grid-layout/core` is a **separate entry point** —
not reachable from the package root import documented on the
[API overview](/api/) page. It exposes the same grid-layout math the
`GridLayout`/`GridItem` components are built on, with **zero Vue
dependency and no live DOM requirement**: every function here takes
plain data in and returns plain data out.

```ts
import {
  collides, getAllCollisions, getFirstCollision, findFirstFitSlot,
  moveElement, moveToCorrectPlace, moveElementAwayFromCollision,
  compactLayout, compactItem, compactLayoutHorizontal, compactItemHorizontal,
  compactLayoutOverlapVertical, compactLayoutOverlapHorizontal,
  cloneLayout, cloneLayoutItem, getLayoutItem,
  calcXY, calcGridItemWH, calcColWidth, clamp,
  sortLayoutItemsByRowCol, sortLayoutItemsByColRow, getAllStaticGridItems, getAllNonStaticGridItems, correctBounds,
  findAlignmentGuides, findSnapAdjustment,
  findOrGenerateResponsiveLayout, sortBreakpoints, getBreakpointFromWidth, getColsFromBreakpoint,
  serializeLayout, deserializeLayout,
  exportLayoutAsSvg, readOutsideDropPayload,
  breakpointsValidator, keysValidator, layoutValidator, marginValidator, validateLayoutItemRequiredKeys,
  setTransform, setTransformRtl, setTopLeft, setTopRight,
  verticalCompactor, horizontalCompactor, noCompactor, verticalOverlapCompactor, horizontalOverlapCompactor, getCompactor,
  EMovingDirections, ECompactType,
  type ILayoutItem, type TLayout, type TResponsiveLayout,
  type IBreakpoints, type IColumns, type TBreakpoint, type TBreakpoints,
  type IAlignmentGuide, type IExportLayoutAsSvgOptions,
  type ICompactor, type ICompactorContext,
} from 'vue-ts-responsive-grid-layout/core';
```

## Why this exists

Server-side layout validation, computing collisions for a batch job,
or building an entirely different UI layer on the same algorithms —
none of that needs Vue installed or a component mounted, but before
this entry point existed, the only way to reach this logic was
importing the whole package (Vue peer dependency and all) and never
actually rendering any of its components.

## What's deliberately excluded

Anything that needs a live browser: DOM measurement, the native
pointer-driven drag/resize engine, and the cross-grid registry (a
runtime coordination singleton tied to component mount/unmount, not a
pure calculation). Those stay reachable only through the main
component entry point, where they're actually usable.

## Overlap with the main entry

`serializeLayout`, `deserializeLayout`, `readOutsideDropPayload`, and
`exportLayoutAsSvg` are exported from **both** the main entry and
`/core` — they were already Vue-free before this entry point existed.
Importing them from either resolves to the same underlying function;
which one to use is just a question of whether the rest of your import
list is component-related or not.

## Build & verification

Built as its own ES+CJS bundle (`vite.core.config.js`) — kept as a
separate Vite config rather than a second entry in the main one,
since Vite doesn't support multiple entry points when any output
format includes `umd`, and the main library needs to keep shipping
that for script-tag/CDN consumers. Verified via the pack-install smoke
test (`scripts/check-package-install.js`), which resolves every
`exports` subpath and confirms this one's own named exports import
successfully after a real `npm install` — not just checked from
source. See `docs/REFACTORING.md` for the import-path audit this
entry point required first: several of these helpers imported their
shared types via the main component barrel rather than the type-only
file directly, which would have silently pulled the entire Vue
component tree into what's supposed to be a Vue-free bundle.
