# Styling → GridLayout

`GridLayout`'s root element gets the class `vue-grid-layout`. It's
`position: relative` with a 200ms `height` transition (so `autoSize`
changes animate smoothly) — override either directly:

```css
.vue-grid-layout {
  background: #0f172a;
}
```

## `.grid` — grid line guides

When `showGridLines` is enabled, `GridLayout` adds a `grid` class and
renders the guide lines via a `::before` pseudo-element, colored by the
`$grid-line-color` SCSS variable (see [Styling → Variables](/components/css-variables)).
See [Show grid lines](/examples/16-example) for a live demo.

## `.vue-grid-placeholder`

The internal drag placeholder — a hidden `GridItem` shown only while
`isDragging` is true, marking where the dragged/resized item would land.
Style it to make the "drop target" more or less visually prominent:

```css
.vue-grid-placeholder {
  background: rgba(59, 130, 246, 0.3);
}
```

## Sizing

`GridLayout`'s height is either fixed (when `autoSize="false"`) or grows
to fit its content (`autoSize="true"`, the default) — see
[GridLayout props](/components/grid-layout-props). There's no dedicated
class for this; it's applied as an inline style.
