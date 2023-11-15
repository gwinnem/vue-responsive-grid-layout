// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import {calcColWidth, calcGridItemWH, calcXY, clamp} from "../src/core/helpers/calculateUtils";

describe(`calcGridItemWH tests`, () => {
    it(`gridUnits is NaN`, () => {
        const gridUnits = NaN;
        const calculatedValue = calcGridItemWH(gridUnits, 1, 1);
        expect(calculatedValue).toBe(gridUnits);
    });

    it(`gridUnits is Null`, () => {
        expect(() => calcGridItemWH(null, 1, 1)).toThrowError(new Error(`Invalid gridUnits passed`));
    });

    it(`gridUnits is 0 or negative`, () => {
        expect(() => calcGridItemWH(0, 1, 1)).toThrowError(new Error(`Invalid gridUnits passed`));
    });

    it(`gridUnits is valid`, () => {
        expect(() => {calcGridItemWH(10, 1, 1).toBe(19)});
    });

    it(`colOrRowSize is 0 or negative`, () => {
        expect(() => calcGridItemWH(1, 0, 1)).toThrowError(new Error(`Invalid colOrRowSize passed`));
    });

    it(`marginPx is 0 or negative`, () => {
        expect(() => calcGridItemWH(1, 1, 0)).toThrowError(new Error(`Invalid marginPx passed`));
    });
});

describe(`calcColWidth tests`, () => {
    it(`containerWidth is less than 1`, () => {
        expect(() => calcColWidth(0, 1, 1)).toThrowError(new Error(`Invalid containerWidth passed`));
    });

    it(`marginLeftRight is less than 1`, () => {
        expect(() => calcColWidth(1, 0, 1)).toThrowError(new Error(`Invalid marginLeftRight passed`));
    });

    it(`cols is less than 1`, () => {
        expect(() => calcColWidth(1, 1, 0)).toThrowError(new Error(`Invalid cols passed`));
    });

    it(`Parameters are valid`, () => {
        expect(() => {calcColWidth(100, 10, 10).toBe(NaN)});
    });
});

describe(`clamp tests`, () => {
    it(`clamp successful`, () => {
        expect(() => clamp(10, 0, 300).toBe(10));
    });
});

describe(`calcXY tests`, () => {
    it(`Valid result`, () => {
        expect(()=> calcXY(10, 589, [10, 10], 60, 6, 0, 0, 0, 0 ).toBe( !0));
    });
});
