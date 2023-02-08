# GridLayout Properties

## autoSize
* type: `Boolean`
* required: `false`
* default: `true`

Says if the container height should swell and contracts to fit contents.


## borderRadiusPx
* type: `Number`
* required: `false`
* default: `8`

Set's border-radius css value used for the GridItem.


## breakpoints
* type: `Object`
* required: `false`
* default: `{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }`

Breakpoints defined for responsive layout, the parameter represents the width of different devices: lg = large, md = medium, sm = small, xs = extra small.
<br/>
Sets widths on wich column number changes.


## colNum
* type: `Number`
* required: `false`
* default: `12`

Says how many columns the grid has.

The value should be a _natural number_.


## cols
* type: `Object`
* required: `false`
* default: `{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }`

Defines number of columns for each breakpoint


## horizontalShift
* type: `Boolean`
* required: `false`
* default: `false`


## intersectionObserverConfig


### isBounded(Not implemented yet)
* type: `Boolean`
* required: `false`
* default: `false`

Says if the grid items are bounded to the container when dragging


## isDraggable
* type: `Boolean`
* required: `false`
* default: `true`

Says if the grids items are draggable.


### isMirrored(Not implemented yet)

* type: `Boolean`
* required: `false`
* default: `false`

Says if the RTL/LTR should be reversed.


## isResizable
* type: `Boolean`
* required: `false`
* default: `true`

Says if the grids items are resizable.


## layout
* type: `Array`
* required: `true`

This is the initial layout of the grid.

The value must be an `Array` of `Object` items. Each item must have `i`, `x`, `y`, `w` and `h` properties.

Please refer to the documentation for `GridItem` below for more information.


## margin
* type: `Array`
* required: `false`
* default: `[10, 10]`

Says what are the margins of elements inside the grid.

The value must be a two-element `Array` of `Number`. Each value is expressed in pixels. The first element is a margin horizontally, the second element is a vertical margin.


## maxRows
* type: `Number`
* required: `false`
* default: `Infinity`

Says what is a maximal number of rows in the grid.


## preventCollision
* type: `Boolean`
* required: `false`
* default: `false`

Says if grid items will move when being dragged over.


## responsive
* type: `Boolean`
* required: `false`
* default: `false`

Says if the layout should be responsive to window width


## responsiveLayouts
* type: `Object`
* required: `false`
* default : `{}`

This is the initial layouts of the grid per breakpoint if `responsive` is set to `true`.
The keys of the `Object` are breakpoint names and each value is an `Array` of `Object` items as defined by `layout` prop. eg:{ lg:[layout items], md:[layout items] }.
Setting the prop after the creation of the GridLayout has no effect.


### restoreOnDrag(Not implemented)

* type: `Boolean`
* required: `false`
* default: `false`

Says if the moved grid items should be restored after an item has been dragged over.


## rowHeight
* type: `Number`
* required: `false`
* default: `150`

Says what is a height of a single row in pixels.


## showCloseButton
* type: `Boolean`
* required: `false`
* default: `true`

If `true`, the GridItem's will show a close button in the top right corner.

When the button is being clicked, an event `remove-grid-item` will be emitted by the `GridItem`.
The `GridLayout` is listening for this event and will remove the `GridItem` will then be removed from the `layout`.


## showGridLines
If set to true, it adds a grid layout, displaying the size of each box in the GridLayout.


## staticGridItemBackgroundColor
The background color(hex value) to be added to GridItems which are static.


### transformScale(Not implemented)
* type: `Number`
* required: `false`
* default: 1

Sets a scaling factor to the size of the grid items, 1 is 100%


## useBorderRadius
If set to true, it adds a 8px corner radius to each GridItem.


## useCssTransforms
* type: `Boolean`
* required: `false`
* default: `true`

Says if the CSS `transition-property: transform;` should be used.


## useObserver


## verticalCompact
* type: `Boolean`
* required: `false`
* default: `true`

Says if the layout should be compact vertically.
