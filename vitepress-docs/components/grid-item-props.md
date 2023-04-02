# GridItem Properties

## distributeEvenly
* default: `true`
* required: `false`
* type: `Boolean`

<br/>
When true it will ensure that when the layout is resized, the grid item's are evenly distributed.

### With normal layout:
This means that a grid item will be moved to the left until it finds that a grid item already is to the left.

#### With mirrored (rtl) layout:
__WIP__


## enableEditMode
* default: `false`
* required: `false`
* type: `Boolean`
<br/>
When set to `false`, it overrides the props: `isDraggable`, `isResizable` and `showCloseButton`.
<br/>
Setting it to true will not change these props, but will not override them.


## isBounded
* default: `false`
* required: `false`
* type: `Boolean`

Says if the item is bounded to the container when dragging.

If default value is `null` then it's inherited from parent.


## dragAllowFrom
* default: `null`
* required: `false`
* type: `String`

Says which elements of the item should trigger drag event of the item.

The value is `css-like` selector string.

If `null` then one can drag by any (excluding `dragIgnoreFrom`) element of the item.

For more info please refer to `allowFrom` in [interact.js docs](http://interactjs.io/docs/#ignorable-selectors).


## dragIgnoreFrom
* default: `'a, button'`
* required: `false`
* type: `String`

Says which elements of the item shouldn't trigger drag event of the item.

The value is `css-like` selector string.

For more info please refer to `ignoreFrom` in [interact.js docs](http://interactjs.io/docs/#ignorable-selectors).


## dragOption
* default: `{}`
* required: `false`
* type: `Object`

Pass through object for the grid item [interact.js draggable configuration](https://interactjs.io/docs/draggable/)


## h
* type: `Number`
* required: `true`

Says what is the initial height of the item.

The value is a number that is multiplied by `rowHeight`.


## i
* required: `true`
* type: `String | Number`

This is the unique identifier of the item.


## isBounded
* default: `null`
* required: `false`
* type: `Boolean | null`

Says if the item is bounded to the container when dragging.

If default value is `null` then it's inherited from parent.


## isDraggable
* default: `null`
* required: `false`
* type: `Boolean | null`

Says if item is draggable.

If default value is `null` then it's inherited from parent.


## isResizable
* default: `null`
* required: `false`
* type: `Boolean`

Says if item is resizable.

If default value is `null` then it's inherited from parent.


## isStatic
* default: `false`
* required: `false`
* type: `Boolean`

Says if item is static (won't be draggable, resizable or moved by other items).


## maxH
* default: `Infinity`
* required: `false`
* type: `Number`

Says what is a maximal height of the item. If `h` will be bigger then `maxH` then `h` will be set to `maxH`.

The value is a number that is multiplied by `rowHeight`


## maxW
* default: `Infinity`
* required: `false`
* type: `Number`

Says what is a maximal width of the item. If `w` will be bigger then `maxW` then `w` will be set to `maxW`.

The value is a number that is multiplied by `colWidth`.


## minH
* default: `1`
* required: `false`
* type: `Number`

Says what is a minimal height of the item. If `h` will be smaller then `minH` then `h` will be set to `minH`.

The value is a number that is multiplied by `rowHeight`.

## minW
* default: `1`
* required: `false`
* type: `Number`

Says what is a minimal width of the item. If `w` will be smaller then `minW` then `w` will be set to `minW`.

The value is a number that is multiplied by `colWidth`.


## preserveAspectRatio
* default: `false`
* required: `false`
* type: `Boolean`

If 'true', forces the GridItem to preserve its aspect ratio when resizing.


## resizeIgnoreFrom
* default: `'a, button'`
* required: `false`
* type: `String`

Says which elements of the item shouldn't trigger resize event of the item.

The value is `css-like` selector string.

For more info please refer to `ignoreFrom` in [interact.js docs](http://interactjs.io/docs/#ignorable-selectors).


## resizeOption
* default: `{}`
* required: `false`
* type: `Object`

Pass through object for the grid item [interact.js resizable configuration](https://interactjs.io/docs/resizable/)


## showCloseButton
* default: `true`
* required: `false`
* type: `Boolean`


If `true`, the GridItem will show a close button in the top right corner.

When it is being clicked it will fire an event `remove-grid-item` which the `GridLayout` is listening for. The `GridItem` will then be removed from the `GridLayout`.


## useBorderRadius
* default: `false`
* required: `false`
* type: `Boolean`

If set to true, it adds a 8px corner radius to the GridItem.


## w
* required: `true`
* type: `Number`

Says what is the initial width of the item.

The value is a number that is multiplied by `colWidth`.


## x
* required: `true`
* type: `Number`

Says what is the initial horizontal position of the item (in which column it should be placed).

The value must be a _whole number_.


## y
* required: `true`
* type: `Number`

Says what is the initial vertical position of the item (in which row it should be placed).

The value must be a _whole number_. 
