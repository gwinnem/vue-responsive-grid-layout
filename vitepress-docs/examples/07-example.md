# Responsive breakpoints

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" responsive @breakpoint-changed="onBreakpointChanged">
  ...
</GridLayout>
```

```ts
const onBreakpointChanged = (breakpoint: string) => {
  console.log('now at breakpoint', breakpoint);
};
```

Customize the breakpoints and per-breakpoint column counts with the
`breakpoints`/`cols` props — see [GridLayout props](/components/grid-layout-props).
For full control, pre-define a layout for specific breakpoints with
`responsiveLayouts` — see [Responsive predefined layouts](/examples/09-example).

<script setup>
import CustomComponent from './components/07-example.vue';
</script>
