# Comparison: `vue-ts-responsive-grid-layout` vs. Kendo TileLayout and DevExtreme Dashboard

## Scope, and why this is a separate document from `COMPARISON_ALTERNATIVES.md`

[`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md) deliberately
scopes itself to open-source peers in the same category. This document
covers two commercial products instead — kept separate rather than
folded in, since both the licensing model and (for one of the two) the
actual product category are different enough that treating them as
equivalent entries in the same table would be misleading. Two
corrections up front, found while researching this rather than assumed
from the names:

- **"Kendo DashboardLayout" isn't the product's real name.** Kendo's
  actual component is called **TileLayout**, available for jQuery,
  Angular, React (KendoReact), and Blazor. There's an open, unresolved
  feature request on Telerik's own Blazor feedback portal from users
  asking for a *separate* "DashboardLayout" component — it doesn't
  exist. This document compares against **TileLayout**.
- **DevExtreme's "Dashboard Designer" is a full BI platform, not a
  standalone layout component.** It bundles SQL/OLAP/JSON/Excel data
  source binding, master-filter/drill-down interactivity, a WYSIWYG
  designer UI, and PDF/Excel/image export around its own layout
  mechanism — categorically different from a library you'd drop into
  an app the way this one is used. This document compares against
  **just its layout engine** (the drag/resize/arrange mechanics),
  since that's the only part in the same category as this project. The
  rest of what Dashboard Designer does is out of scope for any
  meaningful comparison.

## The bigger architectural difference

Both commercial products use a **recursive binary split-pane tree**:
adding a new item splits the largest existing pane in half, creating a
new group containing both; resizing means dragging the **separator
line** between two adjacent panes, not independent per-item resize
handles. This is the same model as tiling window managers or an IDE's
split editor panes. This library — like `react-grid-layout` and
`gridstack.js` — uses **freeform, independent `x`/`y`/`w`/`h` grid
coordinates**: any item can move to any free position on its own,
with its own resize handles on its own edges.

This isn't a minor implementation detail. It means several rows in the
table below aren't simple "missing feature" gaps — they're different
tradeoffs a different architecture makes. A split-pane tree
structurally guarantees no overlaps and no manual compaction step, at
the cost of items never being fully independent of their neighbors.
Freeform coordinates give full independent placement, at the cost of
needing an explicit collision/compaction system to prevent overlaps.
Neither is strictly better; they suit different products.

## Feature comparison

| Feature | `vue-ts-responsive-grid-layout` | Kendo TileLayout | DevExtreme Dashboard (layout engine) |
|---|---|---|---|
| Layout model | Freeform `x`/`y`/`w`/`h` grid coordinates | CSS Grid, `col`/`row`/`colSpan`/`rowSpan` | Recursive binary split-pane tree |
| Resize any of an item's 8 edges/corners independently | Yes | No — bottom/right edges + bottom-right corner only, with a `resizable` mode restricting to `'horizontal'`/`'vertical'`/both | No — drag the separator between two adjacent panes |
| Drag an item to an arbitrary free position | Yes | No — dragging *reorders* within the CSS Grid auto-flow; large tiles can leave gaps smaller tiles won't automatically fill (confirmed directly in Kendo's own docs, not assumed) | No — the drop indicator inserts the item into the tree structure at a new split point |
| Non-drag reorder option (accessibility) | No (keyboard move/resize exists, but not a distinct "click-to-select, click-to-place" mode) | **Yes** — `reorderable.clickMoveClick`: click a tile to start moving it, click again to place it, no drag gesture required at all | No |
| Vue support | Native, ground-up | **None.** jQuery, Angular, React, and Blazor only | Yes, via an Angular/React/Vue/jQuery wrapper layer over the same core |
| Licensing | MIT, free | Commercial, but **free for the React version specifically** (KendoReact's free component tier) — jQuery/Angular/Blazor require a paid license or 30-day trial | Commercial (DevExpress Universal Subscription); no free tier |
| Cross-grid drag/drop between independent instances | Yes (`allowCrossGridDrag`) | No | No (single dashboard surface; tabs exist, but that's a different mechanism, not independent sibling grids) |
| Drag-and-drop from outside the component | Yes (`allowOutsideDrop`) | No | No (Toolbox → click-to-add, not a drag gesture) |
| Responsive breakpoints (auto column-count switching) | Yes (`responsive`/`breakpoints`/`cols`) | No | The control auto-stretches/shrinks to fit its container — a different, non-breakpoint-based mechanism, not directly comparable |
| Undo/redo | Yes (`enableUndoRedo`/`undoHistoryLimit`) | No | No (dashboard-level save/reload only, no in-session history stack) |
| Multi-select group move/resize | Yes (`multiSelect`) | No | No (single-item drag only) |
| Magnetic snap-to-grid / visual alignment guides | Yes (both, distinct mechanisms) | No | No |
| Keyboard move/resize | Yes (arrow keys / Shift+arrow keys) | Comparable, via a different mechanism: Ctrl+arrow keys resize, Shift+arrow keys reorder a focused tile | Not documented as a distinct keyboard-only mode |
| Per-item lock against rearrangement | Yes (`isStatic`) | Yes — a per-`TileLayoutItem` `reorderable: false` override | Not a standalone per-item toggle in the same sense — locking is closer to a dashboard-level "view mode" (Viewer vs. Designer) than a per-item flag |
| **Maximize/restore an item to fill the entire surface** | **No — a real, confirmed gap** | No | **Yes** — a caption button expands one item to the root layout group's full size, then restores it; the item is actually re-created on both transitions (its full lifecycle events fire again, not just a resize) |
| Save/restore layout state | Yes (`useLayoutStorage`, `serializeLayout`/`deserializeLayout`) | Yes (`getState`/`setState`) — comparable | Yes (XML dashboard definition, save/load API) — comparable |
| RTL | Yes | Comparable — supported | Not a highlighted feature in what was checked |
| Export layout as image/SVG | Yes (`exportLayoutAsSvg`, dependency-free) | No | Yes (PDF/image/Excel) — but this exports the dashboard's *data visualizations*, not a plain layout-shell export the way this library's feature does |
| Data source binding, master-filter, drill-down, BI charting | **Out of scope for this project entirely — a deliberate boundary, not an oversight** | No (TileLayout is presentation-only, the same category as this library) | **Yes — its entire reason to exist** |

## Honest summary

Against **Kendo TileLayout**: this library is ahead on nearly every
drag/resize/layout-mechanics dimension — full 8-edge independent
resize vs. Kendo's 3-handle/axis-restricted model, freeform positioning
vs. reorder-only, cross-grid drag, outside drop, snap/alignment
guides, undo/redo, multi-select. TileLayout's genuine advantages are
being one component in a 120+ component commercial suite with paid
support and a mature accessibility feature this library doesn't have
(click-move-click, a real non-drag alternative worth considering as a
future addition here) — and, for the React build specifically, being
free. There's no Vue build to compare against directly at all.

Against **DevExtreme Dashboard**: the honest framing is that these
aren't real competitors for most consumers — Dashboard Designer is a
BI-authoring product where drag/resize layout is one supporting piece
of a much larger data-analytics platform, not something you'd choose
*for* its layout engine alone. The one genuine, worth-tracking gap even
at the pure layout-mechanics level is **maximize/restore** — a common,
useful dashboard UX pattern this library doesn't have. It's tracked as
item 32 in [`ROADMAP.md`](./ROADMAP.md), explicitly not yet designed
(open questions include whether other items' compaction freezes or
continues while one is maximized, and whether this is a per-item prop
or a `GridLayout`-level `maximizedItemId`).

## What's *not* worth chasing from either

- **Kendo's CSS Grid-based, resize-restricted-to-3-handles model** —
  adopting this would be a regression, not a gap to close; this
  library's full independent 8-edge resize is a genuine advantage
  worth keeping, not something to trade away for parity with a more
  restrictive model.
- **DevExtreme's recursive split-pane structure itself** — rebuilding
  this library around that architecture would abandon the freeform
  positioning model that's core to what this library is, not a
  targeted feature addition. If a split-pane layout mode is ever
  genuinely wanted, it belongs as an alternative, opt-in mode
  (mirroring the existing `ICompactor`/pluggable-positioning-strategy
  precedent already in `ROADMAP.md`), not a replacement.
- **DevExtreme's BI/data-analytics layer entirely** — data source
  connectivity, drill-down, and chart-aware export are a different
  product category by design, not a scope this library is trying to
  grow into.
