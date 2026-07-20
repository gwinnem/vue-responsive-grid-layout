# Switching layouts & forcing a remount

<CustomComponent/>

## Code

```vue
<template>
  <GridLayout :key="forceRemount ? gridKey : 'stable'" v-model:layout="layout" enable-undo-redo>
    <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
      {{ item.i }}
    </GridItem>
  </GridLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layoutA: TLayout = [/* ... */];
const layoutB: TLayout = [/* ... */];

const layout = ref<TLayout>(structuredClone(layoutA));
const forceRemount = ref(false);
const gridKey = ref(0);

function switchTo(target: 'a' | 'b'): void {
  layout.value = structuredClone(target === 'a' ? layoutA : layoutB);
  gridKey.value += 1;
}
</script>
```

Reassigning `layout` to a different array reactively updates the same
`GridLayout` instance — internal state it's holding keeps existing too,
even once it no longer refers to anything meaningful for the new
layout. `multiSelect`'s own selection is *not* an example of this — it
gets pruned to just the ids still present whenever the layout's length
changes, so switching to an unrelated layout already clears it
correctly on its own. `enableUndoRedo`'s history is a real example,
though: a stack of full layout snapshots with no such pruning, so it
stays populated (`canUndo` stays `true`) even after switching to a
layout it has nothing to do with. Changing the component's own `:key`
is the standard Vue pattern for forcing a hard reset instead: it tells
Vue to fully destroy and recreate the instance rather than reactively
update its props, so every piece of internal state — undo history,
drag/resize in-progress state — starts clean.

**Try it**: with "Force remount on switch" off, drag an item in Layout
A (to commit an undo point), then switch to Layout B — `canUndo` is
still `true`, a stale answer about a layout that's no longer showing.
Turn the toggle on and repeat — `canUndo` correctly resets to `false`.

::: tip Not something this library does automatically
`GridLayout` has no built-in "reset on layout swap" behavior, on purpose
— a consumer might genuinely want selection or undo history to survive
a layout change (e.g., swapping to a filtered view of the same data).
Whether to force a remount is a decision for your own app to make,
using ordinary Vue mechanisms — nothing special is required here beyond
changing a `:key`.
:::

<script setup>
import CustomComponent from './components/45-example.vue';
</script>
