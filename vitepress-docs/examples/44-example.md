# Grid dimensions (rowHeight, colNum, margin)

<CustomComponent/>

## Code

```vue
<template>
  <GridLayout v-model:layout="layout" :col-num="colNum" :margin="[marginH, marginV]" :row-height="rowHeight">
    <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
      {{ item.i }}
    </GridItem>
  </GridLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([/* ... */]);

const rowHeight = ref(80);
const colNum = ref(12);
const marginH = ref(10);
const marginV = ref(10);
</script>
```

- **`rowHeight`** (default `150`) — pixel height of a single grid row.
  Column width is never set directly; it's always derived from the
  container's own measured width divided by `colNum`.
- **`colNum`** (default `12`) — number of columns the grid divides its
  width into. Changing this doesn't reflow existing items' `x`/`w`
  values for you — an item positioned for a 12-column grid can overflow
  or collide once `colNum` drops low enough that its own `x + w` no
  longer fits. See [Layout bounds & rendering options](/examples/41-example)
  for `maxRows`/`distributeEvenly`, which affect overflow handling
  along the *row* axis the same way.
- **`margin`** (default `[10, 10]`) — `[horizontal, vertical]` gap
  between items, in pixels. The two axes are fully independent of each
  other.

See [GridLayout props](/components/grid-layout-props) for the complete
prop reference.

<script setup>
import CustomComponent from './components/44-example.vue';
</script>
