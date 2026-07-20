import { describe, expect, it } from 'vitest';
import { exportLayoutAsSvg } from '../src/core/gridlayout/helpers/export-svg';

describe(`exportLayoutAsSvg`, () => {
  it(`Should produce a valid, empty SVG document for an empty layout`, () => {
    const svg = exportLayoutAsSvg([]);

    expect(svg).toContain(`<svg`);
    expect(svg).toContain(`</svg>`);
    expect(svg).not.toContain(`<rect x=`);
  });

  it(`Should render a rectangle and label for each item`, () => {
    const svg = exportLayoutAsSvg([
      { h: 2, i: `0`, w: 2, x: 0, y: 0 },
      { h: 2, i: `1`, w: 2, x: 2, y: 0 },
    ]);

    expect((svg.match(/<rect x=/g) ?? []).length).toBe(2);
    expect(svg).toContain(`>0</text>`);
    expect(svg).toContain(`>1</text>`);
  });

  it(`Should not throw for a layout with a single item`, () => {
    expect(() => exportLayoutAsSvg([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }])).not.toThrow();
  });

  it(`Should escape XML-unsafe characters in item ids`, () => {
    const svg = exportLayoutAsSvg([{ h: 2, i: `<script>`, w: 2, x: 0, y: 0 }]);

    expect(svg).not.toContain(`<script>`);
    expect(svg).toContain(`&lt;script&gt;`);
  });

  it(`Should respect custom colNum/rowHeight/margin/containerWidth options`, () => {
    const svg = exportLayoutAsSvg(
      [{ h: 1, i: `0`, w: 1, x: 0, y: 0 }],
      { colNum: 4, containerWidth: 400, margin: [0, 0], rowHeight: 100 },
    );

    // colWidth = (400 - 0*5)/4 = 100; item w:1 -> pixelW = 100.
    expect(svg).toContain(`width="100"`);
    expect(svg).toContain(`height="100"`);
  });

  it(`Should apply a background color when backgroundColor is set`, () => {
    const svg = exportLayoutAsSvg([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }], { backgroundColor: `#fff` });

    expect(svg).toContain(`fill="#fff"`);
  });

  it(`Should not include a background rect when backgroundColor is null (the default)`, () => {
    const svg = exportLayoutAsSvg([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    expect(svg).not.toContain(`width="100%" height="100%"`);
  });

  it(`Should size the viewBox/height to fit the bottommost item`, () => {
    const svg = exportLayoutAsSvg(
      [{ h: 2, i: `0`, w: 2, x: 0, y: 3 }],
      { margin: [10, 10], rowHeight: 100 },
    );

    // bottomRow = 3+2 = 5; totalHeight = calcGridItemWH(5, 100, 10) + 10
    // = (100*5 + 4*10) + 10 = 540 + 10 = 550.
    expect(svg).toContain(`height="550"`);
  });
});
