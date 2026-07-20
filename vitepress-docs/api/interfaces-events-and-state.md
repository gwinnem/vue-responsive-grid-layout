---
aside: false
---

# Event payload & exposed-state interfaces

Types for a consumer's own event handlers, and for reading the value of
something exposed via `defineExpose` on `GridLayout`/`GridItem` through
a template ref — as opposed to [`IEventsData`](/api/interfaces-eventBus),
which is internal plumbing between `GridLayout` and `GridItem`
themselves, not something a consumer reads directly.

## `IOutsideItemDropped`

Payload of the `item-dropped-from-outside` event (`allowOutsideDrop`).
See [Drag, drop from outside](/examples/11-example).

```typescript
export interface IOutsideItemDropped {
  x: number;
  y: number;
  w: number;
  h: number;
  dataTransfer: DataTransfer | null;
}
```

```ts
import type { IOutsideItemDropped } from 'vue-ts-responsive-grid-layout';

function onDropped(payload: IOutsideItemDropped) {
  // payload.x/y are the resolved grid position; payload.dataTransfer is
  // the native DataTransfer — see readOutsideDropPayload() in
  // /api/utilities for parsing its contents.
}
```

## `ICrossGridItemDropped`

Payload of the `cross-grid-item-dropped` event (`allowCrossGridDrag`) —
fired on the *target* grid when an item is successfully dragged in from
another grid instance. See
[Drag, drop from grid to grid](/examples/12-example).

```typescript
export interface ICrossGridItemDropped {
  item: ILayoutItem;
  sourceLayoutId: string;
}
```

## `ICrossGridDropRejected`

Payload of the `cross-grid-drop-rejected` event — fired on the *target*
grid when a cross-grid drop is attempted but rejected because that grid
has `disableExternalDrop` set. See
[Cross-grid drop restrictions](/examples/22-example).

```typescript
export interface ICrossGridDropRejected {
  itemId: string | number;
  sourceLayoutId: string;
}
```

## `IPlaceholder`

The shape of `GridLayout`'s `placeholder` ref, exposed via
`defineExpose` — the live drag/resize/outside-drop preview box. Also
the shape backing the `#placeholder` custom slot's scoped props. See
[Custom drag-placeholder content](/examples/25-example).

```typescript
export interface IPlaceholder {
  i: string | number;
  x: number;
  y: number;
  w: number;
  h: number;
}
```

```ts
import type { IPlaceholder } from 'vue-ts-responsive-grid-layout';

const gridRef = ref<InstanceType<typeof GridLayout>>();
// gridRef.value?.placeholder is a Ref<IPlaceholder>
```

## `IAlignmentGuide`

One entry in `GridLayout`'s `alignmentGuides` ref, exposed via
`defineExpose` — populated while dragging/resizing when
`showAlignmentGuides` is on. See
[Alignment guides while dragging](/examples/26-example).

```typescript
export interface IAlignmentGuide {
  axis: 'x' | 'y';
  position: number;
}
```

## `IGridItemPosition`

The shape of `GridItem`'s `dragging` ref, exposed via `defineExpose` —
the live pixel position/size while a drag is in progress (`undefined`
when not dragging).

```typescript
export interface IGridItemPosition {
  left?: number;
  right?: number;
  top: number;
  width: number;
  height: number;
}
```
