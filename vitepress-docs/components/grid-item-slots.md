# GridItem Slots

## Default slot

Anything you render inside `<GridItem>` lands here — text, images,
forms, a chart component, another Vue component entirely. `GridItem`
doesn't style it.

```vue
<GridItem v-bind="item">
  <MyChartComponent :data="item.data" />
</GridItem>
```

The slot receives one scope prop:

| Prop | Type | Description |
|---|---|---|
| `style` | `Record<string, string \| number>` | The same computed position/size style `GridItem` applies to its own root element — rarely needed, but available if a child needs to match it exactly (e.g. an absolutely-positioned overlay). |

```vue
<GridItem v-bind="item" v-slot="{ style }">
  <div :style="style">Matches the item's own computed size exactly</div>
</GridItem>
```

## `#resize-handle` slot

Custom content for each of the 8 resize handles (edges + corners) —
closes the gap `react-grid-layout`'s own `resizeHandle` prop covers,
where a fully custom render (an icon, not just a color) wasn't possible
before. Renders inside the same small hit-area `showResizeHandles`/
`resizeHandleColor` already use; both mechanisms can be combined, or
the slot used alone for a fully custom look. See
[Multi-select & group move/resize](/examples/37-example), which also
demonstrates this slot.

```vue
<GridItem v-bind="item">
  {{ item.label }}
  <template #resize-handle="{ edge }">
    <MyResizeIcon :edge="edge" />
  </template>
</GridItem>
```

The slot receives one scope prop:

| Prop | Type | Description |
|---|---|---|
| `edge` | `'n' \| 's' \| 'e' \| 'w' \| 'ne' \| 'nw' \| 'se' \| 'sw'` | Which of the 8 resize handles this particular slot instance is rendering into — the slot is invoked once per handle, each with its own `edge` value, so different content per edge/corner is possible if wanted. |

Not rendered at all when the item isn't resizable (`isResizable` false,
or `isStatic`) — same condition that already gates whether the resize
hints render at all.
