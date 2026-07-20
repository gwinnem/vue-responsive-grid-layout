# Layout lifecycle events

<CustomComponent/>

## Code

```vue
<GridLayout
  v-model:layout="layout"
  @layout-before-mount="onBeforeMount"
  @layout-created="onCreated"
  @layout-mounted="onMounted"
  @layout-ready="onReady"
  @layout-updated="onUpdated"
  @columns-changed="onColumnsChanged"
  @dragstart="onDragStart"
  @dragmove="onDragMove"
  @dragend="onDragEnd"
>
  <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y"
    @container-resized="onContainerResized" @item-clicked="onItemClicked" @resize="onResize">
    {{ item.i }}
  </GridItem>
</GridLayout>
```

## `GridLayout` lifecycle events

Fire in this order, once each, as the component sets up:

1. **`layout-before-mount`** — from `onBeforeMount`, before the layout
   has been validated or laid out.
2. **`layout-created`** — synchronously during setup, immediately, with
   the initial `layout` prop.
3. **`layout-mounted`** — from `onMounted`, before layout
   validation/responsive setup has run.
4. **`layout-ready`** — fired once, after the container's width is
   known and every item's size is stable. The first reliable point to
   read exposed state like `lastBreakpoint`, or inspect final
   positions/sizes.

Then repeatedly as things change:

- **`layout-updated`** — after a layout mutation (compaction,
  drag/resize completion, responsive switch) has fully settled.
- **`columns-changed`** — the resolved column count changes (the
  `colNum` prop, or a responsive-breakpoint switch).
- **`dragstart`/`dragmove`/`dragend`** — `GridLayout`'s own raw
  drag-in-progress events, distinct from `GridItem`'s `item-move`/
  `item-moved` (which report position specifically; these report that
  a drag is happening at all, regardless of which item).

## `GridItem` events used here

- **`container-resized`** — the item's rendered pixel size changed.
- **`resize`** — fired continuously while a resize is in progress
  (distinct from `resized`, which fires once when it completes).
- **`item-clicked`** — a genuine click/tap on the item (trailing clicks
  from a drag/resize gesture ending are suppressed). See
  [Multi-select & group move/resize](/examples/37-example) for this
  event's main use case.

<script setup>
import CustomComponent from './components/40-example.vue';
</script>
