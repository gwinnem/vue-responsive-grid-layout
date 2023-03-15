# Responsive layout

The following breakpoints are applied by default:

```typescript
breakpoints: (): IBreakpoints => ({
  xxl: 1600,
  xl: 1400,
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
})
cols: (): IColumns => ({
  xxl: 12,
  xl: 12,
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
})
```
::: tip
Resize the browser window to see how the Grid is behaving.
:::
<CustomComponent/>

<script setup>
import CustomComponent from './components/07-example.vue';
</script>
