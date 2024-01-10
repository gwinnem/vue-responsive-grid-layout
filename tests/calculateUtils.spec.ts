// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import {calcXY} from "../src/core/helpers/calculateUtils";

describe(`calcXY tests`, () => {
    it(`Valid result`, () => {
        expect(()=> calcXY(10, 589, [10, 10], 60, 6, 0, 0, 0, 0 ).toBe( !0));
    });
});
