---
aside: false
---

# Layout & breakpoint types

## `TLayout`

The full layout for a `GridLayout` — one [`ILayoutItem`](/api/interfaces-layout) per rendered `GridItem`.

```typescript
export type TLayout<TMeta = unknown> = ILayoutItem<TMeta>[];
```

## `TLayoutItem`

Structurally identical to `ILayoutItem`. Both exist in the codebase;
prefer `ILayoutItem` for new code — `TLayoutItem` is kept for backwards
compatibility with existing type annotations.

```typescript
export type TLayoutItem = ILayoutItemRequired & {
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  moved?: boolean;
};
```

## `TResponsiveLayout`

Pre-defined layouts keyed by breakpoint name, for `GridLayout`'s
`responsiveLayouts` prop. Every key is optional — see
[Responsive predefined layouts](/examples/09-example).

```typescript
export type TResponsiveLayout = {
  xxl?: TLayout;
  xl?: TLayout;
  lg?: TLayout;
  md?: TLayout;
  sm?: TLayout;
  xs?: TLayout;
  xxs?: TLayout;
};
```

## `TBreakpoint`

A breakpoint name — not restricted to the built-in set, since
`breakpoints`/`cols` can define custom names.

```typescript
export type TBreakpoint = string;
```

## `TBreakpoints`

Container-width thresholds per breakpoint name. Structurally identical to
[`IBreakpoints`](/api/interfaces-props); both exist in the codebase —
prefer `IBreakpoints` for new code involving `GridLayout` props
specifically.

```typescript
export type TBreakpoints = {
  xxl?: number;
  xl?: number;
  lg?: number;
  md?: number;
  sm?: number;
  xs?: number;
  xxs?: number;
};
```
