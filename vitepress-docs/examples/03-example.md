# Events

<CustomComponent/>

## Code

```vue
<GridItem
  v-for="item in layout"
  :key="item.i"
  v-bind="item"
  @item-moved="(i, x, y) => console.log(`${i} moved to`, x, y)"
  @resized="(i, h, w) => console.log(`${i} resized to`, w, h)"
/>
```

See the full list of events on [GridLayout](/components/grid-layout-events)
and [GridItem](/components/grid-item-events), plus the lower-level
[eventBus events](/components/grid-item-event-bus-events) used internally
between the two components.

<script setup>
import CustomComponent from './components/03-example.vue';
</script>
