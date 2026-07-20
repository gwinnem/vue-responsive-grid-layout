import { describe, expect, it } from 'vitest';
import {
  noCompactor,
  verticalCompactor,
  horizontalCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  getCompactor,
} from '../src/core/gridlayout/helpers/compactor';
import { compactLayout, compactLayoutHorizontal, compactLayoutOverlapVertical, compactLayoutOverlapHorizontal } from '../src/core/helpers/utils';
import { ECompactType } from '../src/core/gridlayout/enums/ECompactType';

describe(`compactor.interface`, () => {
  describe(`verticalCompactor`, () => {
    it(`Should have type "vertical"`, () => {
      expect(verticalCompactor.type).toBe(`vertical`);
    });

    it(`Should produce identical results to compactLayout(layout, true) directly`, () => {
      const layout = [
        { h: 2, i: `0`, w: 2, x: 0, y: 5 },
        { h: 2, i: `1`, w: 2, x: 2, y: 8 },
      ];
      const viaCompactor = verticalCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.VERTICAL });
      const viaDirectCall = compactLayout(structuredClone(layout), true);

      expect(viaCompactor).toStrictEqual(viaDirectCall);
      expect(viaCompactor[0].y).toBeLessThan(5);
    });

    it(`Should ignore context.compactType and always compact vertically — that's what choosing this compactor means`, () => {
      const layout = [{ h: 2, i: `0`, w: 2, x: 0, y: 5 }];
      const result = verticalCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.NONE });
      expect(result[0].y).toBe(0);
    });
  });

  describe(`horizontalCompactor`, () => {
    it(`Should have type "horizontal"`, () => {
      expect(horizontalCompactor.type).toBe(`horizontal`);
    });

    it(`Should produce identical results to compactLayoutHorizontal(layout, true) directly`, () => {
      const layout = [
        { h: 2, i: `0`, w: 1, x: 5, y: 0 },
        { h: 2, i: `1`, w: 1, x: 8, y: 2 },
      ];
      const viaCompactor = horizontalCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.HORIZONTAL });
      const viaDirectCall = compactLayoutHorizontal(structuredClone(layout), true);

      expect(viaCompactor).toStrictEqual(viaDirectCall);
      expect(viaCompactor[0].x).toBeLessThan(5);
    });

    it(`Should ignore context.compactType and always compact horizontally — that's what choosing this compactor means`, () => {
      const layout = [{ h: 2, i: `0`, w: 1, x: 5, y: 0 }];
      const result = horizontalCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.NONE });
      expect(result[0].x).toBe(0);
    });
  });

  describe(`noCompactor`, () => {
    it(`Should have type "none"`, () => {
      expect(noCompactor.type).toBe(`none`);
    });

    it(`Should produce identical results to compactLayout(layout, false) directly`, () => {
      const layout = [
        { h: 2, i: `0`, w: 2, x: 0, y: 5 },
        { h: 2, i: `1`, w: 2, x: 2, y: 8 },
      ];
      const viaCompactor = noCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.NONE });
      const viaDirectCall = compactLayout(structuredClone(layout), false);

      expect(viaCompactor).toStrictEqual(viaDirectCall);
      expect(viaCompactor[0].y).toBe(5);
    });

    it(`Should still resolve an actual collision by pushing down, not leave items overlapping`, () => {
      const layout = [
        { h: 4, i: `0`, w: 2, x: 0, y: 0 },
        { h: 2, i: `1`, w: 2, x: 0, y: 1 },
      ];
      const result = noCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.NONE });
      const item1 = result.find((entry) => entry.i === `1`)!;
      expect(item1.y).toBeGreaterThanOrEqual(4);
    });

    it(`Should pass context.minPositions through to compactLayout, matching restoreOnDrag's own behavior`, () => {
      const layout = [{ h: 2, i: `0`, w: 2, x: 0, y: 8 }];
      const minPositions = { '0': { y: 5 } };
      const viaCompactor = noCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.NONE, minPositions });
      const viaDirectCall = compactLayout(structuredClone(layout), false, minPositions);

      expect(viaCompactor).toStrictEqual(viaDirectCall);
      expect(viaCompactor[0].y).toBe(5);
    });
  });

  describe(`verticalOverlapCompactor`, () => {
    it(`Should have type "vertical-overlap"`, () => {
      expect(verticalOverlapCompactor.type).toBe(`vertical-overlap`);
    });

    it(`Should produce identical results to compactLayoutOverlapVertical(layout) directly`, () => {
      const layout = [
        { h: 2, i: `0`, w: 2, x: 0, y: 5 },
        { h: 2, i: `1`, w: 2, x: 0, y: 8 },
      ];
      const viaCompactor = verticalOverlapCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.VERTICAL_OVERLAP });
      const viaDirectCall = compactLayoutOverlapVertical(structuredClone(layout));

      expect(viaCompactor).toStrictEqual(viaDirectCall);
      expect(viaCompactor[0].y).toBe(0);
      expect(viaCompactor[1].y).toBe(0);
    });
  });

  describe(`horizontalOverlapCompactor`, () => {
    it(`Should have type "horizontal-overlap"`, () => {
      expect(horizontalOverlapCompactor.type).toBe(`horizontal-overlap`);
    });

    it(`Should produce identical results to compactLayoutOverlapHorizontal(layout) directly`, () => {
      const layout = [
        { h: 2, i: `0`, w: 1, x: 5, y: 0 },
        { h: 2, i: `1`, w: 1, x: 8, y: 0 },
      ];
      const viaCompactor = horizontalOverlapCompactor.compact(structuredClone(layout), 12, { compactType: ECompactType.HORIZONTAL_OVERLAP });
      const viaDirectCall = compactLayoutOverlapHorizontal(structuredClone(layout));

      expect(viaCompactor).toStrictEqual(viaDirectCall);
      expect(viaCompactor[0].x).toBe(0);
      expect(viaCompactor[1].x).toBe(0);
    });
  });

  describe(`getCompactor`, () => {
    it(`Should return verticalCompactor for ECompactType.VERTICAL`, () => {
      expect(getCompactor(ECompactType.VERTICAL)).toBe(verticalCompactor);
    });

    it(`Should return horizontalCompactor for ECompactType.HORIZONTAL`, () => {
      expect(getCompactor(ECompactType.HORIZONTAL)).toBe(horizontalCompactor);
    });

    it(`Should return noCompactor for ECompactType.NONE`, () => {
      expect(getCompactor(ECompactType.NONE)).toBe(noCompactor);
    });

    it(`Should return verticalOverlapCompactor for ECompactType.VERTICAL_OVERLAP`, () => {
      expect(getCompactor(ECompactType.VERTICAL_OVERLAP)).toBe(verticalOverlapCompactor);
    });

    it(`Should return horizontalOverlapCompactor for ECompactType.HORIZONTAL_OVERLAP`, () => {
      expect(getCompactor(ECompactType.HORIZONTAL_OVERLAP)).toBe(horizontalOverlapCompactor);
    });
  });
});
