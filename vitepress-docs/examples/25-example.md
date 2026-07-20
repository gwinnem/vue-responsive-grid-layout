# Custom drag-placeholder content

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout">
  <GridItem v-for="item in layout" ...>...</GridItem>
  <template #placeholder="{ placeholder, isDragging }">
    <div class="custom-placeholder">Drop at {{ placeholder.x }}, {{ placeholder.y }}</div>
  </template>
</GridLayout>
```

The `#placeholder` slot renders inside the same internal `GridItem` the
library already uses for the placeholder (`.vue-grid-placeholder`) —
your content is layered on top of its existing background/sizing, the
same way a regular `GridItem`'s own slot content sits inside its
background rather than replacing it. Visibility is still controlled by
the library (`v-show`, based on whether a drag is actually in progress);
you only control what's *inside* it.

Scoped slot props:

| Prop | Type | Description |
|---|---|---|
| `placeholder` | `{ x, y, w, h }` | The placeholder's current grid position/size — updates live as you drag. |
| `isDragging` | `boolean` | Whether a drag is currently in progress. |

<script setup>
import CustomComponent from './components/25-example.vue';
</script>
