# Custom drag handle & close button

<CustomComponent/>

## Code

```vue
<GridItem drag-allow-from=".drag-handle-slot" resize-ignore-from=".drag-handle-slot" :show-close-button="false">
  <CustomDragElement class="drag-handle-slot" text="⠿" />
  Item content
  <CustomCloseButton :i="item.i" @remove-grid-item="removeItem" />
</GridItem>
```

```ts
import { GridLayout, GridItem, CustomCloseButton, CustomDragElement } from 'vue-ts-responsive-grid-layout';
```

`CustomCloseButton` is the exact component `GridItem` renders internally
for its own built-in close button (`show-close-button`). `CustomDragElement`
is a standalone opt-in handle, not used internally by the library, exported
purely for cases like this one. Both are plain exported components you can
style to match your own design.

::: tip Why both `drag-allow-from` *and* `resize-ignore-from`?
Resizing is triggered by pointer proximity to the item's own edges, not by
a specific handle element — it doesn't know or care where
`drag-allow-from` puts the drag handle. A handle positioned near a corner
(as this one is, `top: 8px; left: 8px`) sits inside that same
edge-detection margin, so grabbing it could start a resize instead of the
drag `drag-allow-from` was supposed to restrict things to.
`resize-ignore-from` is the same kind of CSS-selector restriction, just
for resizing instead of dragging — excluding the handle from it is what
actually stops the two from fighting over the same gesture.
:::

<script setup>
import CustomComponent from './components/18-example.vue';
</script>
