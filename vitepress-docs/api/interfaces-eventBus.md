---
aside: false
---

# eventBus interfaces

## `IEventsData`

The payload shape for the internal `eventBus`'s `dragEvent`/`resizeEvent`
messages — a `GridItem` reporting its current drag/resize state up to the
parent `GridLayout`. Internal plumbing; see
[eventBus events](/components/grid-layout-event-bus-events) for context.

```typescript
export interface IEventsData {
  /** The originating DOM event type, e.g. 'dragstart', 'resizemove', 'resizeend'. */
  eventType: string | symbol;
  /** Current height, in grid row units. */
  h: number;
  /** The reporting item's id. */
  i: string | number;
  /** Current width, in grid column units. */
  w: number;
  /** Current horizontal position, in grid column units. */
  x: number;
  /** Current vertical position, in grid row units. */
  y: number;
}
```
