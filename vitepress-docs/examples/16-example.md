# Show grid lines

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :show-grid-lines="true">
  ...
</GridLayout>
```

Handy while building a layout in the browser, or as a permanent visual
aid for dashboard-style grids where users expect to see the underlying
structure.

<script setup>
import CustomComponent from './components/16-example.vue';
</script>
