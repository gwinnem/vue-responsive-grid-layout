# Layout types


## `TLayoutItem`
```typescript
export type TLayoutItem = ILayoutItemRequired & {
minW?: number;
minH?: number;
maxW?: number;
maxH?: number;
moved?: boolean;
isStatic?: boolean;
isDraggable?: boolean;
isResizable?: boolean;
}
```

## `TLayout`
```typescript
export type TLayout = TLayoutItem[]
```
