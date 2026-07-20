---
aside: false
footer: true
page: true
title: Changelog
---

# Changelog

This mirrors the repository's
[`CHANGELOG.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/CHANGELOG.md) —
check there for the single source of truth if this page looks out of date.

## v2.0.0 — 2026-07-20

The first major release. Two large passes: the first brought cross-grid
and outside-the-grid drag-and-drop, a full test/CI/docs foundation, and
this documentation site; the second closed out the rest of the
then-current roadmap in one batch — magnetic snapping, layout tools,
persistence presets, export, and localization — plus a further round of
e2e coverage and a bug found while writing it. See
`docs/REFACTOR_STRATEGY.md` for the roadmap this was scoped against, and
`docs/REFACTORING.md`/`docs/BUNDLE_ANALYSIS.md` for exhaustive detail on
every item below.

**Added (first pass):** cross-grid drag/drop
(`allowCrossGridDrag`/`disableExternalDrop` — see
[Drag, drop from grid to grid](/examples/12-example)); native
drag-and-drop from outside the grid system entirely
(`allowOutsideDrop`/`outsideDropWidth`/`outsideDropHeight` — see
[Drag, drop from outside](/examples/11-example) and
[into multiple grids](/examples/23-example)); resize from **all four
edges and their corners** with cursor affordance; full unit/component/e2e
test suite (**98%+ coverage**, enforced — see
[Test Coverage](/guide/coverage)); CI/CD across Node 18/20/22 with a
bundle-size regression check, dependency audit, and automated releases;
keyboard move/resize accessibility support; a `demo/` app and a restyled
`sandbox/` test bench; a live layout viewer under every example, paired
with the [Understanding Layouts](/guide/understanding-layouts) guide.

**Added (second pass):** `compactNow()`/`rearrange()` (on-demand
compaction); collision-safe `duplicateItem(id)`; a
`MOVE_BLOCKED_BY_COLLISION` feedback event for `preventCollision` — see
[Blocked-move feedback](/examples/30-example); per-item `autoHeight`
(a real `ResizeObserver`, not a one-shot measurement) — see
[Per-item autoHeight](/examples/31-example); magnetic `snapToGrid`/
`snapThreshold`, distinct from the visual-only `showAlignmentGuides` —
see [Snap to grid](/examples/32-example); configurable resize-handle
appearance (`showResizeHandles`/`resizeHandleColor`) — see
[Configurable resize-hint appearance](/examples/33-example);
`outsideDropAccept` and a typed outside-drop payload helper
(`readOutsideDropPayload`) — see
[outsideDropAccept & readOutsideDropPayload](/examples/34-example);
named layout presets (`useLayoutPresets`) — see
[Named layout presets](/examples/35-example); a dependency-free
grid-to-SVG export (`exportLayoutAsSvg`) — see
[Export layout as SVG](/examples/28-example); localizable UI/ARIA
strings (`ariaLabels`) — see
[Localizable ARIA strings](/examples/36-example); shared design tokens
between `demo/`/`sandbox/`; and `npm run package`, a script running
every quality gate and producing the exact publishable tarball in one
command. The example catalog grew from 23 to 36 across both passes.

**Fixed:** 40+ source-level bugs found while building tests, adding
features, and writing documentation in the first pass — several
crash-level, several silent (changing `margin`/`showCloseButton`/RTL
mirroring after mount never reaching already-rendered items; a fast drag
committing short of where the pointer released), and several
API-surface bugs. In the second pass: **`compactNow()`/`rearrange()`
was a no-op whenever `verticalCompact` was `false`** — found while
writing an e2e test for exactly that "tidy up" scenario, not from a bug
report — now always forces compaction regardless of the ambient
auto-compact setting, since that's the entire point of a manual
trigger. Full detail, with exact file references, in
[`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md).

**Changed:** `element-resize-detector` replaced with native
`ResizeObserver` (17% smaller gzipped bundle); `GridItem.vue` reduced
from 1,345 to ~830 lines via composable extraction; every prop, event
enum, and layout/breakpoint type exported from the package's main entry
point; `sandbox/` restyled to match `demo/`'s visual language; the
bundle-size budget raised from 45 KB to 55 KB gzip to accommodate the
second pass's feature growth, with the reasoning documented alongside
the change rather than raised silently; e2e test flakiness
(`drag-and-resize.spec.ts` and two new spec files) traced to a
project-wide race between an item's draggable-ready class appearing and
its container-width measurement actually settling, fixed with a shared
`stableBoundingBox()` test helper.

## v1.2.10 — 2025-04-28

- **Demo App**: eventlog wasn't displaying any resize events.
- **Fixed**: the `margin` property couldn't be `[0, 0]`.
- **Fixed**: resize cursor changed even when a `GridItem` wasn't resizable.
- **Tests**: added more unit tests; refactored code to be easier to test.
- **Tests**: updated `vitest.config.js`'s coverage exclude section.

## v1.2.9 — 2024-02-03

- **Fixed**: dynamic column changes caused items to overlap.

## v1.2.8 — 2024-01-25

- **Fixed**: unexpected behavior when dragging items. Thanks to [T0miii](https://github.com/T0miii).

## v1.2.7 — 2024-01-10

- **Fixed**: the `responsive` option wasn't working. Thanks to [T0miii](https://github.com/T0miii).

## v1.2.6 — 2023-12-28

- **Fixed**: a problem when the layout had no static item.

## v1.2.5 — 2023-12-14

- **Fixed**: `editMode` not working as expected.
- **Docs**: fixed page config so refreshing loads the correct page instead of a 404.
- **Demo App**: added margin inputs; number inputs can no longer go below 1; fixed the dropped-item index when it's numeric.
- **Refactor**: updated gridline styling in `GridLayout.vue`.
- **Config**: added style linting; updated `package.json` scripts.
- **Tests**: added more unit tests; refactored code to be easier to test.

## v1.2.4 — 2023-10-23

- **Fixed**: the layout-update event was raised before the update finished. Thanks to [SamGeems](https://github.com/SamGeens).
- **Fixed**: the close button's CSS didn't match the documented example. Thanks to [SamGeems](https://github.com/SamGeens).
- **Added**: `drag-end`, `drag-move`, and `drag-start` events on `GridLayout`.
- **Codebase**: renamed `EGridLayoutEvent.UPDATE_LAYOUT` to `LAYOUT_UPDATE`; removed `EDragEvents` (folded into `EGridLayoutEvent`); documented `DOM.ts`; removed the obsolete `EMovingDirections` enum.
- **Demo App**: added a button to clear the event log and a dropdown to filter events.

## v1.2.2 — 2023-09-19

- **Fixed**: drag-and-drop from outside the grid wasn't working when `distributeEvenly` was set.
- **Partial fix**: `resizemove` edge-case handling — right/bottom-right/bottom fixed; left/top-left/top/top-right still not (see [Roadmap](/guide/roadmap)).
- **Codebase**: added function documentation, contributor list, and README badges; updated outdated dependencies.

Thanks to [UTing1119](https://github.com/UTing1119) for contributing to this release.

## v1.2.1 — 2023-05-07

- **Fixed**: [issue 7](https://github.com/gwinnem/vue-responsive-grid-layout/issues/7) and [issue 6](https://github.com/gwinnem/vue-responsive-grid-layout/issues/6). Thanks to [UTing1119](https://github.com/UTing1119).
