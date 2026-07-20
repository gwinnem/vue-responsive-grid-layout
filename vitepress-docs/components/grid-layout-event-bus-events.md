# eventBus events

`GridLayout` and every `GridItem` communicate through a shared
[`mitt`](https://github.com/developit/mitt) event bus — `GridLayout`
creates it and `provide()`s it; every `GridItem` `inject()`s it. This is
internal plumbing, not part of the public component API (there's nothing
to configure), but understanding it helps when debugging why a prop
change on `GridLayout` did or didn't reach an item.

::: tip Most consumers never need this page
Everything here happens automatically based on the props/events already
documented for [GridLayout](/components/grid-layout-props) and
[GridItem](/components/grid-item-props). This page exists for anyone
digging into the library's internals or filing a detailed bug report.
:::

## GridLayout → GridItem

Pushed down whenever the corresponding `GridLayout` prop changes, so every
item can react without `GridLayout` needing to re-render each one
individually.

| Message | Payload | Purpose |
|---|---|---|
| `changeDirection` | `boolean` (isMirrored) | RTL toggle. |
| `compact` | — | "Recompute your style, something upstream changed" (layout mutation, breakpoint switch, etc). |
| `setBounded` | `boolean` | Cascades `isBounded` — only applied by items whose own `isBounded` prop is `null`. |
| `setColNum` | `number` | Cascades the resolved column count. |
| `setMargin` | `number[]` | Cascades `[horizontal, vertical]` margin. |
| `setDraggable` | `boolean` | Cascades `isDraggable` — only applied when the item's own prop is `null`. |
| `setMaxRows` | `number` | Cascades `maxRows`. |
| `setResizable` | `boolean` | Cascades `isResizable` — only applied when the item's own prop is `null`. |
| `setShowCloseButton` | `boolean` | Cascades `showCloseButton` — only applied by items whose own prop is `null`. |
| `setRowHeight` | `number` | Cascades `rowHeight`. |
| `setTransformScale` | `number` | Cascades `transformScale`. |
| `updateWidth` | `number` | Cascades the container's measured pixel width. |

## GridItem → GridLayout

An item reporting its own drag/resize progress up to the parent, so
`GridLayout` can resolve collisions against every *other* item and update
the drag placeholder.

| Message | Payload | Purpose |
|---|---|---|
| `dragEvent` | [`IEventsData`](/api/interfaces-eventBus) | A drag is starting, in progress, or ending. |
| `resizeEvent` | [`IEventsData`](/api/interfaces-eventBus) | A resize is starting, in progress, or ending. |

See [Architecture notes](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/ARCHITECTURE.md)
in the source repository for the full internal picture, including why
`$parent` access (not props) is used for the initial state a `GridItem`
reads at mount.
