# GridLayout

The grid container. Renders your [`GridItem`](/components/grid-item)s in
its default slot and manages the layout array, responsive breakpoints,
and collision/compaction behavior for you.

```vue
<GridLayout v-model:layout="layout">
  <GridItem v-for="item in layout" :key="item.i" v-bind="item" />
</GridLayout>
```

- [Props](/components/grid-layout-props) — `layout` and every
  behavior/styling option.
- [Vue events](/components/grid-layout-events) — `update:layout`,
  `breakpoint-changed`, `layout-ready`, and more.
- [eventBus events](/components/grid-layout-event-bus-events) — internal
  plumbing shared with `GridItem`.
- [Slots](/components/grid-layout-slots) — the default slot and `#placeholder`.
- [Styling](/components/css-grid-layout) — classes and CSS variables.

## Exposed methods & state

Accessible via a template ref (`const gridRef = ref<InstanceType<typeof GridLayout>>()`):

| Name | Description |
|---|---|
| `dragEvent(eventName, id, x, y, h, w)` | Manually drives the internal drag machinery — used for dragging items in from outside the grid. See [Drag, drop from outside](/examples/11-example). |
| `scrollToItem(id)` | Scrolls the item's element into view (`block: 'nearest'`). No-op if the id doesn't match any currently rendered item. Safe to call immediately after adding the item — internally awaits a tick before searching, so it works correctly even called in the same handler that just pushed the new item into `layout`. See [scrollToItem & focusItem](/examples/27-example). |
| `focusItem(id)` | Moves keyboard focus to the item's element. No-op if the id doesn't match any currently rendered item, or the item isn't focusable (static items aren't). Same "safe to call right after adding the item" behavior as `scrollToItem` above. |
| `compactNow()` | Re-runs compaction on the current layout on demand — the exact sequence that already runs internally after drag/resize/add/remove. See [compactNow, rearrange & duplicateItem](/examples/29-example). |
| `rearrange()` | An alias for `compactNow()` — same operation. |
| `duplicateItem(id)` | Clones the item with a collision-safe id (`${id}-copy`, `${id}-copy-2`, ...), placed directly below the source. Returns the new id, or `null` if `id` doesn't match any item currently in the layout. See the same example above. |
| `selectItem(id, additive?)` | Selects `id`. `additive: false` (default) replaces the entire selection with just this item; `additive: true` adds it without clearing the rest. Only meaningful when `multiSelect` is on. See [Multi-select & group move/resize](/examples/37-example). |
| `deselectItem(id)` | Removes `id` from the selection, if present. A no-op if it wasn't selected. |
| `toggleItemSelection(id)` | Adds `id` to the selection if not already present, removes it otherwise. |
| `clearSelection()` | Empties the selection entirely. A no-op if nothing was selected. |
| `selectedItems` | Reactive array of currently-selected item ids. Always empty when `multiSelect` is off. |
| `isDragging` | Whether any item in this grid is currently being dragged or resized. |
| `width` | The container's last measured pixel width, or `null` before it's been measured. |
| `lastBreakpoint` | The currently active responsive breakpoint name, or `null`. See [Layout lifecycle events](/examples/40-example). |
| `layouts` | The per-breakpoint layout cache (see [Responsive predefined layouts](/examples/09-example)). |
| `placeholder` | The live drag/resize/outside-drop preview box's current grid-unit position/size, typed `IPlaceholder` — see [Custom drag-placeholder content](/examples/25-example) for the `#placeholder` slot this also backs. |
| `alignmentGuides` | Every edge alignment currently found (see `showAlignmentGuides`), as `IAlignmentGuide[]` (`{ axis: 'x' \| 'y', position: number }[]`) in grid units — empty when the prop is off or nothing aligns. |
| every prop | All props are also re-exposed for external inspection. |
