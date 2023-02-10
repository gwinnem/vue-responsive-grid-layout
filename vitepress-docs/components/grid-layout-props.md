# GridLayout Properties

## autoSize
* default: `true`
* required: `false`
* type: `Boolean`

Says if the container height should swell and contracts to fit contents.


## borderRadiusPx
* default: `8`
* required: `false`
* type: `Number`

Set's border-radius css value used for the GridItem.


## breakpoints
* default: `{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }`
* required: `false`
* type: `Object`

Breakpoints defined for responsive layout, the parameter represents the width of different devices: lg = large, md = medium, sm = small, xs = extra small.
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

Defines number of columns for each breakpoint


## horizontalShift
* default: `true`
* required: `false`
* type: `Boolean`


### isBounded(Not implemented yet)
* default: `false`
* required: `false`
* type: `Boolean`

Says if the grid items are bounded to the container when dragging


## isDraggable
* default: `true`
* required: `false`
* type: `Boolean`

Says if the grids items are draggable.


### isMirrored(Not implemented yet)
* default: `false`
* required: `false`
* type: `Boolean`

Says if the RTL/LTR should be reversed.


## isResizable
* default: `true`
* required: `false`
* type: `Boolean`

Says if the grids items are resizable.


## layout
* required: `true`
* type: `Array`

This is the initial layout of the grid.

The value must be an `Array` of `Object` items. Each item must have `i`, `x`, `y`, `w` and `h` properties.

Please refer to the documentation for `GridItem` below for more information.


## margin
* default: `[10, 10]`
* required: `false`
* type: `Array`

Says what are the margins of elements inside the grid.

The value must be a two-element `Array` of `Number`. Each value is expressed in pixels. The first element is a margin horizontally, the second element is a vertical margin.


## maxRows
* default: `Infinity`
* required: `false`
* type: `Number`

Says what is a maximal number of rows in the grid.


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


## responsiveLayouts
* default : `{}`
* required: `false`
* type: `Object`

This is the initial layouts of the grid per breakpoint if `responsive` is set to `true`.
The keys of the `Object` are breakpoint names and each value is an `Array` of `Object` items as defined by `layout` prop. eg:{ lg:[layout items], md:[layout items] }.
Setting the prop after the creation of the GridLayout has no effect.


### restoreOnDrag(Not implemented)
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


## staticGridItemBackgroundColor
* default:
* required: `false`
* type: `String`

The background color(hex value) to be added to GridItems which are static.


## transformScale(Not implemented)
* default: 1
* required: `false`
* type: `Number`

Sets a scaling factor to the size of the grid items, 1 is 100%

## useBootstrapBreakpoints
* default: `false`
* required: `false`
* type: `Boolean`

When set to `true` the layout will adjust the colNums based on the breakpoints used in Bootstrap.
<br/>
Also the prop cols will be ignored and the `GridLayout` cols value will be adjusted according to the table below.

#### Breakpoints used
| Width     | Columns | Size              |
|-----------|---------|-------------------|
| <   576px | 2       | Extra small       |
| =>  576px | 4       | Small             |
| =>  768px | 6       | Medium            |
| =>  992px | 10      | Large             |
| => 1200px | 12      | Extra large       |
| => 1400px | 12      | Extra extra large |


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
