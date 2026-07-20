# GridItem Props

`h`, `i`, `w`, `x`, and `y` are required — everything else has a default.
Props that can defer to a `GridLayout` default (`isDraggable`,
`isResizable`, `isBounded`) accept `null` for exactly that purpose.

| Prop | Type | Default | Description |
|---|---|---|---|
| `h` | `number` (required) | — | Height, in grid row units. |
| `i` | `string \| number` (required) | — | Unique identifier, matching this item's entry in the parent's `layout` array. |
| `w` | `number` (required) | — | Width, in grid column units. |
| `x` | `number` (required) | — | Starting horizontal position, in grid column units. |
| `y` | `number` (required) | — | Starting vertical position, in grid row units. |
| `ariaLabels` | `IGridAriaLabels` | `{}` | Per-item overrides for localizable UI/ARIA strings — only the keys actually set here override whatever `GridLayout`'s own `ariaLabels` (or the built-in English defaults) would otherwise supply for this specific item. See [Localizable ARIA strings](/examples/36-example). |
| `autoScroll` | `boolean` | `false` | Scrolls the item's nearest scrollable ancestor automatically when a drag or resize approaches its edge. A native, `requestAnimationFrame`-driven implementation, not configurable beyond on/off. See [autoScroll](/examples/39-example). |
| `autoHeight` | `boolean` | `false` | Automatically re-runs `autoSize()`'s measurement whenever the default slot's content actually changes size (via a `ResizeObserver` on a dedicated wrapper element), without a consumer manually calling the exposed `autoSize()` method themselves. See [Per-item autoHeight](/examples/31-example). |
| `borderRadiusPx` | `number \| null` | `null` (inherits `GridLayout`'s own `borderRadiusPx`, itself `10` by default) | Border radius, in pixels, applied when `useBorderRadius` is true. See [Border radius](/examples/14-example). |
| `dragAllowFrom` | `string \| null` | `null` | CSS selector restricting which descendant elements can start a drag. `null` allows dragging from anywhere except `dragIgnoreFrom` matches. |
| `dragIgnoreFrom` | `string` | `` `a, button` `` | CSS selector for elements that should *not* start a drag. |
| `enableEditMode` | `boolean \| null` | `null` (inherits `GridLayout`'s own `enableEditMode`, itself `true` by default) | Master switch — when `false`, the item can't be dragged, resized, or closed regardless of other props. Same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton` — set explicitly per item to override the grid-wide default for just that item. See [Edit mode toggle](/examples/21-example). |
| `isBounded` | `boolean \| null` | `null` | Restrict dragging to within the container. `null` defers to `GridLayout`'s `isBounded`. |
| `isDraggable` | `boolean \| null` | `null` | `null` defers to `GridLayout`'s `isDraggable`. |
| `isMirrored` | `boolean \| null` | `true` | Whether this item participates in the parent layout's RTL mirroring. |
| `isResizable` | `boolean \| null` | `null` | `null` defers to `GridLayout`'s `isResizable`. |
| `isStatic` | `boolean \| null` | `false` | Ignores `isDraggable`/`isResizable` entirely; excluded from collision cascades. See [Static items](/examples/17-example). |
| `maxH` | `number` | `Infinity` | Maximum height, in grid row units. See [Size constraints & aspect ratio](/examples/38-example). |
| `maxW` | `number` | `Infinity` | Maximum width, in grid column units. See [Size constraints & aspect ratio](/examples/38-example). |
| `minH` | `number` | `1` | Minimum height, in grid row units. See [Size constraints & aspect ratio](/examples/38-example). |
| `minW` | `number` | `1` | Minimum width, in grid column units. See [Size constraints & aspect ratio](/examples/38-example). |
| `preserveAspectRatio` | `boolean` | `false` | Locks the width/height ratio while resizing. See [Size constraints & aspect ratio](/examples/38-example). |
| `resizeIgnoreFrom` | `string \| null` | `null` | CSS selector for elements that should *not* start a resize. |
| `resizeHandleColor` | `string \| null` | `null` (inherits `GridLayout`'s own `resizeHandleColor`, itself a semi-transparent gray by default) | CSS color for the visible resize handle, when `showResizeHandles` is true. Has no effect while `showResizeHandles` is false. |
| `showResizeHandles` | `boolean \| null` | `null` (inherits `GridLayout`'s own `showResizeHandles`, itself `false` by default) | Renders a visible resize-handle affordance instead of only a cursor change on hover. See [Configurable resize-hint appearance](/examples/33-example). |
| `showCloseButton` | `boolean \| null` | `null` (inherits `GridLayout`'s own `showCloseButton`, itself `false` by default) | Shows the built-in close button. Ignored when `isStatic` is true. See [Show close button](/examples/13-example). |
| `useBorderRadius` | `boolean \| null` | `null` (inherits `GridLayout`'s own `useBorderRadius`, itself `false` by default) | Applies `borderRadiusPx` as a border radius. |

## Resize direction support

All four edges — top, right, bottom, left — and their diagonal corners are
resizable. Left/top-edge resizes move the item's position (`x`/`y`) as
well as its size, since growing from the left/top edge means the opposite
edge stays fixed. In RTL mode, this is mirrored correctly too — dragging
the right edge (rather than the left) is what moves the anchor, verified
directly against the [Mirrored (RTL)](/examples/06-example) example, not
just reasoned through.

