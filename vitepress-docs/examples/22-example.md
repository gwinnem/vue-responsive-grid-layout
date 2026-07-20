# Cross-grid drop restrictions

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="teamA" :allow-cross-grid-drag="teamAEnabled" layout-id="team-a" ...>
  ...
</GridLayout>

<GridLayout v-model:layout="archive" :allow-cross-grid-drag="archiveEnabled" :disable-external-drop="archiveRejects"
  layout-id="archive" @cross-grid-drop-rejected="onRejected" ...>
  ...
</GridLayout>
```

```ts
const onRejected = ({ itemId, sourceLayoutId }) => {
  console.log(`Archive rejected "${itemId}" from ${sourceLayoutId}.`);
};
```

`allowCrossGridDrag` is what makes a grid participate in cross-grid
drag/drop at all — every grid that should be part of the same
"drag pool" sets it, including the two in the simpler [Drag, drop from
grid to grid](/examples/12-example) example. Toggle any grid's own
checkbox above off and it drops out of the pool immediately: its items
can no longer be dragged into any other grid, and other grids can no
longer drop into it either — the prop covers both directions at once.

`disableExternalDrop`, toggleable on **Archive** independently of its
own `allowCrossGridDrag` toggle, is the opt-out: that grid can still have
its own items dragged *out* to Team A or Team B, but nothing can be
dropped *into* it. Attempting to drop something there
doesn't fail silently — `GridLayout` emits
`EGridLayoutEvent.CROSS_GRID_DROP_REJECTED` (`@cross-grid-drop-rejected`)
on the grid that refused the drop, with the id of the item that was
turned away and the `layoutId` of wherever it came from, so the UI (or
your own state) can react to it explicitly. A successful drop anywhere
else emits `EGridLayoutEvent.CROSS_GRID_ITEM_DROPPED`
(`@cross-grid-item-dropped`) on the receiving grid instead.

::: tip Why does Archive have a static item in it already?
Just to show that `disableExternalDrop` and `isStatic` are independent:
Archive's own existing item is static (can't be dragged *at all*,
anywhere), while the *grid itself* separately refuses anything dragged
*into* it from outside. Team A and Team B's items are ordinary — free to
move within their own grid, to each other, or be turned away by Archive.
:::

<script setup>
import CustomComponent from './components/22-example.vue';
</script>
