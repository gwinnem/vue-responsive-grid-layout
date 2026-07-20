# Parity Gap Implementation Plan

Tracks the closable feature gaps identified against five actively-checked
alternatives — `qmhc/grid-layout-plus`, `merfais/vue-grid-layout-v3`,
`xhlife/vue3-grid-layout` (npm: `vue3-grid-layout-next`),
`marshal-zheng/vue-grid-layout` (npm: `@marsio/vue-grid-layout` — same
project, GitHub repo and npm package name), and
`react-grid-layout/react-grid-layout` v2 — plus `gridstack.js`'s
swap-on-drag gap, tracked separately as `ROADMAP.md` item 8 rather than
folded into this plan (excluded from this plan on request).

See `COMPARISON_ALTERNATIVES.md` for the full comparative research this
plan is built on — this document is the "how to close them," not a
repeat of the "what's missing and against whom" analysis.

**Confirmed directly, not assumed**: `grid-layout-plus`,
`vue-grid-layout-v3`, and `vue3-grid-layout-next` are all faithful Vue-3
ports of the original `jbaysolutions/vue-grid-layout` feature set — none
of the 9 items below trace to any of those three. All 9 trace to either
`@marsio`/`marshal-zheng` (7 items) or `react-grid-layout` v2 (2 items).
`xhlife/vue3-grid-layout` has its own open, unresolved reliability issue
(GitHub #17 — a shrinking responsive grid overlaps cards instead of
properly collapsing columns) worth knowing about but not a "gap" this
plan closes, since it's a bug in a different project, not a missing
feature here.

## Phase 1 — low risk, extends existing systems, clear value

### 1. Configurable resize-handle set

**Source**: `@marsio/vue-grid-layout`'s `resizeHandles: Array<'s'|'w'|'e'|'n'|'sw'|'nw'|'se'|'ne'>`.

**Current state** (checked directly): `GridItem.vue` always renders all
8 resize-hint `<span>`s (`vue-resize-hint--n/s/e/w/ne/nw/se/sw`);
`showResizeHandles` only toggles visibility via CSS, not which handles
exist. `useGridItemResize.ts`'s `tryMakeResizable()` collects every
handle ref that's actually present in the DOM into `handleEls` and
wires each one to the native drag engine — it doesn't hardcode which
refs to expect.

**Design**: new prop `resizeHandles?: Array<'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'>`,
default `undefined` meaning all 8 (preserving current behavior exactly).
Two changes needed:
- Template: gate each `<span>`'s existing `v-if="resizableAndNotStatic"`
  with an additional check that the edge is in the resolved handle set
- `tryMakeResizable()`: **no change needed** — it already only wires
  refs it finds present; a handle simply not rendered is automatically
  absent from `handleEls`

**Inheritance**: follows the existing `showResizeHandles`-style
null-inherit pattern (`GridLayout`-level default, per-`GridItem`
override), for consistency with every other similarly-scoped prop.

**Effort**: small.

**Tests**: unit test confirming an excluded handle doesn't render; e2e
test confirming a hidden handle genuinely can't be dragged (matching
the existing `resizeIgnoreFrom` test pattern in `item-overrides.spec.ts`).

---

### 2. Spacing guides with distance labels

**Source**: `@marsio/vue-grid-layout`'s spacing guides (distance labels
like "2 cols"), alongside its edge/center alignment guides.

**Current state**: `alignment-helper.ts`'s `findAlignmentGuides()`
returns edge-alignment lines only — no distance/gap information at all.

