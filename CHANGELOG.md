# Changelog

All notable changes to this project are documented in this file. Format is
loosely based on [Keep a Changelog](https://keepachangelog.com/); dates are
`YYYY-MM-DD`.

## v2.0.0 — 2026-07-20

### Added

- **A `compactType` toggle on the `Drag, drop from outside` example
  and its demo-app equivalent** — neither exposed any control for it at
  all, so the interaction between an outside-dropped item's position
  and compaction was never visible or testable there. Verified the
  underlying behavior was already correct first (a unit test dropping
  into a real gap, `VERTICAL` vs `NONE`) before adding the toggle.
  Reported as "drag/drop from outside — h/v compact toggle." See
  `docs/REFACTORING.md` #87.

- **`findFirstFitSlot(layout, colNum, w, h)` (`vue-ts-responsive-grid-layout/core`)**
  — a real first-fit bin-pack: returns the first `(x, y)` an item of
  the given size fits, scanning row by row from the top and column by
  column from the left within each row, without colliding with
  anything already in the layout. Added because neither the `Add or
  remove items` example nor its demo-app equivalent actually
  bin-packed — a new item never reused a gap left by a previously
  removed one, always landing in a fresh row at the bottom instead.
  Both now use this. See `docs/REFACTORING.md` #85.

- **`enableUndoRedo`/`undoHistoryLimit` props, `undo()`/`redo()`/
  `canUndo`/`canRedo` (`GridLayout`)** — opt-in (`false` by default)
  undo/redo history, at committed-change granularity: drag start→end,
  resize start→end, item add/remove (including `duplicateItem`), and
  `compactNow()`/`rearrange()` — not per intermediate drag-move frame,
  and skipped entirely for a gesture that doesn't actually change
  anything (e.g. a drag that snaps back to its own start position).
  Capped at `undoHistoryLimit` (default 50) snapshots, oldest dropped
  first. Closes the `@marsio/vue-grid-layout` parity gap noted in
  `COMPARISON_ALTERNATIVES.md`. See `docs/REFACTORING.md` #80 for a
  design bug found and fixed before this shipped — an earlier version
  checked for "has anything changed?" at `dragstart`, before the drag
  itself had changed anything yet, which would have silently made
  `undo()` a no-op after every drag.

- **`compactor` prop (`GridLayout`)** — replaces the built-in
  compaction algorithm entirely via a new `ICompactor` interface
  (`type`, `compact(layout, cols, context)`). `null` (the default)
  means "use whichever built-in strategy `compactType` selects" —
  purely additive, not a replacement for that prop, which keeps
  working unchanged either way. `verticalCompactor`/`horizontalCompactor`/
  `noCompactor`/`verticalOverlapCompactor`/`horizontalOverlapCompactor`
  ship as the five built-in strategies this default falls back to,
  exported from both the main entry and `/core`, alongside a
  `getCompactor()` factory. Closes the `react-grid-layout` v2 parity
  gap noted in `COMPARISON_ALTERNATIVES.md`.
  See `docs/REFACTORING.md` #79, and the new
  [Pluggable compaction](https://vue-ts-responsive-grid-layout.winnem.tech/examples/42-example)
  example.

- **`vue-ts-responsive-grid-layout/core`** — a new, separate entry
  point exposing this library's own grid-layout math
  (`collides`/`getAllCollisions`/`getFirstCollision`, `moveElement`/
  `moveToCorrectPlace`/`moveElementAwayFromCollision`, `compactLayout`/
  `compactItem`, `calcXY`/`calcGridItemWH`/`calcColWidth`/`clamp`,
  `findAlignmentGuides`/`findSnapAdjustment`, `serializeLayout`/
  `deserializeLayout`, `exportLayoutAsSvg`, every validator, and more —
  see `src/core/index.ts` for the complete list) with **zero Vue
  dependency and no live-DOM requirement**. Every function takes plain
  data in and returns plain data out, so it's usable standalone —
  validating a layout server-side, computing collisions for a batch
  job, or building a different UI layer on the same algorithms —
  without installing Vue or mounting a single component. Built as its
  own ES+CJS bundle (`vite.core.config.js`, since Vite doesn't support
  multiple entry points when any format includes `umd`, and the main
  library needs to keep shipping that for script-tag/CDN consumers).
  Verified via the pack-install smoke test (`scripts/check-package-install.js`),
  extended to check this subpath's own named exports resolve after a
  real `npm install`, not just from source. See
  `docs/REFACTORING.md` for the import-path audit this required first
  — several of these helpers imported their shared types via the main
  component barrel (`@/components`) rather than the type-only file
  directly, which would have silently pulled the entire Vue component
  tree into what's supposed to be a Vue-free bundle.

- e2e coverage for gaps identified in an audit of the `2.0.0` native
  drag/resize migration: a genuine corner (two-dimensional) resize
  gesture, `preserveAspectRatio`, `isResizable`/`isDraggable: false`
  blocking the native engine specifically, `dragIgnoreFrom`/
  `resizeIgnoreFrom`, group *resize* (multi-select) via mouse, real
  `autoScroll` scrolling behavior (previously only checked "doesn't
  throw"), and — the one path no test exercised at all — real touch
  input via CDP's `Input.dispatchTouchEvent`, confirming the Pointer
  Events-based engine genuinely works with touch, not only mouse.
  `e2e/item-overrides.spec.ts` and `e2e/touch-input.spec.ts` are new
  files; `demo/views/ItemOverridesView.vue` gained an `autoScroll`
  toggle and a scrollable wrapper to make that last one testable at
  all, and its inner button no longer hides itself based on
  `dragIgnoreFrom`, so both the ignored and non-ignored states are
  observable.

- **`multiSelect`** (`GridLayout`) — opt-in multi-select and group
  move/resize. Click to select, Shift/Ctrl/Cmd+click to add
  additively, click empty background to clear. Dragging/resizing a
  selected item while more than one is selected moves/resizes every
  other selected item by the same delta — deliberately not
  collision-aware for passenger items during the gesture (see
  `docs/REFACTORING.md` for the full scope rationale). Group move/
  resize also works from the keyboard (arrow keys/Shift+arrow on a
  selected item), not just mouse/touch drag — each keypress now emits
  a synthetic `dragstart`/`resizestart` immediately before its existing
  `dragend`/`resizeend`, so it engages the same mechanism a mouse drag
  already does. New
  `selectItem`/`deselectItem`/`toggleItemSelection`/`clearSelection`
  exposed methods, `selectedItems` exposed reactive state, a
  `selection-changed` event, and a `vue-grid-item-selected` CSS class.
- **`#resize-handle` slot** (`GridItem`) — custom content (an icon, not
  just a color) for each of the 8 resize handles, scoped with the edge
  being rendered. Closes the gap `react-grid-layout`'s own
  `resizeHandle` prop covers (see `COMPETITIVE_ROADMAP.md`).
- **`enableEditMode` now has a `GridLayout`-level default** (previously
  per-item only) — same `null`-means-inherit pattern as
  `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. A
  grid-wide "view mode" toggle no longer needs binding the prop on
  every item individually.
- **A systematic vitepress example-coverage audit**: checked every
  documented prop/event/exposed-method/slot against whether any of the
  37 (now 41) examples actually demonstrated it, not just whether a
  doc row happened to link to one. Found 22 genuine gaps — real props/
  events never bound in any example despite being documented, plus one
  pre-existing broken claim (`calcXY`'s doc link pointed to an example
  that never actually called it). Closed with 4 new examples:
  [Size constraints & aspect ratio](https://vue-ts-responsive-grid-layout.winnem.tech/examples/38-example)
  (`minW`/`maxW`/`minH`/`maxH`/`preserveAspectRatio`),
  [interact.js option overrides & autoScroll](https://vue-ts-responsive-grid-layout.winnem.tech/examples/39-example)
  (`dragOption`/`resizeOption`/`autoScroll`),
  [Layout lifecycle events](https://vue-ts-responsive-grid-layout.winnem.tech/examples/40-example)
  (all 5 lifecycle events, `columns-changed`, `dragstart`/`dragmove`/
  `dragend`, `container-resized`, `resize`, `item-clicked`,
  `lastBreakpoint`), and
  [Layout bounds & rendering options](https://vue-ts-responsive-grid-layout.winnem.tech/examples/41-example)
  (`distributeEvenly`/`maxRows`/`restoreOnDrag`/`transformScale`/
  `useCssTransforms`/`calcXY`). Every reference-doc row for these items
  now links to the example that actually demonstrates it.

- **`multiSelect`** (opt-in, off by default) — click to select an
  item, Shift/Ctrl/Cmd+click to add to the selection additively, click
  empty background to clear it. Dragging or resizing a selected item
  while more than one is selected moves/resizes every other selected
  item by the same delta — deliberately scoped down from a fully
  collision-aware group transform (no per-passenger collision
  detection during the gesture itself; only the anchor item gets the
  usual collision/bounds handling). New exposed API
  (`selectItem`/`deselectItem`/`toggleItemSelection`/`clearSelection`/
  `selectedItems`), a new `selection-changed` event, a new `GridItem`
  `item-clicked` event (the trailing click after a drag/resize gesture
  is suppressed), and a `vue-grid-item-selected` CSS class. See
  `docs/REFACTORING.md` for the full scope rationale.
- **`#resize-handle`** scoped slot on `GridItem` — a fully custom
  render (an icon, not just a color) for each of the 8 resize handles,
  receiving `{ edge }` as a scoped prop. Closes the
  `react-grid-layout` gap identified in `COMPARISON_ALTERNATIVES.md`.
  Coexists with the existing `showResizeHandles`/`resizeHandleColor`
  toggle.
- **A layout-level `enableEditMode`** on `GridLayout` — the same
  inherit pattern `isDraggable`/`isResizable`/`showCloseButton` already
  use. A grid-wide "view mode" toggle no longer needs binding
  `enableEditMode` on every `GridItem` individually.
- **`MANUAL_TEST_CHECKLIST.md`** — a step-by-step, prop-by-prop
  checklist (107 numbered items) covering every documented `GridLayout`
  prop (38), `GridItem` prop (27), event (14), and exposed method/value
  (14) with a concrete action and expected result, organized by demo
  view — not a one-line-per-feature summary. Plus cross-browser
  (Firefox/Safari have zero automated coverage today), touch/mobile,
  RTL, and screen-reader sections for scenarios a human needs to verify
  in a real browser. Directly targets the gaps
  `PRODUCTION_READINESS.md` already documents rather than duplicating
  what the automated suite covers well. Linked from `README.md` and
  `docs/TESTING.md`.
- **Documentation pass covering the 8 newly-exported types**:
  `GridLayout`'s exposed-values table was missing a `placeholder` row
  entirely (a real gap, not just a missing type reference); `dragging`,
  `alignmentGuides`, and the three cross-grid/outside-drop event payload
  descriptions now name their actual exported type
  (`IGridItemPosition`, `IAlignmentGuide`, `IOutsideItemDropped`,
  `ICrossGridItemDropped`, `ICrossGridDropRejected`) rather than only
  describing the shape inline. Also found and fixed a stale domain in
  `INSTALL.md`: six links (including the one pointing readers to "the
  complete list" of exports) used an old `gwinnem.github.io` URL instead
  of the actual current docs domain.
- **8 previously-unexported types now exported from the package's main
  entry point**: `DraggableOptions`/`ResizableOptions` (interact.js's
  own config types backing `dragOption`/`resizeOption` — re-exported
  directly since `@interactjs/*` is a transitive dependency, otherwise
  unreachable under strict dependency resolution like pnpm or Yarn PnP),
  `IOutsideItemDropped`/`ICrossGridItemDropped`/`ICrossGridDropRejected`
  (event payload types, for typing a consumer's own handlers without
  hand-rolling duplicate interfaces), and
  `IPlaceholder`/`IAlignmentGuide`/`IGridItemPosition` (types of values
  exposed via `defineExpose` on `GridLayout`/`GridItem`). Found via a
  systematic audit — every `export interface`/`export type`/`export enum`
  in `src/` checked against the main entry point's actual re-exports,
  then each gap verified against its real usage before being added, not
  just exported wholesale. See the new
  [Event payload & exposed-state](https://vue-ts-responsive-grid-layout.winnem.tech/api/interfaces-events-and-state)
  API reference page.
- **`MIGRATION.md`, `SUPPORT.md`, `NOTICE.md`** — an upgrade guide
  (stating plainly that `2.0.0` has no breaking changes, aside from one
  named bug-fix behavior change), a formal support policy (supported
  versions/environments, response expectations, the single-maintainer
  bus-factor stated plainly), and third-party license attributions for
  bundled runtime dependencies.

- **New e2e coverage**: `e2e/keyboard-accessibility.spec.ts` (arrow-key
  move, shift+arrow resize, boundary clamping at x:0, minW clamping, a
  non-interactive item ignoring keyboard input entirely) and
  `e2e/advanced-features.spec.ts` (the newer `AdvancedFeaturesView` —
  blocked-move feedback, `compactNow`, `duplicateItem`, `snapToGrid`,
  named presets), both previously with zero e2e coverage of any kind.
  Also extracted `e2e/helpers.ts`'s `stableBoundingBox()` after finding
  a genuine, project-wide (not new-test-specific) race: a
  `boundingBox()` read immediately after an item's `vue-draggable`
  class appears can still catch a container-width measurement mid-settle,
  producing an intermittently wrong baseline. Applied to
  `drag-and-resize.spec.ts`'s existing tests too, which had the same
  latent issue.
- **`ariaLabels`** (`GridLayout` grid-wide default, `GridItem` per-item
  override) — the close button's visually-hidden label, the item's
  `aria-roledescription`, and the keyboard move/resize instructions
  were previously hardcoded English literals; now overridable, with
  the current English text as the default for any key not overridden.
  Merges three layers (built-in defaults <- grid-wide <- per-item), so
  a consumer only needs to supply the specific keys they want to
  change. See `IGridAriaLabels`.
- **`npm run package`** (`scripts/generate-package.js`) — runs every
  quality gate (typecheck, `lint:style`, license allowlist, tests,
  build, bundle-size budget, pack-and-install smoke test) and produces
  the exact tarball `npm publish` would push, in one command. Stops
  short of actually publishing by default (needs an authenticated npm
  session); an opt-in `--publish` flag will run `npm publish` itself
  once everything passes, but only after confirming `npm whoami`
  succeeds and getting one further explicit confirmation first. See
  `CONTRIBUTING.md`'s "Generating (and, manually, publishing) the
  package locally".
- **A large feature batch**: `GridLayout.compactNow()`/`rearrange()`
  (public methods re-running compaction on demand), `duplicateItem(id)`
  (collision-safe cloning, placed below the source), a
  `MOVE_BLOCKED_BY_COLLISION` event (fires when `preventCollision`
  blocks a drag or resize), per-item `autoHeight` (a real
  `ResizeObserver` on a dedicated template-ref wrapper — see
  `docs/REFACTORING.md` for why this needed a wrapper element rather
  than reusing the existing `slots.default()` lookup), `snapToGrid`/
  `snapThreshold` (magnetic snapping, distinct from the visual-only
  `showAlignmentGuides`, with a new `findSnapAdjustment` helper),
  `showResizeHandles`/`resizeHandleColor` (configurable resize-hint
  appearance, grid-level default with per-item override),
  `outsideDropAccept` (a predicate rejecting incompatible native drags
  before the placeholder appears), `readOutsideDropPayload<T>()` (a
  typed-payload helper for `item-dropped-from-outside`),
  `useLayoutPresets` (named layout presets, layered on
  `serializeLayout`/`deserializeLayout`), `exportLayoutAsSvg()` (a
  dependency-free grid-to-SVG export), and shared design tokens between
  `demo/`/`sandbox/` (`dev-shared/tokens.css` — this also fixed a real
  gap, not just deduplicated: `sandbox/` referenced CSS variables that
  were never actually defined anywhere). See `ROADMAP.md`'s "Recently
  completed" section and `docs/REFACTORING.md` for the full account.
- **`sandbox/App.vue`** (the all-props-in-one contributor test bench)
  and **`demo/views/DynamicItemsView.vue`** now exercise `autoScroll`,
  `scrollToItem`, and `focusItem` — previously untouched by either.
  The demo view calls `scrollToItem`/`focusItem` after adding a new
  item, the exact "jump to the widget you just added" use case these
  methods were built for. See `docs/REFACTORING.md` #69.
- **`GridLayout.scrollToItem(id)`/`focusItem(id)`** exposed methods —
  scroll to and/or focus a specific item by id, useful after a
  programmatic add/remove or a keyboard-driven action that relocates
  the currently-focused item. Both no-ops (not throws) when the id
  isn't currently rendered. Scoped to the calling grid's own container,
  not `document`-wide, so two grids sharing an id (a plausible
  `allowCrossGridDrag` scenario) don't cross-match. See
  [scrollToItem & focusItem](vitepress-docs/examples/27-example.md) and
  `docs/FEATURE_RECOMMENDATIONS.md` #9.
- **`autoScroll` prop on `GridItem`** — finishes the previously
  imported-but-unconfigured `@interactjs/auto-scroll` plugin. A
  convenience default (`{ enabled: true }`) for the common case;
  `dragOption`/`resizeOption`'s own `autoScroll` key (already reachable,
  just previously undocumented as covering this) wins if both are set.

- **`src/composables/*.ts` added to the mutation testing scope** — the
  persistence helper's public composable (`useLayoutStorage.ts`) had
  been sitting outside every pattern in `stryker.conf.json`'s `mutate`
  array, unlike the pure functions it wraps. Found while auditing
  `docs/STRYKER.md` for stale numbers. See `docs/REFACTORING.md` #62.

- **Visual regression coverage for the 3 newer demo views** (cross-grid
  drag/drop, per-item overrides, drag from outside/multi-grid) —
  `e2e/visual-regression.spec.ts` now covers all 7 `demo/` views instead
  of the original 4. The two multi-grid views needed a small
  `data-testid` added to their existing shared grid wrapper
  (`CrossGridView.vue`/`ExternalDropView.vue`), since neither renders a
  single element representing "the whole view" the way the other five
  do. Still not run against a real baseline or wired into CI — no
  real Playwright browser has been available in any environment this
  project has been worked in yet; this closes the coverage gap, not the
  baseline-generation one. See `docs/REFACTORING.md` #61.

- **Grid-unit-based alignment guides** (`showAlignmentGuides` on
  `GridLayout`, default `false`) — Figma-style guide lines while
  dragging or resizing, wherever an item's edges land on the same grid
  coordinate as another item's edges (not restricted to same-side
  matches). Purely visual, no snapping or movement constraint; no cost
  when the prop is off. Two real bugs caught by tests before shipping:
  the drag call site initially computed alignment against the item's
  stale pre-drag position rather than its live drag target (a naive
  assumption about which values were already updated at that point in
  the function), and the pixel-conversion logic initially called a
  validating helper unconditionally on every render, throwing on an
  unmeasured container width and breaking most of this file's other
  tests as a side effect. See
  [Alignment guides while dragging](vitepress-docs/examples/26-example.md),
  `docs/FEATURE_RECOMMENDATIONS.md` #6, and `docs/REFACTORING.md` #60.

- **A `#placeholder` slot** on `GridLayout` — customize the drag
  placeholder's content (previously always a plain colored box), with
  `placeholder` (`{ x, y, w, h }`, live during a drag) and `isDragging`
  exposed as scoped slot props. Renders inside the same internal
  `GridItem` the library already uses for the placeholder — your
  content layers on top of its existing background/sizing rather than
  replacing it. See
  [Custom drag-placeholder content](vitepress-docs/examples/25-example.md)
  and `docs/FEATURE_RECOMMENDATIONS.md` #8.

- **Configurable `transitionDurationMs`/`transitionTimingFunction`** on
  `GridLayout` — previously three separate hardcoded values across
  `GridItem.vue`'s scoped styles (`200ms`/`400ms`/`100ms` for the base
  item transition, the CSS-transform positioning variant, and the drag
  placeholder respectively), none overridable. Applied via CSS custom
  properties (`--grid-transition-duration`/`--grid-transition-timing`)
  inherited naturally by every `GridItem` — no eventBus cascade needed,
  since CSS custom properties already inherit through the DOM. All
  three previously-independent values now share the same pair of
  variables. **Behavior note**: the CSS-transform-positioned item and
  the drag placeholder previously animated at 400ms/100ms respectively,
  distinct from the base 200ms; all three are 200ms by default now,
  unifying what was an unintentional-looking three-way split rather
  than a deliberate ratio. See
  [Configurable transition duration & easing](vitepress-docs/examples/24-example.md),
  `docs/FEATURE_RECOMMENDATIONS.md` #7, and `docs/REFACTORING.md` #58.

- **Generic `ILayoutItem<TMeta>`** (and `TLayout<TMeta>`/`TLayoutItem<TMeta>`) —
  attach a typed, consumer-defined `data` payload to each layout item
  (a widget's config, a chart's dataset reference, anything
  JSON-serializable) instead of maintaining a parallel array keyed by
  `i`. `TMeta` defaults to `unknown`, so every existing usage without a
  type argument keeps working unchanged — confirmed with a full
  typecheck across the codebase, not just reasoned about. `data` is
  never read or written by the library itself, and round-trips through
  `serializeLayout`/`deserializeLayout` like any other field. See
  `docs/FEATURE_RECOMMENDATIONS.md` #1 and `docs/REFACTORING.md` #57.

- **A first-party persistence helper** — `useLayoutStorage(key, layout, options?)`,
  a composable saving/loading a `v-model:layout` ref against `localStorage`
  (or any `Storage`-compatible backend), plus the plain
  `serializeLayout(layout)`/`deserializeLayout(json)` functions it's built
  on. Removes the boilerplate every consumer previously had to
  reimplement by hand: stripping the internal `moved` field before
  saving, and gracefully handling a missing/malformed stored value on
  load (reusing the same `layoutValidator` `GridLayout` itself uses at
  mount, rather than a separately-maintained shape check). Defaults to
  auto-loading on creation; auto-save is opt-in and debounced, to avoid
  write-amplification while an item is actively being dragged. SSR-safe
  — every storage access is guarded, matching the pattern already
  established after finding #51. [v-model & save/load layout](vitepress-docs/examples/19-example.md)
  now uses this instead of the manual `localStorage` pattern. See
  `docs/FEATURE_RECOMMENDATIONS.md` #2 and `docs/REFACTORING.md` #56.

- **`INSTALL.md`** — a consumer-facing installation guide (package
  install, style import, Composition/Options API usage, TypeScript,
  a fuller drag/resize/remove example, and a verification step for
  checking `exports` resolves correctly). The same content was added to
  `vitepress-docs/guide/installation.md`. In the process, found and
  removed `docs/setup.md`: stale contributor-setup instructions (wrong
  script name, `npm run typeCheck` vs the actual `typecheck`) that
  `README.md` linked to under a "Setting up in your project" heading —
  misleadingly, since its content was about developing *this* repository,
  not consuming the package, and fully superseded by `CONTRIBUTING.md`
  besides. README now links to `INSTALL.md` for consumers and
  `CONTRIBUTING.md` for contributors instead.

- **A pack-and-install smoke test** (`npm run check:package-install`,
  wired into CI right after the bundle-size check) — the one check in
  this project that verifies the *published* package resolves and
  imports correctly, not just `src/`. Closes the verification gap
  finding #46 found but left open: every other test here goes through
  source aliases, never `package.json`'s `exports` field the way a real
  `npm install`'d consumer does. Verified it actually catches a
  regression by reintroducing #46's exact bug and confirming the script
  fails with the precise error a real consumer would hit. See
  `docs/REFACTORING.md` #52.

- **Live layout viewer under every example** on the documentation site —
  all 23 examples now show their current `layout` array (or one labeled
  block per grid, for the multi-grid examples) below the demo itself,
  updating in real time as you drag/resize/add/remove items, via a
  shared `LayoutJsonViewer` component. Paired with a new
  [Understanding Layouts](vitepress-docs/guide/understanding-layouts.md)
  guide page explaining the `TLayout`/`ILayoutItem` shape once, with a
  table pointing at which examples demonstrate which layout patterns
  (multi-grid, static items, cross-grid movement, outside-drop, custom
  fields) — rather than re-explaining the shape on every example page.

- **`FEATURES.md`** and **`ROADMAP.md`** at the project root — a
  comprehensive, categorized reference of every currently-implemented
  feature, and a shorter, more discoverable summary of suggested next
  features (the fuller version of the latter remains
  `docs/FEATURE_RECOMMENDATIONS.md`).

- **`allowOutsideDrop`**: native HTML5 drag-and-drop from a source that
  isn't a `GridItem` or another `GridLayout` at all — promoted from the
  hand-rolled technique [Drag, drop from outside](vitepress-docs/examples/11-example.md)
  always used into a real prop, the same way `allowCrossGridDrag`
  (finding #34) did for grid-to-grid dragging. New props
  `outsideDropWidth`/`outsideDropHeight` (default `2`/`2`) size the live
  placeholder (reusing `GridLayout`'s own existing drag-placeholder
  state, so it looks identical to a normal in-grid drag); new event
  `EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE` fires on drop with the
  resolved position and the native `DataTransfer` object — deliberately
  does **not** touch `layout` on its own, since the library has no way
  to know what a plain draggable element represents. New example
  [Drag, drop from outside into multiple grids](vitepress-docs/examples/23-example.md);
  example 11 and the demo app's new `ExternalDropView` (built the
  hand-rolled way first, then rewritten once the prop existed) both use
  it now, and the sandbox gained a matching checkbox + draggable widget.
  See `docs/REFACTORING.md` #43.

- **Demo app expanded with two new views for internal/manual testing**:
  [`CrossGridView`](demo/views/CrossGridView.vue) (the `allowCrossGridDrag`/
  `disableExternalDrop`/`layoutId` feature had zero demo coverage before
  this) and [`ItemOverridesView`](demo/views/ItemOverridesView.vue)
  (every remaining `GridItem`-level prop — `isStatic`, `enableEditMode`,
  `preserveAspectRatio`, per-item border radius/close button, min/max
  dimensions, `dragIgnoreFrom`/`resizeIgnoreFrom`, and a three-way
  inherit/true/false selector for `isDraggable`/`isResizable`/
  `isBounded`). The existing `DragResizeView` gained the `GridLayout`
  props it was still missing (`useBorderRadius`/`borderRadiusPx`,
  `transformScale`, `maxRows`); `ResponsiveView` gained custom `cols`
  overrides and a simulated-container-width slider for testing
  breakpoints without resizing the real browser window. See
  `docs/REFACTORING.md` #36.

- **Cross-grid drag/drop is now a real `GridLayout` feature**, not
  example-level code. New props: `allowCrossGridDrag` (opts a grid into
  sending its own items to, and receiving items from, any other grid
  that also has it set) and `disableExternalDrop` (opts out of
  *receiving* only — a grid can still send its own items elsewhere with
  this set). New events, both fired on the target grid:
  `cross-grid-item-dropped` on success, `cross-grid-drop-rejected` when
  the target has `disableExternalDrop`. New optional `layoutId` prop
  (auto-generated if omitted) identifies a grid in these events' payloads.
  New example: [Cross-grid drop restrictions](vitepress-docs/examples/22-example.md)
  (three grids, one refusing incoming drops, with live per-grid toggles
  for both new props). [Drag, drop from grid to grid](vitepress-docs/examples/12-example.md)
  rewritten to use this real prop instead of its original hand-rolled
  `dragstart`/`dragend` + manual pointer-tracking approach, with the
  same kind of live toggles and an intentionally-empty starting target
  grid. `allowCrossGridDrag` can be toggled at runtime, not just set
  once — registration/deregistration reacts to the prop changing after
  mount, not only its initial value. See `docs/REFACTORING.md`
  #34 and `docs/ARCHITECTURE.md`'s new cross-grid section for the full
  design, including a module-level registry
  (`cross-grid-registry.ts`) that lets independent `GridLayout` instances
  find each other without a shared Vue ancestor.
- **Empty layouts (`layout: []`) are now valid everywhere**, not just
  where finding #9 already covered. Building the cross-grid feature's
  most natural use case — an empty target grid — surfaced three more
  spots (`layoutValidator`, `getBottomYCoordinate`, `getAllCollisions`)
  that threw on an empty array, all now fixed consistently: a grid with
  no items yet is a normal state, not an error. See `docs/REFACTORING.md`
  #33.
- **Close button position now accounts for `borderRadiusPx`** — it used
  to sit at a fixed 4px inset from the item's corner regardless of the
  radius, ending up half over the curve at larger radii. See
  `docs/REFACTORING.md` #33.
- **"Drag, drop from grid to grid" example rewritten to avoid native
  HTML5 drag-and-drop**, using `GridLayout`'s own `dragstart`/`dragend`
  events (which already carry the dragged item's id) plus a plain
  `getBoundingClientRect()` check against the target grid at drop time.
  Dragged items now keep the library's own smooth drag feedback the
  entire time — no more `:is-draggable="false"` needed on source items
  to avoid fighting a second drag system, since there isn't one. An
  initial attempt using interact.js's own `dropzone()` action didn't
  actually work and was replaced — see `docs/REFACTORING.md` #30 for
  what happened and why the final approach is built entirely on
  primitives already proven to work elsewhere in this codebase. Also
  added a static "locked" item to the example and a regression test
  confirming `isStatic` disables an item's draggability at the interact.js
  level regardless of `isDraggable`, so it never fires a `dragstart` for
  this (or anything else) to react to in the first place.
- **`enableEditMode` usage added to the demo app and VitePress**, where
  it previously had zero usage anywhere despite being a genuinely useful
  master edit/view-mode switch. Demo app's options playground gained an
  "Edit mode" toggle; VitePress example 21 was rewritten from a
  permanently-static demo into an interactive
  [Edit mode toggle](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/21-example.md)
  that actually demonstrates the runtime-toggle pattern its own "tip"
  callout already described. Also documented, for the first time, that
  `enableEditMode` has no `GridLayout`-level cascade the way
  `isDraggable`/`isResizable`/etc. do — it's set per-`GridItem` only.
- **Demo app's Drag & resize view expanded into a full options
  playground** — was 3 toggles (draggable/resizable/bounded), now covers
  every meaningful `GridLayout` prop (collision/compaction modes, RTL,
  grid lines, CSS transforms vs. top/left positioning, close button, row
  height, column count, margin) as live controls.
- **New example**: [Read-only dashboard (all items static)](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/21-example.md)
  — distinct from the existing [Static items](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/17-example.md)
  example (which mixes static "anchor" items with movable ones): every
  item static, demonstrating the "fixed overview/kiosk view" use case.
- **Keyboard accessibility**: every non-static, editable `GridItem` is now
  keyboard-focusable and operable — arrow keys move it, Shift+arrow keys
  resize it (`useGridItemKeyboard.ts`), reusing the same events/eventBus
  messages the mouse-driven path already uses. Previously there was no
  way to move or resize an item other than a mouse/touch drag at all. See
  `docs/ACCESSIBILITY.md` for full scope and what's still not covered.
- **Governance docs**: `CONTRIBUTING.md`, `SECURITY.md`,
  `.github/CODEOWNERS`.
- **License compliance**: `npm run check:licenses` (`license-checker`,
  production dependencies, permissive-license allowlist), wired into
  `ci.yml` as a blocking check.
- **Mutation testing** (Stryker), scoped to `.ts` logic (`core/**`,
  composables, `hooks/`) and run weekly via
  `.github/workflows/mutation-testing.yml` rather than per-PR (too slow —
  ~1,365 mutants). Verified by actually running it, not just configuring
  it: found real survived mutants in a file already at 100%
  line/branch coverage. See `docs/STRYKER.md` for how to run and interpret
  it, including a real configuration pitfall hit and fixed along the way.
- **Visual regression test suite** (`e2e/visual-regression.spec.ts`)
  covering all four `demo/` views. Not yet wired into CI or the default
  `npm run test:e2e` run — needs a one-time baseline-screenshot generation
  step in a real browser environment; see `docs/VISUAL_REGRESSION.md`.
- **Test coverage expanded from 93.95%/92.21% to 98.44%/95.85%**
  (lines/branches, 100% functions) — see the new
  [Test Coverage](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/guide/coverage.md)
  docs page for the full per-file breakdown.
- **Resize from all four edges and their corners.** Previously only
  bottom/right/bottom-right worked — the other five directions were
  enabled in the interact.js config with empty implementation stubs
  behind them (confirmed via the project's own 2023 changelog: never
  finished, not a regression). Left/top-edge resizes now correctly move
  the item's position as well as its size. RTL-mode resize direction
  handling remains best-effort — see `docs/REFACTORING.md` #25.
- **CI/CD**: `.github/workflows/ci.yml` (typecheck, lint, tests with
  coverage gate, library/demo/docs builds, bundle-size regression check,
  and dependency audit, matrixed across Node 18/20/22), `.github/workflows/release.yml`
  + `.releaserc.json` (`semantic-release`, wired to the project's existing
  conventional-commit convention — publishes to npm and creates GitHub
  releases automatically once an `NPM_TOKEN` secret is added), and
  `.github/dependabot.yml` (weekly dependency update PRs). Before this,
  there was no automated verification of anything.
- **VitePress documentation site rebuilt**: 20 interactive examples (up
  from 16 — added multiple grids, responsive predefined layouts, and
  drag/drop between grids), a shared styled example-demo component
  system, a rewritten guide (introduction/installation/roadmap/changelog),
  a comprehensive features page, corrected component prop/event
  references, and a corrected/expanded API reference (all current
  exported types/interfaces/enums, including the ones added below). Also
  fixed the docs site's build being completely broken (it depended on a
  built package copy in `node_modules` that never existed in a fresh
  clone) via a Vite alias to source.
- **Component test suite**: `@vue/test-utils`-based tests for `GridLayout`,
  `GridItem`, `CustomCloseButton`, and `CustomDragElement`, mounted together
  the way real usage does (`tests/helpers/mountGrid.ts`). Coverage on `src/`
  went from ~0% on components to 93.7% lines / 90.3% branches / 100%
  functions, enforced as a CI-ready gate (`vitest.config.js`
  `coverage.thresholds`, 90% minimum).
- **Playwright e2e suite** (`e2e/`) driving real drag/resize/responsive
  interactions against a new demo app.
- **Demo app** (`demo/`): four focused, minimal usage examples (basic grid,
  drag & resize, dynamic add/remove, responsive breakpoints), separate from
  `sandbox/`'s kitchen-sink manual test bench. Imports the library straight
  from `src/`.
- **`docs/BUNDLE_ANALYSIS.md`**: measured bundle composition and
  size-reduction findings.
- **`docs/REFACTORING.md`**: 16 concrete, source-level findings (several
  crash-level bugs) found while writing tests and doing the structural
  cleanup below.
- **`docs/REFACTOR_STRATEGY.md`**: phased roadmap (tooling → CI/CD →
  structural standardization → deeper testability → governance).
- **`docs/ARCHITECTURE.md`**: the `GridLayout`↔`GridItem` `$parent`/eventBus
  contract, and the new composable split.
- **`docs/TESTING.md`**: unit, component, and e2e testing guide.
- `useGridItemDrag`, `useGridItemResize`, and `useResponsiveLayout`
  composables (`src/components/Grid/composables/`), extracted from
  `GridItem.vue`/`GridLayout.vue`.
- `eslint.config.js` (ESLint 9 flat config) and a real `.husky/pre-commit`
  hook running `lint-staged`.
- `npm run analyze` — a permanent bundle-treemap script
  (`vite.analyze.config.js`, `rollup-plugin-visualizer`).

### Changed

- **BREAKING: `verticalCompact: boolean` (`GridLayout`) replaced by
  `compactType: ECompactType`** — a single enum-valued prop selecting
  one of five built-in compaction strategies, rather than a boolean
  covering only two of them. `verticalCompact: true` (the default) →
  `compactType: ECompactType.VERTICAL`; `verticalCompact: false` →
  `compactType: ECompactType.NONE`. Two genuinely new strategies are
  now available that had no equivalent before at all:
  `ECompactType.HORIZONTAL` (items float left) and
  `ECompactType.VERTICAL_OVERLAP`/`HORIZONTAL_OVERLAP` (every item
  moves straight to `0` on that axis, ignoring collisions entirely).
  Modeled on `react-grid-layout` v2's own built-in compactor set
  (`verticalCompactor`/`horizontalCompactor`/`noCompactor`/
  `verticalOverlapCompactor`/`horizontalOverlapCompactor`), all five of
  which — plus a `getCompactor(compactType)` factory — are now exported
  from the package root and from `vue-ts-responsive-grid-layout/core`.
  `ICompactorContext`'s own `verticalCompact: boolean` field is
  likewise now `compactType: ECompactType`. See `MIGRATION.md` for the
  full mapping and `docs/REFACTORING.md` for the design rationale.
  `horizontalShift` (a separate, unrelated prop controlling which
  direction a *colliding* item shifts during an active drag, not a
  compaction strategy) is unaffected.

- **`GridLayout.vue`'s cross-grid drag and outside-drop logic extracted
  into their own composables** (`useCrossGridDrag.ts`/`useOutsideDrop.ts`),
  mirroring the drag/resize/keyboard split already done for `GridItem.vue`.
  Public interface unchanged — all existing tests (including the
  dedicated 9-test cross-grid suite) needed zero changes, verified
  incrementally after each of the two extractions rather than only at
  the end. See `docs/REFACTORING.md` #68.

- **The deferred camelCase-vs-kebab-case naming sweep across
  `core/**` is now done.** 14 files (helpers and interfaces —
  `calculateUtils.ts`, `draggableUtils.ts`, `responsiveUtils.ts`,
  `gridItemTypeHelpers.ts`, `breakpointsHelper.ts`, `eventBus.interfaces.ts`,
  `transformStyle.interfaces.ts`, `gridItemCalculateHelper.ts`,
  `gridLayoutHelper.ts`, `crossGridRegistry.ts`, `collisionHelper.ts`,
  `sortHelper.ts`, `responsiveHelper.ts`, `moveHelper.ts`) renamed to
  kebab-case, matching the convention the validator files (`layout-validator.ts`
  etc.) already used — one mechanical pass, every import reference across
  `src/`, `tests/`, `demo/`, and `sandbox/` updated alongside each rename.
  Enum/type declaration files (`EGridLayoutEvents.ts`, `DOM.ts`, etc.) were
  deliberately left alone — different, equally legitimate convention,
  filename matching the exported symbol's own name. Verified with a clean
  typecheck and the full 307-test suite immediately after, with zero
  source or test logic changed. See `docs/REFACTOR_STRATEGY.md`'s
  "Naming and file organization" section.

- **`license-checker` replaced with `license-checker-rseidelsohn`**
  (`^4.4.2` — the newest release still declaring Node ≥18 support; the
  latest 5.x requires Node ≥24) — the original has been unmaintained
  since 2019 and its old `read-installed` dependency chain accounted
  for six of the ten `npm warn deprecated` messages seen on install
  (`readdir-scoped-modules`, `osenv`, `debuglog`, and others).
  `npm run check:licenses`'s flags are unchanged, only the command name.
  See `docs/REFACTORING.md` #45 for the remaining, not-safely-fixable
  warnings and why each one is left alone (`commitizen`'s `glob@7`,
  direct dependencies of `semantic-release`/`jsdom`, and three sources
  of `glob@10` that would need a riskier coordinated major-version bump
  to resolve).

- **`sandbox/` restyled to match `demo/`'s visual language**, and the
  `mini.css` CDN stylesheet it depended on removed from `index.html`
  entirely. Checked for functional (not just cosmetic) dependencies
  first — `mini.css`'s `.hidden` utility was the only thing keeping the
  "Reset Layout" button hidden, preserved via a new `.sandbox-hidden`
  class rather than letting it become visible as an unintended side
  effect. No `v-model`/event handler/prop binding changed, only
  surrounding markup and CSS classes. See `docs/REFACTORING.md` #44.

- **`borderRadiusPx`'s default changed from `8` to `10`** on both
  `GridItem` and `GridLayout`, matching the value the shared VitePress
  example styling had been hardcoding all along (see
  `docs/REFACTORING.md` #29). Only relevant if you were relying on the
  previous default rather than setting the prop explicitly.
- **CSS**: `GridItem`'s `.cssTransforms` class renamed to `.css-transforms`
  (kebab-case, consistent with every other class the component uses) —
  the only violation left once `stylelint` was brought to zero issues, to
  make `lint:style` safe to run as a blocking CI gate. Only relevant if
  you were targeting `.cssTransforms` directly in your own CSS overrides.
- **Dependency**: `element-resize-detector` replaced with native
  `ResizeObserver` in `GridLayout.vue` — 17% smaller gzipped ES bundle
  (45.2 KB → 37.5 KB) from this change alone. `element-resize-detector`
  and its `@types` package are gone from `package.json`.
- **Types**: `dragOption`/`resizeOption` props now typed against
  interact.js's own `DraggableOptions`/`ResizableOptions` instead of
  `{ [key: string]: any }`; `styleObj`, `useCurrentInstance()`'s return
  type, the `keys-validator.ts` functions, and `compactItem`/
  `compactLayout`'s `minPositions` parameter are typed instead of `any`.
- **Structure**: `GridItem.vue` reduced from 1,345 to ~830 lines via the
  composable extraction above; `GridLayout.vue`'s responsive-breakpoint
  logic moved to `useResponsiveLayout`.
- **Naming**: `gridIemTypeHelpers.ts` → `gridItemTypeHelpers.ts`,
  `collissionHelper.ts` → `collisionHelper.ts` (typo fixes). The broader
  camelCase-vs-kebab-case inconsistency across `core/**/helpers` —
  deferred at the time this entry was first written — has since been
  closed too: every camelCase file under `core/**` (14 total, including
  the two typo-fixed ones above) renamed to kebab-case in one mechanical
  pass, every reference updated alongside it. See
  `docs/REFACTOR_STRATEGY.md`.
- `package.json`: added `prepare`, `demo`, `demo:build`, `analyze`,
  `test:e2e*` scripts; corrected `engines.node`; removed the dead `husky`
  config block.

### Removed

- **BREAKING: `interact.js` removed entirely** as a runtime dependency,
  replaced with a native, Pointer Events-based drag/resize engine
  (`src/core/helpers/native-interaction.ts`). Measured effect: the ES
  bundle dropped from 44.66 KB to 20.52 KB gzip — a 54% reduction. See
  `docs/REFACTORING.md` for the full account and `MIGRATION.md` for the
  upgrade path.
- **BREAKING: `dragOption`/`resizeOption` props** (`GridItem`) removed —
  these merged extra options into interact.js's own `.draggable()`/
  `.resizable()` calls; with interact.js gone, there's no equivalent to
  merge into. `autoScroll` (still supported, now natively implemented)
  is unaffected.
- **BREAKING: `DraggableOptions`/`ResizableOptions` exported types**
  removed — re-exports of interact.js's own config types, now
  meaningless.

- `src/components/Grid/DragItem.vue` — dead, unreachable, half-finished
  code (not exported from the library, only reference was a commented-out
  block in `sandbox/App.vue`).
- `src/core/helpers/layoutUtils.ts` — empty, unreferenced file.
- `.eslintrc.cjs`, `.eslintrc.js`, `.eslintignore`, `.prettierrc.js`.

### Fixed

- **A layout item with `y: Infinity` (or `x: Infinity` during
  horizontal compaction) — a common, widely-used convention for
  "place this item past everything else, then let compaction settle
  it" (`react-grid-layout`'s own docs use the same pattern) — froze
  the page entirely.** `Infinity - 1 === Infinity` in JavaScript, so
  `compactItem`'s own decrement loop never actually reduced the value
  when nothing collided with it yet, an infinite loop rather than a
  slow one. Fixed by clamping a non-finite starting coordinate to a
  real value before compaction runs. Two related bugs surfaced while
  fixing this: an item still carrying a raw `Infinity` value could get
  cloned into an undo/redo snapshot *before* compaction cleaned it up,
  and `JSON.stringify(Infinity)` silently produces `null`, permanently
  corrupting that item in the undo history; and `undo()`/`redo()`
  themselves had an identical snapshot-before-compaction ordering
  mistake, causing a spurious extra undo point after a full revert.
  All three fixed together. See `docs/REFACTORING.md` #105 for the
  full account.

- **`useCssTransforms` never propagated to already-mounted items when
  toggled after mount** — every other similarly grid-wide-inherited
  prop (`isDraggable`, `showCloseButton`, `rowHeight`, `margin`,
  `transformScale`, etc.) has a watcher pushing changes to existing
  items via the eventBus; this one never did, so toggling it had no
  effect on anything already rendered. Added the missing watcher/
  eventBus handler pair, matching the existing pattern. Reported as
  part of "Layout bounds & rendering — description clarity,
  useCssTransforms." See `docs/REFACTORING.md` #93.

- **`autoHeight` never actually grew an item, no matter how much its
  content grew** — the internal wrapper element `autoSize()` measures
  (the same one its `ResizeObserver` watches) had `height: 100%` in its
  own CSS, constraining it to exactly its parent's current fixed
  height, so it could never reflect the content's real size and the
  observer never detected growing content either. Changed to
  `height: auto`. Reported as "Per-item autoHeight — container
  height." See `docs/REFACTORING.md` #90.

- **`scrollToItem`/`focusItem` silently did nothing when called
  immediately after adding the item they target** — their own
  documented use case. Vue's reactivity batches the resulting DOM
  update asynchronously, so the new item's element didn't exist yet
  at the moment these searched for it; both have a "no-op if not
  found" contract, so this failed with no error at all. Both now
  `await nextTick()` internally before searching, so the exact call
  pattern shown in the docs — no `await` needed by the caller — works
  correctly. **Both methods are now `async`, returning `Promise<void>`
  instead of `void`** — existing fire-and-forget calls (not awaiting
  the return value) are unaffected, but code awaiting or otherwise
  relying on a synchronous `void` return should account for the new
  return type. Reported as "scrollToItem/focusItem — not actually
  scrolling/focusing." See `docs/REFACTORING.md` #89.

- **Two examples (`Edit mode toggle` and the demo app's drag/resize
  view) rendered a fully-working, clickable close button that
  silently did nothing** — neither ever had an `@remove-grid-item`
  listener bound. Confirmed directly: the click handler fired every
  time, correctly gated on edit mode being on, but nothing removed
  the item from the layout, since there was no listener to do it.
  Reported as "edit mode toggle — delete button test." See
  `docs/REFACTORING.md` #86.

- **Neither the `Add or remove items` example nor its demo-app
  equivalent actually bin-packed new items** — removing an item from
  the middle of the grid (opening a gap) and then adding a new one
  always landed the new item in a fresh row at the bottom, ignoring
  the gap. Both now use the library's new `findFirstFitSlot` (see
  Added, below) instead of their own ad hoc, and both wrong,
  placement logic. Reported as "bin-packing placement algorithm"
  (missing one).

- **A dragged item had no z-index boost, so a static item rendered
  later in a consumer's own `v-for` would visually paint on top of it**
  during a drag. The natural fix (toggling z-index reactively on the
  dragged item itself) turned out to silently cancel the browser's own
  pointer capture mid-gesture — traced via the drag's own event trace
  (a single `dragmove` followed by a malformed `dragend` at unrelated
  coordinates, instead of a normal run ending at the true drop point).
  Fixed instead by giving static items a permanently lower z-index
  (never toggled, since `isStatic` never changes mid-gesture), which
  achieves the same visual result without ever mutating a
  stacking-related property on the element holding capture. See
  `docs/REFACTORING.md` #84.

- **The pluggable-compactor demo's own custom `downwardCompactor`
  used `maxY: 20`**, far more headroom than its 3 small items need —
  since compaction re-runs on every drag end (not just an explicit
  "tidy up"), every drag pushed items toward y:20, ballooning the grid
  container's own height and leaving items scrolled out of view below
  the visible demo area. Reduced to a sensible bound for both the
  VitePress example and the equivalent demo-app view. Reported as
  "rows are resized a lot and grid items end up out of sight."

- **Cross-grid drag transferred an item on the first `dragmove` that
  crossed into another grid's rect, not on the actual drop** — using
  whatever position the pointer happened to be at that moment (via
  `acceptDrop`'s fixed placement + compaction), not where the user
  actually released the mouse, and removing the item from its source
  grid for the rest of that same gesture. Reported as "drag an item
  back onto a locked item, it snaps back to its previous position
  instead of landing there." Now gated to the actual `dragend`. See
  `docs/REFACTORING.md` #83.

- **`dragAllowFrom` silently lost to the default `dragIgnoreFrom`
  whenever the handle was a `<button>` or `<a>`** — breaking the
  library's own exported `CustomDragElement` component out of the box,
  since its handle is a `<button>` internally. `ignoreFrom` was checked
  unconditionally, before `allowFrom`; an explicit `allowFrom` is now
  the sole authority once set. Reported as "the custom drag handle
  example doesn't work" — see `docs/REFACTORING.md` #82.

- **`resizestart` silently corrupted an item's own `h`/`w` in the
  layout to `{1, 1}`**, before the user had moved anything at all —
  invisible for a single-item resize (the very next `resizemove`
  immediately overwrote it with the real, correct size), but broke
  `multiSelect`'s own group-resize snapshot, which reads the layout
  exactly during that corrupted instant. Reported as "group resize
  changes both height and width when only resizing one dimension" —
  confirmed against the actual resize handle before diagnosing, traced
  to a shared code path (meant only for resizemove/resizeend) silently
  running for resizestart too. See `docs/REFACTORING.md` #81.

- **A second concurrent pointer (two fingers on the same item, or an
  accidental palm touch mid-gesture) could silently hijack drag or
  resize tracking**, abandoning the first pointer's own gesture without
  ever firing its `dragend`/`resizeend`. For resize specifically, this
  left `isResizing` stuck `true` indefinitely, which also blocked drag
  from working again for that item until the page was reloaded. Found
  via a fresh audit of the native drag/resize engine, not any prior bug
  report. See `docs/REFACTORING.md` #77.

- **A resize could silently do nothing at all**, for any item where
  `isResizable` resolves via the default `null`-inherit pattern (the
  common case) — found only by e2e-testing the native drag/resize
  migration against a real browser, not caught by any unit test. Root
  cause: the resize-hint spans are `v-if`-gated on the resolved
  `resizable` state, which the same `onMounted` that first wires up
  the resize engine sets *synchronously*, but Vue's own DOM update
  from that is asynchronous — the very first wiring attempt could run
  before the spans existed, permanently latch onto zero handles, and
  never retry. See `docs/REFACTORING.md` #76 for the full account.

- **`multiSelect` group move/resize ignored a passenger item's own
  `minW`/`maxW`/`minH`/`maxH`.** Only clamped to a hard floor of `1` —
  a passenger with its own, tighter constraints could be resized past
  them right along with the group's anchor item. Now clamps to each
  passenger's own constraints individually.
- **`multiSelect` group move/resize could move or resize a *static*
  passenger**, or one with `isDraggable`/`isResizable` explicitly
  `false` — as a passive member of a selection, not directly dragged
  itself. Now skipped, the same guarantee a static item already has
  against the normal collision-push cascade.
- **A removed item's id lingered in the `multiSelect` selection
  indefinitely** — closing a selected item (or a consumer removing it
  from their own layout) left a dangling reference visible in the
  exposed `selectedItems`. Now pruned automatically, with
  `SELECTION_CHANGED` firing only when something was actually removed
  from the selection.
- **`SECURITY.md`'s "Supported versions" section was stale**, still
  describing a `1.x` version line after the `2.0.0` release. Updated.

A large pass covering test infrastructure, dependency hygiene, and
structural cleanup — see `docs/REFACTOR_STRATEGY.md` for the full roadmap
this work was scoped against, and `docs/REFACTORING.md`/
`docs/BUNDLE_ANALYSIS.md` for exhaustive detail on every item below.

- **`compactNow()`/`rearrange()` was a no-op whenever `verticalCompact`
  was `false`.** It passed `props.verticalCompact` straight through to
  the internal `compactLayout()` call — meaning a manual "tidy up"
  trigger did nothing whenever the ambient auto-compact setting was
  off, exactly the scenario a manual tidy-up button exists for in the
  first place. Found while writing a new e2e test for this precise
  scenario, not from a bug report. Now always forces vertical
  compaction regardless of the `verticalCompact` prop, since that prop
  is meant to govern *automatic* compaction during drag/resize, not
  what an explicit, deliberately-triggered action should do.
- **The static-item collision check during drag never actually
  detected a collision.** `GridLayout.vue`'s `dragEvent()` checked the
  drag target against static items using the placeholder's own x/y,
  which still mirrored the item's pre-drag position at that point —
  a position already validly occupied can never collide with anything,
  so the check silently always passed regardless of the actual drag
  target. Found while closing coverage gaps; an existing test with the
  right name only asserted `not.toThrow()`, which never caught it.
  Fixed by reading the incoming drag-target x/y directly. See
  `docs/REFACTORING.md` #70.
- **Grid lines (`showGridLines`) were hardcoded to 6 columns/70px rows
  and opaque black**, regardless of the actual grid configuration or
  light/dark theme. Now computed dynamically from the real
  `colNum`/`rowHeight`/`margin`, and rendered in a semi-transparent
  neutral gray visible against either theme. See `docs/REFACTORING.md` #63.
- **A drag handle positioned inside interact.js's default ~10px
  resize-edge margin** could get resize instead of drag —
  `resizeIgnoreFrom` excludes by DOM target but doesn't shrink
  interact.js's own margin-based edge zone around the excluded element.
  Moved both `CustomDragElement`'s internal handle and the custom drag
  handle example's handle safely outside that margin. See
  `docs/REFACTORING.md` #64.
- **`GridLayout`'s exposed props (`defineExpose({ ...props })`) went
  stale after any wholesale prop reassignment**, not just `layout` —
  found while investigating a persistence-helper bug report.
  In-place mutations (e.g. dragging) stayed visible through the stale
  reference; a full reassignment (e.g. `v-model:layout` receiving a
  new array, exactly what `useLayoutStorage`'s `load()` does) did not.
  The actual rendered output and the consuming component's own state
  were never affected — only `gridRef.value.<prop>`-style programmatic
  access after a reassignment. Fixed with `toRefs(props)` instead of a
  plain spread. See `docs/REFACTORING.md` #65.

- **RTL resize dragged the wrong edge fixed in place** — dragging an
  item's left edge while mirrored moved the wrong anchor (and vice
  versa for the right edge), hardcoded to the LTR case regardless of
  render direction. Fixed in both the resize-in-progress math and the
  final grid-unit position conversion; verified with new unit tests
  (confirmed each fails against the old code) and a real browser drag
  test in both directions, checking the actual screen-space bounding
  box before/after. See `docs/REFACTORING.md` #54.
- **A genuinely redundant `eventBus.emit('setColNum', ...)`** removed
  from `GridLayout.vue`'s own `colNum` watcher — `responsiveGridLayout()`,
  called unconditionally by that same watcher, already emits the same
  resolved value via a second path in `useResponsiveLayout.ts`. Found by
  testing rather than reasoning alone: a first pass concluded the emit
  was necessary, wrote a regression test expecting it to fail without
  the emit, and it passed anyway — which is what led to finding the
  actual (still-necessary) second emit path, rather than stopping at an
  unexamined-but-passing test. See `docs/REFACTORING.md` #54.
- Two misleading/stale code comments corrected rather than silently
  removed: `responsive-helper.ts`'s `// TODO obsolete code..` (the
  function is actively used and has its own test suite) and
  `responsive-utils.ts`'s `// TODO ... this is not being triggered`
  from 2023 (the branch is reachable — an item wider than a new,
  narrower breakpoint's own column count triggers it as a side effect
  of the right-overflow correction; new test added). See
  `docs/REFACTORING.md` #54.

- **`isAndroid` crashed any server-side render** — read `navigator.userAgent`
  unguarded from a template-bound computed, evaluated on every render
  including SSR, where `navigator` doesn't exist in Node < 21 (this
  project's own `engines.node` field explicitly supports Node 18).
  Confirmed directly against a real `@vue/server-renderer` render of the
  built package with `navigator` deleted (simulating the actually-supported
  Node versions, since this sandbox's own Node 22 has an experimental
  `navigator` global that masked the bug on first attempt) — threw and
  crashed the entire render before the fix, succeeded after it. See
  `docs/REFACTORING.md` #51.

- **The demo's multi-grid outside-drop view (and its VitePress
  counterpart, example 23) only ever set `allowOutsideDrop`, never
  `allowCrossGridDrag`** — dragging an item already placed in one grid
  toward the other just left it confined to its own grid, which looked
  exactly like "not being removed from grid 1." Added
  `allowCrossGridDrag` to both grids in both places, alongside the
  existing `allowOutsideDrop` — confirmed the two mechanisms are
  independent and coexist safely, verified both directions (existing
  items between grids, new items from the palette) still work together.
  See `docs/REFACTORING.md` #49.

- **`borderRadiusPx`/`useBorderRadius` didn't cascade from `GridLayout`
  to items** — same bug class as `showCloseButton` (finding #31), one
  prop pair later. `GridItem`'s copies defaulted to concrete values
  instead of `null`, so a `GridLayout`-level default never reached any
  item that didn't also set its own copy directly. Now inherits
  correctly, same pattern as `isDraggable`/`isResizable`/`isBounded`/
  `showCloseButton`. See `docs/REFACTORING.md` #47.
- **`demo/`'s `CrossGridView` and `ExternalDropView`** had the same
  undersized-empty-grid issue findings #48 fixed per-VitePress-example —
  both use the shared `.demo-grid-wrap` class (which `sandbox/` also
  imports wholesale), so fixed it once at that shared location
  (`min-height: 140px` on `.demo-grid-wrap .vue-grid-layout`) rather
  than duplicating a per-view override. `sandbox/`'s own
  `preventCollision`/`useBorderRadius`/`borderRadiusPx`/`allowOutsideDrop`
  bindings were audited and found already correct — a full interaction
  sweep (every checkbox, a drag) produced no console errors. See
  `docs/REFACTORING.md` #50.

- **`package.json`'s `exports` map pointed `./style.css` at a file that
  doesn't exist** (`dist/style.css`, when the actual build output is
  `dist/vue-ts-responsive-grid-layout.css`) — every consumer following
  `guide/installation.md`'s own documented
  `import 'vue-ts-responsive-grid-layout/style.css';` would have hit a
  module-resolution error. Never caught because every internal consumer
  (`demo/`, `sandbox/`, every VitePress example) imports from source via
  an alias, bypassing `exports` entirely — found only by finally
  packing and installing the tarball into a genuinely separate scratch
  project and testing resolution the way a real consumer would. See
  `docs/REFACTORING.md` #46.

- **No cursor affordance for dragging or resizing at all.** A draggable
  item's body showed the plain arrow cursor regardless — nothing ever
  set `cursor: move`. Separately, there was no resize handle element in
  the template at all, despite CSS for one existing (dead code, likely
  left over from before resize supported all eight directions) —
  resizing worked from any edge (it's proximity-based, not tied to a
  handle element), there was just no visual hint of it anywhere. Added
  a `move` cursor for draggable items and eight small cursor-only hint
  elements around each resizable item's edges/corners, verified not to
  interfere with actual drag/resize activation. See
  `docs/REFACTORING.md` #42.
- **Cross-grid drag/drop re-verified working end-to-end** in a real
  browser (checked DOM parentage directly, not just an emitted event) —
  plausibly explained by the `dragend`/`interactObj` fixes above, since
  both sit on the code path any drag depends on. Documented a real,
  separate gotcha found while checking this: `allowCrossGridDrag` must
  be set on **both** the source and target grid — if the target is
  missing it, the drop fails completely silently (no event, no error),
  which looks exactly like a bug from the outside. Not a behavior
  change, just made explicit in the props reference and the VitePress
  example. See `docs/REFACTORING.md` #42.

- **`dragend` could commit a stale position, landing a fast or long drag
  far short of where the pointer actually ended up** — found via this
  project's first real-browser (Playwright) verification of any fix in
  this changelog. `dragend` re-derived position from the dragged
  element's live `getBoundingClientRect()`, racing against Vue's
  asynchronous render of the `dragging.value` state `dragmove` had
  already accumulated correctly throughout the gesture. Fixed by having
  `dragend` reuse that same accumulated value instead of a second,
  independent, potentially-stale DOM read. See `docs/REFACTORING.md`
  #41, including an open follow-up on e2e test-runner instability this
  surfaced but didn't fully resolve.

- **`interactObj.value.resizable is not a function` — a real crash
  affecting drag and resize across the demo app** (`BasicGridView`,
  `DragResizeView`, `DynamicItemsView` alike). `GridItem`'s internal
  `gridItem` ref starts as a placeholder object, not a real DOM element,
  until mount — several reactive watchers could call
  `tryMakeDraggable()`/`tryMakeResizable()` before that happens, handing
  interact.js a non-element target and producing a degenerate
  `Interactable` that crashes the *next* time it's used. Added a guard
  skipping the call entirely until the target is real. Also found and
  fixed a related gap where `onMounted` never directly called either
  function — only relied on a watcher noticing a *changed* value as a
  side effect, which could silently skip drag/resize setup forever if a
  resolved value happened to already match its default. See
  `docs/REFACTORING.md` #38.
- **Mirrored RTL didn't actually turn off when `isMirrored` was switched
  off** — `renderRtl` referenced a frozen `GridLayout` prop snapshot
  instead of the live, eventBus-cascaded value, and negated a value
  against a frozen copy of itself; separately, that live value was never
  initialized for a layout that starts already mirrored (only for
  layouts toggled into it after mount). Fixed both; four new tests cover
  initial mount, the full on/off/on toggle round trip, and the per-item
  `isMirrored: false` opt-out. See `docs/REFACTORING.md` #39.
- **Several VitePress example issues from a manual pass**: "Responsive
  breakpoints" never showed multiple columns at its narrowest breakpoint
  (items were too wide); "Add or remove items" always added new items
  via a fragile collision-cascade rather than a deliberately-chosen
  position, and gained a toggle for a second placement strategy; "Custom
  drag handle & close button" triggered a resize instead of a move when
  dragging from the handle (missing `resizeIgnoreFrom`); "Show close
  button" had no way to toggle the button off. See `docs/REFACTORING.md`
  #40.

- **`npm install` printed `EBADENGINE` warnings for six packages
  requiring Node ≥22**, contradicting this project's own declared
  `engines` range (`^18.0.0 || ^20.0.0 || >=22.0.0`). Downgraded
  `semantic-release`, `@semantic-release/github`, `@semantic-release/npm`,
  `conventional-changelog-angular`, and `rollup-plugin-visualizer` to
  their newest Node-≥18/20-compatible versions, and added an `overrides`
  entry (alongside the existing `qs`/`esbuild` ones) pinning
  `@commitlint/load` and its siblings — pulled in via
  `cz-conventional-changelog`'s own unbounded `">6.1.1"` dependency
  range — to their last Node-≥18-compatible releases. Verified
  `semantic-release --dry-run` still loads every plugin correctly and
  `npm run analyze` (the only consumer of `rollup-plugin-visualizer`)
  still builds. See `docs/REFACTORING.md` #37.

- **`npm run dev` (the `sandbox/` test bench) threw a Vite/Vue compile
  error on startup** — two typo'd import paths
  (`gridIemTypeHelpers`/`collissionHelper`, neither a real file). Fixed;
  also wired up `borderRadiusPx`'s input control, which had never
  actually been bound to `GridLayout`/`GridItem` in the template. See
  `docs/REFACTORING.md` #36.

- **Cross-grid drop wasn't working at all — dropped items always
  reverted to their source grid.** Pointer position was tracked via a
  separate `document`-level `mousemove` listener, which isn't guaranteed
  to fire reliably while interact.js has an active drag in progress
  (pointer capture can redirect/suppress native mouse events depending
  on browser/input type) — never verified against a real browser while
  building the feature. Fixed by reading pointer position straight off
  interact.js's own drag event instead (`IEventsData` gained optional
  `clientX`/`clientY`, threaded through from `useGridItemDrag.ts` to
  `GridLayout.vue`'s `dragEvent()`), removing the separate listener
  entirely. See `docs/REFACTORING.md` #35.
- **`GridLayout` also emitted `DRAG_END` twice, with a hardcoded, wrong
  id** — the exact same bug shape as the `DRAG_START` one above, found
  two lines below it while wiring up the cross-grid feature. Fixed the
  same way. See `docs/REFACTORING.md` #34.
- **`GridLayout` emitted `DRAG_START` twice when `verticalCompact` was
  `false`** — once immediately with a hardcoded, wrong id (`1`,
  regardless of which item was actually dragged), then again correctly
  via the normal event-dispatch path. Found while investigating the
  drag/drop-between-grids issue below (unrelated to it, but in the same
  function). See `docs/REFACTORING.md` #32.
- **`showCloseButton` never actually inherited from `GridLayout`** — the
  prop is typed `boolean | null` (the same "inherit from `GridLayout`"
  sentinel `isDraggable`/`isResizable`/`isBounded` use) but defaulted to
  `true` instead of `null`, and no resolution logic ever existed to read
  `GridLayout`'s own (correctly `false`-by-default) setting. Every item
  showed a close button by default, everywhere, regardless of
  `GridLayout`'s setting. Fixed with the same resolved-ref +
  `onMounted` + prop-watcher + eventBus-cascade pattern `isBounded`
  already had. See `docs/REFACTORING.md` #31.
- **"Drag, drop from grid to grid" example's native `drop` event never
  actually fired** — `onDragOver` was missing the `preventDefault()` the
  HTML5 DnD spec requires for a drop target to be considered valid
  (superseded by the interact.js `dropzone()` rewrite below, which
  doesn't use native HTML5 DnD at all — see `docs/REFACTORING.md` #30).
- **VitePress's "Border radius" example looked completely broken** — the
  `useBorderRadius`/`borderRadiusPx` controls had zero visible effect,
  even though the library's own logic reacts correctly (verified
  directly). Root cause: the example's inner content used the shared
  `.example-item` class, which has its own hardcoded `border-radius: 10px`
  filling the entire item — completely masking whatever radius the outer
  element actually had. Fixed by binding the inner content's radius to
  the same values the controls set.
- **`@import` rules in `GridItem.vue`/`GridLayout.vue`/`src/styles/index.scss`
  were deprecated** (Dart Sass will remove `@import` entirely in 3.0) —
  migrated to `@use ... as *`, preserving the existing bare
  (non-namespaced) variable references exactly.
- **`npm audit` findings**: 2 of 6 reported vulnerabilities fixed via
  targeted `package.json` `overrides` (`qs` → `6.15.3`, fixing a
  transitive pin from `@stryker-mutator/core`; `esbuild` → `0.25.12`,
  fixing an advisory in vitepress's vendored copy) — each verified by
  actually re-running the affected tool (Stryker; `npm run docs:build`)
  afterward, not just trusting the override resolved cleanly. The
  remaining 3 are vitepress's own vendored `vite` (a major version behind
  this project's own, unaffected top-level `vite`), with no non-breaking
  fix currently available — left alone deliberately rather than risking a
  breaking change to docs tooling; see `docs/REFACTORING.md` #28. The
  production-only audit gate (`npm audit --omit=dev --audit-level=high`,
  what `ci.yml` actually blocks on) was already at 0 vulnerabilities and
  remains there.
- **The new keyboard accessibility support had two real bugs**, found in
  a deliberate re-review immediately after writing it: it would have
  hijacked Ctrl/Alt/Meta+Arrow (OS virtual-desktop-switching, browser
  history navigation, some screen reader commands) instead of passing
  those through untouched; and arrow-key direction didn't account for RTL
  mirroring, so the physical right-arrow key would have moved a mirrored
  item visually *left*. See `docs/REFACTORING.md` #27.
- **`CustomCloseButton.vue` (the standalone exported component) had no
  accessible name at all** — just a decorative icon span with no text or
  `aria-label`. Fixed alongside the accessibility work above.
- **`.visually-hidden` was used but never actually defined anywhere** in
  the library's CSS — the close button's screen-reader-only "Close" label
  has been rendering as plain visible text this whole time, unless a
  consumer's own global stylesheet happened to already define a
  conventional `.visually-hidden` utility class. Found while adding
  keyboard-accessibility instructions text (which used the same class).
  Fixed by adding the standard clip-to-1px-box CSS pattern.
- **Changing `margin` on `GridLayout` after mount never actually reached
  already-rendered items** — the watcher responsible for it read
  `thisLayout.margin`, which (like every prop spread into `defineExpose`)
  is a one-time snapshot, not a live reactive reference, so the watcher
  could never fire. Given the `setXxx` eventBus cascade every other
  layout-level setting already uses. See `docs/REFACTORING.md` #26.
- Source-level bugs and broken tooling found while building the test suite,
checking public API exposure, and writing documentation (full detail in
`docs/REFACTORING.md`):

- `EGridItemEvent` was exported from the package's main entry point as a
  type-only re-export, making it uncompilable to use as a value
  (`EGridItemEvent.RESIZED`) from outside the repo; `EGridLayoutEvent`
  wasn't exported at all.
- The published `types` path in `package.json` didn't match what the
  build actually emitted (an extra `src/` segment), and the emitted
  declaration files contained unresolvable `@/...` path aliases instead
  of real relative imports — both meant TypeScript consumers couldn't
  resolve types for most of the public API at all.
- The eventBus type was hand-duplicated a third and fourth time, directly
  in `GridItem.vue`/`GridLayout.vue` (in addition to the two composable
  files that already shared one definition).
- `borderRadiusPx` was a declared prop on both components with zero
  actual effect — the CSS that was supposed to use it referenced a
  hardcoded SCSS variable instead.
- Several declared events (`EGridItemEvent.DRAG`/`DRAGGED`,
  `EGridLayoutEvent.CHANGED_DIRECTION`/`CONTAINER_RESIZED`) are never
  actually emitted.
- The VitePress documentation site's build was completely broken —
  every example imported the package from `node_modules`, which doesn't
  exist without a separate publish/link step first.

- Every window resize threw an uncaught error (`resizeEvent()` called with
  no item id).
- Starting a drag/resize while the container width was still 0/null
  crashed the whole grid.
- `autoSize()` (the "resize on content change" feature) threw on its first
  line, every time it was called.
- `restoreOnDrag` silently did nothing whenever `verticalCompact: false` —
  a producer/consumer shape mismatch (`{tmpX, tmpY}` vs. `.y`) hidden behind
  an `any` type, found by replacing that `any` with a real type.
- `IGridLayoutProps` was hand-duplicated in two files and could silently
  drift out of sync; `GridLayout.vue` now imports the single copy.
- `hasWindow` was referenced instead of called in `DOM.ts`, making an
  SSR-safety branch permanently unreachable.
- Two existing unit tests asserted nothing (`expect(() => x.toBe(y))` never
  invokes `x`), despite a `// TODO tests should fail but not doing it`
  comment sitting right above them.
- Several duplicate/dead code paths: a duplicated 11-line geometry block in
  `handleDrag`, a dead RTL conditional whose branches were identical, an
  unreachable duplicate `cols < 1` validation check, an empty no-op `if`
  block in `correctBounds`, an unused `rowHeightPx` computed property, and
  a fully dead, unreachable `DragItem.vue` component (removed).
- `package.json`'s `module` field was missing its `dist/` prefix (broken
  for any bundler still reading the legacy field), and `typeings` was a
  typo of `types` (silently non-functional for all tooling).
- `eslint.config.js` didn't exist — `npm run lint` failed outright under
  the installed ESLint 9. `.stylelintrc` referenced 5 rules removed from
  Stylelint core in v16 — `npm run lint:style` failed outright too.
- `husky@9` was installed but never wired up (no `.husky/` directory, no
  `prepare` script; the `package.json` `"husky"` block is a v4-era format
  v9 doesn't read) — pre-commit hooks have never run since the v9 upgrade.
- Two conflicting Prettier configs (`.prettierrc` vs. `.prettierrc.js`,
  disagreeing on tabs vs. spaces, with `.prettierrc.js` also contradicting
  itself); only `.prettierrc` was ever actually used.
- `.eslintignore`/`.stylelintignore` referenced `cypress.config.ts`,
  `/cypress`, and `pnpm-lock.yaml` — none of which exist in this project.
- `engines.node` claimed `>= 14.18.0`; Vite 6 and Vitest 3 actually require
  Node `^18.0.0 || ^20.0.0 || >=22.0.0`.
- `@interactjs/dev-tools` (a devtools/inspector plugin) was imported
  unconditionally in production source.

---

The entries below predate this changelog file and were migrated from the
version history previously embedded in `README.md`.

## [1.2.10] - 2025-04-28

- **Demo App**: eventlog was not displaying any resize events.
- **Fixed**: the margin property couldn't be `[0, 0]`.
- **Fixed**: resize cursor changed even when GridItem was not resizable.
- **Tests**: added more unit tests and refactored code to be easier to test.
- **Tests**: updated `vitest.config.js` coverage exclude section.

## [1.2.9] - 2024-02-03

- **Fixed**: dynamic column changes caused items to overlap.

## [1.2.8] - 2024-01-25

- **Fixed**: unexpected behavior when dragging items. Thanks to
  [T0miii](https://github.com/T0miii).

## [1.2.7] - 2024-01-10

- **Fixed**: the `responsive` option wasn't working. Thanks to
  [T0miii](https://github.com/T0miii).

## [1.2.6] - 2023-12-28

- **Fixed**: a problem when the layout had no static item.

## [1.2.5] - 2023-12-14

- **Fixed**: `editMode` not working as expected.
- **Docs**: fixed page config so refreshing loads the correct page instead
  of a 404.
- **Demo App**: added margin inputs; added checks so number inputs can't go
  below 1; fixed the dropped-item index when it's a numeric value.
- **Refactor**: updated gridline styling in `GridLayout.vue`.
- **Config**: added style linting; updated `package.json` scripts.
- **Tests**: added more unit tests and refactored code to be easier to test.

## [1.2.4] - 2023-10-23

- **Fixed**: the layout-update event was raised before the update finished.
  Thanks to [SamGeems](https://github.com/SamGeens).
- **Fixed**: the close button's CSS didn't match the documented example.
  Thanks to [SamGeems](https://github.com/SamGeens).
- **Added**: `drag-end`, `drag-move`, and `drag-start` events on
  `GridLayout`.
- **Codebase**: renamed `EGridLayoutEvent.UPDATE_LAYOUT` to `LAYOUT_UPDATE`;
  removed `EDragEvents` (folded into `EGridLayoutEvent`); documented
  `DOM.ts`; removed the obsolete `EMovingDirections` enum.
- **Demo App**: added a button to clear the event log and a dropdown to
  filter events.

## [1.2.2] - 2023-09-19

- **Fixed**: drag-and-drop from outside the grid wasn't working when
  `distributeEvenly` was set.
- **Partial fix**: `resizemove` edge-case handling — right, bottom-right,
  and bottom resize fixed; left, top-left, top, and top-right still not.
- **Codebase**: added function documentation, contributor list, and README
  badges; updated outdated dependencies.

Thanks to [UTing1119](https://github.com/UTing1119) for contributing to
this release.

## [1.2.1] - 2023-05-07

- **Fixed**: [issue 7](https://github.com/gwinnem/vue-responsive-grid-layout/issues/7)
  and [issue 6](https://github.com/gwinnem/vue-responsive-grid-layout/issues/6).
  Thanks to [UTing1119](https://github.com/UTing1119).
