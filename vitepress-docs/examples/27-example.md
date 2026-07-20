# scrollToItem & focusItem

<CustomComponent/>

## Code

```vue
<script setup>
const gridRef = ref();
</script>

<template>
  <GridLayout ref="gridRef" v-model:layout="layout">...</GridLayout>
</template>
```

```ts
gridRef.value.scrollToItem('some-id');
gridRef.value.focusItem('some-id');
```

Both are no-ops (not throws) when the id doesn't match any currently
rendered item — the common case being calling one of these right after
adding or removing that same item, where the id may not (yet, or any
longer) exist. `scrollToItem` uses `block: 'nearest'`, so it only
scrolls the minimum amount needed rather than always centering the
item, which would yank the page's scroll position around for an item
that's already fully visible. `focusItem` only does something
meaningful for an item that's actually focusable — a purely static,
non-interactive item never receives `tabindex`, so focusing it is a
no-op too.

Both are scoped to the specific `GridLayout` instance they're called
on, not `document`-wide — safe to use on a page with multiple grids
(e.g. `allowCrossGridDrag`) that happen to reuse the same id.

<script setup>
import CustomComponent from './components/27-example.vue';
</script>
