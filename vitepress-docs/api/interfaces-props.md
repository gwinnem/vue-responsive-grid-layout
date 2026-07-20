---
aside: false
---

# Component prop interfaces

The prop types behind every component, exported so you can type a
wrapper component's own props, a template ref, or a config object you
build up before passing it to `v-bind`.

## `IGridLayoutProps`

See [GridLayout props](/components/grid-layout-props) for the full
description of each field and its default.

```typescript
export interface IGridLayoutProps {
  autoSize?: boolean;
  borderRadiusPx?: number;
  breakpoints?: IBreakpoints;
  colNum?: number;
  cols?: IColumns;
  compactor?: ICompactor | null;
  compactType?: ECompactType;
  distributeEvenly?: boolean;
  enableUndoRedo?: boolean;
  horizontalShift?: boolean;
  isBounded?: boolean;
  isDraggable?: boolean;
  isMirrored?: boolean;
  isResizable?: boolean;
  layout: TLayout;
  margin?: number[];
  maxRows?: number;
  preventCollision?: boolean;
  responsive?: boolean;
  responsiveLayouts?: { [key: string]: TLayout };
  restoreOnDrag?: boolean;
  rowHeight?: number;
  showCloseButton?: boolean;
  showGridLines?: boolean;
  transformScale?: number;
  undoHistoryLimit?: number;
  useBorderRadius?: boolean;
  useCssTransforms?: boolean;
}
```

## `IGridItemProps`

See [GridItem props](/components/grid-item-props) for the full
description of each field and its default.

```typescript
export interface IGridItemProps {
  borderRadiusPx?: number;
  dragAllowFrom?: string | null;
  dragIgnoreFrom?: string;
  enableEditMode?: boolean;
  h: number;
  i: string | number;
  isBounded?: boolean | null;
  isDraggable?: boolean | null;
  isMirrored?: boolean | null;
  isResizable?: boolean | null;
  isStatic?: boolean | null;
  maxW?: number;
  maxH?: number;
  minH?: number;
  minW?: number;
  preserveAspectRatio?: boolean;
  resizeIgnoreFrom?: string | null;
  showCloseButton?: boolean | null;
  useBorderRadius?: boolean | null;
  w: number;
  x: number;
  y: number;
}
```

## `IBreakpoints` / `IColumns`

```typescript
export interface IBreakpoints {
  xxl: number; xl: number; lg: number; md: number; sm: number; xs: number; xxs: number;
}

export interface IColumns {
  xxl: number; xl: number; lg: number; md: number; sm: number; xs: number; xxs: number;
}
```

## `IGridAriaLabels`

Localizable UI/ARIA strings — the type of both `GridLayout`'s and
`GridItem`'s own `ariaLabels` prop. See
[Localizable ARIA strings](/examples/36-example).

```typescript
export interface IGridAriaLabels {
  closeButton?: string;          // default 'Close'
  itemRoleDescription?: string;  // default 'Draggable, resizable item'
  moveInstruction?: string;      // default 'Press arrow keys to move.'
  resizeInstruction?: string;    // default 'Press shift plus arrow keys to resize.'
}
```

`DEFAULT_ARIA_LABELS` (a `Required<IGridAriaLabels>`) is also exported,
holding the current English text for each key — useful if you want to
override just one key while explicitly spreading the rest of the
current defaults rather than leaving them implicit.

## `ICustomCloseButtonProps` / `ICustomDragElementProps`

Prop types for the two small exported utility components — see
[Custom drag handle & close button](/examples/18-example).

```typescript
export interface ICustomCloseButtonProps {
  /** The id of the GridItem this button removes when clicked. `-1` (default) is a no-op sentinel. */
  i: string | number;
}

export interface ICustomDragElementProps {
  /** Label rendered inside the handle's button. Default `'x'`. */
  text: string;
}
```
