import { TLayout } from '@/components/Grid/layout-definition';
import { calcColWidth, calcGridItemWH } from '@/core/griditem/helpers/grid-item-calculate-helper';

/**
 * A grid-to-image export utility — nothing previously captured the
 * rendered grid as a static image (a report, a thumbnail preview, a
 * "share my dashboard layout" feature). Deliberately built as a
 * dependency-free SVG generator directly from layout data, rather than
 * a `html2canvas`-style DOM-to-canvas wrapper: the latter would need a
 * new runtime dependency shipped in this library's own bundle (or left
 * for the consumer to add themselves, in which case this helper adds
 * little value over them calling it directly on the rendered grid's
 * root element), and — being a real DOM screenshot — would be more
 * faithful to arbitrary custom slot content (a chart, an image) than a
 * hand-built SVG can be. This trades that fidelity for zero bundle-size
 * cost and no rendering dependency: it draws each item as a labeled
 * rectangle from the layout data alone, not a snapshot of whatever's
 * actually rendered inside each `GridItem`. Good for a structural
 * thumbnail/overview of the layout itself; not a substitute for a real
 * screenshot of custom content.
 *
 * See
 * [Export layout as SVG](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/28-example.md).
 */

export interface IExportLayoutAsSvgOptions {
  /** Number of columns the layout uses. Default `12`, matching `GridLayout`'s own `colNum` default. */
  colNum?: number;
  /** Height of one grid row, in pixels. Default `150`, matching `GridLayout`'s own `rowHeight` default. */
  rowHeight?: number;
  /** `[horizontal, vertical]` spacing between items, in pixels. Default `[10, 10]`, matching `GridLayout`'s own `margin` default. */
  margin?: [number, number];
  /**
   * The pixel width to lay the grid out against — this needs to be
   * supplied explicitly, unlike `GridLayout` itself, which measures its
   * own container automatically via `ResizeObserver`; there's no DOM
   * element for this standalone function to measure. Pass the same
   * width your actual `GridLayout` is rendered at for a matching
   * result. Default `1200`.
   */
  containerWidth?: number;
  /** Fill color for each item's rectangle. Default `'#eef2ff'`. */
  itemFill?: string;
  /** Stroke (border) color for each item's rectangle. Default `'#c7d2fe'`. */
  itemStroke?: string;
  /** Text color for each item's id label. Default `'#3730a3'`. */
  labelColor?: string;
  /** Background color for the whole SVG. `null` (default) leaves it transparent. */
  backgroundColor?: string | null;
}

/**
 * Renders a `TLayout` as a standalone SVG string — each item drawn as a
 * rectangle at its actual pixel position/size (given the same
 * `colNum`/`rowHeight`/`margin`/`containerWidth` your real grid uses),
 * labeled with its own `i`. Never throws: an empty layout produces a
 * valid, empty SVG rather than an error, matching the
 * `serializeLayout`/`deserializeLayout` convention of not needing a
 * try/catch for the common cases.
 *
 * The returned string is a complete `<svg>...</svg>` document — usable
 * directly (e.g. `innerHTML`'d into a container), downloaded as a
 * `.svg` file (`new Blob([svg], { type: 'image/svg+xml' })`), or
 * converted to a raster image via a `data:` URL drawn onto a `<canvas>`
 * if a PNG/JPEG is specifically needed instead.
 *
 * @param layout The layout to render.
 * @param options See `IExportLayoutAsSvgOptions`; every field optional, with defaults matching `GridLayout`'s own prop defaults.
 * @return A complete SVG document as a string.
 */
export function exportLayoutAsSvg(layout: TLayout, options: IExportLayoutAsSvgOptions = {}): string {
  const {
    backgroundColor = null,
    colNum = 12,
    containerWidth = 1200,
    itemFill = `#eef2ff`,
    itemStroke = `#c7d2fe`,
    labelColor = `#3730a3`,
    margin = [10, 10],
    rowHeight = 150,
  } = options;

  const [marginX, marginY] = margin;
  const colWidth = calcColWidth(containerWidth, marginX, colNum);

  const bottomRow = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  const totalHeight = bottomRow > 0 ? calcGridItemWH(bottomRow, rowHeight, marginY) + marginY : marginY;

  const escapeXml = (value: string): string =>
    value.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`).replace(/"/g, `&quot;`);

  const rects = layout
    .map(item => {
      const pixelX = colWidth * item.x + (item.x + 1) * marginX;
      const pixelY = rowHeight * item.y + (item.y + 1) * marginY;
      const pixelW = calcGridItemWH(item.w, colWidth, marginX);
      const pixelH = calcGridItemWH(item.h, rowHeight, marginY);
      const label = escapeXml(String(item.i));

      return [
        `<rect x="${pixelX}" y="${pixelY}" width="${pixelW}" height="${pixelH}"`,
        ` fill="${itemFill}" stroke="${itemStroke}" stroke-width="1" rx="8" ry="8" />`,
        `<text x="${pixelX + pixelW / 2}" y="${pixelY + pixelH / 2}" fill="${labelColor}"`,
        ` font-family="sans-serif" font-size="13" text-anchor="middle" dominant-baseline="middle">${label}</text>`,
      ].join(``);
    })
    .join(``);

  const background = backgroundColor ? `<rect width="100%" height="100%" fill="${backgroundColor}" />` : ``;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${containerWidth} ${totalHeight}" width="${containerWidth}" height="${totalHeight}">${background}${rects}</svg>`;
}
