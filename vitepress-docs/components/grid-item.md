# GridItem

A single draggable/resizable/static cell, rendered inside a
[`GridLayout`](/components/grid-layout)'s default slot. Content is
entirely up to you — `GridItem` only handles position, size, and
interactivity; the default slot is unstyled otherwise.

```vue
<GridLayout v-model:layout="layout">
  <GridItem v-for="item in layout" :key="item.i" v-bind="item">
    <!-- anything goes here -->
  </GridItem>
</GridLayout>
```

- [Props](/components/grid-item-props) — `h`/`w`/`x`/`y`/`i` and every
  interactivity/styling option.
- [Vue events](/components/grid-item-events) — `resize`, `resized`,
  `item-move`, `item-moved`, `remove-grid-item`, `container-resized`.
- [eventBus events](/components/grid-item-event-bus-events) — internal
  plumbing shared with `GridLayout`.
- [Default slot](/components/grid-item-slots) — your content.
- [Styling](/components/css-grid-item) — classes and CSS variables.

## Exposed methods & state

Accessible via a template ref (`const itemRef = ref<InstanceType<typeof GridItem>>()`):

| Name | Description |
|---|---|
| `calcXY(top, left)` | Converts a pixel position to grid units. Used internally by dragging; exposed for advanced/manual drag implementations. See [Layout bounds & rendering options](/examples/41-example). |
| `autoSize()` | Resizes the item to fit its slot content's measured size. Has a known reliability limitation — see [Roadmap](/guide/roadmap). |
| `dragging` | The item's current pixel position while a drag is in progress, typed `IGridItemPosition`, or `undefined` otherwise. |
| every prop | All props are also re-exposed for external inspection. |
