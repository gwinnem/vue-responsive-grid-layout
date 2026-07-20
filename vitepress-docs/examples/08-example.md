# Prevent collision

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :prevent-collision="true">
  ...
</GridLayout>
```

::: warning Interacts with compaction
`preventCollision` stops an item from overlapping another — it doesn't
disable compaction. If you want items to stay exactly where they're put
with no automatic repositioning at all, also set `:compact-type="ECompactType.NONE"`.
:::

<script setup>
import CustomComponent from './components/08-example.vue';
</script>
