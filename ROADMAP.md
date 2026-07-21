# Roadmap

Forward-looking — what's suggested next, not a task list nobody's
committed to. For what's already built, see
[`FEATURES.md`](./FEATURES.md); for the published, curated version of
this page (with live example links), see
[the documentation site's roadmap](vitepress-docs/guide/roadmap.md); for
the fuller, source-grounded version of the suggestions below, see
[`docs/FEATURE_RECOMMENDATIONS.md`](./docs/FEATURE_RECOMMENDATIONS.md).

## Recently completed (context for what follows)

Cross-grid drag/drop (`allowCrossGridDrag`), drag-and-drop from outside
the grid system (`allowOutsideDrop`), resize from all eight edges/corners
with cursor affordance, keyboard move/resize, a `margin`/RTL/close-button
inheritance-after-mount fix, a first-party persistence helper
(`useLayoutStorage`/`serializeLayout`/`deserializeLayout`), a generic
`ILayoutItem<TMeta>` for attaching typed, consumer-defined data to each
layout item, configurable `transitionDurationMs`/
`transitionTimingFunction` (item position/resize/auto-height transitions,
applied via inherited CSS custom properties), a `#placeholder` slot for
custom drag-placeholder content, grid-unit-based alignment guides
(`showAlignmentGuides`) while dragging or resizing,
`scrollToItem(id)`/`focusItem(id)` exposed methods, a convenience
`autoScroll` prop finishing the previously-imported-but-unused
`@interactjs/auto-scroll` plugin, and a structural extraction of
`GridLayout.vue`'s cross-grid/outside-drop logic into their own
composables (mirroring `GridItem.vue`'s earlier drag/resize/keyboard
split). Then a further batch: `compactNow()`/`rearrange()`,
`duplicateItem(id)`, a `MOVE_BLOCKED_BY_COLLISION` feedback hook for
`preventCollision`, per-item `autoHeight` (a real `ResizeObserver` on a
new template-ref wrapper, not the fragile `slots.default()` lookup —
see `docs/REFACTORING.md`'s finding on this), magnetic `snapToGrid`/
`snapThreshold` (distinct from the visual-only `showAlignmentGuides`),
configurable resize-hint appearance (`showResizeHandles`/
`resizeHandleColor`), a typed-payload convention for `allowOutsideDrop`
(`readOutsideDropPayload<T>()`), `outsideDropAccept`, named layout
presets (`useLayoutPresets`), a dependency-free grid-to-SVG export
utility (`exportLayoutAsSvg`), shared design tokens between `demo/`
and `sandbox/` (`dev-shared/tokens.css` — this also fixed a real gap,
not just deduplicated: `sandbox/` referenced CSS variables that were
never actually defined anywhere), localizable UI/ARIA strings (an
`ariaLabels` prop on both `GridLayout` and `GridItem`, merging
built-in English defaults <- grid-wide override <- per-item override),
a custom `#resize-handle` slot (closing the `react-grid-layout` gap
around fully custom resize-handle rendering, not just a color toggle),
a layout-level `enableEditMode` (the same inherit pattern
`isDraggable`/`isResizable`/`showCloseButton` already use), and
multi-select + group move/resize (`multiSelect`, deliberately scoped
down from a fully collision-aware group transform — see
`docs/REFACTORING.md` for the exact scope and why) — see
`CHANGELOG.md` for the full list with dates. Several of the
suggestions below are direct follow-ups to this work, not independent
ideas.

## Suggested next features

### Follow-ups to recently completed work

1. ~~Configurable resize-hint appearance~~ — **done**, see "Recently completed" above.
2. ~~A typed-payload convention for `allowOutsideDrop`~~ — **done** (`readOutsideDropPayload<T>()`), see "Recently completed" above.
3. ~~`outsideDropAccept` — reject incompatible drags before they even show a placeholder~~ — **done**, see "Recently completed" above.
4. ~~Shared design tokens between `demo/` and `sandbox/`~~ — **done** (`dev-shared/tokens.css`), see "Recently completed" above.

### Carried over from `docs/FEATURE_RECOMMENDATIONS.md`

The items below are explored in much more depth (with source-code
references and concrete code sketches) in that file — summarized here
only to keep this page a single stop for "what's suggested":

5. ~~Generic `ILayoutItem<TMeta>`~~ — **done**, see "Recently completed" above.
6. ~~A first-party persistence helper~~ — **done**, see "Recently
   completed" above (`useLayoutStorage`/`serializeLayout`/`deserializeLayout`).
7. **A Nuxt module** — paired with an actual, systematic SSR audit. One
   concrete SSR-breaking spot (an unguarded `navigator.userAgent` read
   inside a template-bound computed) has already been found *and
   fixed* (confirmed with a real SSR render, not just read from source
   — see `docs/REFACTORING.md` #51), but that was one specific instance
   checked, not the exhaustive sweep a real audit would need before
   shipping a Nuxt wrapper around the rest of the codebase.
8. **Swap-on-drag collision mode** — dragging item A onto item B swaps
   their positions, as an alternative to the current push-aside
   compaction. Common in consumer tile-dashboard products.
9. ~~Multi-select + group move/resize~~ — **done**, see "Recently completed" above. Deliberately scoped down from a fully collision-aware group transform — see `docs/REFACTORING.md` for the exact scope and why.
10. ~~Alignment/snap guides during drag~~ — **done**, see "Recently completed" above.
11. ~~Configurable transition duration/easing~~ — **done**, see "Recently completed" above.
12. ~~`GridLayout.scrollToItem(id)`/`focusItem(id)`~~ — **done**, see "Recently completed" above.

**Update**: `interact.js` (and `dragOption`/`resizeOption` along with
it) was later removed entirely — `autoScroll` is now backed by a native
`requestAnimationFrame`-driven implementation instead (see
`docs/REFACTORING.md`), not configurable beyond on/off. This section is
kept as an accurate record of how the prop was first introduced, not a
description of how it works today.

### New suggestions

Checked against `FEATURES.md` before writing these down, to avoid
suggesting something that already exists in a different form:

13. ~~A layout-level read-only/edit-mode toggle~~ — **done**, see "Recently completed" above.
14. ~~A public `rearrange()`/`compactNow()` method~~ — **done**, see "Recently completed" above.
15. ~~Per-item auto-height to content~~ — **done** (`autoHeight` prop), see "Recently completed" above.
16. ~~A `duplicateItem(id)` method~~ — **done**, see "Recently completed" above.
17. ~~Undo/redo~~ — **done**: `enableUndoRedo`/`undoHistoryLimit` props,
    `undo()`/`redo()`/`canUndo`/`canRedo`. Snapshots at committed-change
    granularity (drag start→end, resize start→end, item add/remove,
    `compactNow()`/`rearrange()`) via an explicit `commitUndoPoint(before)`
    call at each — not the "auto-snapshot every internal change"
    approach this item originally warned against, and not per
    intermediate drag-move frame. Opt-in (`false` by default) given the
    real memory cost of keeping snapshots. See `docs/REFACTORING.md` #80.
23. **Align/distribute commands on `multiSelect`'s selected items** —
    found via a scoping pass on `@marsio/vue-grid-layout`'s own command
    layer (`COMPARISON_ALTERNATIVES.md`) before starting on it, which
    corrected an earlier, too-quick assumption: `snapToGrid` (magnetic
    snap *during* a single drag) and `distributeEvenly` (spreading
    items that overflow the grid's right edge) are different
    mechanisms from "align every selected item's left edge to match
    one anchor" or "evenly space the vertical gaps between selected
    items" as an explicit, on-demand command over a `multiSelect`
    group — genuinely missing, not just differently named. `isStatic`
    toggled per selected item ("lock") is the one part of that same
    command layer that *does* already exist under a different name.
    Not started — deliberately scoped out of the same work that added
    undo/redo, to keep that feature's own design and test quality from
    being rushed by also building this in the same pass. See
    `docs/PARITY_GAP_PLAN.md` item 4 for the full implementation design.
18. ~~Named layout presets~~ — **done** (`useLayoutPresets`), see "Recently completed" above.
19. ~~A hook for blocked-move feedback~~ — **done** (`MOVE_BLOCKED_BY_COLLISION`), see "Recently completed" above.
20. ~~Localizable UI/ARIA strings~~ — **done** (`ariaLabels` prop on both `GridLayout` and `GridItem`), see "Recently completed" above.
21. ~~Actual snap-to-grid during drag~~ — **done** (`snapToGrid`/`snapThreshold`), see "Recently completed" above.
22. ~~A grid-to-image export utility~~ — **done** (`exportLayoutAsSvg`), see "Recently completed" above.

### From the parity-gap analysis (`docs/PARITY_GAP_PLAN.md`)

Checked against five actively-maintained alternatives
(`COMPARISON_ALTERNATIVES.md`) — 7 of these 8 trace to
`@marsio/vue-grid-layout`'s own expanded command layer/persistence
model, 2 to `react-grid-layout` v2's architecture work. None trace to
`grid-layout-plus`, `vue-grid-layout-v3`, or `vue3-grid-layout-next`,
all three confirmed to be faithful ports of the original
`jbaysolutions/vue-grid-layout` feature set with no equivalent
expansion. Full technical design, effort estimates, and phasing for
each of these 8 is in `docs/PARITY_GAP_PLAN.md` — summarized here only
to keep this page a single stop for "what's suggested."

24. **Configurable resize-handle set** — `resizeHandles` prop selecting
    which of the 8 corner/edge handles actually render, instead of
    today's all-or-nothing `showResizeHandles`. Not started. See
    `docs/PARITY_GAP_PLAN.md` item 1.
25. **Spacing guides with distance labels** — alongside the existing
    edge/center alignment guides, a labeled distance indicator (e.g.
    "2 cols") for the gap between the dragged item and its nearest
    neighbor. Not started. See `docs/PARITY_GAP_PLAN.md` item 2.
26. **Per-input-type drag-activation thresholds** — distinct
    activation-distance values for mouse/touch/pen, instead of one
    fixed threshold for all pointer types. Not started. See
    `docs/PARITY_GAP_PLAN.md` item 3.
27. **Configurable container height modes** — `heightMode`
    (`auto`/`fixed`/`scroll`/`fit`), with `autoSize` becoming a
    deprecated, non-breaking alias rather than being removed. Not
    started. See `docs/PARITY_GAP_PLAN.md` item 5.
28. **Async persistence backends** (IndexedDB, remote HTTP) — a new,
    separate `useAsyncLayoutStorage` composable with its own adapter
    interface, alongside (not replacing) the existing synchronous
    `useLayoutStorage`. Note: `sessionStorage` already works today via
    `useLayoutStorage`'s existing `storage` option — confirmed while
    scoping this item, not a gap needing new code. Not started. See
    `docs/PARITY_GAP_PLAN.md` item 6.
29. **Open pluggable CSS positioning strategy** — an `IPositionStrategy`
    interface (mirroring the existing `ICompactor` precedent) replacing
    `useCssTransforms`'s current two-choice toggle, with both current
    behaviors preserved as built-ins. Not started. See
    `docs/PARITY_GAP_PLAN.md` item 7.
30. **Fast/O(n log n) compaction algorithm** — a `fastVerticalCompactor`
    implementing the existing `ICompactor` interface, for very large
    layouts. Requires a real perf benchmark proving the complexity
    claim before shipping — not to be added as an unverified swap. Not
    started. See `docs/PARITY_GAP_PLAN.md` item 8.
31. **Worker-based layout engine** — an opt-in Web Worker executor for
    compaction/responsive-generation on very large layouts. The
    largest lift of any item on this list; deliberately deferred until
    item 30 alone is proven insufficient, not built speculatively
    alongside it. Not started. See `docs/PARITY_GAP_PLAN.md` item 9.
32. **Maximize/restore an item** — temporarily expand a single item to
    fill the grid's entire visible area (its own header/close button
    still reachable, everything else hidden without being removed from
    `layout`), then restore it back to its prior position/size. Not a
    parity-gap-plan item (came from a different comparison —
    DevExpress/DevExtreme's Dashboard Designer has this; Kendo
    TileLayout, also checked, does not — see
    `COMPARISON_COMMERCIAL.md` for the full writeup and why the two
    are compared separately from `COMPARISON_ALTERNATIVES.md`'s
    open-source peers). Needs its own design pass before starting,
    particularly around what happens to *other* items' compaction while
    one is maximized (frozen in place seems right, but unverified),
    and whether this lives as a per-item boolean prop/method or a
    `GridLayout`-level `maximizedItemId`. Not started.

## Known limitations (tracked, not silently ignored)

- **Not a full WAI-ARIA grid/application widget pattern** — keyboard
  support is deliberately scoped to single-unit-step move/resize, not
  roving `tabindex` or a dedicated "move mode." See
  `docs/ACCESSIBILITY.md` for the reasoning.
- Full list, with exact source locations, in `docs/REFACTORING.md`.

## Have a request?

Open an issue on
[GitHub](https://github.com/gwinnem/vue-responsive-grid-layout/issues).
