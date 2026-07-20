# Border radius

<CustomComponent/>

## Code

```vue
<GridItem :use-border-radius="true" :border-radius-px="16">...</GridItem>
```

Setting `useBorderRadius`/`borderRadiusPx` on `GridLayout` instead works
too — it cascades to every `GridItem` that doesn't set its own (`null`,
the default), the same inherit pattern as `isDraggable`/`isResizable`.
Setting it directly on a `GridItem`, as above, overrides that inherited
default for that one item.

<script setup>
import CustomComponent from './components/14-example.vue';
</script>
