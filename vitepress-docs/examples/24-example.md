# Configurable transition duration & easing

<CustomComponent/>

## Code

```vue
<GridLayout
  v-model:layout="layout"
  :transition-duration-ms="500"
  transition-timing-function="ease-out"
>
  ...
</GridLayout>
```

Applied via CSS custom properties (`--grid-transition-duration`,
`--grid-transition-timing`) set on `GridLayout`'s own root element and
inherited naturally by every `GridItem` underneath — not an eventBus
cascade like most other layout-level defaults (`isDraggable`,
`showCloseButton`, etc.), since CSS custom properties already inherit
through the DOM without needing one. There's no per-item override prop
for the same reason: a consumer wanting a different transition for one
specific item can already set `--grid-transition-duration`/
`--grid-transition-timing` directly on that item's own element via a
scoped style, which naturally takes precedence over the inherited value.

Controls both item position/size transitions (drag, resize, and the
internal drag placeholder — all share the same `.vue-grid-item` CSS
class) and this grid's own auto-height transition (`autoSize`). The
close button's own hover transition is intentionally separate — a
different concern (button hover feedback, not item movement) that
doesn't change based on this setting.

<script setup>
import CustomComponent from './components/24-example.vue';
</script>
