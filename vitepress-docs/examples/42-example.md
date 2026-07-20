# Pluggable compaction (compactType & compactor)

<CustomComponent/>

## Code

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, ECompactType, type TLayout, type ICompactor } from 'vue-ts-responsive-grid-layout';
import { collides } from 'vue-ts-responsive-grid-layout/core';

const layout = ref<TLayout>([/* ... */]);
const compactType = ref(ECompactType.VERTICAL);

// Bottom-most items processed first, so each claims its own lowest
// possible spot before anything above it does.
const downwardCompactor: ICompactor = {
  type: 'downward',
  compact(layoutToCompact) {
    const maxY = 8;
    const placed: TLayout = [];
    const sorted = [...layoutToCompact].sort((a, b) => b.y - a.y);
    for (const item of sorted) {
      const moved = { ...item };
      if (!moved.isStatic) {
        while (moved.y + moved.h <= maxY && !placed.some((other) => collides({ ...moved, y: moved.y + 1 }, other))) {
          moved.y++;
        }
      }
      placed.push(moved);
    }
    return layoutToCompact.map((item) => placed.find((entry) => entry.i === item.i) ?? item);
  },
};
</script>

<template>
  <GridLayout v-model:layout="layout" :compact-type="compactType" :compactor="downwardCompactor">
    <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
      {{ item.i }}
    </GridItem>
  </GridLayout>
</template>
```

- **`compactType`** (default `ECompactType.VERTICAL`) — selects one of
  five built-in compaction strategies: `VERTICAL` (items float up,
  the default), `HORIZONTAL` (items float left), `NONE` (items stay
  exactly where placed — collisions still resolve by pushing down, they
  just never float up on their own), and `VERTICAL_OVERLAP`/
  `HORIZONTAL_OVERLAP` (every non-static item moves straight to `0` on
  that axis unconditionally, ignoring collisions entirely — items may
  end up genuinely overlapping as a result). Replaces the old, separate
  `verticalCompact: boolean` prop — see `MIGRATION.md` in the repo root
  if migrating an existing consumer.
- **`compactor`** (default `null`) — replaces the built-in compaction
  algorithm entirely. `null` keeps whichever built-in strategy
  `compactType` selects; this is a purely additive override, not a
  replacement for that prop — both keep working unchanged whether or
  not `compactor` is set. Called after every drag end, resize end,
  item add/remove, on mount, on a breakpoint/column-count change, and
  by `compactNow()`/`rearrange()` — the same trigger points the
  built-in compaction already runs at.
- **`verticalCompactor`/`horizontalCompactor`/`noCompactor`/
  `verticalOverlapCompactor`/`horizontalOverlapCompactor`** — the five
  built-in strategies matching `compactType`'s own five values,
  exported from this package (and from
  `vue-ts-responsive-grid-layout/core`) as a starting point for a
  custom one. `getCompactor(compactType)` looks one of these up
  directly by its `ECompactType` value, the same mapping `GridLayout`
  itself uses internally when `compactor` isn't set.
- **`ICompactor`** — the interface itself: a `type` (informational
  only) and a `compact(layout, cols, context)` function returning a new
  array — never mutate `layout` or its items in place. `context`
  carries `compactType` (the current value of that prop,
  informational — a custom compactor decides for itself whether to use
  it) and, only during a `restoreOnDrag`-gated compaction, `minPositions`.

See [`vue-ts-responsive-grid-layout/core`](/api/core) for the
framework-agnostic entry point this example's `collides` import comes
from — the same collision detection, compaction, and movement math the
components themselves are built on, usable standalone.

<script setup>
import CustomComponent from './components/42-example.vue';
</script>
