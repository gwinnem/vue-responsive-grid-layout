---
aside: true
page: true
title: Components
---

# Components

The package exports four components from its main entry point:

| Component | Purpose |
|---|---|
| [`GridLayout`](/components/grid-layout) | The grid container — owns the layout array, breakpoints, and collision/compaction logic. |
| [`GridItem`](/components/grid-item) | A single draggable/resizable cell, rendered inside `GridLayout`'s default slot. |
| `CustomCloseButton` | The exact close button `GridItem` renders internally for `show-close-button` — exported for standalone reuse. See [Styling → GridItem](/components/css-grid-item). |
| `CustomDragElement` | A standalone drag-handle widget, not used internally by the library — pair it with `GridItem`'s `dragAllowFrom` prop. See [Custom drag handle & close button](/examples/18-example). |

```ts
import {
  GridLayout,
  GridItem,
  CustomCloseButton,
  CustomDragElement,
} from 'vue-ts-responsive-grid-layout';
```

There's no default export — always import by name. See
[Installation](/guide/installation) if you haven't added the package yet.
