# Edit mode toggle (view-only dashboard)

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :enable-edit-mode="editMode" :show-close-button="editMode">
  <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
    {{ item.label }}
  </GridItem>
</GridLayout>
```

`enableEditMode` is a master switch — set it to `false` and every item
can't be dragged, resized, or closed, regardless of what
`isDraggable`/`isResizable`/`showCloseButton` say. Distinct from
[Static items](/examples/17-example)'s `isStatic`, which is meant for
individual items that are permanently fixed (and are excluded from the
drag-collision cascade as fixed obstacles); `enableEditMode` is meant to
be toggled at runtime — a "Done editing" button, or gating on whether the
current viewer has permission to rearrange the dashboard at all.

Setting `enableEditMode` on `GridLayout` itself (as above) is a
grid-wide default every `GridItem` inherits — the same `null`-means-inherit
pattern `isDraggable`/`isResizable`/`isBounded`/`showCloseButton` already
use. A specific item can still override the grid-wide default for just
itself by setting its own `enable-edit-mode` prop explicitly.

<script setup>
import CustomComponent from './components/21-example.vue';
</script>
