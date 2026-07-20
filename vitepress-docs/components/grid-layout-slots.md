# GridLayout Slots

## Default slot

Where every `GridItem` you render goes. `GridLayout` itself doesn't
create or manage `GridItem` instances — you render one per layout entry
yourself, typically with `v-for`:

```vue
<GridLayout v-model:layout="layout">
  <GridItem v-for="item in layout" :key="item.i" v-bind="item">
    Item {{ item.i }}
  </GridItem>
</GridLayout>
```

## `#placeholder`

Customizes the drag placeholder's content — the box shown while an item
is being dragged or resized, indicating where it will land. By default
this is a plain colored box with nothing inside it. Content you provide
here renders inside the same internal `GridItem` the library already
uses for the placeholder, layered on top of its existing
background/sizing rather than replacing it — the same relationship a
regular `GridItem`'s own default slot content has with its background.

```vue
<GridLayout v-model:layout="layout">
  <GridItem v-for="item in layout" :key="item.i" v-bind="item">...</GridItem>
  <template #placeholder="{ placeholder, isDragging }">
    <div class="my-placeholder">Drop at {{ placeholder.x }}, {{ placeholder.y }}</div>
  </template>
</GridLayout>
```

The slot receives two scope props:

| Prop | Type | Description |
|---|---|---|
| `placeholder` | `{ x, y, w, h }` | The placeholder's current grid position/size — updates live as you drag or resize. |
| `isDragging` | `boolean` | Whether a drag or resize is currently in progress. |

Visibility is still controlled by the library (`v-show`, not `v-if`) —
your slot content is present in the DOM regardless of whether a drag is
actually happening; you only control what's rendered *inside* the
placeholder, not when it's shown. See
[Custom drag-placeholder content](/examples/25-example) for a full
example.
