# Competitive Roadmap: Closing the Gaps in `COMPARISON_ALTERNATIVES.md`

This orders the gaps identified in
[`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md) (plus the
relevant open items already in [`ROADMAP.md`](./ROADMAP.md)) by actual
impact and feasibility — not just a re-listing. Some things that look
like "gaps" on paper aren't worth closing; that's called out explicitly
rather than padding this with busywork.

**Ranking logic**: impact (does this matter to someone actually
choosing between this library and an alternative) × feasibility (can
it be built without a disproportionate rewrite) × fit (does it match
what this library is actually for). Phase 0 isn't a feature at all, and
still ranks above every feature below it — explained first.

## Phase 0 — Publish (blocks everything else from mattering)

**The gap:** every alternative in the comparison — `vue-grid-layout`,
its community forks, `react-grid-layout`, `gridstack.js` — is on npm
and installable today. This library, as of `PRODUCTION_READINESS.md`,
is not. No feature advantage this document could ever describe matters
to someone who can't `npm install` it.

**Effort:** none, code-wise — `npm run package` already builds and
validates the exact publishable tarball. What's missing is a human with
npm credentials running `npm login && npm publish`, plus the
`NPM_TOKEN` GitHub secret so future releases publish automatically.

**Why this outranks every feature below:** a feature-complete library
nobody can install loses to a feature-poor library that's one
`npm install` away, every time. This is the only item on this whole
roadmap that isn't a design or engineering question.

## Phase 1 — Cheap, high-value, low-risk (reuses existing patterns)

### 1a. Custom resize-handle rendering (closes the `react-grid-layout` gap) — done

Implemented as a `#resize-handle` scoped slot on `GridItem`, invoked
once per handle with `{ edge }` (`'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw'`)
— exactly the shape predicted below. Additive as expected: the
existing `showResizeHandles`/`resizeHandleColor` color/visibility
toggle keeps working unchanged as the default case; the slot renders
inside the same hit-area, and both can be combined. See
[Multi-select & group move/resize](https://vue-ts-responsive-grid-layout.winnem.tech/examples/37-example),
which also demonstrates this slot.

**The gap:** `react-grid-layout`'s `resizeHandle` prop accepts a full
custom component/render function per handle. This library's
`showResizeHandles`/`resizeHandleColor` only toggle visibility and
color — a real, specific gap called out in the comparison, not a vague
one.

**Why it's cheap:** the `#placeholder` scoped slot (custom
drag-placeholder content) already established the exact pattern needed
— a named slot per resize handle (`#resize-handle-se`,
`#resize-handle-n`, etc., or a single `#resize-handle` slot with the
edge/corner passed as a scoped prop) would follow the same shape.
Low architectural risk because it's additive: the current
color/visibility toggle keeps working as the default, unstyled case.

**Effort:** small — a few days, mostly in `GridItem.vue`'s template and
the existing resize-hint CSS, plus VitePress docs/example and demo/
sandbox wiring, following the exact process every recent feature in
this project's history has used (implement → typecheck → test →
verify → document).

### 1b. A layout-level `enableEditMode` toggle — done

Implemented exactly as predicted below — a one-line application of the
existing inherit-from-`GridLayout` pattern. One real wrinkle found
along the way, not anticipated here: `enableEditMode`'s default
changed from `true` (a plain boolean) to `null` (inherit), which meant
every place reading the raw `props.enableEditMode` directly —
`useGridItemDrag`/`useGridItemResize`/`useGridItemKeyboard`, not just
the template — needed updating to read the *resolved* value instead,
since `null` is falsy and would otherwise have silently disabled every
interaction by default. Caught by typechecking and the full test suite
before considering this done, not assumed safe from the pattern alone.

