# GridItem Events

Emitted directly on a `<GridItem>` — listen with `@event-name`.

| Event | Payload | When |
|---|---|---|
| `container-resized` | `(i, h, w, height, width)` | The item's rendered pixel size changed. See [Layout lifecycle events](/examples/40-example). |
| `item-clicked` | `(i, event: MouseEvent)` | A genuine click/tap on the item — the trailing click a browser can still dispatch immediately after a drag/resize gesture ends is suppressed. The native `MouseEvent` is included so a handler can check `shiftKey`/`ctrlKey`/`metaKey`. Backs `GridLayout`'s own `multiSelect` handling; also usable directly. See [Multi-select & group move/resize](/examples/37-example). |
| `item-move` | `(i, x, y)` | Fired continuously while a drag is in progress, whenever the grid-unit position changes. |
| `item-moved` | `(i, x, y)` | Fired once when a drag completes and the position actually changed. |
| `remove-grid-item` | `(i)` | The item's close button was clicked. See [Show close button](/examples/13-example). |
| `resize` | `(i, h, w, height, width)` | Fired continuously while a resize is in progress. See [Layout lifecycle events](/examples/40-example). |
| `resized` | `(i, h, w, height, width)` | Fired once when a resize completes and the size actually changed. |

Bind these with `@container-resized`, `@item-clicked`, `@item-move`, `@item-moved`,
`@remove-grid-item`, `@resize`, and `@resized` respectively — see
[Events](/examples/03-example) for a live demo, and
[`EGridItemEvent`](/api/GridItem-enums) for the backing enum.

::: warning Declared but not currently emitted
`EGridItemEvent.DRAG` and `DRAGGED` exist on the enum for backwards
compatibility, but `GridItem` emits `item-move`/`item-moved` instead —
listening for `@drag`/`@dragged` won't see anything fire. See
[Roadmap](/guide/roadmap).
:::
