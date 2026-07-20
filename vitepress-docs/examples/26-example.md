# Alignment guides while dragging

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" show-alignment-guides>
  ...
</GridLayout>
```

Grid-unit-based, not pixel-based: an alignment exists whenever the
actively-dragged/resized item's left, right, top, or bottom edge lands
on the exact same grid coordinate as another item's edge — independent
of the current `colWidth`/`rowHeight`/`margin`, which only affect where
the guide line renders, not whether the alignment exists. Not restricted
to same-side matches (a left edge lining up with another item's *right*
edge is just as valid an alignment as left-to-left).

Purely visual feedback — it doesn't snap the dragged item to the
alignment or constrain its movement in any way, and adds no cost when
`showAlignmentGuides` is off (the default), which it is unless set.

<script setup>
import CustomComponent from './components/26-example.vue';
</script>
