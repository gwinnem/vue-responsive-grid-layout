# Static items

<CustomComponent/>

## Code

```vue
<GridItem :is-static="true">Locked in place</GridItem>
```

`isStatic` can be set per-item in the layout array (as above) or as a
per-`GridItem` prop directly. A static item ignores `isDraggable`/
`isResizable` entirely, is excluded from the drag-collision cascade
(other items compact around it as a fixed obstacle), and its close button
is hidden even if `showCloseButton` is set.

::: tip Common use case: dashboard "anchors"
A common pattern is a static header or KPI card that should never move,
surrounded by draggable widgets — set `isStatic: true` on just that one
layout entry.
:::

<script setup>
import CustomComponent from './components/17-example.vue';
</script>
