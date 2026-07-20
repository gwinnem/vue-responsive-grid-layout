# Drag, drop from outside

<CustomComponent/>

## Code

```vue
<div draggable="true" @dragstart="onDragStart">⠿ Drag me into the grid</div>

<GridLayout v-model:layout="layout" allow-outside-drop
  :outside-drop-width="2" :outside-drop-height="2"
  @item-dropped-from-outside="onDropped">
  ...
</GridLayout>
```

```ts
const onDragStart = (event: DragEvent) => {
  // Whatever the drop handler needs to know about what's being dragged —
  // the library only resolves *where* it was dropped, not *what* it is.
  event.dataTransfer?.setData('text/plain', 'dropped-widget');
};

const onDropped = (payload: { x: number; y: number; w: number; h: number }) => {
  layout.value = [...layout.value, { h: payload.h, i: String(Date.now()), w: payload.w, x: payload.x, y: payload.y }];
};
```

`allowOutsideDrop` is the library's own built-in support for native HTML5
drag-and-drop from a source that isn't a `GridItem` or another
`GridLayout` — distinct from `allowCrossGridDrag`, which is for dragging
*between* grids that already contain items. While a compatible drag
hovers over the grid, it shows the same live placeholder a normal in-grid
drag already uses, sized to `outsideDropWidth`/`outsideDropHeight`; on
drop, it emits `item-dropped-from-outside` with the resolved grid
position and the native `DataTransfer` object, and does *not* touch
`layout` on its own.

::: tip Why doesn't dropping just add the item automatically?
The library has no way to know what a plain `draggable="true"` element
represents — that's the whole reason `DataTransfer` exists in the native
HTML5 drag-and-drop API: it's how a drag source hands data to whatever it
gets dropped on. Reading it back via `dataTransfer.getData(...)` in the
drop handler is what decides what (if anything) actually gets added.
:::

See [Drag, drop from outside into multiple grids](/examples/23-example)
for the same prop used across more than one possible drop target.

<script setup>
import CustomComponent from './components/11-example.vue';
</script>
