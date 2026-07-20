# Multiple grids

<CustomComponent/>

## Code

```vue
<template>
  <GridLayout v-model:layout="layoutA">...</GridLayout>
  <GridLayout v-model:layout="layoutB">...</GridLayout>
</template>
```

Each `GridLayout` creates its own `eventBus` and `provide`/`inject`
context (see [Architecture](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/ARCHITECTURE.md)
in the source repo for details) — grids never share state, so there's
nothing to namespace or configure.

::: warning Not the same as dragging between grids
This just shows two grids side by side. For actually dragging an item
*from* one grid *into* another, see [Drag, drop from outside](/examples/11-example)
— cross-grid dragging works the same way, using the source grid's
`dragEvent` and the target grid's layout array.
:::

<script setup>
import CustomComponent from './components/04-example.vue';
</script>
