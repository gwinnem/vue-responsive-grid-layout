# Multi-select & group move/resize

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" multi-select>
  <GridItem v-for="item in layout" :key="item.i" show-resize-handles :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
    {{ item.i }}
    <template #resize-handle="{ edge }">
      <span>⤡</span> <!-- edge is 'n'|'s'|'e'|'w'|'ne'|'nw'|'se'|'sw' -->
    </template>
  </GridItem>
</GridLayout>
```

```ts
gridRef.value.selectItem('a');           // replaces the selection with just 'a'
gridRef.value.selectItem('b', true);     // adds 'b' additively (Shift/Ctrl+click equivalent)
gridRef.value.toggleItemSelection('b');  // toggles 'b' in/out
gridRef.value.deselectItem('a');
gridRef.value.clearSelection();
gridRef.value.selectedItems;             // reactive array of currently-selected ids
```

## Multi-select

Off by default (`multiSelect: false`) — every prior behavior is
completely unaffected when this stays off. When on:

- **Click** an item — selects only it, replacing any prior selection.
- **Shift+click or Ctrl/Cmd+click** — adds/removes that item from the
  current selection additively.
- **Click empty grid background** — clears the selection entirely.

Dragging or resizing any *selected* item while more than one item is
selected moves/resizes every other selected item by the same delta —
also works from the keyboard (arrow keys/Shift+arrow on a focused,
selected item), not just mouse/touch drag.

A passenger that's static, or has `isDraggable`/`isResizable`
explicitly `false`, never moves or resizes as part of a group gesture
— the same guarantee a static item already has against the normal
collision-push cascade. A passenger's own `minW`/`maxW`/`minH`/`maxH`
are also respected individually during group resize, not just clamped
to the anchor's own limits (or a bare floor of 1) — see item "d" in the
demo above, which stops at its own `maxW` of 3 even while the other,
unconstrained items keep growing.

::: warning Deliberately scoped, not fully collision-aware
The delta is applied directly to every other selected item's position
or size — there's no per-passenger collision detection against
*non-selected* items during the gesture itself, only the
dragged/resized item gets the usual collision/bounds handling.
Compaction (per `compactType`) still runs normally once the
gesture ends. See `docs/REFACTORING.md` for the full design rationale.
:::

Listen for `@selection-changed` (payload: the full current selection as
an array) to react to selection changes, or read the exposed
`selectedItems` directly.

## Custom resize-handle rendering (`#resize-handle` slot)

A named, scoped slot on `GridItem` — receives `{ edge }` (`'n'`, `'s'`,
`'e'`, `'w'`, `'ne'`, `'nw'`, `'se'`, `'sw'`), letting you render
different content per edge/corner if you want. Renders inside the same
small hit-area `showResizeHandles`/`resizeHandleColor` already use for
the color/visibility toggle — both can be combined, or the slot used on
its own for a fully custom icon instead of a plain colored dot.

<script setup>
import CustomComponent from './components/37-example.vue';
</script>
