# Styling → Variables

::: warning These are SCSS variables, not CSS custom properties
Everything on this page is a compile-time SCSS `$variable`
(`src/styles/variables.scss`), baked into the published `dist/style.css`
at build time — **not** a runtime-overridable `--css-custom-property`.
You can't change these from your own stylesheet the way you would a
`:root { --foo: red; }` override. To customize them, override the
resulting classes directly (see [Styling → GridItem](/components/css-grid-item)
and [Styling → GridLayout](/components/css-grid-layout)), which is the
supported approach today.
:::

| Variable | Default | Used for |
|---|---|---|
| `$grid-line-color` | `#000` | Grid line guides, when `showGridLines` is enabled. |
| `$grid-item-bg-color` | `#726e6e` | Not currently referenced by any component style — declared but unused. |
| `$grid-item-border-radius` | `12px` | The `.vue-use-radius` class's border-radius — note that `GridItem`'s own `borderRadiusPx` prop is applied as an inline style and takes priority over this when `useBorderRadius` is set; see [GridItem props](/components/grid-item-props). |
| `$grid-item-text-color` | `white` | Reserved for item text color. |
| `$grid-item-font-size` | `1rem` | Reserved for item font size. |
| `$grid-item-static-bg-color` | `#393d42` | Background color for items with `isStatic` set. |
| `$grid-item-placeholder-bg-color` | `#8f3c3c` | Background color of the drag placeholder shown while dragging/resizing. |
| `$grid-item-placeholder-opacity` | `.5` | Opacity of the drag placeholder. |

## Overriding styles today

Target the library's classes directly, after its stylesheet is loaded:

```css
/* After importing 'vue-ts-responsive-grid-layout/style.css' */
.vue-grid-item.vue-static {
  background-color: #1e293b;
}
```

See [Styling → GridItem](/components/css-grid-item) and
[Styling → GridLayout](/components/css-grid-layout) for the full class
reference.
