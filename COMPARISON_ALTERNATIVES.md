# Comparison: `vue-ts-responsive-grid-layout` vs. Other GitHub Grid-Layout Projects

## Scope

This compares projects in the actual same category as this library —
**draggable/resizable dashboard layout engines** (position arbitrary
widgets on a grid, drag/resize them, responsive breakpoints) — not data
tables/grids (Kendo's Grid, AG Grid, etc.), which solve a different
problem entirely. For Kendo's own actual layout-engine peer (TileLayout)
and DevExtreme's Dashboard Designer, see
[`COMPARISON_COMMERCIAL.md`](./COMPARISON_COMMERCIAL.md) instead — kept
separate since both are commercial products with a different licensing
model, not open-source peers. Star counts and last-release info below
are approximate,
pulled from a live search rather than memorized, but GitHub numbers
move constantly — treat them as "roughly this order of magnitude," not
a live count.

Projects compared:
- **[`jbaysolutions/vue-grid-layout`](https://github.com/jbaysolutions/vue-grid-layout)** — the original Vue library this whole space descends from. ~7.4k stars.
- **[`qmhc/grid-layout-plus`](https://github.com/qmhc/grid-layout-plus)** — a Vue 3 migration of the original, TypeScript, `<script setup>`, its own VitePress docs site (English/Chinese). ~600 stars, but **~66k weekly npm downloads** as of this check — a genuine gap in an earlier version of this document, since by actual usage this is arguably the closest thing to a "default" Vue 3 choice in this space, not just one more fork among several.
- **[`merfais/vue-grid-layout-v3`](https://github.com/merfais/vue-grid-layout-v3)** — a community Vue 3 port/fork, published as `vue-grid-layout-v3`.
- **[`xhlife/vue3-grid-layout`](https://github.com/xhlife/vue3-grid-layout)** — another independent community Vue 3 port, published as `vue3-grid-layout-next`.
- **[`marshal-zheng/vue-grid-layout`](https://github.com/marshal-zheng/vue-grid-layout)** (npm: `@marsio/vue-grid-layout`) — a much newer (~6 months old, v1.0.3), much smaller (double-digit weekly downloads) but technically ambitious fork: Pinia-backed undo/redo history, a web-worker layout engine for heavy operations, configurable drag-activation-distance thresholds, and its own command-kernel/editor layer (select, align, distribute, lock, sections). Worth knowing about for the specific features it has that this library doesn't (undo/redo, in particular), even though its adoption is a fraction of the options above.
- **[`react-grid-layout/react-grid-layout`](https://github.com/react-grid-layout/react-grid-layout)** — the React equivalent and, arguably, the reference implementation the whole category traces back to. Recently did a full v2 TypeScript rewrite with a hooks API.
- **[`gridstack/gridstack.js`](https://github.com/gridstack/gridstack.js)** — framework-agnostic (vanilla JS core), ~8.7k stars, ships official Vue 3/React/Angular wrapper components.

## The headline finding: the Vue 3 side of this ecosystem is fragmented — though less than an earlier version of this document suggested

`jbaysolutions/vue-grid-layout` — the most popular, most-forked option
by star count — **still has no official Vue 3 release on its main npm
package**, years after Vue 3 shipped. Its own GitHub issues confirm
this: people were still asking *"Known alternative using Vue3?"* as
late as mid-2022, years after Vue 3's release. What filled the gap
instead is a scatter of independent, differently-named community
forks — `vue-grid-layout-v3`, `vue3-grid-layout-next`,
`vue3-grid-layout`, `fleet-grid-layout`, at least one explicitly marked
*"Package no longer supported"* — each maintained by a different
individual.

**Correction from an earlier pass**: one of those forks,
`qmhc/grid-layout-plus`, has actually emerged as something close to a
de-facto default by real usage — ~66k weekly npm downloads is an order
of magnitude ahead of the other forks checked here, it has its own
polished VitePress documentation site, and its release history shows
regular maintenance. Framing this ecosystem as having "no single
obvious default choice" undersold that. `vue-ts-responsive-grid-layout`
is a newer entry in the same overall gap (still no *official* Vue 3
release from `jbaysolutions` itself), built as a ground-up TypeScript
rewrite rather than a patched fork of the Vue 2 codebase — but
`grid-layout-plus` specifically, not the whole fragmented field
equally, is the more accurate comparison to have front-of-mind.

## Feature comparison

| Feature | `vue-ts-responsive-grid-layout` | `vue-grid-layout` (jbaysolutions) | `grid-layout-plus` (the actual adopted Vue 3 fork — see "Vue-ecosystem parity gap" below) | `react-grid-layout` | `gridstack.js` |
|---|---|---|---|---|---|
| Native Vue 3 support | Yes, ground-up | No official release — Vue 3 stuck in an unmerged/informal branch for years | Yes — that's their entire reason to exist | N/A (React) | Yes, official wrapper |
| Written in TypeScript from the start | Yes | No (Vue 2 era JS, `@types` bolted on historically) | Mixed — ports of a JS codebase | Yes, as of v2 (full rewrite) | Yes (core is TS) |
| Framework | Vue 3 only | Vue 2 (Vue 3 unofficial) | Vue 3 only | React only | Framework-agnostic core + official Vue/React/Angular wrappers |
| Basic drag/resize, responsive breakpoints, compaction | Yes | Yes (the original) | Yes (inherited from upstream) | Yes (the reference implementation) | Yes |
| Cross-grid drag/drop (drag an item from one grid instance into another) | Yes (`allowCrossGridDrag`, with accept/reject rules) | No | No | No built-in equivalent | Yes, via sub-grids/nested grids — a different mechanism (grids-within-grids, not independent sibling grids) |
| Drag-and-drop from *outside* the component entirely | Yes (`allowOutsideDrop`, `outsideDropAccept`, typed-payload helper) | No | No | Yes (`onDrop`/`isDroppable`) — comparable feature, present here too | Yes (`setupDragIn`) |
| Magnetic snap-to-grid (position actually adjusts, not just visual) | Yes (`snapToGrid`/`snapThreshold`) | No | No | No | No (has grid-cell snapping as its default drag model, but no separate "visual guide vs. magnetic snap" distinction) |
| Visual alignment guides (Figma-style, non-committal) | Yes (`showAlignmentGuides`) | No | No | No | No |
| Blocked-move feedback event | Yes (`MOVE_BLOCKED_BY_COLLISION`) | No | No | No | No |
| Named layout presets (save/switch multiple saved arrangements) | Yes (`useLayoutPresets`) | No (roll your own) | No | No (roll your own) | No (roll your own) |
| First-party persistence helper | Yes (`useLayoutStorage`/`serializeLayout`/`deserializeLayout`) | No (roll your own `localStorage` code) | No | No | Yes — `save()`/`load()` methods are built into the core engine itself |
| Grid-to-image/SVG export | Yes (`exportLayoutAsSvg`, dependency-free) | No | No | No | No |
| Localizable UI/ARIA strings | Yes (`ariaLabels`) | No | No | No | No |
| Per-item auto-height to content | Yes (`autoHeight`, real `ResizeObserver`) | No | No | No | Partial — `sizeToContent` option exists but works differently (content-driven initial sizing, not a live-resync-on-change subscription) |
| Configurable resize-handle visual appearance (color/visibility toggle) | Yes (`showResizeHandles`/`resizeHandleColor`) | Limited (CSS-only override) | Limited | Yes (`resizeHandle` custom render prop) | Limited |
| Keyboard-only move/resize (no mouse) | Yes (arrow keys / shift+arrow) | No | No | No | No |
| Multi-select + group move/resize | Yes (`multiSelect`, deliberately scoped — no per-passenger collision detection during the gesture) | No | No | Not confirmed in the scope checked here | Not confirmed in the scope checked here |
| Custom resize-handle rendering (full custom component/icon, not just color) | Yes (`#resize-handle` scoped slot) | No | No | Yes (`resizeHandle` render prop) | Limited |
| Custom drag-placeholder slot/content | Yes (`#placeholder` scoped slot) | No | No | Yes (`placeholder` prop can be a custom element) | Limited |
| Dependency footprint | Zero third-party runtime dependencies as of 2.0.0 — `interact.js` (previously ~59-63% of this library's own gzipped bundle) was replaced with a native, Pointer Events-based drag/resize engine; only `mitt` remains, a ~200-byte event emitter. See `docs/BUNDLE_ANALYSIS.md` and `MIGRATION.md` for the upgrade path | jQuery-free (own drag implementation) | Same as upstream | Zero runtime dependencies | Zero runtime dependencies (core); jQuery-free since v3 |
| Approximate bundle size (core, gzip) | ~43.5 KB | Historically larger due to age/JS-era tooling; not independently re-measured here | Not independently measured here | Smaller — a leaner, more focused feature set by design | Larger — it's a full dashboard engine including its own persistence/sub-grid system, not just drag/resize |
| License | MIT | MIT | MIT | MIT | MIT (core); some enterprise add-ons commercially licensed |
| Test coverage rigor (as publicly documented) | 99%+ statement/branch coverage, mutation testing (Stryker), documented in-repo | Not documented to this level publicly | Not documented to this level publicly | Has its own test suite; coverage rigor not published as a specific number | Has its own test suite; coverage rigor not published as a specific number |
| Accessibility (keyboard, ARIA) | Explicit, documented scope: keyboard move/resize, `aria-roledescription`/`aria-describedby`, **not** a full WAI-ARIA grid/application pattern | Minimal | Minimal (inherited) | Minimal | Minimal |
| Maintenance/community size | Small, newer project | Large community, ~7.4k stars, but the flagship Vue 3 gap itself is the clearest sign of maintenance strain | Smaller, single-maintainer forks | Large, very active, ~20k+ stars historically, recent major rewrite | Large, ~8.7k stars, actively developed, official multi-framework wrappers |

### `grid-layout-plus` parity gap — a precise comparison, not a hedge

Read its actual Properties/Events docs page (the complete prop and
event list it publishes, not the homepage summary) rather than
continuing to guess. It's a genuinely full-featured, actively
maintained library — closer to feature parity with the *original*
`jbaysolutions/vue-grid-layout` than the summary above implied, since
it's a faithful Vue 3 migration of that same codebase. Its own docs
confirm it has: `layout`/`responsiveLayouts`/`colNum`/`rowHeight`/
`maxRows`/`margin`/`isDraggable`/`isResizable`/`isMirrored`/`isBounded`/
`autoSize`/`verticalCompact`/`restoreOnDrag`/`preventCollision`/
`useCssTransforms`/`responsive`/`breakpoints`/`cols`/`transformScale`
on `GridLayout`; `minW`/`maxW`/`minH`/`maxH`/`isDraggable`/`isResizable`/
`isBounded` (same null-inherit pattern this project uses)/`static`/
`dragIgnoreFrom`/`dragAllowFrom`/`resizeIgnoreFrom`/
`preserveAspectRatio`/`dragOption`/`resizeOption` on `GridItem`; and
`layout-before-mount`/`layout-mounted`/`layout-ready`/`layout-updated`/
`breakpoint-changed`/`move`/`resize`/`moved`/`resized`/
`container-resized` events. It also likely has **no `interact.js`
dependency at all** — being a migration of the original codebase's own
hand-rolled drag implementation, not a rewrite onto interact.js the
way this project is — which would make its dependency footprint and
maintenance-risk profile for that piece a real edge over this project,
not confirmed with a source read but a reasonable inference from its
lineage.

**What its own documented API confirms it doesn't have**, checked
directly rather than assumed from an absence in a summary list:

| Feature this project has | In `grid-layout-plus`'s own docs? |
|---|---|
| `allowOutsideDrop` (first-class prop, typed payload) | No — its "Drag From Outside" example instead reaches into internal, undocumented state (`item.wrapper`, `item.state`) and calls `dragEvent()` directly; a fragile workaround, not a supported feature |
| `allowCrossGridDrag` (drag between independent grid instances) | No — its "Multiple Grid Layouts" example is independent grids on one page, not dragging between them |
| `snapToGrid`/`showAlignmentGuides` | No |
| `MOVE_BLOCKED_BY_COLLISION` event | No |
| `useLayoutPresets`/`useLayoutStorage` (named presets, first-party persistence) | No — "layout can be serialized" just means it's a plain array you `JSON.stringify` yourself |
| `exportLayoutAsSvg` | No |
| `ariaLabels` (localizable UI/ARIA strings) | No |
| `autoHeight` (live `ResizeObserver`-driven per-item sizing) | No |
| `showResizeHandles`/`resizeHandleColor`, `#resize-handle` slot | No — no visible resize-handle affordance beyond a cursor change |
| Keyboard move/resize (arrow keys) | No |
| `multiSelect` + group move/resize | No |
| `enableEditMode` grid-wide master switch | No — has the same `isDraggable`/`isResizable` null-inherit pattern, but no single toggle disabling drag+resize+close together |
| `distributeEvenly` | No |
| `layout-created`/`columns-changed` events | No |
| `#placeholder` custom-content slot | Not confirmed either way — its "Styling Placeholder" example wasn't read in enough depth to confirm content vs. CSS-only styling |

## `react-grid-layout` v2 parity gap — checked against its actual recent rewrite, not the older v1 API

Worth doing precisely rather than folding into the bullet list below,
since `react-grid-layout` did a real v2 rewrite recently (hooks API,
`react-grid-layout/legacy` kept for 100% v1 compatibility) that changes
what "ahead"/"behind" means here — this isn't the same comparison as
checking its older, more widely-referenced v1 API would give.

**What v2 has that this project doesn't:**

| Feature | This project | `react-grid-layout` v2 |
|---|---|---|
| Pluggable compaction algorithm | ~~No~~ **Done** — an `ICompactor` interface, swappable via the `compactor` prop (`null` default falls back to whichever built-in strategy `compactType` selects, unchanged); `verticalCompactor`/`horizontalCompactor`/`noCompactor`/`verticalOverlapCompactor`/`horizontalOverlapCompactor` ship as the five built-in strategies. See `docs/REFACTORING.md` #79. No fast/O(n log n) alternative algorithm shipped alongside it yet, unlike `react-grid-layout`'s own optional `fastVerticalCompactor` | Yes — a `Compactor` interface, swappable via the `compactor` prop; ships a `fastVerticalCompactor` as an optional extra alongside its own default |
| Pluggable CSS positioning strategy | Partial — `useCssTransforms` is an on/off switch between two built-in strategies (CSS transforms vs `top`/`left`), not an open interface | Yes — a `positionStrategy` prop takes any strategy implementing its interface, not just a choice between two built-ins |
| Framework-agnostic core utilities as public API | ~~No~~ **Done** — `vue-ts-responsive-grid-layout/core` exports `collides`/`moveElement`/`compactLayout` and more, zero Vue dependency, verified via the pack-install smoke test. See `docs/REFACTORING.md` #78 | Yes — `compact`, `moveElement`, `collides` and others are importable from `react-grid-layout/core` with zero React dependency, usable standalone (e.g. server-side layout validation without mounting anything) |
| Multiple tree-shakeable entry points | ~~No~~ **Partially done** — `/core` is now a second, separate entry point (its own `es`+`cjs` build); no `/extras`/`/legacy`-equivalent split of the main entry itself yet | Yes — `react-grid-layout/core`, `/extras`, `/legacy` as separate entry points on top of the main one |

**What this project has that v2 doesn't** (per its own npm/GitHub docs,
not exhaustively verified beyond what's documented there): `snapToGrid`,
alignment guides, `MOVE_BLOCKED_BY_COLLISION`, named layout presets,
SVG export, localizable ARIA strings, per-item `autoHeight`, and
multi-select + group move/resize — the same set noted as unique among
every alternative checked in the section below, unchanged by v2's own
additions, which were about configurability/architecture rather than
this kind of end-user-facing feature surface.

## Vue-ecosystem parity gap — checked against the actual current leaders, not just `jbaysolutions/vue-grid-layout` itself

Worth its own section for the same reason as the `react-grid-layout`
one above: comparing against the original, Vue-3-less
`jbaysolutions/vue-grid-layout` alone understates the Vue ecosystem,
since real usage has already moved on to forks it never made an
official release of its own. Checked two specifically, chosen for
being the extremes of that ecosystem rather than arbitrary picks:
`grid-layout-plus` (the actual, adopted default — ~66k weekly npm
downloads) and `@marsio/vue-grid-layout` (the most feature-rich fork
found, though with minimal current adoption — 62 weekly downloads at
time of writing, published 6 months ago).

### `grid-layout-plus` (qmhc) — the real de-facto default, checked directly against its own README/CHANGELOG

A faithful Vue 3 + `<script setup>` + TypeScript **port** of the
original `jbaysolutions/vue-grid-layout` codebase, not an expanded
fork — its own README lists the same feature set the original had
(draggable/resizable/static widgets, bounds checking, add/remove,
serialize/restore, RTL, responsive), nothing more. Two concrete,
verified differences:

| | This project | `grid-layout-plus` |
|---|---|---|
| Runtime dependencies | Zero (native Pointer Events engine as of 2.0.0) | Still depends on `interactjs` (`^1.10.27`, confirmed in its own `package.json`) |
| Compaction / collision / multi-select / snap-to-grid / alignment guides / presets / persistence / SVG export / localizable ARIA / `autoHeight` | Yes to all (see the feature table above) | No to all — none of these appear anywhere in its README; it inherited the original's scope exactly, not an extended one |

The **entire "Where this project genuinely leads" list below applies
to `grid-layout-plus` at full strength** — unlike `react-grid-layout`
or `gridstack.js`, which each have at least a few of these, the actual
most-adopted Vue 3 option has essentially none of them. Its own appeal
is different: it's the known, battle-tested, "just the original,
finally on Vue 3" choice — not a feature competitor.

### `@marsio/vue-grid-layout` — the most feature-rich fork found, scope now closer to a dashboard-editor framework than a grid library

Grew well beyond "grid layout" into a genuine dashboard-editor
framework: a headless command layer (select, move, resize, add,
delete, duplicate, copy, paste, align, distribute, lock, sections),
Pinia-backed history, a widget registry protocol, a "dashboard
document" persistence model with responsive profiles, and even an MCP
server for AI-IDE tooling. Much of that surface (widget registry,
dashboard documents, editor shells, clipboard/palette wiring) is
arguably out of scope for an apples-to-apples *grid layout* comparison
— but several pieces are directly comparable, and genuinely ahead:

| Feature | This project | `@marsio/vue-grid-layout` |
|---|---|---|
| Align/distribute commands on a multi-selection | No (tracked as `ROADMAP.md` item 23, not started) | Yes — `align`/`distribute` commands over the current selection |
| Configurable resize-handle *set* (which corners/edges render) | No — `showResizeHandles` is only an on/off toggle for all handles at once | Yes — `resizeHandles: Array<'s'\|'w'\|'e'\|'n'\|'sw'\|'nw'\|'se'\|'ne'>` picks specific handles |
| Spacing guides with distance labels (e.g. "2 cols"), alongside edge/center alignment guides | No — `showAlignmentGuides` covers edge/center alignment only | Yes |
| Multiple layout-persistence backends | One — `useLayoutStorage` (localStorage-based) | Several — localStorage, sessionStorage, IndexedDB, and a remote-HTTP adapter, all through one adapter interface |
| Worker-based layout engine for very large layouts | No | Yes — an opt-in Web Worker executor for compaction/fit/responsive-generation on big layouts |
| Configurable container height modes (auto / fixed / scroll / fit-to-container) | No — height is always content-driven | Yes — `heightMode` |
| Separate drag-activation thresholds per input type | No | Yes — `dragActivationDistance` (distinct mouse/pen/touch values) |
| MCP server for AI-IDE tooling (Cursor, Claude Desktop) | No | Yes |

**Where this project is still ahead of it, confirmed directly from its
own README rather than assumed**: multi-select **group resize** —
its own docs state under "Known editor limits": *"group resize and
group bounding-box ghosting are not included"*, i.e. it only supports
group *move*, not group *resize*, across a multi-selection. This
project's `multiSelect` supports both. It also has no equivalent to
this project's cross-grid drag (`allowCrossGridDrag`), outside-drop
typed-payload helper, `snapToGrid` as a distinct magnetic-snap concept,
or per-item live-resyncing `autoHeight` — though given how large its
own scope has grown, some of these may exist under names not surfaced
in the sections actually read here.

## Where this project genuinely leads the category

Cross-referencing the table above, the features with **no equivalent
in any of the four alternatives checked** are: magnetic `snapToGrid`
(as distinct from a visual guide), visual alignment guides themselves,
the `MOVE_BLOCKED_BY_COLLISION` feedback event, named layout presets,
grid-to-SVG export, localizable ARIA strings as a dedicated prop
surface, a live-resyncing per-item `autoHeight`, and multi-select +
group move/resize (deliberately scoped — see
`COMPETITIVE_ROADMAP.md`/`docs/REFACTORING.md` for exactly what was and
wasn't built). None of these are
exotic — they're the kind of small, real-world friction points (a
consumer having to hand-roll persistence, or wire up their own
collision-shake animation, or accept English-only screen reader text)
that this project's `ROADMAP.md`/`docs/FEATURE_RECOMMENDATIONS.md`
process was specifically built to surface and close one at a time.

## Where this project is genuinely behind

- **Ecosystem size and battle-testing.** `react-grid-layout` and
  `gridstack.js` have years more production usage across far more
  companies. That's not a feature gap this library can close by
  writing code — it's just a newer project.
- **Framework breadth.** `gridstack.js` covers Vue, React, and Angular
  from one core engine. This library is Vue-3-only by design — a
  reasonable scope choice, but a real limitation if a team needs the
  same layout logic across multiple frameworks.
- **Sub-grids / nesting.** `gridstack.js` supports grids-within-grids
  as first-class nested structures. This library's cross-grid feature
  (`allowCrossGridDrag`) is sibling-to-sibling dragging between
  independent grid instances — a different capability, not a nesting
  system.
- **Swap-on-drag.** Checked directly against `gridstack.js`'s own
  changelog and docs, not assumed: dragging one item onto another of
  the same size swaps their positions, the default behavior in its
  `float: false` (top-gravity) mode since a 2022 rewrite of its
  collision code specifically to add this. This library only pushes
  items aside (compaction); an item landing on another never swaps
  with it. Tracked as open in `ROADMAP.md` item 8, not started.
- **Undo/redo** — ~~No~~ **Done**: `enableUndoRedo`/`undoHistoryLimit`
  props, `undo()`/`redo()`/`canUndo`/`canRedo`, committed-change
  granularity (not per drag-move frame). See `docs/REFACTORING.md` #80.
- **`@marsio/vue-grid-layout`'s command layer** (align/distribute over
  a selection, configurable resize-handle sets, spacing guides,
  multi-backend persistence, and more) — see the dedicated
  "Vue-ecosystem parity gap" section above for the full, current
  breakdown rather than repeating it here. Align/distribute
  specifically is tracked as open in `ROADMAP.md` item 23, not started.

## Bottom line

For a **Vue 3, TypeScript-first** dashboard layout library, the realistic
field is small and genuinely fragmented — the most-starred option
(`vue-grid-layout`) still doesn't officially support Vue 3, and what
exists instead is a handful of differently-maintained community forks
with no clear default. Measured against that actual field,
`vue-ts-responsive-grid-layout` has meaningfully more features (several
with no equivalent in any alternative checked) and a more rigorously
documented test/coverage process — at the cost of being a newer,
smaller-community project without the multi-year production track
record `react-grid-layout` or `gridstack.js` can claim.
