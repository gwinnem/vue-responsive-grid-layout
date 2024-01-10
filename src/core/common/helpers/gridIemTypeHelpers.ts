import {ILayoutItem, TLayout} from "@/components";

/**
 * Get all static elements.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of static layout items.
 * @throws {String}       Empty layout not allowed.
 */
// eslint-disable-next-line no-undef
export function getAllStaticGridItems(layout: TLayout): ILayoutItem[] {
    if (layout.length === 0) {
        throw new Error('Empty layout not allowed');
    }
    return layout.filter(l => l.isStatic);
}

/**
 * Get non all static elements.
 * @param  {Array} layout Array of layout objects.
 * @return {Array}        Array of static layout items.
 * @throws {String}       Empty layout not allowed.
 */
// eslint-disable-next-line no-undef
export function getAllNonStaticGridItems(layout: TLayout): ILayoutItem[] {
    if (layout.length === 0) {
        throw new Error('Empty layout not allowed');
    }
    return layout.filter(l => !l.isStatic);
}
