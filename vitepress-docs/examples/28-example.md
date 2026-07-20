# Export layout as SVG

<CustomComponent/>

## Code

```ts
import { exportLayoutAsSvg } from 'vue-ts-responsive-grid-layout';

const svg = exportLayoutAsSvg(layout.value, {
  colNum: 12,        // default 12, matching GridLayout's own default
  rowHeight: 150,    // default 150
  margin: [10, 10],  // default [10, 10]
  containerWidth: 1200, // required for meaningful output — see below
  itemFill: '#eef2ff',
  itemStroke: '#c7d2fe',
  labelColor: '#3730a3',
  backgroundColor: null, // transparent by default
});
```

Returns a complete `<svg>...</svg>` document as a string. Use it
directly (`innerHTML`), download it as a file
(`new Blob([svg], { type: 'image/svg+xml' })`), or draw it onto a
`<canvas>` via a `data:` URL if a raster image (PNG/JPEG) is
specifically needed instead.

`containerWidth` needs to be supplied explicitly — unlike `GridLayout`
itself, which measures its own container automatically via
`ResizeObserver`, there's no DOM element for this standalone function
to measure. Pass the same width your actual grid renders at for a
matching result.

::: warning Not a DOM screenshot
This draws each item as a labeled rectangle from the layout data
alone — deliberately dependency-free, at the cost of not capturing
arbitrary custom slot content's actual rendered appearance (a chart, an
image). Good for a structural overview/thumbnail of the layout itself;
if you need a true screenshot of what's actually rendered, use a
`html2canvas`-style library directly against the grid's root element
instead.
:::

<script setup>
import CustomComponent from './components/28-example.vue';
</script>
