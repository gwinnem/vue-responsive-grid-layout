# Snap to grid

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" snap-to-grid :snap-threshold="2">
  ...
</GridLayout>
```

`snapThreshold` is how close, in grid units, a dragged item's edge
needs to be to another item's edge before it snaps — default `1`.
Unlike [alignment guides](/examples/26-example) (`showAlignmentGuides`,
purely visual), this actually changes where the item lands: once the
pointer's dragged-to position is within threshold of an edge alignment,
the position adjusts to match it exactly, both in the live placeholder
while dragging and in the final committed position on drop.

Both features can be on at the same time — the visual guide showing
exactly where the magnetic snap is about to lock to.

<script setup>
import CustomComponent from './components/32-example.vue';
</script>
