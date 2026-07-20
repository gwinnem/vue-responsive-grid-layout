# Features

A comprehensive reference of what `vue-ts-responsive-grid-layout` actually
does today — every prop, event, and interaction pattern currently
implemented, organized by category rather than alphabetically. For
forward-looking ideas that *aren't* built yet, see
[`ROADMAP.md`](./ROADMAP.md). For the history of bugs found and fixed
along the way, see [`docs/REFACTORING.md`](./docs/REFACTORING.md).

Every feature below links to its live example in the
[documentation site](https://github.com/gwinnem/vue-responsive-grid-layout)
(`vitepress-docs/examples/`) where one exists, and to the relevant props
reference page for full type/default details.

## Core layout

- **Grid-unit positioning** — every item's `x`/`y`/`w`/`h` are in grid
  columns/rows, not pixels; the library handles pixel conversion,
  including `margin` (`[horizontal, vertical]` spacing) and `rowHeight`.
- **Generic `ILayoutItem<TMeta>`** — attach a typed, consumer-defined
  `data` payload to each layout item instead of maintaining a parallel
  array keyed by `i`. See [Persistence](vitepress-docs/api/persistence.md)
  API docs for a usage example alongside `useLayoutStorage`.
- **`v-model:layout`** — two-way binding on the layout array, the
  primary way consumers read/write item positions. See
  [v-model & save/load layout](vitepress-docs/examples/19-example.md).
- **Auto-sizing container** (`autoSize`) — the grid's own height grows
  and shrinks to fit its content automatically. See
  [Auto-size grid on content](vitepress-docs/examples/20-example.md).
- **`maxRows`** — caps how far the layout may grow vertically.
- **`colNum`/`cols`** — column count, either fixed or per-breakpoint
  (see Responsive, below).
- **Visible grid line guides** (`showGridLines`) — renders the
  underlying column/row structure behind items. See
  [Show grid lines](vitepress-docs/examples/16-example.md).
- **Alignment guides** (`showAlignmentGuides`) — Figma-style guide lines
  while dragging/resizing, wherever an item's edges land on the same
  grid coordinate as another item's edges. Purely visual, grid-unit-based.
  See [Alignment guides while dragging](vitepress-docs/examples/26-example.md).
- **CSS transform positioning** (`useCssTransforms`, default on) — items
  position via GPU-accelerated `transform` rather than `top`/`left`.
- **`transformScale`** — compensates drag/resize math when the grid
  renders inside a CSS-scaled ancestor (e.g. a zoomed-out canvas view).

## Drag and resize

- **Drag from anywhere on an item's body** by default, with cursor
  affordance (`cursor: move`) and a live drop-position preview as you
  drag.
- **Resize from all eight directions** — every edge and corner, not
  just bottom-right — each with its own cursor hint
  (`ns-resize`/`ew-resize`/`nesw-resize`/`nwse-resize`). Left/top-edge
  resizes correctly move the item's anchor position as well as its
  size, since the opposite edge stays fixed.
- **`dragAllowFrom`/`dragIgnoreFrom`** and **`resizeIgnoreFrom`** — CSS
  selectors restricting which descendant elements can (or can't) start
  a drag or resize, for custom drag handles or elements that should be
  click-only (e.g. a close button). See
  [Drag allow/ignore elements](vitepress-docs/examples/05-example.md)
  and [Custom drag handle & close button](vitepress-docs/examples/18-example.md).
- **`autoScroll`** — scrolls the item's nearest scrollable ancestor
  automatically as a drag or resize nears its edge. A native,
  `requestAnimationFrame`-driven implementation, not configurable
  beyond on/off.
- **`isBounded`** — restricts dragging to stay within the container. See
  [Bounded drag to container](vitepress-docs/examples/02-example.md).
- **`preserveAspectRatio`** — locks an item's width/height ratio while
  resizing.
- **`minW`/`minH`/`maxW`/`maxH`** — per-item size constraints.
- **Keyboard move and resize** — every non-static, editable item is
  focusable; arrow keys move it, Shift+arrow keys resize it, one grid
  unit per keypress. See [`docs/ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md).

## Multi-select

- **`multiSelect`** — opt-in (off by default, every prior behavior
  unaffected when off). Click an item to select only it; Shift/Ctrl/Cmd
  +click to add to the selection additively; click empty grid
  background to clear it. Dragging or resizing any *selected* item
  while more than one is selected moves/resizes every other selected
  item by the same delta — also works from the keyboard (arrow keys/
  Shift+arrow on a focused, selected item), not just mouse/touch drag.
  A static passenger (or one with `isDraggable`/`isResizable`
  explicitly `false`) never moves/resizes as part of the group, and
  each passenger's own `minW`/`maxW`/`minH`/`maxH` are respected
  individually during group resize, not just clamped to the anchor's
  own limits. Deliberately not collision-aware for passenger items
  against *non-selected* items during the gesture itself (only the
  anchor item gets the usual collision/bounds handling; compaction
  still runs normally once the gesture ends). See
  [Multi-select & group move/resize](vitepress-docs/examples/37-example.md).
- **`selectItem(id, additive?)`/`deselectItem(id)`/`toggleItemSelection(id)`/`clearSelection()`**
  (exposed methods) and **`selectedItems`** (exposed, reactive array) —
  programmatic selection control, alongside the click-driven gestures
  above. A selected item's id is automatically pruned from the
  selection if it's later removed from the layout.
- **`selection-changed`** event — fires with the full current selection
  whenever it changes.
- **`vue-grid-item-selected`** CSS class — applied to every selected
  item, with a sensible default visual (an inset outline), fully
  overridable via your own CSS targeting the same class.

## Collision and compaction

- **`compactType`** (default `ECompactType.VERTICAL`) — selects one of
  five built-in compaction strategies: `VERTICAL` (items float up),
  `HORIZONTAL` (items float left), `NONE` (items stay exactly where
  placed), and `VERTICAL_OVERLAP`/`HORIZONTAL_OVERLAP` (every item
  moves straight to `0` on that axis, ignoring collisions).
- **`compactor`** — replaces the compaction algorithm entirely via a
  pluggable `ICompactor` interface. `null` (the default) keeps
  whichever built-in strategy `compactType` selects;
  `verticalCompactor`/`horizontalCompactor`/`noCompactor`/
  `verticalOverlapCompactor`/`horizontalOverlapCompactor` ship as the
  five built-in strategies it falls back to. See
  [Pluggable compaction](vitepress-docs/examples/42-example.md).
- **`preventCollision`** — blocks a drag/resize that would overlap
  another item, instead of pushing it aside. See
  [Prevent collision](vitepress-docs/examples/08-example.md).
- **`horizontalShift`** — colliding items get pushed left/right instead
  of down. See [Horizontal shift](vitepress-docs/examples/15-example.md).
- **`distributeEvenly`** — items that would overflow the right edge
  spread evenly across available columns instead of just clamping.
- **`restoreOnDrag`** — while a drag is in progress, other items won't
  compact past their pre-drag position until the drag actually ends.
- **Static items** (`isStatic`) — excluded from collision cascades
  entirely, and ignore `isDraggable`/`isResizable`. See
  [Static items](vitepress-docs/examples/17-example.md).
- **`MOVE_BLOCKED_BY_COLLISION` event** — fires when `preventCollision`
  blocks a drag or resize, so a consumer can add a shake/flash/toast
  without reimplementing collision detection themselves. See
  [Blocked-move feedback](vitepress-docs/examples/30-example.md).
- **`snapToGrid`/`snapThreshold`** — magnetic snapping during drag,
  distinct from `showAlignmentGuides` (visual-only): the dragged item's
  position actually adjusts once within `snapThreshold` grid units of
  another item's edge. See
  [Snap to grid](vitepress-docs/examples/32-example.md).

## Responsive layouts

- **Breakpoint-based column counts** (`responsive`, `breakpoints`,
  `cols`) — the grid automatically switches column count as its
  container width crosses configured thresholds. See
  [Responsive breakpoints](vitepress-docs/examples/07-example.md).
- **Predefined per-breakpoint layouts** (`responsiveLayouts`) — supply
  an exact layout for each breakpoint instead of relying on
  auto-generation. See
  [Responsive predefined layouts](vitepress-docs/examples/09-example.md).
- **`breakpoint-changed`/`columns-changed` events** for reacting to a
  breakpoint switch.

## Multi-grid and drag-and-drop between/beyond grids

- **Multiple independent grids on one page**, each with its own state.
  See [Multiple grids](vitepress-docs/examples/04-example.md).
- **Cross-grid drag/drop** (`allowCrossGridDrag`) — drag an item out of
  one `GridLayout` and drop it into another that also has this set.
  `disableExternalDrop` lets a grid opt out of *accepting* drops while
  still allowing its own items to be dragged out. Emits
  `cross-grid-item-dropped`/`cross-grid-drop-rejected`. See
  [Drag, drop from grid to grid](vitepress-docs/examples/12-example.md)
  and [Cross-grid drop restrictions](vitepress-docs/examples/22-example.md).
- **Drag-and-drop from outside the grid system** (`allowOutsideDrop`) —
  accept native HTML5 drag-and-drop from a plain `draggable="true"`
  element that isn't a `GridItem` or another `GridLayout` at all (e.g. a
  widget palette/sidebar). Shows the same live placeholder a normal
  in-grid drag uses; emits `item-dropped-from-outside` with the resolved
  position and the native `DataTransfer` object on drop, leaving the
  consumer's own handler to decide what (if anything) to add. Works
  independently across any number of grids on the same page — no
  coordination needed between them, unlike cross-grid drag. See
  [Drag, drop from outside](vitepress-docs/examples/11-example.md) and
  [into multiple grids](vitepress-docs/examples/23-example.md).
- **`outsideDropAccept`** — a predicate rejecting incompatible native
  drags (a stray OS file drag, an unrelated third-party widget's own
  draggable) before the placeholder even appears, checked in
  `dragenter`/`dragover`/`drop`. See
  [outsideDropAccept & readOutsideDropPayload](vitepress-docs/examples/34-example.md).
- **`readOutsideDropPayload<T>(dataTransfer, mimeType?)`** — a small
  helper wrapping `getData`/`JSON.parse` with a clear failure mode, so a
  consumer's `item-dropped-from-outside` handler doesn't need to
  re-implement the same parsing every time. See the same example above.

## Editing and item lifecycle

- **Add/remove items at runtime** by mutating the `layout` array — no
  special API needed. See
  [Add or remove items](vitepress-docs/examples/10-example.md).
- **`enableUndoRedo`/`undoHistoryLimit`, `undo()`/`redo()`/`canUndo`/
  `canRedo`** — opt-in undo/redo history at committed-change
  granularity (drag start→end, resize start→end, item add/remove,
  `compactNow()`/`rearrange()`), not per intermediate drag-move frame.
  Capped at `undoHistoryLimit` (default 50) snapshots. See
  [Undo/redo](vitepress-docs/examples/43-example.md).
- **Built-in close button** (`showCloseButton`, settable on `GridLayout`
  as a default or per-item) — emits `remove-grid-item` on click. See
  [Show close button](vitepress-docs/examples/13-example.md).
- **`enableEditMode`** (`GridLayout`-level default, per-item override,
  same inherit pattern as `isDraggable`/`isResizable`/`showCloseButton`)
  — master switch; when off, an item can't be dragged, resized, or
  closed regardless of any other prop. A grid-wide "view mode" toggle
  no longer needs binding the prop on every item individually. See
  [Edit mode toggle](vitepress-docs/examples/21-example.md).
- **Custom close button / drag handle components** — `CustomCloseButton`
  and `CustomDragElement` are exported, the same components the library
  uses internally, for consumers who want the built-in behavior with
  their own styling. See
  [Custom drag handle & close button](vitepress-docs/examples/18-example.md).
- **`duplicateItem(id)`** (exposed method) — clones an item with a
  collision-safe id (`${id}-copy`, `${id}-copy-2`, ...), placed directly
  below the source and left to the next compaction pass to resolve any
  overlap. See
  [compactNow, rearrange & duplicateItem](vitepress-docs/examples/29-example.md).
- **`compactNow()`/`rearrange()`** (exposed methods) — re-runs
  compaction on demand, the same sequence that already runs internally
  after drag/resize/add/remove, for a "Tidy up" button or after a bulk
  programmatic layout edit. See the same example above.
- **`autoHeight`** (per-item) — automatically re-runs `autoSize()`'s
  measurement whenever the slot content's own size actually changes (a
  `ResizeObserver` on a dedicated wrapper element), without a consumer
  manually calling the exposed `autoSize()` method every time. See
  [Per-item autoHeight](vitepress-docs/examples/31-example.md).

## Styling and customization

- **Border radius** (`borderRadiusPx`/`useBorderRadius`, per-item). See
  [Border radius](vitepress-docs/examples/14-example.md).
- **Configurable transition duration/easing**
  (`transitionDurationMs`/`transitionTimingFunction` on `GridLayout`) —
  controls item position/size transitions and the grid's own auto-height
  resizing, applied via inherited CSS custom properties. See
  [Configurable transition duration & easing](vitepress-docs/examples/24-example.md).
- **A `#placeholder` slot** for custom drag-placeholder content (a
  ghost preview, a "drop here" label, an icon) instead of the default
  plain colored box, with the current position/size and drag state as
  scoped slot props. See
  [Custom drag-placeholder content](vitepress-docs/examples/25-example.md).
- **`showResizeHandles`/`resizeHandleColor`** (`GridLayout`-level
  default, per-item override) — a visible resize-handle affordance (per
  edge/corner) instead of only a cursor change on hover. Applied via a
  `--resize-handle-color` CSS custom property, inherited the same way
  `transitionDurationMs` is — no eventBus cascade needed. See
  [Configurable resize-hint appearance](vitepress-docs/examples/33-example.md).
- **`#resize-handle` slot** — a fully custom render (an icon, not just
  a color) for each of the 8 resize handles, receiving the edge/corner
  as a scoped slot prop. Closes the gap `react-grid-layout`'s own
  `resizeHandle` prop covers. See
  [Multi-select & group move/resize](vitepress-docs/examples/37-example.md).
- **RTL layout mirroring** (`isMirrored` on `GridLayout`, with a
  per-item opt-out) — see [Mirrored (RTL)](vitepress-docs/examples/06-example.md).
- Full CSS class hooks for every interactive state (`vue-draggable`,
  `vue-resizable`, `vue-static`, `vue-draggable-dragging`,
  `vue-grid-placeholder`, etc.) — see the Styling section of the
  documentation site for the complete list and override examples.

## Accessibility

- Keyboard move/resize (see Drag and resize, above).
- `aria-roledescription`, `aria-describedby` (pointing at a visually-hidden
  usage hint), and `role="group"` on every draggable/resizable item.
- **`ariaLabels`** (`GridLayout` grid-wide default, `GridItem` per-item
  override) — the close button's label, the item's
  `aria-roledescription`, and the keyboard move/resize instructions are
  no longer hardcoded English literals; override any of them with the
  current English text as the fallback for anything left unset. See
  [Localizable ARIA strings](vitepress-docs/examples/36-example.md).
- **`scrollToItem(id)`/`focusItem(id)`** (exposed methods on `GridLayout`,
  via a template ref) — scroll to and/or focus a specific item, useful
  after a programmatic add/remove or a keyboard-driven action that
  relocates the currently-focused item. See
  [scrollToItem & focusItem](vitepress-docs/examples/27-example.md).
- See [`docs/ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md) for full scope,
  including what's deliberately not covered (this isn't a full WAI-ARIA
  grid/application widget pattern — see [`ROADMAP.md`](./ROADMAP.md) for
  why, and what a fuller pattern would need).

## Events

`GridLayout` emits (non-exhaustive — see
[Events reference](vitepress-docs/components/grid-layout-events.md) for
the complete table with payloads):
`update:layout`, `layout-created`, `layout-before-mount`,
`layout-mounted`, `layout-ready`, `layout-updated`, `breakpoint-changed`,
`columns-changed`, `dragstart`/`dragmove`/`dragend`,
`cross-grid-item-dropped`, `cross-grid-drop-rejected`,
`item-dropped-from-outside`, `move-blocked-by-collision`,
`selection-changed`.

`GridItem` emits (see
[Events reference](vitepress-docs/components/grid-item-events.md)):
`move`/`moved`, `resize`/`resized`, `drag`/`dragged`, `remove-grid-item`,
`container-resized`, `item-clicked`. See [Events](vitepress-docs/examples/03-example.md)
for a live demo of most of these firing.

An internal `eventBus` (see
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)) also carries
cascaded `GridLayout`-level settings down to items reactively
(`margin`, `rowHeight`, `showCloseButton`, etc. changing after mount
actually reaches already-rendered items).

## TypeScript

- Full type/enum/interface exposure from the package's main entry
  point — every prop interface, layout/breakpoint type, event enum,
  event-payload type, and the type of every value exposed via
  `defineExpose` on `GridLayout`/`GridItem` (`placeholder`,
  `alignmentGuides`, `dragging`) is importable directly from
  `'vue-ts-responsive-grid-layout'` — no reaching into an internal
  `@/core/...` path required. See
  [API reference](vitepress-docs/api/index.md) for the complete,
  current list.
- Event payload types (`IOutsideItemDropped`, `ICrossGridItemDropped`,
  `ICrossGridDropRejected`) are exported too, for typing a consumer's
  own event handlers without hand-rolling duplicate interfaces.

## Persistence

- **`useLayoutStorage(key, layout, options?)`** — a composable that
  saves/loads a `v-model:layout` ref against `localStorage` (or any
  `Storage`-compatible backend), handling the two things a hand-rolled
  `localStorage.setItem`/`getItem` has to account for manually: stripping
  the internal `moved` field before saving, and gracefully returning
  `false` rather than throwing when nothing valid is stored. Defaults to
  auto-loading on creation; auto-save (debounced) is opt-in via
  `autoSave: true`. See
  [v-model & save/load layout](vitepress-docs/examples/19-example.md).
- **`serializeLayout(layout)`/`deserializeLayout(json)`** — the plain,
  storage-agnostic functions `useLayoutStorage` is built on, exported
  separately for a non-browser backend or use outside Vue's reactivity
  system entirely.
- **`useLayoutPresets(key, layout, options?)`** — named layout presets:
  save and switch between several named arrangements of the same items
  (e.g. "compact"/"detailed" views of the same dashboard), layered on
  top of `serializeLayout`/`deserializeLayout` rather than duplicating
  that logic. See
  [Named layout presets](vitepress-docs/examples/35-example.md).
- **`exportLayoutAsSvg(layout, options?)`** — a dependency-free
  grid-to-SVG export utility, drawing each item as a labeled rectangle
  from layout data alone (a report/thumbnail/share use case) — no new
  runtime dependency, unlike a DOM-to-canvas approach, at the cost of
  not capturing arbitrary custom slot content's actual rendered
  appearance. See
  [Export layout as SVG](vitepress-docs/examples/28-example.md).

## Testing and quality (for contributors, not end consumers)

Not a "feature" in the end-user sense, but worth listing here since it's
part of what the project delivers: 98%+ statement/branch coverage
(Vitest, unit + component), a Playwright e2e suite across
Chromium/Firefox/WebKit, mutation testing (Stryker), a visual regression
suite, and CI gates on every PR (typecheck/lint/test/build/bundle-size).
See [`docs/TESTING.md`](./docs/TESTING.md) and the
[coverage report](vitepress-docs/guide/coverage.md).
