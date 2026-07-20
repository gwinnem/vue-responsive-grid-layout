# Responsive predefined layouts

<CustomComponent/>

## Code

```ts
const responsiveLayouts: TResponsiveLayout = {
  xs: [
    { h: 2, i: 'header', w: 4, x: 0, y: 0 },
    { h: 4, i: 'content', w: 4, x: 0, y: 2 },
    { h: 3, i: 'sidebar', w: 4, x: 0, y: 6 },
  ],
};
```

```vue
<GridLayout v-model:layout="layout" responsive :responsive-layouts="responsiveLayouts">
  ...
</GridLayout>
```

Any breakpoint you don't provide an explicit entry for falls back to an
auto-generated layout, derived from whichever layout was active before —
see `findOrGenerateResponsiveLayout` in the library's
[`responsive-helper.ts`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/src/core/gridlayout/helpers/responsive-helper.ts)
if you're curious how that derivation works.

<script setup>
import CustomComponent from './components/09-example.vue';
</script>
