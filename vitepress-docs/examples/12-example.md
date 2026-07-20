# Drag, drop from grid to grid

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="sourceLayout" allow-cross-grid-drag layout-id="source">
  <GridItem v-for="item in sourceLayout" :key="item.i" ...>...</GridItem>
</GridLayout>
<GridLayout v-model:layout="targetLayout" allow-cross-grid-drag layout-id="target">
  <GridItem v-for="item in targetLayout" :key="item.i" ...>...</GridItem>
</GridLayout>
```

`allowCrossGridDrag` is the library's own built-in cross-grid drag/drop
support — set it on every `GridLayout` that should participate, and
that's the whole setup. No native HTML5 drag-and-drop, no manual pointer
tracking, no `data-*` attributes. Items stay fully draggable via the
library's normal mechanism the entire time; a `GridLayout` with this set
registers itself so any other participating grid can detect a drop onto
it and move the item's data across automatically.

`layoutId` names each grid for event payloads (`sourceLayoutId` on
`cross-grid-item-dropped`/`cross-grid-drop-rejected`, see [Cross-grid
drop restrictions](/examples/22-example) for both events in action) — if
you don't set it, one is generated automatically.

**The "locked" item can't be dragged into the target at all** —
`isStatic` disables a `GridItem`'s draggability entirely, so it never
starts a drag in the first place.

**The target grid starts completely empty**, which works without any
special handling — an empty `layout` array is a normal starting state
for any grid, not just one enabled for cross-grid drops.

<script setup>
import CustomComponent from './components/12-example.vue';
</script>