**The gap:** not from the competitive comparison directly, but it's the
cheapest remaining item on `ROADMAP.md` (#13) and a genuinely common
ask — "view mode" vs. "edit mode" for a whole dashboard, without
setting `enableEditMode` on every item individually.

**Why it's cheap:** this is a one-line application of the *exact*
inherit-from-`GridLayout` pattern `isDraggable`/`isResizable`/
`showCloseButton` already use — no new mechanism, just one more prop
following the established convention.

**Effort:** very small — likely under a day including tests/docs.

## Phase 2 — The single biggest feature gap: multi-select + group move/resize — done, deliberately scoped

Implemented as `multiSelect` (opt-in, off by default). Click selects
only that item; Shift/Ctrl/Cmd+click adds additively; clicking empty
background clears the selection. Dragging/resizing a selected item
while more than one is selected moves/resizes every other selected
item by the same delta.

**This is a deliberately reduced scope from a fully collision-aware
group transform** — read this section below (kept as originally
written) for why that would have been the far larger undertaking, and
note specifically what was *not* built: no per-passenger collision
detection against non-selected items during the gesture itself (only
the dragged/resized anchor item gets that); the delta is applied
directly to every other selected item's position/size, with
compaction (per `compactType`) left to run normally once the
gesture ends, not modeled live during the drag. This is a real,
working feature for the common case — moving/resizing a genuinely
overlapping, collision-aware multi-selection remains unbuilt, and
would be its own, separate, larger effort if ever needed. See
`docs/REFACTORING.md` for the full account of what was built and why
this scope line was drawn where it was.

**Update, found via a later audit**: the "how does arrow-key movement
work for a multi-selection?" question the analysis below raises as one
reason this was hard *is* now answered — it works, via the same
group-move mechanism the mouse-driven path uses (see
`docs/REFACTORING.md` #75). That audit also found and fixed three real
bugs in the initial implementation (a passenger's own size constraints
being ignored during group resize; a static/non-draggable passenger
being moved anyway; a removed item's id lingering in the selection
indefinitely) — the scope reduction itself held up, but the first pass
at implementing it wasn't bug-free.

**The gap:** none of the four alternatives checked in the comparison
were confirmed to have this either, but it's the most consistently
requested feature *category* for dashboard-builder UIs generally (drag
a marquee selection, move/resize several items together), and it's
already flagged in `ROADMAP.md` as "the item most likely to reshape the
architecture if attempted."

**Why it's ranked here, not first:** this is genuinely large — it
touches the collision/compaction model (what does `preventCollision`
mean for five items moving as one unit?), the keyboard-accessibility
model (how does arrow-key movement work for a multi-selection?), and
probably needs new events (`selection-changed`) and new exposed state.
Building it before Phase 0/1 would mean spending the most effort on the
least-de-risked part of the codebase.

**Recommended approach**: a design document *before* any code — the
`ROADMAP.md` entry already says this explicitly, and it's worth
repeating here because it's the one item on this roadmap where writing
code first would likely mean rewriting it once the real edge cases
(dragging a multi-selection across a `preventCollision`-blocked area;
resizing multiple items with different aspect ratios) surface.

**Effort:** large — likely the single biggest single item in this
document, probably spanning several sessions' worth of design +
implementation + the same test rigor (99%+ coverage, mutation testing)
this project holds everything else to. **In practice, implemented in
one session by deliberately narrowing scope** (see above) rather than
building the fully collision-aware version this section originally
anticipated — a real trade-off, not a shortcut taken silently.

## Phase 3 — Nuxt module with a real, systematic SSR audit

**The gap:** `gridstack.js` ships official framework wrappers including
first-class SSR-friendly patterns; this library has had exactly one
SSR bug found and fixed (an unguarded `navigator.userAgent` read),
confirmed with one real SSR render — not a systematic sweep.

**Why it's here and not higher:** Nuxt is a large fraction of the
real-world Vue ecosystem, so this has real reach — but it's blocked on
doing the audit properly rather than shipping a thin wrapper and
calling it done, which is exactly the mistake `ROADMAP.md` already
flags as the risk to avoid.

**Effort:** medium — the audit itself (systematically checking every
`window`/`document`/`navigator`/`ResizeObserver` reference for an SSR
guard) is mechanical but needs to be exhaustive, not sampled. The
actual Nuxt module wrapper afterward is comparatively small.

## Phase 4 — Sub-grid / nesting support

**The gap:** `gridstack.js` supports grids-within-grids as first-class
nested structures. This library's cross-grid feature
(`allowCrossGridDrag`) is sibling-to-sibling dragging between
independent grid instances — genuinely useful, but not the same
capability, and the comparison calls that difference out explicitly
rather than blurring it.

**Why it's ranked this low:** it's the most architecturally invasive
item on this list short of multi-select — nesting changes what "the
grid's own coordinate space" even means (a nested grid's items need
coordinates relative to their parent `GridItem`, not the page), which
touches collision detection, compaction, and the responsive breakpoint
system all at once. Worth doing only after Phase 2's multi-select
work has already tested how much architectural change this codebase
can absorb in one effort.

**Effort:** large, comparable to or bigger than Phase 2 — and probably
easier to scope well *after* Phase 2, once there's a recent precedent
for how a big structural feature was actually designed and landed here.

## Phase 5 — Editor-grade completeness (real, but not urgent)

Lower-impact than everything above, genuinely useful for a
dashboard-*builder* product specifically rather than a fixed dashboard:

- **Undo/redo** — `ROADMAP.md` already flags the real design risk
  (auto-snapshotting every internal change could get memory-heavy on a
  large layout with a long history) and recommends a size-capped
  history or an explicit `pushUndoPoint()`/`undo()`/`redo()` API a
  consumer calls deliberately. That guidance still holds.
- **Swap-on-drag collision mode** — an alternative to the current
  push/compact collision behavior (two items trade positions instead
  of one displacing the other). Self-contained, doesn't block on
  anything else in this document.

## What's explicitly *not* recommended

**Multi-framework support (React/Angular ports).** `gridstack.js`
covers this by keeping a framework-agnostic vanilla-JS core with thin
wrappers per framework — a fundamentally different architecture from
this library, which is built on Vue 3's reactivity and Composition API
throughout (the entire drag/resize/collision system is Vue refs and
computeds, not a framework-agnostic engine with a Vue adapter bolted
on). Retrofitting that split now would mean rewriting the core, not
adding a wrapper — effectively becoming a different library. The
honest recommendation is to stay Vue-3-native and let a framework-
agnostic engine be someone else's project, rather than chasing feature
parity with `gridstack.js` on an axis this library was never built
along.

**Chasing ecosystem size/stars directly.** Not something a roadmap
item can produce — it's a consequence of Phase 0 (being installable at
all) plus time, not something to plan a sprint around.

## Sequencing summary

| Phase | Item | Impact | Effort | Blocks later phases? | Status |
|---|---|---|---|---|---|
| 0 | Publish to npm | Critical — nothing else matters without it | None (code-wise) | N/A — do this regardless | Still open (needs your own npm session) |
| 1a | Custom resize-handle rendering | Medium — closes one specific, named competitive gap | Small | No | **Done** |
| 1b | Layout-level `enableEditMode` | Small — common convenience ask | Very small | No | **Done** |
| 2 | Multi-select + group move/resize | Large — the biggest feature gap in the category | Large | Informs how Phase 4 gets scoped | **Done, deliberately scoped down** (see above) |
| 3 | Nuxt module + real SSR audit | Medium-large — real ecosystem reach (Nuxt is huge in Vue) | Medium | No | Open |
| 4 | Sub-grid/nesting | Medium — closes a named `gridstack.js` gap | Large | Best attempted after Phase 2 | Open |
| 5 | Undo/redo, swap-on-drag | Medium — editor-grade completeness | Medium each | No | Open |
| — | Multi-framework support | N/A | N/A | **Not recommended** | N/A |
