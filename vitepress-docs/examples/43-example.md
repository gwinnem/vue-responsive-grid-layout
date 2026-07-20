# Undo/redo (enableUndoRedo)

<CustomComponent/>

## Code

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([/* ... */]);
const gridRef = ref<InstanceType<typeof GridLayout>>();
const undoHistoryLimit = ref(3);
</script>

<template>
  <button :disabled="!gridRef?.canUndo" @click="gridRef?.undo()">Undo</button>
  <button :disabled="!gridRef?.canRedo" @click="gridRef?.redo()">Redo</button>

  <GridLayout ref="gridRef" v-model:layout="layout" enable-undo-redo :undo-history-limit="undoHistoryLimit">
    <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
      {{ item.i }}
    </GridItem>
  </GridLayout>
</template>
```

- **`enableUndoRedo`** (default `false`) — opts into the history. Off
  by default: it keeps up to `undoHistoryLimit` cloned layout snapshots
  in memory, a real cost that shouldn't apply to every consumer
  automatically.
- **`undoHistoryLimit`** (default `50`) — caps how far back `undo()`
  can step; the oldest snapshot is dropped once exceeded. Set to a
  small `3` here (adjustable via the control above), specifically so
  the cap itself is easy to observe: add more than 3 items, then keep
  undoing — `canUndo` goes `false` before every addition is undone.
- **`undo()`/`redo()`** (exposed methods) — step back/forward through
  the history. No-op (not an error) when there's nothing to undo/redo,
  or when `enableUndoRedo` is off.
- **`canUndo`/`canRedo`** (exposed, reactive) — whether either has
  anything to act on, for disabling the buttons above appropriately.

## What counts as a committed change

A snapshot is taken once per **committed** change, not per
intermediate frame:

- A drag or resize, from its own start to its own end — not every
  `pointermove` in between.
- An item added or removed (including via `duplicateItem(id)`).
- `compactNow()`/`rearrange()`.

A gesture that doesn't actually change anything (a drag that snaps
back to exactly where it started) doesn't consume an undo slot — no
real change happened, so there's nothing worth stepping back through.

See `docs/ARCHITECTURE.md`'s own section on this and
`docs/REFACTORING.md` #80 for the design this API went through —
including a real bug found and fixed before it shipped, in exactly the
part of this that's easiest to get wrong (checking whether a change
happened at the *start* of a gesture, before that gesture has actually
had a chance to change anything yet).

<script setup>
import CustomComponent from './components/43-example.vue';
</script>
