---
page: true
title: Installation
---

# Installation

## Add the package

::: code-group

```sh [npm]
npm install vue-ts-responsive-grid-layout
```

```sh [yarn]
yarn add vue-ts-responsive-grid-layout
```

```sh [pnpm]
pnpm add vue-ts-responsive-grid-layout
```

:::

`vue` (^3.0.0) is a peer dependency — the package doesn't bundle its own
copy of Vue.

## Import the styles

The components ship with their own base styling (positioning, drag/resize
cursors, the default close button). Import it once, anywhere it'll be
loaded application-wide — typically your app's entry point:

```ts
import 'vue-ts-responsive-grid-layout/style.css';
```

## Use the components

The package has **no default export** — import `GridLayout`/`GridItem`
(and anything else you need) as named imports:

```vue
<script setup lang="ts">
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
]);
</script>

<template>
  <GridLayout v-model:layout="layout">
    <GridItem v-for="item in layout" :key="item.i" v-bind="item">
      Item {{ item.i }}
    </GridItem>
  </GridLayout>
</template>
```

That's the whole setup — see [Basic drag & resize](/examples/01-example)
for a working version of the snippet above, or
[Components](/components/) for the full prop/event reference.

## Options API

Everything above uses `<script setup>` (the Composition API), but both
components work the same way with the Options API — just register them
like any other component:

```vue
<script lang="ts">
import { defineComponent } from 'vue';
import { GridLayout, GridItem } from 'vue-ts-responsive-grid-layout';

export default defineComponent({
  components: { GridLayout, GridItem },
  data() {
    return {
      layout: [
        { h: 2, i: '0', w: 2, x: 0, y: 0 },
        { h: 2, i: '1', w: 2, x: 2, y: 0 },
      ],
    };
  },
});
</script>
```

## A more complete example: drag, resize, and remove

A slightly larger example showing the props most people reach for early —
`row-height`/`margin` for sizing, `is-bounded` to keep items inside the
container, and a close button:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
  { h: 2, i: '2', w: 2, x: 4, y: 0, isStatic: true },
]);

function removeItem(id: string): void {
  layout.value = layout.value.filter((item) => item.i !== id);
}
</script>

<template>
  <GridLayout
    v-model:layout="layout"
    :col-num="12"
    :row-height="60"
    :margin="[10, 10]"
    is-bounded
    show-close-button
    @remove-grid-item="removeItem"
  >
    <GridItem v-for="item in layout" :key="item.i" v-bind="item">
      Item {{ item.i }}
      <span v-if="item.isStatic"> (locked)</span>
    </GridItem>
  </GridLayout>
</template>
```

`isStatic: true` on item `2` locks it in place — it won't drag, resize, or
show a close button, regardless of the layout-level defaults above it. See
[Props](/components/grid-item-props) for the complete per-item override list.

## TypeScript

Every prop, event, enum, and interface is exported from the same entry
point — there's nothing extra to install or configure for full type
support:

```ts
import {
  GridLayout,
  GridItem,
  EGridLayoutEvent,
  EGridItemEvent,
  type IGridLayoutProps,
  type IGridItemProps,
  type TLayout,
  type ILayoutItem,
} from 'vue-ts-responsive-grid-layout';
```

See [API](/api/) for the complete list.

## Requirements

| | |
|---|---|
| Vue | ^3.0.0 (peer dependency) |
| Node (for building your app) | ^18.0.0 \|\| ^20.0.0 \|\| >=22.0.0 |
| Browser support | Any browser with native `ResizeObserver` support — all current evergreen browsers |

## Verifying the install

If `import 'vue-ts-responsive-grid-layout/style.css'` or the named component
imports fail to resolve, first confirm the installed version actually
declares an `exports` map for both:

```sh
npm ls vue-ts-responsive-grid-layout
node -e "console.log(require.resolve('vue-ts-responsive-grid-layout/style.css'))"
```

The second command should print a path ending in
`vue-ts-responsive-grid-layout.css`. If it throws instead, you're likely on
an older published version — update to the latest and try again.

## Persisting a layout

`v-model:layout` is a plain reactive array — persist it however you
like. The library ships a `useLayoutStorage` composable for the common
case (save/load against `localStorage` or any `Storage`-compatible
backend). See [Persistence](/api/persistence) for the full reference, or
[v-model & save/load layout](/examples/19-example) for a working example.
