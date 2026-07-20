# Horizontal shift

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :horizontal-shift="true">
  ...
</GridLayout>
```

The default collision behavior compacts vertically (colliding items get
pushed down). `horizontalShift` changes that to push left/right instead —
useful for layouts that read more naturally as a single row or a small
number of rows.

<script setup>
import CustomComponent from './components/15-example.vue';
</script>
