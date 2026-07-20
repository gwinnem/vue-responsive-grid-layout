# Size constraints & aspect ratio

<CustomComponent/>

## Code

```vue
<GridItem :h="2" i="0" :max-w="4" :min-w="2" :w="3" :x="0" :y="0">
  Clamped between 2 and 4 columns wide
</GridItem>
<GridItem :h="2" i="1" :max-h="3" :min-h="2" :w="3" :x="3" :y="0">
  Clamped between 2 and 3 rows tall
</GridItem>
<GridItem :h="2" i="2" preserve-aspect-ratio :w="3" :x="6" :y="0">
  Resizes proportionally from any corner
</GridItem>
```

`minW`/`maxW`/`minH`/`maxH` clamp how far a resize can go, in grid
units — a resize that would go past the limit stops there instead.
`preserveAspectRatio` keeps width/height changing together
proportionally while resizing, based on the item's own starting ratio.

<script setup>
import CustomComponent from './components/38-example.vue';
</script>
