# GridItem Properties

## borderRadiusPx
Default: 8
<br/>
Set's border-radius css value used for the GridItem.

### isBounded(Not implemented)
* type: `Boolean`
* required: `false`
* default: `null`

Says if the item is bounded to the container when dragging.

If default value is `null` then it's inherited from parent.

## breakpointCols

## colNum

## containerWidth

## dragAllowFrom
* type: `String`
* required: `false`
* default: `null`

Says which elements of the item should trigger drag event of the item.

The value is `css-like` selector string.

If `null` then one can drag by any (excluding `dragIgnoreFrom`) element of the item.

For more info please refer to `allowFrom` in [interact.js docs](http://interactjs.io/docs/#ignorable-selectors).

## dragIgnoreFrom
* type: `String`
* required: `false`
* default: `'a, button'`

Says which elements of the item shouldn't trigger drag event of the item.

The value is `css-like` selector string.

For more info please refer to `ignoreFrom` in [interact.js docs](http://interactjs.io/docs/#ignorable-selectors).

## dragOption
* type: `Object`
* required: `false`
* default: `{}`

Passthrough object for the grid item [interact.js draggable configuration](https://interactjs.io/docs/draggable/)

## h
* type: `Number`
* required: `true`

Says what is the initial height of the item.

The value is a number that is multiplied by `rowHeight`.

## i
* type: `String`
* required: `true`

This is the unique identifier of the item.

## isDraggable
* type: `Boolean`
* required: `false`
* default: `null`

Says if item is draggable.

If default value is `null` then it's inherited from parent.

## isResizable
* type: `Boolean`
* required: `false`
* default: `null`

Says if item is resizable.

If default value is `null` then it's inherited from parent.

## lastBreakpoint

## margin

## maxH
* type: `Number`
* required: `false`
* default: `Infinity`

Says what is a maximal height of the item. If `h` will be bigger then `maxH` then `h` will be set to `maxH`.

The value is a number that is multiplied by `rowHeight`

## maxRows

## maxW
* type: `Number`
* required: `false`
* default: `Infinity`

Says what is a maximal width of the item. If `w` will be bigger then `maxW` then `w` will be set to `maxW`.

The value is a number that is multiplied by `colWidth`.

## minH
* type: `Number`
* required: `false`
* default: `1`

Says what is a minimal height of the item. If `h` will be smaller then `minH` then `h` will be set to `minH`.

The value is a number that is multiplied by `rowHeight`.

## minW
* type: `Number`
* required: `false`
* default: `1`

Says what is a minimal width of the item. If `w` will be smaller then `minW` then `w` will be set to `minW`.

The value is a number that is multiplied by `colWidth`.

## observer

### preserveAspectRatio(Not implemented)
* type: `Boolean`
* required: `false`
* default: `false`

If 'true', forces the GridItem to preserve its aspect ratio when resizing.

### resizeIgnoreFrom(Not implemented)
* type: `String`
* required: `false`
* default: `'a, button'`

Says which elements of the item shouldn't trigger resize event of the item.

The value is `css-like` selector string.

For more info please refer to `ignoreFrom` in [interact.js docs](http://interactjs.io/docs/#ignorable-selectors).

### resizeOption(Not implemented)
* type: `Object`
* required: `false`
* default: `{}`

Passthrough object for the grid item [interact.js resizable configuration](https://interactjs.io/docs/resizable/)

## rowHeight

## static
* type: `Boolean`
* required: `false`
* default: `false`

Says if item is static (won't be draggable, resizable or moved by other items).

## useBorderRadius
* type: `Boolean`
* required: `false`
* default: `false`
If set to true, it adds a 8px corner radius to the GridItem.

## useCssTransforms

## w
* type: `Number`
* required: `true`

Says what is the initial width of the item.

The value is a number that is multiplied by `colWidth`.

## x
* type: `Number`
* required: `true`

Says what is the initial horizontal position of the item (in which column it should be placed).

The value must be a _whole number_.

## y
* type: `Number`
* required: `true`

Says what is the initial vertical position of the item (in which row it should be placed).

The value must be a _whole number_. 
