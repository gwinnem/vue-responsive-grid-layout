# Bounded drag to container

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :is-bounded="true">
  <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y" />
</GridLayout>
```

::: tip Per-item override
`isBounded` can also be set on an individual `GridItem` (its own
`is-bounded` prop) to bound just that item regardless of the layout's
default — leave it `null` (the default) to inherit from `GridLayout`.
:::

<script setup>
import CustomComponent from './components/02-example.vue';
</script>
