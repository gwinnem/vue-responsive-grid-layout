---
aside: false
footer: true
page: true
title: Roadmap
---

# Roadmap

## Recently completed

- ✅ **A first-party persistence helper** —
  [`useLayoutStorage`](/examples/19-example) saves/loads a
  `v-model:layout` ref against `localStorage` (or any
  `Storage`-compatible backend), stripping the internal `moved` field
  before saving and gracefully returning `false` — rather than
  throwing — when nothing valid is stored. `serializeLayout`/
  `deserializeLayout`, the plain functions it's built on, are exported
  separately for non-browser backends or use outside Vue's reactivity.
- ✅ **Cross-grid drag/drop** — `allowCrossGridDrag` lets a `GridLayout`'s
  items be dragged into any other `GridLayout` that also has it set;
  `disableExternalDrop` lets a grid opt out of *accepting* drops while
  still sending its own items out. A module-level registry lets
  independent `GridLayout` instances find each other without a shared
  Vue ancestor. See [Drag, drop from grid to grid](/examples/12-example),
  [Cross-grid drop restrictions](/examples/22-example), and
  [`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md)
  #34 for the full design.
- ✅ Full unit + component test suite (Vitest, **99%+ statement coverage** — see the
  [coverage report](/guide/coverage)) and a Playwright e2e suite.
- ✅ Examples for multiple grids, responsive predefined layouts, and
  drag/drop between grids — see [Examples](/examples/01-example).
- ✅ `element-resize-detector` replaced with native `ResizeObserver`
  (smaller bundle, no extra dependency).
- ✅ Full TypeScript type/enum/interface exposure from the package's main
  entry point (see [API](/api/)).
- ✅ Composable-based internals for drag, resize, and responsive-breakpoint
  logic — see the [source repo's architecture notes](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/ARCHITECTURE.md)
  if you're curious how the library itself is structured.
- ✅ Resize from **all four edges and their corners** — previously only
  bottom/right/bottom-right worked; top/left/top-left/bottom-left/top-right
  were enabled in the interact.js config but the position/size math behind
  them was never implemented (empty stub branches). See
  [`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md)
  for the full history.
- ✅ CI/CD: typecheck/lint/test/build gates on every PR, a bundle-size
  regression check, dependency audit, and automated releases via
  `semantic-release` — see [`docs/REFACTOR_STRATEGY.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTOR_STRATEGY.md).
- ✅ Changing `margin` on `GridLayout` after mount now actually reaches
  already-rendered items — it silently never did before, for reasons that
  turned out to apply to any `GridLayout` state read via `$parent`, not
  just `margin`. The same root cause also affected `showCloseButton`
  (never actually inheriting `GridLayout`'s default) and RTL mirroring
  (toggling `isMirrored` off could leave an item stuck rendering RTL).
  See [`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md)
  #26, #31, and #39.
- ✅ A drag ending quickly could commit a position short of where the
  pointer actually released — `dragend` was re-measuring from the DOM
  instead of the already-correct value `dragmove` had been accumulating,
  racing against Vue's asynchronous render. See
  [`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md) #41.
- ✅ Mutation testing (Stryker, weekly CI run) and a visual regression test
  suite covering all seven demo views — see the source repo's
  [`docs/STRYKER.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/STRYKER.md)
  and [`docs/VISUAL_REGRESSION.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/VISUAL_REGRESSION.md).
  The visual suite needs a one-time baseline-generation step before it's
  active in CI — tracked in that doc, not silently skipped.
- ✅ **Keyboard accessibility** — every non-static, editable `GridItem` is
  now keyboard-focusable; arrow keys move it, Shift+arrow keys resize it.
  Previously there was no way to move or resize an item other than a
  mouse/touch drag at all. See
  [`docs/ACCESSIBILITY.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/ACCESSIBILITY.md)
  for full scope, including what's deliberately not covered.
- ✅ Governance docs (`CONTRIBUTING.md`, `SECURITY.md`, `CODEOWNERS`) and a
  license-compliance CI check.
- ✅ An empty `layout` array (`[]`) is now a normal, supported starting
  state rather than throwing — useful for a grid that starts empty and
  fills in later, like a cross-grid drop target. It previously threw at
  several different points depending on which operation touched it first.
- ✅ Drag-and-drop from *outside* the grid system entirely
  (`allowOutsideDrop`) — accept a native HTML5 drag from a plain
  `draggable="true"` element that isn't a `GridItem` at all (e.g. a
  widget palette). A typed-payload helper (`readOutsideDropPayload<T>()`)
  and `outsideDropAccept` predicate reject incompatible drags before a
  placeholder even appears. See
  [Drag, drop from outside](/examples/11-example).
- ✅ **Multi-select + group move/resize** (`multiSelect`) — Shift/Ctrl/Cmd
  +click to build a selection; dragging or resizing any selected item
  moves/resizes every other selected item by the same delta, from mouse
  or keyboard alike. Deliberately scoped down from a fully
  collision-aware group transform — see `docs/REFACTORING.md` for the
  exact scope and why. See
  [Multi-select & group move/resize](/examples/37-example).
