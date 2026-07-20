# Show close button

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :show-close-button="showCloseButton">
  <GridItem @remove-grid-item="removeItem">...</GridItem>
</GridLayout>
```

Setting `showCloseButton` on `GridLayout` (rather than on every
individual `GridItem`) controls the default for every item that doesn't
set its own — an item's own `show-close-button` prop always overrides it,
same as `isDraggable`/`isResizable`/`isBounded`. Toggling the control
above demonstrates exactly this: no item in this example sets its own
`show-close-button`, so all three follow the layout's default at once.

Want a custom close button instead of the built-in one? The library
exports the same `CustomCloseButton` component it uses internally — see
[Styling → GridItem](/components/css-grid-item) for how to swap it in.

<script setup>
import CustomComponent from './components/13-example.vue';
</script>
