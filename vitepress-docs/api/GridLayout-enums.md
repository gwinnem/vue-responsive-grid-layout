---
aside: false
---

# EGridLayoutEvent

```typescript
export enum EGridLayoutEvent {
  BREAKPOINT_CHANGED = `breakpoint-changed`,
  /** Declared for backwards compatibility — not currently emitted. */
  CHANGED_DIRECTION = `changed-direction`,
  COLUMNS_CHANGED = `columns-changed`,
  /** Declared for backwards compatibility — not currently emitted. */
  CONTAINER_RESIZED = `container-resized`,
  DRAG_END = `dragend`,
  DRAG_MOVE = `dragmove`,
  DRAG_START = `dragstart`,
  LAYOUT_BEFORE_MOUNT = `layout-before-mount`,
  LAYOUT_CREATED = `layout-created`,
  LAYOUT_MOUNTED = `layout-mounted`,
  LAYOUT_READY = `layout-ready`,
  /** The `v-model:layout` update event. */
  LAYOUT_UPDATE = `update:layout`,
  LAYOUT_UPDATED = `layout-updated`,
}
```

A real (value) export from the package's main entry point — usable both
as a type and to compare against at runtime. See
[GridLayout events](/components/grid-layout-events) for the full
event/payload reference.