**Design**: new function `findSpacingIndicators(layout, activeItem)` in
the same file, alongside the existing `findAlignmentGuides`/
`findSnapAdjustment`. For each axis, finds the *nearest* neighbor
above/below/left/right of `activeItem` (not every item — just the
closest gap on each side, unlike `findAlignmentGuides`'s all-matches
approach) and returns `{ axis, gapStart, gapEnd, distance }[]`.
Rendering reuses the existing alignment-guide overlay layer in
`GridLayout.vue` — same CSS stacking context, a new element type (a
small text badge at the gap's midpoint) alongside the existing guide
lines.

**Prop surface**: new, independent `showSpacingGuides?: boolean`
sibling to the existing `showAlignmentGuides` — not a combined enum,
matching how `snapToGrid` and `showAlignmentGuides` are already two
separately-toggleable, composable features rather than one.

**Effort**: moderate — new geometry logic (nearest-neighbor, not
all-matches), new rendering path, new prop.

**Tests**: unit tests on `findSpacingIndicators` directly (matching the
existing `alignment-helper.spec.ts` pattern); e2e test confirming a
spacing badge appears with the correct grid-unit count during a drag.

---

### 3. Per-input-type drag-activation thresholds

**Source**: `@marsio/vue-grid-layout`'s `dragActivationDistance`
(distinct mouse/pen/touch values).

**Current state**: not yet confirmed — first implementation step is
locating `native-interaction.ts`'s current activation-distance handling
before finalizing this design, not assuming a specific existing
threshold constant's name/location.

**Design**: new prop `dragActivationDistance?: number | { mouse?: number; touch?: number; pen?: number }`,
default preserves the current single-threshold behavior for every
pointer type (no behavior change for existing consumers). The native
engine's own `pointerdown`/`pointermove` handling already has access to
`PointerEvent.pointerType` (`'mouse'`/`'touch'`/`'pen'`) — the change is
reading the per-type value from this new prop instead of one fixed
constant.

**Effort**: small, contained to `native-interaction.ts`.

**Tests**: extend the existing `touch-input.spec.ts` with a case
setting a distinct touch threshold and confirming a drag doesn't start
below it.

---

## Phase 2 — moderate effort, already-scoped or well-contained

### 4. Align/distribute commands on `multiSelect`

**Source**: `@marsio/vue-grid-layout`'s `align`/`distribute` commands
over the current selection.

**Status**: already tracked as `ROADMAP.md` item 23 (renumbered from a
duplicate 22 — see that file), with the scoping analysis already done:
confirmed genuinely missing, distinct from `snapToGrid` (magnetic snap
during a single drag) and `distributeEvenly` (spreading items that
overflow the grid's right edge). Ready to build, not "needs design."

**Design**: new methods exposed on `GridLayout`'s template ref,
alongside the existing `compactNow()`/`rearrange()`:
`alignSelected(edge: 'left'|'right'|'top'|'bottom'|'center-x'|'center-y')`
and `distributeSelected(axis: 'horizontal'|'vertical')`. Both operate
only on `selectedItemIds` (already tracked for `multiSelect`), compute
the target position from an anchor item, and commit through the
existing `commitUndoPoint` path — undo-able for free, no new history
mechanism needed.

**Open design decision**: which item is the alignment anchor.
Recommendation: first-selected item, for predictability — needs
confirming before implementation, not assumed.

**Effort**: moderate — the geometry itself is straightforward, but
needs careful interaction with existing collision/compaction (aligning
items may create new overlaps that then need to interact correctly
with `preventCollision`/compaction settings).

**Tests**: new coverage (extend `advanced-features.spec.ts` or a new
`multi-select-commands.spec.ts`) covering align on each edge, distribute
on each axis, and interaction with `preventCollision`.

---

### 5. Configurable container height modes

**Source**: `@marsio/vue-grid-layout`'s `heightMode`.

**Current state**: `containerHeight()` in `GridLayout.vue` is a small,
self-contained function currently branching only on `props.autoSize`
(boolean).

**Design**: new prop `heightMode?: 'auto' | 'fixed' | 'scroll' | 'fit'`,
default `'auto'` mapping to today's `autoSize: true` behavior exactly.
`autoSize` becomes a deprecated alias (`autoSize: false` → `heightMode:
'fixed'`), not a breaking removal — the same non-breaking migration
pattern already used for `compactType` replacing `verticalCompact` (see
`MIGRATION.md`).
- `'fixed'`: today's `autoSize: false` behavior (consumer sets height
  via CSS)
- `'scroll'`: fixed height + `overflow-y: auto` — not currently
  supported cleanly
- `'fit'`: height locked to the parent container, content scrolls
  internally

**Effort**: moderate — logic is contained to one function, but this is
the one Phase 2 item touching a widely-relied-on default behavior, so
needs the same careful non-breaking migration path as `compactType`.

**Tests**: unit tests for each mode's height calculation; e2e visual
check that `'scroll'` mode actually produces a scrollbar rather than
growing the container.

---

## Phase 3 — higher effort or architectural

### 6. Async persistence backends

**Source**: `@marsio/vue-grid-layout`'s multiple persistence backends
(localStorage, sessionStorage, IndexedDB, remote HTTP).

**Important finding from investigating this, not assumed**:
`useLayoutStorage` already accepts any `Storage`-compatible object —
**`sessionStorage` support already works today**, just by passing it in
as the `storage` option. The real, remaining gap is specifically
**async backends** (IndexedDB, remote HTTP), since the current
`save()`/`load()` are synchronous, built around the synchronous
`Storage` interface.

**Design**: rather than making the existing composable's API async (a
breaking change to every current consumer), add a **new, separate**
composable — `useAsyncLayoutStorage` — with its own adapter interface:

```ts
interface IAsyncLayoutStorageAdapter {
  save(key: string, value: string): Promise<void>;
  load(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
}
```

