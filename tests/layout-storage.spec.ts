import { describe, expect, it } from 'vitest';
import { deserializeLayout, serializeLayout } from '../src/core/helpers/layout-storage';

describe(`serializeLayout`, () => {
  it(`Should serialize a layout to a JSON string`, () => {
    const layout = [{ h: 2, i: `0`, w: 2, x: 0, y: 0 }];

    expect(serializeLayout(layout)).toBe(JSON.stringify(layout));
  });

  it(`Should strip the internal moved field before serializing`, () => {
    const layout = [{ h: 2, i: `0`, moved: true, w: 2, x: 0, y: 0 }];

    const result = JSON.parse(serializeLayout(layout));

    expect(result).toStrictEqual([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    expect(result[0]).not.toHaveProperty(`moved`);
  });

  it(`Should strip moved from every item, not just the first`, () => {
    const layout = [
      { h: 2, i: `0`, moved: true, w: 2, x: 0, y: 0 },
      { h: 2, i: `1`, moved: false, w: 2, x: 2, y: 0 },
    ];

    const result = JSON.parse(serializeLayout(layout));

    expect(result.every((item: object) => !(`moved` in item))).toBe(true);
  });

  it(`Should serialize an empty layout to an empty array`, () => {
    expect(serializeLayout([])).toBe(`[]`);
  });

  it(`Should preserve every other field, including optional ones`, () => {
    const layout = [{ h: 2, i: `0`, isStatic: true, maxW: 6, minW: 1, w: 2, x: 0, y: 0 }];

    const result = JSON.parse(serializeLayout(layout));

    expect(result[0]).toStrictEqual({ h: 2, i: `0`, isStatic: true, maxW: 6, minW: 1, w: 2, x: 0, y: 0 });
  });
});

describe(`deserializeLayout`, () => {
  it(`Should round-trip a layout serialized by serializeLayout`, () => {
    const layout = [{ h: 2, i: `0`, w: 2, x: 0, y: 0 }];

    expect(deserializeLayout(serializeLayout(layout))).toStrictEqual(layout);
  });

  it(`Should round-trip an item's data payload (ROADMAP.md #5's generic ILayoutItem<TMeta>)`, () => {
    const layout = [{ h: 2, i: `0`, w: 2, x: 0, y: 0, data: { chartId: `revenue`, refreshMs: 5000 } }];

    expect(deserializeLayout(serializeLayout(layout))).toStrictEqual(layout);
  });

  it(`Should return null for null input`, () => {
    expect(deserializeLayout(null)).toBeNull();
  });

  it(`Should return null for undefined input`, () => {
    expect(deserializeLayout(undefined)).toBeNull();
  });

  it(`Should return null for an empty string`, () => {
    expect(deserializeLayout(``)).toBeNull();
  });

  it(`Should return null for malformed JSON, not throw`, () => {
    expect(() => deserializeLayout(`{not valid json`)).not.toThrow();
    expect(deserializeLayout(`{not valid json`)).toBeNull();
  });

  it(`Should return null for valid JSON that isn't an array`, () => {
    expect(deserializeLayout(JSON.stringify({ h: 2, i: `0`, w: 2, x: 0, y: 0 }))).toBeNull();
  });

  it(`Should return null for valid JSON that isn't an array (a primitive)`, () => {
    expect(deserializeLayout(JSON.stringify(`just a string`))).toBeNull();
  });

  it(`Should return null for an array of items missing required fields`, () => {
    expect(deserializeLayout(JSON.stringify([{ i: `0`, w: 2 }]))).toBeNull();
  });

  it(`Should return an empty array for a serialized empty layout`, () => {
    expect(deserializeLayout(`[]`)).toStrictEqual([]);
  });

  it(`Should accept a layout that still has a moved field (e.g. hand-edited storage), not just output from serializeLayout`, () => {
    const result = deserializeLayout(JSON.stringify([{ h: 2, i: `0`, moved: true, w: 2, x: 0, y: 0 }]));

    expect(result).toStrictEqual([{ h: 2, i: `0`, moved: true, w: 2, x: 0, y: 0 }]);
  });
});
