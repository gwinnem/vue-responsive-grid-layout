# Drag allow / ignore elements

<CustomComponent/>

## Code

```vue
<!-- Only .drag-handle can start a drag -->
<GridItem drag-allow-from=".drag-handle">
  <span class="drag-handle">⠿</span>
</GridItem>

<!-- Anything except .no-drag can start a drag -->
<GridItem drag-ignore-from=".no-drag">
  <button class="no-drag">Click me</button>
</GridItem>
```

Both props accept any CSS selector. `dragIgnoreFrom` defaults to
`` `a, button` `` — links and buttons never start a drag out of the box,
which is why the button in the second card above already didn't need
`@click.stop` to be clickable.

<script setup>
import CustomComponent from './components/05-example.vue';
</script>
