---
aside: false
page: true
title: Features
---

# Features

## Drag & resize

- **Drag anywhere, or from a handle.** Every item is draggable by
  default; restrict it to a specific handle with `dragAllowFrom`, or
  exclude specific elements with `dragIgnoreFrom`. See [Drag allow/ignore elements](/examples/05-example)
  and [Custom drag handle](/examples/18-example).
- **Resize from any edge or corner** — top, right, bottom, left, and the
  diagonals — with optional `preserveAspectRatio` locking.
- **Min/max size constraints** (`minW`/`maxW`/`minH`/`maxH`) per item.
- **Bounded dragging** — keep items from being dragged outside the
  container. See [Bounded drag](/examples/02-example).
- **Static items** — lock specific items in place; they ignore
  dragging/resizing entirely and act as fixed obstacles for compaction.
  See [Static items](/examples/17-example).
- **Per-item `autoHeight`** — a live-resyncing height, driven by a real
  `ResizeObserver` on the item's own content rather than a one-time
  measurement. See [Per-item autoHeight](/examples/31-example).

## Layout & collision

- **Automatic compaction.** Items fill gaps vertically by default; other
  items automatically move out of the way of a drag/resize.
- **Pluggable compaction strategy** (`compactType`) — five built-in
  strategies (vertical, horizontal, none, and overlap variants of
  each), or replace the algorithm entirely with a custom `ICompactor`.
  See [Pluggable compaction](/examples/42-example).
- **Horizontal shift mode** — push colliding items left/right instead of
  down. See [Horizontal shift](/examples/15-example).
- **Prevent collision mode** — block a drag/resize instead of pushing
  other items, with a `MOVE_BLOCKED_BY_COLLISION` event so a consumer
  can give feedback the moment that happens. See
  [Prevent collision](/examples/08-example) and
  [Blocked-move feedback](/examples/30-example).
- **Magnetic snap-to-grid** (`snapToGrid`/`snapThreshold`) — actually
  adjusts an item's landing position to align with a neighbor, not
  just a visual guide. See [Snap-to-grid & alignment guides](/examples/32-example).
- **Alignment guides** — Figma-style guide lines while dragging or
  resizing, wherever an item's edges line up with another's. See
  [Alignment guides while dragging](/examples/26-example).
- **`restoreOnDrag`** — keep other items from compacting past their
  pre-drag position while a drag is in progress.
- **Auto-sizing container** — the grid's height grows/shrinks to fit its
  content by default (`autoSize`). See [Auto-size grid](/examples/20-example).
- **Serializable layout.** The `layout` array is a plain, JSON-serializable
  structure you own — persist it anywhere. See [v-model & save/load layout](/examples/19-example).
- **Named layout presets** (`useLayoutPresets`) — save and switch
  between multiple named arrangements, layered on the same
  serialize/restore primitives. See [Named layout presets](/examples/35-example).
- **Grid-to-SVG export** (`exportLayoutAsSvg`) — a dependency-free
  utility producing a standalone SVG snapshot of the current layout.
  See [Layout export to SVG](/examples/28-example).
- **Undo/redo** (`enableUndoRedo`, capped via `undoHistoryLimit`) —
  opt-in history at committed-change granularity (drag/resize end,
  add/remove), not per intermediate frame. See
  [Undo/redo](/examples/43-example).
- **Add/remove items freely**, with automatic re-compaction — no manual
  position math required. See [Add or remove items](/examples/10-example).

## Multi-select & group operations

- **Select multiple items** — click to select, Shift/Ctrl/Cmd+click to
  add additively, click empty background to clear.
- **Group move and resize** — drag or resize any selected item and the
  rest of the selection moves or resizes by the same delta, from mouse
  or keyboard alike. See [Multi-select & group move/resize](/examples/37-example).

## Responsive

- **Breakpoint-based column counts**, with sensible defaults
  (`xxl`/`xl`/`lg`/`md`/`sm`/`xs`/`xxs`) and fully customizable
  breakpoints/columns. See [Responsive breakpoints](/examples/07-example).
- **Pre-defined layouts per breakpoint**, for full control over how
  content reflows instead of relying on auto-generation. See
  [Responsive predefined layouts](/examples/09-example).

## Internationalization

- **RTL mirroring** for an entire layout or individual items — positions
  (and dragging) flip horizontally with a single prop. See
  [Mirrored (RTL)](/examples/06-example).

## Accessibility

- **Keyboard move & resize.** Every non-static, editable item is
  keyboard-focusable — arrow keys move it, Shift+arrow keys resize it —
  without needing any extra configuration. Reuses the exact same
  events/collision handling the mouse-driven path uses. See
  [`docs/ACCESSIBILITY.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/ACCESSIBILITY.md)
  in the source repo for the full scope, including what's deliberately not
  (yet) covered.
- **Screen reader support** — interactive items are announced with
  `role="group"` and a description of the available keyboard controls;
  visible focus indicator for keyboard users.
- **Localizable ARIA strings** (`ariaLabels`) — the close button's
  label, `aria-roledescription`, and the keyboard move/resize
  instructions are overridable (`GridLayout` grid-wide default,
  `GridItem` per-item override), rather than hardcoded English
  literals.

## Cross-grid & external drag-and-drop

- **Drag items from outside the grid** using the browser's native HTML5
  drag-and-drop API. See [Drag, drop from outside](/examples/11-example).
- **Drag items between two independent grids.** See
  [Drag, drop from grid to grid](/examples/12-example).
- **Multiple grids on one page** with zero shared state or configuration.
  See [Multiple grids](/examples/04-example).

## Styling & customization

- **Unstyled-by-default content** — `GridItem`'s slot holds whatever you
  put there; the library only handles position/size.
- **Built-in close button**, or bring your own via the exported
  `CustomCloseButton`/`CustomDragElement` components. See
  [Show close button](/examples/13-example) and
  [Custom drag handle & close button](/examples/18-example).
- **Configurable border radius** per item. See [Border radius](/examples/14-example).
- **Optional grid line guides**, useful while building a layout or as a
  permanent visual aid. See [Show grid lines](/examples/16-example).
- **CSS custom properties and SCSS variables** for deeper theming — see
  [Styling → Variables](/components/css-variables).

## Developer experience

- **Full TypeScript support.** Every prop, event, enum, and interface is
  typed and exported from the package's main entry point — see [API](/api/).
- **Zero runtime dependencies.** The drag/resize engine is built on
  native Pointer Events, not a third-party library — no `interact.js`
  or equivalent to audit or update.
- **`vue-ts-responsive-grid-layout/core`** — a separate, framework-agnostic
  entry point exposing this library's own grid-layout math (collision
  detection, movement, compaction, and more) with zero Vue dependency
  and no live-DOM requirement — usable standalone, e.g. for server-side
  layout validation.
- **Vue 3 Composition API**, built with `<script setup>` throughout —
  works equally well with the Options API in consuming projects.
- **Well-tested.** A full unit, component, and end-to-end test suite backs
  every release, at **99%+ statement, 95%+ branch coverage** — see the
  [Test Coverage](/guide/coverage) page for the full breakdown.
