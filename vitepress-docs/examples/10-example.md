# Add or remove items

<CustomComponent/>

## Code

```vue
<GridItem
  v-for="item in layout"
  :key="item.i"
  v-bind="item"
  show-close-button
  @remove-grid-item="removeItem"
/>
```

```ts
const removeItem = (id: string | number) => {
  layout.value = layout.value.filter(item => item.i !== id);
};

const addItem = () => {
  layout.value.push({ h: 2, i: String(nextId++), w: 2, x: 0, y: 0 });
};
```

::: tip New items land at (0, 0) and get compacted automatically
You don't need to compute a free spot yourself — pushing a new item at
`x: 0, y: 0` and letting the library's compaction find it a real position
is the normal pattern (see the code above).
:::

<script setup>
import CustomComponent from './components/10-example.vue';
</script>