Ship `indexedDbAdapter()` and `remoteHttpAdapter(url, options)` as the
two built-in factories; `save()`/`load()` on the new composable return
`Promise<void>`/`Promise<boolean>`.

**Effort**: significant — this is genuinely "design an adapter
interface first," not "add IndexedDB." The IndexedDB adapter alone
needs its own connection-lifecycle handling (open/upgrade/close).

**Tests**: adapter interface tested against a fake/mock adapter first;
IndexedDB adapter tested via `fake-indexeddb` (a real new dependency to
flag and confirm before adding) or an in-memory test double.

---

### 7. Open pluggable CSS positioning strategy

**Source**: `react-grid-layout` v2's `positionStrategy` prop (any
strategy implementing its interface, vs. this project's `useCssTransforms`
on/off toggle between two built-ins only).

**Current state**: `useCssTransforms` is a boolean toggling between two
hardcoded strategies inside `GridItem`'s own inline style computation.

**Design**: new `IPositionStrategy` interface, mirroring the existing
`ICompactor` precedent (`docs/REFACTORING.md` #79):

```ts
interface IPositionStrategy {
  computeStyle(item: ILayoutItem, colWidth: number, rowHeight: number, margin: [number, number]): CSSProperties;
}
```

Ship `cssTransformStrategy`/`topLeftStrategy` as the two built-ins (the
current two behaviors, unchanged), with `useCssTransforms: boolean`
becoming sugar for picking between them — preserved, not removed, same
non-breaking pattern as item 5's `heightMode`/`autoSize`. New
`positionStrategy?: IPositionStrategy` prop overrides both when set.

**Effort**: significant — requires extracting `GridItem`'s current
inline style-computation logic into the two built-in strategy
implementations without regressing either, since this sits on the hot
path for every drag/resize frame.

**Tests**: the existing `useCssTransforms` e2e/unit coverage must keep
passing unchanged (regression proof the extraction didn't alter
behavior), plus new tests confirming a custom strategy actually gets
invoked.

---

## Phase 4 — large, niche payoff, do last if at all

### 8. Fast/O(n log n) compaction algorithm

**Source**: `react-grid-layout` v2's optional `fastVerticalCompactor`.

**Design**: a new `fastVerticalCompactor` implementing the *existing*
`ICompactor` interface — this slots into an extension point that
already exists (per finding #79), no new architecture required.
Algorithmic approach: replace the current per-item collision-scan
compaction with a sweep-line/interval-tree approach for the vertical
case specifically.

**Effort**: large — genuinely needs a real perf benchmark (large
synthetic layouts, e.g. 500+ items) proving the complexity claim before
shipping it as anything beyond a correctness-equivalent, same-speed
alternative. **Do not ship without the benchmark.**

---

### 9. Worker-based layout engine

**Source**: `@marsio/vue-grid-layout`'s opt-in Web Worker executor for
compaction/fit/responsive-generation on large layouts.

**Design**: an opt-in executor wrapping `compactLayout`/
`findFirstFitSlot`/responsive-layout-generation, running in a Web
Worker. Needs a serialization protocol (layouts are already plain,
JSON-serializable — a real advantage here) and graceful fallback when
Workers aren't available (SSR, older environments).

**Effort**: the largest single item in this plan — worker lifecycle,
message-passing protocol, and fallback behavior are all genuinely new
infrastructure, not extensions of existing code.

**Recommendation: defer until item 8 alone is proven insufficient** for
real large-layout cases. A fast synchronous algorithm may make this
unnecessary entirely — don't build this speculatively.

---

## Summary table

| # | Item | Phase | Effort | Source | New deps? |
|---|---|---|---|---|---|
| 1 | Resize-handle set | 1 | Small | `@marsio` | No |
| 2 | Spacing guides | 1 | Moderate | `@marsio` | No |
| 3 | Drag-activation thresholds | 1 | Small | `@marsio` | No |
| 4 | Align/distribute | 2 | Moderate | `@marsio` | No |
| 5 | Height modes | 2 | Moderate | `@marsio` | No |
| 6 | Async persistence backends | 3 | Significant | `@marsio` | Maybe (`fake-indexeddb`, tests only) |
| 7 | Pluggable positioning strategy | 3 | Significant | `react-grid-layout` v2 | No |
| 8 | Fast compaction | 4 | Large | `react-grid-layout` v2 | No |
| 9 | Worker engine | 4 | Largest | `@marsio` | No |

## Status

Not started. This is a planning document, not a record of completed
work — update each item's own entry (and `ROADMAP.md`'s corresponding
numbered item) as work actually begins/completes, the same way every
other tracked feature in this project is recorded.
