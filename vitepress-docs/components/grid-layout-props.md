# GridLayout Props

Only `layout` is required — everything else has a default. Most
boolean/number props here have a matching prop on [`GridItem`](/components/grid-item-props)
that can override it per-item; see each prop's note.

| Prop | Type | Default | Description |
|---|---|---|---|
| `layout` | `TLayout` (required) | — | The layout array — one entry per `GridItem` rendered in the default slot, matched by `i`. See [Layout types](/api/types-layout). |
| `autoSize` | `boolean` | `true` | Grows/shrinks the container's height to fit the layout's content. |
| `ariaLabels` | `IGridAriaLabels` | `{}` | Grid-wide overrides for localizable UI/ARIA strings — the close button's visually-hidden label, keyboard move/resize instructions, and the item's `aria-roledescription`. Only the keys actually set here override the built-in English defaults; a specific `GridItem` can further override any of these for just itself via its own `ariaLabels` prop. See [Localizable ARIA strings](/examples/36-example). |
| `allowCrossGridDrag` | `boolean` | `false` | Lets this grid's items be dragged into any other `GridLayout` that also has this set, and (unless `disableExternalDrop` is set) accept drops from them. **Must be set on both the source and the target grid** — a drop onto a grid that doesn't have this set is indistinguishable from dropping on empty space (the item just settles back within its own grid, silently, with no event of any kind — that grid was never part of the cross-grid system at all, so there's nothing to reject the drop *from*). If cross-grid dragging "isn't working," this is the first thing to check on *both* grids. See [Drag, drop from grid to grid](/examples/12-example) and [Cross-grid drop restrictions](/examples/22-example). |
| `disableExternalDrop` | `boolean` | `false` | When `true`, this grid never accepts an incoming cross-grid drop — its own items can still be dragged *out* to other grids if `allowCrossGridDrag` is set, but nothing can be dropped *into* it. Rejected drops emit `EGridLayoutEvent.CROSS_GRID_DROP_REJECTED` on this grid. Has no effect if `allowCrossGridDrag` is `false`. |
| `layoutId` | `string` | auto-generated | A stable identifier for this grid, used in `CROSS_GRID_DROP_REJECTED`/`CROSS_GRID_ITEM_DROPPED` payloads to say which grid an item came from or was rejected by. Only meaningful with `allowCrossGridDrag`. |
| `allowOutsideDrop` | `boolean` | `false` | Accepts native HTML5 drag-and-drop from *outside* the grid system entirely — a plain `draggable="true"` element that's neither a `GridItem` nor another `GridLayout`. Distinct from `allowCrossGridDrag`/`disableExternalDrop`, which are both about dragging *between* grids. Shows the same live placeholder a normal in-grid drag uses while a compatible drag hovers, then emits `item-dropped-from-outside` on drop — doesn't touch `layout` on its own, since the library has no way to know what a dropped element represents. See [Drag, drop from outside](/examples/11-example) and [into multiple grids](/examples/23-example). |
| `outsideDropWidth` | `number` | `2` | Width, in grid columns, of the live placeholder and the `w` in `item-dropped-from-outside`'s payload. Ignored when `allowOutsideDrop` is `false`. |
| `outsideDropHeight` | `number` | `2` | Height, in grid rows, of the live placeholder and the `h` in `item-dropped-from-outside`'s payload. Ignored when `allowOutsideDrop` is `false`. |
| `outsideDropAccept` | `((dataTransfer: DataTransfer \| null) => boolean) \| null` | `null` | A predicate rejecting incompatible native drags before the placeholder appears — checked in `dragenter`/`dragover`/`drop`. `null` accepts everything. See [outsideDropAccept & readOutsideDropPayload](/examples/34-example). |
| `borderRadiusPx` | `number` | `10` | Border radius, in pixels, applied when `useBorderRadius` is on — cascades to every `GridItem` that doesn't set its own `borderRadiusPx` (`null`, the default), the same inherit pattern as `isDraggable`/`isResizable`/`isBounded`/`showCloseButton`. Also affects `GridLayout`'s own internal drag placeholder. See [Border radius](/examples/14-example). |
| `breakpoints` | `IBreakpoints` | `{ xxl: 1600, xl: 1400, lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }` | Container-width thresholds per breakpoint, used when `responsive` is enabled. |
| `colNum` | `number` | `12` | Maximum number of columns — caps whatever `cols`/breakpoint resolution would otherwise produce. |
| `cols` | `IColumns` | `{ xxl: 12, xl: 12, lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }` | Column count per breakpoint, used when `responsive` is true. |
| `compactor` | `ICompactor \| null` | `null` | Replaces the built-in compaction algorithm entirely — `null` keeps whichever built-in strategy `compactType` selects. `verticalCompactor`/`horizontalCompactor`/`noCompactor`/`verticalOverlapCompactor`/`horizontalOverlapCompactor` (also exported from `vue-ts-responsive-grid-layout/core`, alongside a `getCompactor()` factory) are the five built-in strategies this default falls back to. See [Pluggable compaction](/examples/42-example). |
| `compactType` | `ECompactType` | `ECompactType.VERTICAL` | Selects one of five built-in compaction strategies: `VERTICAL` (items float up), `HORIZONTAL` (items float left), `NONE` (items stay exactly where placed), `VERTICAL_OVERLAP`/`HORIZONTAL_OVERLAP` (every item moves straight to `0` on that axis, ignoring collisions). Replaces the old, separate `verticalCompact: boolean` prop. See [Pluggable compaction](/examples/42-example). |
| `distributeEvenly` | `boolean` | `false` | Spread items that would overflow the right edge evenly across available columns, instead of just clamping. See [Layout bounds & rendering options](/examples/41-example). |
| `horizontalShift` | `boolean` | `false` | Push colliding items left/right instead of down, during an active drag/resize. Distinct from `compactType` — this only decides the direction for a mid-gesture bump; `compactType: HORIZONTAL` only ever adjusts `x` during its own settling pass, so it won't undo a vertical bump this being off already caused. For consistently-horizontal behavior both mid-drag and once settled, set both together. See [Horizontal shift](/examples/15-example). |
| `isBounded` | `boolean` | `false` | Default `isBounded` for items that don't set their own. |
| `isDraggable` | `boolean` | `true` | Default `isDraggable` for items that don't set their own. |
| `isMirrored` | `boolean` | `false` | Enables RTL layout mirroring. See [Mirrored (RTL)](/examples/06-example). |
| `isResizable` | `boolean` | `true` | Default `isResizable` for items that don't set their own. |
| `margin` | `number[]` | `[10, 10]` | `[horizontal, vertical]` spacing between items, in pixels. |
| `maxRows` | `number` | `Infinity` | Maximum number of rows the layout may grow to. See [Layout bounds & rendering options](/examples/41-example). |
| `multiSelect` | `boolean` | `false` | Opt-in multi-select and group move/resize. Click to select an item, Shift/Ctrl/Cmd+click to add to the selection, click empty background to clear it. Dragging/resizing a selected item (from the keyboard too — arrow keys/Shift+arrow, not just mouse/touch) moves/resizes every other selected item by the same delta, skipping any passenger that's static or explicitly not draggable/resizable, and clamping each passenger's resize to its own `minW`/`maxW`/`minH`/`maxH` — deliberately still not collision-aware against non-selected items during the gesture. See [Multi-select & group move/resize](/examples/37-example). |
| `enableEditMode` | `boolean` | `true` | Grid-wide default for `enableEditMode` on every `GridItem` that doesn't set its own — a "view mode" toggle for the whole grid without binding the prop on every item individually. See [Edit mode toggle](/examples/21-example). |
| `enableUndoRedo` | `boolean` | `false` | Opts into `undo()`/`redo()` history, at committed-change granularity (drag start→end, resize start→end, item add/remove, `compactNow()`/`rearrange()`) — not per intermediate drag-move frame. Off by default: a real memory cost (up to `undoHistoryLimit` cloned snapshots) that shouldn't apply automatically. See [Undo/redo](/examples/43-example). |
| `preventCollision` | `boolean` | `false` | Block a drag/resize that would collide, instead of pushing the other item. See [Prevent collision](/examples/08-example). |
| `responsive` | `boolean` | `false` | Enables breakpoint switching (using `breakpoints`/`cols`/`responsiveLayouts`). See [Responsive breakpoints](/examples/07-example). |
| `responsiveLayouts` | `TResponsiveLayout` | `{}` | Pre-defined layouts per breakpoint, instead of auto-generating one. See [Responsive predefined layouts](/examples/09-example). |
| `restoreOnDrag` | `boolean` | `false` | While dragging, don't let other items compact past their pre-drag position until the drag ends. See [Layout bounds & rendering options](/examples/41-example). |
| `rowHeight` | `number` | `150` | Height of one grid row, in pixels. |
| `showCloseButton` | `boolean` | `false` | Default `showCloseButton` for items that don't set their own. See [Show close button](/examples/13-example). |
| `showGridLines` | `boolean` | `false` | Renders visible grid line guides behind the items. See [Show grid lines](/examples/16-example). |
| `showAlignmentGuides` | `boolean` | `false` | Shows Figma-style alignment guide lines while dragging or resizing, wherever an item's edges land on the same grid coordinate as another item's edges (not restricted to same-side matches). Grid-unit-based, not pixel-based. Purely visual — doesn't snap or constrain movement. See [Alignment guides while dragging](/examples/26-example). |
| `showResizeHandles` | `boolean` | `false` | Default `showResizeHandles` for items that don't set their own — see `GridItem`'s own prop. See [Configurable resize-hint appearance](/examples/33-example). |
| `resizeHandleColor` | `string` | `'rgb(94 94 94 / 45%)'` | CSS color for the visible resize handle, when `showResizeHandles` is on. Applied via `--resize-handle-color`, inherited by every `GridItem` the same way `transitionDurationMs` is. See the same example above. |
| `snapToGrid` | `boolean` | `false` | Magnetic snapping during drag — distinct from `showAlignmentGuides`, which never changes where an item lands. A dragged item's position adjusts to align exactly with another item's edge once within `snapThreshold` grid units of one. Only affects drag, not resize. See [Snap to grid](/examples/32-example). |
| `snapThreshold` | `number` | `1` | How close, in grid units, a dragged item's edge needs to be to another item's edge to snap to it. Only meaningful when `snapToGrid` is `true`. |
| `transformScale` | `number` | `1` | CSS transform scale factor to compensate for, when this grid renders inside a scaled ancestor. See [Layout bounds & rendering options](/examples/41-example). |
| `transitionDurationMs` | `number` | `200` | Duration, in milliseconds, of the transition applied to item position/size changes and this grid's own auto-height (`autoSize`) resizing. Applied via a CSS custom property (`--grid-transition-duration`) inherited naturally by every `GridItem` — not an eventBus cascade like most other layout-level defaults, since CSS custom properties already inherit through the DOM. |
| `transitionTimingFunction` | `string` | `'ease'` | CSS `transition-timing-function` for the same transitions (`'ease-out'`, `'linear'`, a `cubic-bezier(...)` string, anything valid there). Applied the same way, via `--grid-transition-timing`. |
| `useBorderRadius` | `boolean` | `false` | Applies `borderRadiusPx` as a border radius — cascades to every `GridItem` that doesn't set its own `useBorderRadius` (`null`, the default), same as `borderRadiusPx` above. |
| `useCssTransforms` | `boolean` | `true` | Position items via CSS `transform` (fast, GPU-accelerated) instead of `top`/`left`. See [Layout bounds & rendering options](/examples/41-example). |
| `undoHistoryLimit` | `number` | `50` | Caps how many snapshots `undo()` can step back through when `enableUndoRedo` is on — the oldest is dropped once exceeded. Ignored when `enableUndoRedo` is `false`. See [Undo/redo](/examples/43-example). |

## Breakpoint object shapes

```ts
interface IBreakpoints {
  xxl: number; xl: number; lg: number; md: number; sm: number; xs: number; xxs: number;
}

interface IColumns {
  xxl: number; xl: number; lg: number; md: number; sm: number; xs: number; xxs: number;
}
```

Both are exported from the package if you want to type your own
breakpoint/column configuration objects — see [API → Interfaces](/api/interfaces-layout).

## v-model

`layout` supports `v-model:layout`, which is exactly sugar for:

```vue
<GridLayout :layout="layout" @update:layout="(newLayout) => layout = newLayout">
```

See [v-model & save/load layout](/examples/19-example) for a full example.
