/**
 * Inline style object produced by `setTransform`/`setTransformRtl`
 * (`core/helpers/utils.ts`) for positioning a `GridItem` via CSS
 * transforms — the default, GPU-accelerated positioning mode
 * (`useCssTransforms: true`, the `GridLayout` default). Vendor-prefixed
 * variants are included because this predates near-universal unprefixed
 * `transform` support in the project's original target browsers.
 */
export interface ITransformStyle {
  transform: string;
  WebkitTransform: string;
  MozTransform: string;
  msTransform: string;
  OTransform: string;
  width: string;
  height: string;
  position: `absolute` | `relative`;
}

/**
 * Inline style object produced by `setTopLeft` (`core/helpers/utils.ts`)
 * for positioning a `GridItem` via `top`/`left` instead of a CSS
 * transform — used when `useCssTransforms: false`.
 */
export interface ITopLeftStyle {
  top: string;
  left: string;
  width: string;
  height: string;
  position: `absolute`;
}

/**
 * Inline style object produced by `setTopRight` (`core/helpers/utils.ts`)
 * — the RTL counterpart of `ITopLeftStyle`, positioning via `top`/`right`.
 */
export interface ITopRightStyle {
  top: string;
  right: string;
  width: string;
  height: string;
  position: string;
}
