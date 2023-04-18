# GridLayout Properties

## autoSize
* default: `true`
* required: `false`
* type: `Boolean`

When `true` the `GridLayout` container is adjusting height and width based on the content.



## borderRadiusPx(Not reactive)
* default: `8`
* required: `false`
* type: `Number`

Set's border-radius css value used for the GridItem.
<br/>
__This value is fully reactive.__


## breakpoints
* default: `{ lg: 1200, md: 996, sm: 768, xs: 576, xxs: 0 }`
* required: `false`
* type: `Object`

Breakpoints defined for responsive layout, the parameter represents the width of different devices:
<br/>
_lg = large, md = medium, sm = small, xs = extra small._
<br/>
Sets widths on wich column number changes.


## colNum
* default: `12`
* required: `false`
* type: `Number`

Says how many columns the grid has.

The value should be a _natural number_.


## cols
* default: `{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }`
* required: `false`
* type: `Object`

Defines number of columns for each breakpoint.

If false, `isDraggable` and `isResizeable` will be set to `false` and the `GridItem`'s will be static.
<br/>
Setting it from `false` to `true` will enable both the `isDraggable` and `isResizeable` props.


## distributeEvenly
* default: `false`
* required: `false`
* type: `Boolean`

If set to `true` it will ensure that GridItems are distributed evenly in the layout.


## horizontalShift
* default: `true`
* required: `false`
* type: `Boolean`

When `true` the `GridItem`'s will be moved horizontally when two of them collides.
<br/>
When `false` the `GridItem`'s will be moved vertically when two of them collides.


## isBounded
* default: `false`
* required: `false`
* type: `Boolean`

Says if the grid items are bounded to the container when dragging


## isDraggable
* default: `true`
* required: `false`
* type: `Boolean`

When `true` the `GridItem`'s can be dragged to a new position in the layout.
Except if a 'GridItem' is `static` then it will not be possible to drag it into a new position in the layout.


## isMirrored(Not reactive)
* default: `false`
* required: `false`
* type: `Boolean`

Says if the RTL/LTR should be reversed.


## isResizable
* default: `true`
* required: `false`
* type: `Boolean`

When `true` the `GridItem`'s can be resized both horizontally and vertically.


## layout
* required: `true`
* type: `TLayout[]`

This is the initial layout of the grid.

The value must be an `Array` of type `TLayout` items. Each item must have:
* `h` The number of rows the `GridItem` will use.
* `i` The index of the `GridItem` in the layout array.
* `x` Column start position.
* `y` Row start position.
* `w` The number of columns the `GridItem` will use.

Please refer to the documentation for [GridItem](grid-item.md) for more details.


## margin(Not reactive)
* default: `[10, 10]`
* required: `false`
* type: `Array`

Says what are the margins of elements inside the grid.

The value must be a two-element `Array` of `Number`. Each value is expressed in pixels. The first element is a margin horizontally, the second element is a vertical margin.


## maxRows
* default: `Infinity`
* required: `false`
* type: `Number`

The maximal number of rows in the `GridLayout`.


## preventCollision
* default: `false`
* required: `false`
* type: `Boolean`

Says if grid items will move when being dragged over.


## responsive
* default: `false`
* required: `false`
* type: `Boolean`

Says if the layout should be responsive to window width


## responsiveLayouts(Must be tested)
* default : `{}`
* required: `false`
* type: `Object`

This is the initial layouts of the grid per breakpoint if `responsive` is set to `true`.
The keys of the `Object` are breakpoint names and each value is an `Array` of `Object` items as defined by `layout` prop. eg:{ lg:[layout items], md:[layout items] }.
Setting the prop after the creation of the GridLayout has no effect.


## restoreOnDrag(Must be tested)
* default: `false`
* required: `false`
* type: `Boolean`

Says if the moved grid items should be restored after an item has been dragged over.


## rowHeight
* default: `150`
* required: `false`
* type: `Number`

Says what is a height of a single row in pixels.


## showCloseButton
* default: `true`
* required: `false`
* type: `Boolean`

If `true`, the GridItem's will show a close button in the top right corner.

When the button is being clicked, an event `remove-grid-item` will be emitted by the `GridItem`.
The `GridLayout` is listening for this event and will remove the `GridItem` will then be removed from the `layout`.


## showGridLines
* default: `false`
* required: `false`
* type: `Boolean`

If set to true, it adds a grid layout, displaying the size of each box in the GridLayout.


## transformScale(Must be tested)
* default: 1
* required: `false`
* type: `Number`

Sets a scaling factor to the size of the grid items, 1 is 100%


## useBorderRadius
* default: `false`
* required: `false`
* type: `Boolean`

If set to true, it adds a 8px corner radius to each GridItem.


## useCssTransforms
* default: `true`
* required: `false`
* type: `Boolean`

Says if the CSS `transition-property: transform;` should be used.

## verticalCompact
* default: `true`
* required: `false`
* type: `Boolean`

Says if the layout should be compacted vertically.
