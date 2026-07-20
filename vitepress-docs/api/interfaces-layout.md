---
aside: false
---

# Layout interfaces

## `ILayoutItemRequired`

The grid-position/size fields every layout item must have, regardless of
its interactivity settings.

```typescript
export interface ILayoutItemRequired {
  i: string | number;
  h: number;
  w: number;
  x: number;
  y: number;
}
```

## `ILayoutItem`

One entry in a `GridLayout`'s `layout` array. The optional fields mirror
the corresponding `GridItem` props — set them on the layout item to
configure a `GridItem` from data rather than template props.

```typescript
export interface ILayoutItem<TMeta = unknown> extends ILayoutItemRequired {
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  /** Set internally by the compaction/collision helpers; not meant to be set by consumers. */
  moved?: boolean;
  /** Optional, consumer-defined payload — never read or written by the library itself. */
  data?: TMeta;
}
```

`TMeta` (default `unknown`) types the optional `data` field — attach
whatever payload your item needs (a widget's config, a chart's dataset
reference, anything JSON-serializable if you're also using
[`useLayoutStorage`](/api/persistence)) directly on the layout item,
instead of maintaining a parallel array keyed by `i` to look it up
separately. Every existing usage of `ILayoutItem` (or `TLayout`) without
a type argument keeps working unchanged — the default only matters if
you actually read `.data` and want it typed as something more specific:

```ts
import { ref } from 'vue';
import type { ILayoutItem } from 'vue-ts-responsive-grid-layout';

interface WidgetConfig {
  chartId: string;
  refreshMs: number;
}

const layout = ref<ILayoutItem<WidgetConfig>[]>([
  { h: 2, i: '0', w: 2, x: 0, y: 0, data: { chartId: 'revenue', refreshMs: 5000 } },
]);

// layout.value[0].data is typed as WidgetConfig, not unknown.
```

See [`TLayout`](/api/types-layout) for the array type built from this
interface, and [GridLayout props](/components/grid-layout-props) for how
the `layout` prop is used.