- ✅ **Magnetic snap-to-grid** (`snapToGrid`/`snapThreshold`) and
  **visual alignment guides** (`showAlignmentGuides`, Figma-style,
  non-committal) — two distinct mechanisms, not the same feature under
  two names. See [Snap to grid](/examples/32-example) and
  [Alignment guides while dragging](/examples/26-example).
- ✅ **Undo/redo** (`enableUndoRedo`/`undoHistoryLimit`,
  `undo()`/`redo()`/`canUndo`/`canRedo`) — opt-in history at
  committed-change granularity, not per intermediate drag-move frame.
  See [Undo/redo](/examples/43-example).
- ✅ A layout-level `enableEditMode` toggle, a public
  `rearrange()`/`compactNow()` method, per-item `autoHeight`, and a
  `duplicateItem(id)` method — see
  [Edit mode toggle](/examples/21-example) and
  [compactNow, rearrange & duplicateItem](/examples/29-example).
- ✅ **Named layout presets** (`useLayoutPresets`) and a
  **blocked-move feedback hook** (`MOVE_BLOCKED_BY_COLLISION`) — see
  [Named layout presets](/examples/35-example) and
  [Blocked-move feedback](/examples/30-example).
- ✅ **Localizable UI/ARIA strings** (`ariaLabels` on both `GridLayout`
  and `GridItem`) and `scrollToItem(id)`/`focusItem(id)` exposed
  methods — see [Localizable ARIA strings](/examples/36-example) and
  [scrollToItem & focusItem](/examples/27-example).
- ✅ A dependency-free **grid-to-SVG export utility**
  (`exportLayoutAsSvg`) and a fully custom **`#resize-handle` slot** —
  see [Export layout as SVG](/examples/28-example).
- ✅ A generic `ILayoutItem<TMeta>` for attaching typed, consumer-defined
  data to each layout item, without a parallel array keyed by `i`.

## Open / upcoming

- **A Nuxt module**, paired with an actual, systematic SSR audit — one
  concrete SSR-breaking spot has already been found and fixed, but that
  was one instance checked, not the exhaustive sweep a real audit needs.
- **Swap-on-drag collision mode** — dragging item A onto item B swaps
  their positions, as an alternative to the current push-aside
  compaction. Common in consumer tile-dashboard products.
- **Align/distribute commands on `multiSelect`'s selected items** —
  align every selected item's edge to one anchor, or evenly space the
  gaps between them, as an explicit on-demand command — distinct from
  the magnetic snap-to-grid and overflow-distribution features above.
- **Configurable resize-handle set** — choose which of the 8
  corner/edge handles actually render, instead of today's all-or-nothing
  toggle.
- **Spacing guides with distance labels** — a labeled distance
  indicator (e.g. "2 cols") alongside the existing alignment guides.
- **Per-input-type drag-activation thresholds** — distinct values for
  mouse/touch/pen, instead of one fixed threshold for all pointer types.
- **Configurable container height modes** (`auto`/`fixed`/`scroll`/`fit`),
  with the current `autoSize` becoming a non-breaking alias.
- **Async persistence backends** (IndexedDB, remote HTTP) alongside the
  existing synchronous `useLayoutStorage`.
- **An open, pluggable CSS positioning strategy**, replacing
  `useCssTransforms`'s current two-choice toggle with both current
  behaviors preserved as built-ins.
- **A fast/O(n log n) compaction algorithm** for very large layouts —
  needs a real perf benchmark before shipping, not an unverified swap.
- **A worker-based layout engine** for very large layouts — the
  largest lift of anything on this list, deliberately deferred until
  the item above is proven insufficient alone.
- **Maximize/restore an item** — temporarily expand a single item to
  fill the grid's entire visible area, then restore it back. Found
  while researching DevExtreme's Dashboard Designer, which has this
  (Kendo TileLayout, also checked, does not); needs its own design
  pass first, particularly around what happens to other items'
  compaction while one is maximized.
- Continued expansion of the automated test suite alongside new features.

For the full list with more detail, see
[`ROADMAP.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/ROADMAP.md)
in the repository.

## Known limitations (tracked, not silently ignored)

A few behaviors are currently limited or partially broken and documented
as such rather than hidden:

- `GridItem`'s `autoSize()` method (resize-to-fit-slot-content) doesn't
  reliably detect the rendered element in every case.
- A small number of declared events (`EGridItemEvent.DRAG`/`DRAGGED`,
  `EGridLayoutEvent.CHANGED_DIRECTION`/`CONTAINER_RESIZED`) exist on the
  enums for backwards compatibility but aren't currently emitted.

Full detail on all of these — including exactly where in the source each
one lives — is in the source repository's
[`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md).

## Ideas under consideration, not yet committed

A separate list of forward-looking feature ideas — things worth
considering, not things anyone's promised to build — lives in
[`docs/FEATURE_RECOMMENDATIONS.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/FEATURE_RECOMMENDATIONS.md)

## Have a request?

Open an issue on [GitHub](https://github.com/gwinnem/vue-responsive-grid-layout/issues) —
feature requests and bug reports both help shape this list.
