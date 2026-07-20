---
aside: false
footer: true
page: true
title: Introduction
---

# Introduction

`vue-ts-responsive-grid-layout` is a Vue 3 component library for building
draggable, resizable, responsive dashboard grids — the kind of UI you'd
use for a customizable analytics dashboard, a widget board, or any screen
where users rearrange content themselves.

It's a TypeScript-first port of the ideas behind
[react-grid-layout](https://github.com/react-grid-layout/react-grid-layout),
rebuilt from the ground up on Vue 3's Composition API, using a native,
Pointer Events-based drag/resize engine with no third-party runtime
dependency for it at all.

## What you get

- **`GridLayout`** — the container. Owns the layout array (position/size
  of every item), responsive breakpoint state, and collision/compaction
  logic.
- **`GridItem`** — a single draggable/resizable cell, rendered inside
  `GridLayout`'s default slot. You control what's inside it — text,
  images, charts, forms, anything.
- **Two small utility components** — `CustomCloseButton` and
  `CustomDragElement` — exported in case you want to reuse the library's
  own default close button or build a dedicated drag handle.

## How it fits together

```
<GridLayout v-model:layout="layout">
  <GridItem v-for="item in layout" :key="item.i" v-bind="item">
    <!-- your content -->
  </GridItem>
</GridLayout>
```

`layout` is a plain array of `{ i, x, y, w, h, ... }` objects — one per
`GridItem`. You own that array; the library reads and updates it as the
user drags and resizes things. Everything else (collision resolution,
compaction, responsive breakpoint switching) happens automatically based
on the props you set.

## Where to go next

- [Installation](/guide/installation) — add the package to your project.
- [Understanding Layouts](/guide/understanding-layouts) — the shape of
  the data structure every example is built around, and where to see it
  update live.
- [Examples](/examples/01-example) — forty-one interactive, copy-pasteable examples,
  from a basic grid to responsive breakpoints and drag-drop between grids.
- [Components](/components/) — full prop/event/slot reference for `GridLayout` and `GridItem`.
- [API](/api/) — exported TypeScript types, interfaces, and enums.

## Design goals

A few decisions that shape how the library behaves, worth knowing up
front:

- **You own the data.** The layout array is yours — the library mutates
  it in place / emits updates, but never hides state you can't inspect or
  serialize (see [v-model & save/load layout](/examples/19-example)).
- **Sensible defaults, explicit overrides.** Most behavior (draggable,
  resizable, bounded, etc.) can be set once on `GridLayout` and inherited
  by every item, or overridden per-item when needed.
- **Composition over configuration objects.** Props map directly to
  documented, individually-typed options rather than one large opaque
  config object — better autocomplete, better documentation per option.
