# autoScroll

<CustomComponent/>

## Code

```vue
<GridItem :auto-scroll="true" :h="2" i="0" :w="4" :x="0" :y="0">
  Scrolls a scrollable ancestor while dragging or resizing near its edge
</GridItem>
```

Scrolls the item's nearest scrollable ancestor automatically while
dragging or resizing near its edge, rather than the interaction being
limited to whatever's currently in the viewport. A native
`requestAnimationFrame`-driven implementation (see
`@/core/helpers/native-interaction.ts`'s `createNativeAutoScroll`), not
configurable beyond on/off — margin and speed are fixed constants tuned
for the common case, not exposed as their own props. Default `false`.

<script setup>
import CustomComponent from './components/39-example.vue';
</script>
