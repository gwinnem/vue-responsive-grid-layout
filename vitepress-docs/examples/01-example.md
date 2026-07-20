# Basic drag & resize

The simplest possible setup: a `GridLayout` bound to a layout array with
`v-model:layout`, and a `GridItem` for each entry.

<CustomComponent/>

## Code

::: code-group

```vue [Template]
<GridLayout v-model:layout="layout" :col-num="12" :row-height="60">
  <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
    <div class="my-item">{{ item.i }}</div>
  </GridItem>
</GridLayout>
```

```ts [Script]
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';
import 'vue-ts-responsive-grid-layout/style.css';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
  { h: 2, i: '2', w: 2, x: 4, y: 0 },
  { h: 4, i: '3', w: 2, x: 6, y: 0 },
  { h: 2, i: '4', w: 2, x: 8, y: 0 },
]);
```

:::

::: tip Every item is draggable and resizable by default
`GridLayout`'s `isDraggable`/`isResizable` props (both default `true`)
apply to every item unless a specific `GridItem` overrides them with its
own `is-draggable`/`is-resizable` prop. See [Props](/components/grid-layout-props).
:::

<script setup>
import CustomComponent from './components/01-example.vue';
</script>
