# eventBus events (GridItem's side)

The same shared `eventBus` documented on
[GridLayout's eventBus events page](/components/grid-layout-event-bus-events) —
this page lists them from `GridItem`'s perspective: what it listens for,
and what it emits.

## Listens for (pushed down from GridLayout)

`changeDirection`, `compact`, `setBounded`, `setColNum`, `setDraggable`,
`setMargin`, `setMaxRows`, `setResizable`, `setRowHeight`,
`setShowCloseButton`, `setTransformScale`, `updateWidth` — each has a
corresponding handler function in `GridItem.vue` (`setDraggableHandler`,
`setResizableHandler`, etc.), registered on mount and deregistered on
unmount.

The `setDraggable`/`setResizable`/`setBounded`/`setShowCloseButton`
handlers only apply the pushed value when the item's own prop
(`isDraggable`/`isResizable`/`isBounded`/`showCloseButton`) is `null` —
an explicit per-item prop always wins over the cascade.

## Emits (reported up to GridLayout)

`dragEvent` and `resizeEvent`, both carrying an
[`IEventsData`](/api/interfaces-eventBus) payload — emitted from the drag
and resize composables' `handleDrag`/`handleResize` functions respectively,
on every `dragstart`/`dragmove`/`dragend` (or `resizestart`/`resizemove`/
`resizeend`) tick.

See [GridLayout's eventBus events](/components/grid-layout-event-bus-events)
for the full message table and payload shapes.
