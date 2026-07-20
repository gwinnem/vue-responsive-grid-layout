# Configurable resize-hint appearance

<CustomComponent/>

## Code

```vue
<!-- Grid-level default, applies to every item that doesn't override it -->
<GridLayout v-model:layout="layout" show-resize-handles resize-handle-color="#5e5e5e">
  ...
  <!-- Per-item override -->
  <GridItem show-resize-handles resize-handle-color="crimson" ...>
</GridLayout>
```

Applied via a `--resize-handle-color` CSS custom property, inherited
by every `GridItem` the same way `transitionDurationMs` is — no
eventBus cascade needed. The color is simply not emitted at all when
`showResizeHandles` is off, and the underlying CSS already defaults to
transparent when the variable is unset, so there's no separate
visibility flag to keep in sync with the color.

<script setup>
import CustomComponent from './components/33-example.vue';
</script>
