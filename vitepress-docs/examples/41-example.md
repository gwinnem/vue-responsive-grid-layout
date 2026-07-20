# Layout bounds & rendering options

<CustomComponent/>

## Code

```vue
<GridLayout
  v-model:layout="layout"
  :max-rows="3"
  restore-on-drag
  distribute-evenly
  :transform-scale="1"
  use-css-transforms
>
  <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
    {{ item.i }}
  </GridItem>
</GridLayout>
```

- **`maxRows`** (default `Infinity`) — a hard ceiling on how many rows
  the layout may grow to.
- **`restoreOnDrag`** (default `false`) — while dragging, other items
  don't compact past their pre-drag position until the drag actually
  ends, rather than compacting continuously as the dragged item moves.
- **`distributeEvenly`** (default `false`) — items that would overflow
  the right edge spread evenly across the available columns instead of
  just clamping.
- **`transformScale`** (default `1`) — compensates drag/resize math for
  this grid rendering inside a CSS-scaled ancestor (`transform: scale(...)`),
  so dragging still tracks the pointer accurately at the scaled-down
  size instead of drifting.
- **`useCssTransforms`** (default `true`) — the positioning mechanism
  itself: CSS `transform: translate(...)` (the fast path) versus
  `top`/`left` (the fallback, for environments where transforms cause
  issues). Visually identical either way.

## `calcXY()` — a low-level exposed utility

`GridItem`'s own exposed `calcXY(top, left)` converts a pixel position
to the equivalent grid-unit `x`/`y`, using that item's current
`colWidth`/`rowHeight`/`margin`. Rarely needed directly — drag/resize
already handle this internally — but useful for converting an
externally-tracked pixel position (e.g. from a custom drop target) to
grid coordinates yourself.

<script setup>
import CustomComponent from './components/41-example.vue';
</script>
