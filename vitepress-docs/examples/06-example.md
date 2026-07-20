# Mirrored (RTL)

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :is-mirrored="true">
  ...
</GridLayout>
```

A `GridItem` can also opt out individually with its own `is-mirrored`
prop, if you want most of a layout mirrored but a specific item to stay
pinned to its literal `x` position.

<script setup>
import CustomComponent from './components/06-example.vue';
</script>
