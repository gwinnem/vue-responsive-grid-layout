# compactNow, rearrange & duplicateItem

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
gridRef.value.compactNow();       // re-runs compaction on the current layout
gridRef.value.rearrange();        // an alias for compactNow() — same thing

const newId = gridRef.value.duplicateItem('some-id');
// newId is 'some-id-copy', 'some-id-copy-2', ... (first unused suffix),
// or null if 'some-id' doesn't match any item currently in the layout.
```

`compactNow()`/`rearrange()` run the exact same sequence — compaction,
the internal `compact` event, a height recompute, and both layout
events — that already runs automatically after a drag, resize, or
item add/remove. Useful when a bulk programmatic edit replaces
`layout.value` wholesale (which doesn't automatically trigger
compaction unless the item count also changed), or for a "Tidy up"
button letting a user manually re-pack a layout that's drifted apart
with `compactType` set to `NONE`.

`duplicateItem(id)` copies every field from the source item except its
id (a new, collision-safe one is generated) and the internal `moved`
flag (compaction's own transient bookkeeping — not part of the item's
actual configuration). The copy is placed directly below the source;
any resulting overlap is left for the next compaction pass to resolve,
the same way a manually-added item would be.

<script setup>
import CustomComponent from './components/29-example.vue';
</script>
