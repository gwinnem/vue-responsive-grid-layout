# Styling → GridItem

`GridItem`'s root element always has the class `vue-grid-item`, plus a
combination of the conditional classes below depending on its current
state. Target these directly, after the library's stylesheet is loaded:

```css
/* After importing 'vue-ts-responsive-grid-layout/style.css' */
.vue-grid-item {
  background: #1e293b;
  color: white;
}
```

## Conditional classes

| Class | Applied when |
|---|---|
| `css-transforms` | `useCssTransforms` is true (the default) — positioned via CSS `transform` instead of `top`/`left`. |
| `disable-userselect` | A drag is in progress — prevents text selection while dragging. |
| `no-touch` | On Android, when the item is draggable or resizable — overrides default touch handling so drag/resize gestures work correctly. |
| `render-rtl` | The item is currently rendering right-to-left. See [Mirrored (RTL)](/examples/06-example). |
| `resizing` | A resize is in progress. |
| `vue-draggable` | The item is currently draggable (resolved from its own prop or the parent layout's default), not static, and edit mode is on. |
| `vue-draggable-dragging` | A drag is in progress (same condition as `disable-userselect`). |
| `vue-resizable` | The item is currently resizable, not static, and edit mode is on. |
| `vue-static` | `isStatic` is true. See [Static items](/examples/17-example). |
| `vue-use-radius` | `useBorderRadius` is true. See [Border radius](/examples/14-example). |

## The close button

Rendered internally as a `<button class="btn-close">` when
`showCloseButton && enableEditMode && !isStatic`. Style it directly:

```css
.vue-grid-item .btn-close {
  background: #ef4444;
}
```

...or replace it entirely with your own — see
[Custom drag handle & close button](/examples/18-example), which uses the
library's own exported `CustomCloseButton` component instead of the
built-in button.

## Border radius

Set via an inline style (not a class) computed from the `borderRadiusPx`
prop, applied whenever `useBorderRadius` is true — see
[GridItem props](/components/grid-item-props) and
[Styling → Variables](/components/css-variables) for the SCSS-level
default that applies when you don't set `borderRadiusPx` yourself.
