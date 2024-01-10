import {describe, expect, it} from 'vitest';
import {TLayout} from "../src/components";
import {getAllNonStaticGridItems, getAllStaticGridItems} from "../src/core/common/helpers/gridIemTypeHelpers";

const testDataOne: TLayout = [
    // test 1
    {
        i: 1,
        h: 2,
        w: 1,
        x: 0,
        y: 0,
    },
    {
        i: 2,
        h: 2,
        w: 1,
        x: 1,
        y: 0,
    },
    {
        i: 3,
        h: 2,
        w: 1,
        x: 2,
        y: 0,
        isStatic: true,
    },
    {
        i: 4,
        h: 2,
        w: 1,
        x: 3,
        y: 0,
    },
    {
        i: 5,
        h: 2,
        w: 1,
        x: 4,
        y: 0,
    },
    {
        i: 6,
        h: 2,
        w: 1,
        x: 5,
        y: 0,
    }
];
describe(`moveToCorrectPlace`, () => {
    it(`Should return layout`, () => {
        const tmpStaticItems = getAllStaticGridItems(testDataOne);
        const tmpNonStaticItems = getAllNonStaticGridItems(testDataOne);

        expect(tmpNonStaticItems.length).toBe(5);
        expect(tmpStaticItems.length).toBe(10);

        // const cols = 6;
        // const gridItem = tmpStaticItems[0];


    });
});
