/**
 * The grid-position/size fields every layout item must have, regardless of
 * its interactivity settings.
 */
export interface ILayoutItemRequired {
  /** Unique identifier, matched against a `GridItem`'s `i` prop. */
  i: string | number;
  /** Height, in grid row units. */
  h: number;
  /** Width, in grid column units. */
  w: number;
  /** Horizontal position, in grid column units. */
  x: number;
  /** Vertical position, in grid row units. */
  y: number;
}

/**
 * One entry in a `GridLayout`'s `layout` array. The optional fields here
 * mirror the corresponding `GridItem` props (`isDraggable`, `minH`, etc.)
 * — set them on the layout item to configure a `GridItem` from data rather
 * than from template props directly.
 *
 * `TMeta` (default `unknown`) types the optional `data` field — attach
 * whatever payload your item needs (a widget's config, a chart's dataset
 * reference, anything) directly on the layout item, instead of
 * maintaining a parallel array keyed by `i` to look it up separately.
 * Every existing usage of `ILayoutItem` (or `TLayout`) without a type
 * argument keeps working unchanged — the default only matters if you
 * actually read `.data` and want it typed as something more specific
 * than `unknown`.
 */
export interface ILayoutItem<TMeta = unknown> extends ILayoutItemRequired {
  isDraggable?: boolean;
  isResizable?: boolean;
  /** Excludes this item from dragging, resizing, and collision cascades. */
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  /**
   * Set internally by the compaction/collision helpers (`utils.ts`,
   * `move-helper.ts`) to short-circuit infinite loops when cascading moves
   * — not meant to be set by consumers.
   */
  moved?: boolean;
  /**
   * Optional, consumer-defined payload — never read or written by the
   * library itself (confirmed: no internal code references `.data` on a
   * layout item), so its presence is purely additive and doesn't change
   * any existing behavior. Round-trips through `serializeLayout`/
   * `deserializeLayout` like any other field, as long as it's
   * JSON-serializable.
   */
  data?: TMeta;
}

/**
 * Structurally identical to `ILayoutItem`. Both exist in the codebase;
 * prefer `ILayoutItem` for new code — `TLayoutItem` is kept for backwards
 * compatibility with existing consumer type annotations.
 */
export type TLayoutItem<TMeta = unknown> = ILayoutItemRequired & {
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  moved?: boolean;
  data?: TMeta;
};

/** The full layout for a `GridLayout` — one `ILayoutItem` per rendered `GridItem`. See `ILayoutItem`'s own doc comment for what `TMeta` is for; the default keeps every existing non-generic usage of `TLayout` working unchanged. */
export type TLayout<TMeta = unknown> = ILayoutItem<TMeta>[];

/**
 * Pre-defined layouts keyed by breakpoint name, for the `GridLayout`
 * `responsiveLayouts` prop. Every key is optional — breakpoints without an
 * explicit entry get an auto-generated layout the first time they're
 * entered (see `findOrGenerateResponsiveLayout` in
 * `core/gridlayout/helpers/responsive-helper.ts`).
 */
export type TResponsiveLayout = {
  xxl?: TLayout;
  xl?: TLayout;
  lg?: TLayout;
  md?: TLayout;
  sm?: TLayout;
  xs?: TLayout;
  xxs?: TLayout;
};

/** A breakpoint name, e.g. `'lg'`, `'md'`, `'xs'`. Not restricted to the built-in set, since `breakpoints`/`cols` can define custom names. */
export type TBreakpoint = string;

/**
 * Container-width thresholds per breakpoint name. Structurally identical
 * to `IBreakpoints` (`grid-layout-props.interface.ts`); both exist in the
 * codebase and are used in different places — prefer `IBreakpoints` for
 * new code involving `GridLayout` props specifically.
 */
export type TBreakpoints = {
  xxl?: number;
  xl?: number;
  lg?: number;
  md?: number;
  sm?: number;
  xs?: number;
  xxs?: number;
};
