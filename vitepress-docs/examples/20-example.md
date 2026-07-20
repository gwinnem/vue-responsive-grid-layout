# Auto-size grid on content

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" :auto-size="true">
  ...
</GridLayout>
```

`autoSize` is `true` by default — most consumers never need to think
about it. It's worth knowing about mainly for the opposite case: set
`:auto-size="false"` if you want a fixed-height scrollable grid instead of
one that grows to fit its content.

::: tip Don't confuse this with `GridItem`'s `autoSize()` method
This page is about `GridLayout`'s `autoSize` **prop** (container height).
`GridItem` separately exposes an `autoSize()` **method** for resizing a
single item to fit its own slot content (e.g. a chart that just rendered)
— a different feature, with a currently-documented reliability limitation.
See [`GridItem` component internals](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md)
if you're looking for that one specifically.
:::

<script setup>
import CustomComponent from './components/20-example.vue';
</script>
