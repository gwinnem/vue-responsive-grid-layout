// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {getBottomYCoordinate} from "../src/core/gridlayout/helpers/grid-layout-helper";
import {TLayout} from "../src/components";
import {EErrorMessage} from "../src/core/common/enums/ErrorMessages";

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
        expect(() => getBottomYCoordinate()).toThrowError(EErrorMessage.INVALID_LAYOUT);
    });

    it(`Should return 0 (not throw) when layout is empty`, () => {
        // Behavior change (see docs/REFACTORING.md #33): a grid with no
        // items yet has nothing occupying any row, which is 0, not an
        // error — distinct from `layout` being `undefined` entirely
        // (still genuinely invalid, see the test above).
        expect(getBottomYCoordinate([])).toBe(0);
    });

    it(`Should return 2 for the l1 layout`, () => {
        const result = getBottomYCoordinate(l1);
        expect(result).toBe(2);
    });
})
