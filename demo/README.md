# Demo app

A showcase and internal-testing tool for `vue-ts-responsive-grid-layout`,
separate from the `sandbox/` test bench (an older, single-page tool with
the same "exercise every prop" goal — see its own history in
`docs/REFACTORING.md`).

```bash
npm run demo         # dev server on http://localhost:5174
npm run demo:build   # production build, output to dist-demo/
```

Seven views:

| View | Demonstrates |
|---|---|
| `views/BasicGridView.vue` | The smallest possible setup — a fixed layout, default drag/resize |
| `views/DragResizeView.vue` | Every meaningful `GridLayout`-level prop as a live toggle (interaction, collision/compaction, layout/rendering, border radius, transform scale, max rows), live event log |
| `views/DynamicItemsView.vue` | Adding/removing grid items without rebuilding the layout, `v-model:layout` |
| `views/ResponsiveView.vue` | `responsive` + `responsiveLayouts` + custom `cols`, with a simulated-container-width slider so breakpoints can be tested without resizing the actual browser window |
| `views/CrossGridView.vue` | `allowCrossGridDrag`/`disableExternalDrop`/`layoutId`, dragging items between two independently-toggleable grids, `cross-grid-item-dropped`/`cross-grid-drop-rejected` events |
| `views/ItemOverridesView.vue` | `GridItem`-level props not covered elsewhere: `isStatic`, `enableEditMode`, `preserveAspectRatio`, per-item border radius/close button, `minW`/`minH`/`maxW`/`maxH`, `dragIgnoreFrom`/`resizeIgnoreFrom`, and a three-way inherit/true/false selector for `isDraggable`/`isResizable`/`isBounded` |
| `views/ExternalDropView.vue` | `allowOutsideDrop`/`outsideDropWidth`/`outsideDropHeight`, dragging a native (non-`GridItem`) element from outside into one of two grids, `item-dropped-from-outside` events; both grids also set `allowCrossGridDrag`, so an existing item can move between them too |

This app also doubles as the target for the Playwright e2e suite — see
`../docs/TESTING.md`. Elements that tests assert on carry a `data-testid`
attribute; keep that in mind when editing a view. `DragResizeView` and
`ResponsiveView` both gained new controls without removing or renaming any
existing `data-testid` — new defaults were deliberately chosen not to
change either view's behavior until a person actually touches the new
controls (e.g. `ResponsiveView`'s container-width slider defaults wider
than any real test viewport, so the existing viewport-resize-based e2e
coverage still exercises the same code path it always did).

The library is imported straight from `../src` (same `@` alias used
throughout the project), so the demo always reflects current source with no
build step in between.
