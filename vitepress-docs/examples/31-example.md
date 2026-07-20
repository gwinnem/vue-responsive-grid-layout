# Per-item autoHeight

<CustomComponent/>

## Code

```vue
<GridItem auto-height :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
  <div>Content that changes height over time</div>
</GridItem>
```

Sets up a `ResizeObserver` on the slot content (via a dedicated wrapper
element, only rendered when `autoHeight` is on — the default,
unwrapped case is completely unaffected), automatically calling the
same measurement `autoSize()` performs whenever the content's own size
actually changes. Distinct from `GridLayout`'s own grid-level
`autoSize` prop (which sizes the whole container to its content) —
this is per-item, so one card's content growing doesn't require the
entire grid to also be auto-sized.

<script setup>
import CustomComponent from './components/31-example.vue';
</script>
