# GridLayout Events

Emitted directly on the `<GridLayout>` component — listen with `@event-name`.

| Event | Payload | When |
|---|---|---|
| `breakpoint-changed` | `(breakpoint: string, layout: TLayout)` | Responsive mode picks a different breakpoint than before. See [Responsive breakpoints](/examples/07-example). |
| `columns-changed` | `(colNum: number)` | The resolved column count changes (the `colNum` prop, or a responsive-breakpoint switch). See [Layout lifecycle events](/examples/40-example). |
| `cross-grid-drop-rejected` | `({ itemId, sourceLayoutId })`, typed `ICrossGridDropRejected` | Fired on the *target* grid when a cross-grid drop (`allowCrossGridDrag`) is attempted but rejected because this grid has `disableExternalDrop` set. See [Cross-grid drop restrictions](/examples/22-example). |
| `cross-grid-item-dropped` | `({ item, sourceLayoutId })`, typed `ICrossGridItemDropped` | Fired on the *target* grid when an item is successfully moved into it from another grid via `allowCrossGridDrag`. See [Drag, drop from grid to grid](/examples/12-example) (the feature this fires for; not explicitly listened to there). |
| `item-dropped-from-outside` | `({ x, y, w, h, dataTransfer })`, typed `IOutsideItemDropped` | Fired when something is dropped via native HTML5 drag-and-drop from outside the grid system entirely (`allowOutsideDrop`) — `x`/`y` are the resolved grid position, `w`/`h` are `outsideDropWidth`/`outsideDropHeight`, and `dataTransfer` is the native `DataTransfer` object from the browser's own `drop` event. Doesn't add anything to `layout` on its own. See [Drag, drop from outside](/examples/11-example). |
| `dragend` | `(id: number)` | A drag ends. See [Layout lifecycle events](/examples/40-example). |
| `dragmove` | — | A drag is in progress. See [Layout lifecycle events](/examples/40-example). |
| `dragstart` | `(id: number)` | A drag begins. See [Layout lifecycle events](/examples/40-example). |
| `layout-before-mount` | `(layout: TLayout)` | Fired from `onBeforeMount`, before the layout has been validated or laid out. See [Layout lifecycle events](/examples/40-example). |
| `layout-created` | `(layout: TLayout)` | Fired synchronously during setup, immediately, with the initial `layout` prop. See [Layout lifecycle events](/examples/40-example). |
| `layout-mounted` | `(layout: TLayout)` | Fired from `onMounted`, before layout validation/responsive setup has run. See [Layout lifecycle events](/examples/40-example). |
| `layout-ready` | `(layout: TLayout)` | Fired once, after the container's width is known and every item's size is stable — the first reliable point to inspect final positions/sizes. See [Layout lifecycle events](/examples/40-example). |
| `layout-updated` | `(layout: TLayout)` | Fired after a layout mutation (compaction, drag/resize completion, responsive switch) has fully settled. See [Layout lifecycle events](/examples/40-example). |
| `move-blocked-by-collision` | `(id: string \| number)` | Fired when `preventCollision` blocks a drag or resize — on drag, the item stays exactly where it was; on resize, whenever the requested size gets clamped at all (a resize can still partially succeed, unlike a fully-rejected drag). See [Blocked-move feedback](/examples/30-example). |
| `selection-changed` | `(selectedItems: (string \| number)[])` | Fired whenever the current `multiSelect` selection changes — an item selected/deselected, replaced by a plain click, or cleared. Payload is the full current selection, not just what changed. See [Multi-select & group move/resize](/examples/37-example). |
| `update:layout` | `(layout: TLayout)` | The `v-model:layout` update event. You don't need to listen for this directly if you're using `v-model:layout` — Vue wires it up automatically. |

See [Events](/examples/03-example) for a live demo, and
[`EGridLayoutEvent`](/api/GridLayout-enums) for the enum backing these
event names (useful if you want to compare against them programmatically
rather than hardcoding the string).

::: warning Declared but not currently emitted
`EGridLayoutEvent.CHANGED_DIRECTION` and `CONTAINER_RESIZED` exist on the
enum for backwards compatibility but aren't wired up to any `defineEmits`
or `emit()` call — listening for `@changed-direction`/`@container-resized`
on `GridLayout` won't see anything fire. See [Roadmap](/guide/roadmap).
:::
