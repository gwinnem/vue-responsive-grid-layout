---
aside: false
---

# EGridItemEvent

```typescript
export enum EGridItemEvent {
  CONTAINER_RESIZED = `container-resized`,
  /** Declared for backwards compatibility — not currently emitted; MOVE/MOVED fire during a drag instead. */
  DRAG = `drag`,
  /** Declared for backwards compatibility — not currently emitted. */
  DRAGGED = `dragged`,
  MOVE = `item-move`,
  MOVED = `item-moved`,
  REMOVE_ITEM = `remove-grid-item`,
  RESIZE = `resize`,
  RESIZED = `resized`,
}
```

A real (value) export from the package's main entry point — usable both
as a type and to compare against at runtime:

```ts
import { EGridItemEvent } from 'vue-ts-responsive-grid-layout';

const onEvent = (name: string) => {
  if (name === EGridItemEvent.RESIZED) {
    // ...
  }
};
```

See [GridItem events](/components/grid-item-events) for the full
event/payload reference.
