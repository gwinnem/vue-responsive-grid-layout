---
aside: false
---

# Understanding layouts

Every `GridLayout` is driven by one plain array — its `layout` prop
(usually bound with `v-model:layout`). This page explains that array's
shape once, in one place, rather than re-explaining it on every example
page. Every example on this site now shows its own **live layout
viewer** directly below the demo, updating in real time as you drag,
resize, add, or remove items — so you can watch the data change instead
of just imagining it.

## The shape

```typescript
type TLayout = ILayoutItem[];

interface ILayoutItem {
  i: string | number;   // unique id, matched to a GridItem's own `i` prop
  x: number;             // horizontal position, in grid columns
  y: number;             // vertical position, in grid rows
  w: number;              // width, in grid columns
  h: number;              // height, in grid rows

  // Optional per-item overrides — see [GridItem Props](/components/grid-item-props)
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  moved?: boolean;        // internal — set by compaction/collision handling, not meant to be set by you
}
```

Everything is in **grid units**, not pixels — an item at `x: 2, w: 3`
occupies columns 2 through 4, regardless of how wide the container
actually is or what `rowHeight`/`colNum` currently resolve to. The
library handles the pixel conversion; your own code (and anything you
persist to storage) only ever deals with grid units.

See [Layout & breakpoint types](/api/types-layout) for the full,
auto-generated type reference, including `TResponsiveLayout` for
per-breakpoint predefined layouts.

## Reading the live viewer

The block that now appears below every example (like the one on this
very page, further down) lists every item currently in that example's
`layout` array, in the exact `x`/`y`/`w`/`h` shape above — nothing
hidden, nothing pre-formatted beyond what's needed to stay readable. If
an example has more than one grid, each gets its own labeled block.

Watching this while you interact with an example is often the fastest
way to actually understand a prop's effect — e.g. setting
`compactType` to `NONE` in
[Basic drag & resize](/examples/01-example) and watching `y` values stop
changing when you drag something out of the way, instead of just reading
that compaction "removes vertical gaps."

## Layout patterns across the examples

Not every example's `layout` looks the same. A few worth comparing
directly (with the live viewer open) if you're building something that
needs one of these patterns:

| Pattern | Example | What to look for in the viewer |
|---|---|---|
| Single grid, plain items | [Basic drag & resize](/examples/01-example) | The simplest possible shape — just `i`/`x`/`y`/`w`/`h`. |
| Multiple independent arrays | [Multiple grids](/examples/04-example) | Two separate, unrelated `layout` arrays — nothing links them. |
| A static (locked) item mixed in | [Static items](/examples/17-example) | `isStatic: true` on one entry, ordinary on the rest. |
| An item moving *between* two arrays | [Drag, drop from grid to grid](/examples/12-example) | Watch an item disappear from one viewer and appear in the other on drop. |
| Items arriving from outside the grid system entirely | [Drag, drop from outside](/examples/11-example) | The array starts empty (or near-empty) and grows as you drop — nothing in the array is added except through your own `item-dropped-from-outside` handler. |
| A custom field beyond the required shape | [Edit mode toggle](/examples/21-example) | A `label` field alongside the required ones — `ILayoutItem` doesn't forbid extra properties, only requires the base shape. |

## Persisting a layout

Since it's plain, serializable data, saving and restoring a layout is
just `JSON.stringify`/`JSON.parse` against your own storage of choice —
see [v-model & save/load layout](/examples/19-example) for the full
pattern, including the one gotcha worth knowing about: strip `moved`
before persisting, since it's set internally by compaction/collision
handling and isn't meant to round-trip through storage as if it were
part of your own data.
