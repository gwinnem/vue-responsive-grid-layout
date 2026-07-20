---
aside: false
---

# Utilities

Small, standalone helper functions — no Vue reactivity or component
lifecycle involved, unlike `useLayoutStorage`/`useLayoutPresets`.

## `readOutsideDropPayload<T>(dataTransfer, mimeType?)`

A typed-payload convention for `allowOutsideDrop`'s
`item-dropped-from-outside` event, whose payload hands back the raw
native `DataTransfer` — every consumer otherwise re-implements the same
`getData`/`JSON.parse` parsing. See
[outsideDropAccept & readOutsideDropPayload](/examples/34-example).

```ts
function readOutsideDropPayload<T>(
  dataTransfer: DataTransfer | null | undefined,
  mimeType?: string, // default 'text/plain'
): T | null;
```

Never throws: a missing MIME type or malformed JSON both return `null`,
mirroring `deserializeLayout`'s own "nothing usable was there"
convention. Performs no shape validation beyond "valid JSON" — the
payload is whatever the consumer's own drag source attached, so there's
no single shape to validate against.

```ts
import { readOutsideDropPayload } from 'vue-ts-responsive-grid-layout';

function onDropped(payload: { dataTransfer: DataTransfer | null }) {
  const data = readOutsideDropPayload<{ label: string }>(payload.dataTransfer, 'application/x-my-widget');
  if (data) {
    // use data.label
  }
}
```

## `exportLayoutAsSvg(layout, options?)`

A dependency-free grid-to-image export — draws each item as a labeled
rectangle from layout data alone, rather than a `html2canvas`-style DOM
screenshot (no new runtime dependency, at the cost of not capturing
arbitrary custom slot content's actual rendered appearance). See
[Export layout as SVG](/examples/28-example).

```ts
function exportLayoutAsSvg(layout: TLayout, options?: IExportLayoutAsSvgOptions): string;
```

### `IExportLayoutAsSvgOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `colNum` | `number` | `12` | Number of columns the layout uses. |
| `rowHeight` | `number` | `150` | Height of one grid row, in pixels. |
| `margin` | `[number, number]` | `[10, 10]` | `[horizontal, vertical]` spacing between items, in pixels. |
| `containerWidth` | `number` | `1200` | The pixel width to lay the grid out against — supplied explicitly, since there's no DOM element for this standalone function to measure. Pass the same width your actual grid renders at for a matching result. |
| `itemFill` | `string` | `'#eef2ff'` | Fill color for each item's rectangle. |
| `itemStroke` | `string` | `'#c7d2fe'` | Stroke color for each item's rectangle. |
| `labelColor` | `string` | `'#3730a3'` | Text color for each item's id label. |
| `backgroundColor` | `string \| null` | `null` | Background color for the whole SVG. `null` leaves it transparent. |

Returns a complete `<svg>...</svg>` document as a string — use it
directly (`innerHTML`), download it as a file
(`new Blob([svg], { type: 'image/svg+xml' })`), or draw it onto a
`<canvas>` via a `data:` URL if a raster image is specifically needed.

```ts
import { exportLayoutAsSvg } from 'vue-ts-responsive-grid-layout';

const svg = exportLayoutAsSvg(layout.value, { containerWidth: 1200 });
```
