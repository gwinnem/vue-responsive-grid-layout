// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {getBottomYCoordinate} from "../src/core/gridlayout/helpers/gridLayoutHelper";
import {TLayout} from "../src/components";

const l1: TLayout = [
    {
        i: 0,
        h: 1,
        w: 1,
        x: 0,
        y: 0,
    },
    {
        i: 0,
        h: 1,
        w: 1,
        x: 0,
        y: 1,
    }
];

describe(`getBottomYCoordinate`, () => {
    it(`Should throw error when layout is undefined`, () => {
        expect(() => getBottomYCoordinate()).toThrowError(`Invalid parameter values`);
    });

    it(`Should throw error when layout is empty`, () => {
        expect(() => getBottomYCoordinate([])).toThrowError(`Invalid parameter values`);
    });

    it(`Should return 2 for the l1 layout`, () => {
        const result = getBottomYCoordinate(l1);
        expect(result).toBe(2);
    });
})
