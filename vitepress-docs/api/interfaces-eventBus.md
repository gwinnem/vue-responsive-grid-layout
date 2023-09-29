---
aside: false
---

# Eventbus interfaces

## IEventsData
Defines the payload `drag` and `resize` events are emitting.

```typescript
export interface IEventsData {
  eventType: string | symbol;
  h: number;
  i: string | number;
  w: number;
  x: number;
  y: number;
}
```
