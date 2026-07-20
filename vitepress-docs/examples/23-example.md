# Drag, drop from outside into multiple grids

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="leftLayout" allow-outside-drop allow-cross-grid-drag layout-id="left"
  @item-dropped-from-outside="onDropped('left', $event)">
  ...
</GridLayout>
<GridLayout v-model:layout="rightLayout" allow-outside-drop allow-cross-grid-drag layout-id="right"
  @item-dropped-from-outside="onDropped('right', $event)">
  ...
</GridLayout>
```

```ts
const onDropped = (gridId: 'left' | 'right', payload) => {
  const label = payload.dataTransfer?.getData('text/plain') || 'New';
  const target = gridId === 'left' ? leftLayout : rightLayout;
  target.value = [...target.value, { h: payload.h, i: String(Date.now()), label, w: payload.w, x: payload.x, y: payload.y }];
};
```

This is [Drag, drop from outside](/examples/11-example) with
`allowOutsideDrop` set on more than one grid, **plus**
`allowCrossGridDrag` (from
[Drag, drop from grid to grid](/examples/12-example)) set on both too —
two genuinely independent mechanisms demonstrated together, not one
subsuming the other. `allowOutsideDrop` needs no coordination between
grids at all: each one independently shows its own live placeholder
while a compatible native drag hovers over it and emits its own
`item-dropped-from-outside` on drop, so a single `onDropped` handler
just needs to know which grid's array to push into. `allowCrossGridDrag`
is what makes an item *already placed* in one grid draggable into the
other — that one does need the shared cross-grid registry
(`layoutId` on each grid) so they can find each other, independent of
whatever's happening with the outside-drop palette above them.

<script setup>
import CustomComponent from './components/23-example.vue';
</script>
