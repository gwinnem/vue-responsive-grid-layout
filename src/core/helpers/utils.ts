import {ILayoutItem, TLayout} from '@/components/Grid/layout-definition';
import {getFirstCollision} from "@/core/gridlayout/helpers/collissionHelper";
import {getAllStaticGridItems} from "@/core/common/helpers/gridIemTypeHelpers";
import {ITopLeftStyle, ITopRightStyle, ITransformStyle} from "@/core/common/interfaces/transformStyle.interfaces";
import {ErrorMsg} from "@/core/common/enums/ErrorMessages";

// Fast path to cloning, since this is monomorphic
export function cloneLayoutItem(layoutItem: ILayoutItem): ILayoutItem {
    return JSON.parse(JSON.stringify(layoutItem));
}

export function cloneLayout(layout: TLayout): TLayout {
    const newLayout = Array(layout.length);
    for (let i = 0, len = layout.length; i < len; i++) {
        newLayout[i] = cloneLayoutItem(layout[i]);
    }
    return newLayout;
}

/**
 * Get layout items sorted from top left to right and down.
 *
 * @param  {TLayout} layout  Array of layout objects.
 * @return {TLayout}        Layout, sorted static items first.
 */
export function sortLayoutItemsByRowCol(layout: TLayout): TLayout {
    const a: ILayoutItem[] = [];
    return a.concat(layout)
        .sort((itemA, itemB) => {
            if (itemA.y === itemB.y && itemA.x === itemB.x) {
                return 0;
            }

            if (itemA.y > itemB.y || (itemA.y === itemB.y && itemA.x > itemB.x)) {
                return 1;
            }

            return -1;
        });
}

/**
 * Compact a GridItem in the layout.
 */
export function compactItem(
    compareWith: TLayout,
    l: ILayoutItem,
    verticalCompact: boolean,
    minPositions?: any,
): ILayoutItem {
    if (verticalCompact) {
        // Move the element up as far as it can go without colliding.
        while (l.y > 0 && !getFirstCollision(compareWith, l)) {
            l.y--;
        }
    } else if (minPositions) {
        const minY = minPositions[l.i].y;
        while (l.y > minY && !getFirstCollision(compareWith, l)) {
            l.y--;
        }
    }

    // Move it down, and keep moving it down if it's colliding.
    let collisions;
    // eslint-disable-next-line no-cond-assign
    while ((collisions = getFirstCollision(compareWith, l))) {
        l.y = collisions.y + collisions.h;
    }
    return l;
}

/**
 * Given a layout, compact it. This involves going down each y coordinate and removing gaps
 * between items.
 *
 * @param   {TLayout} layout          Layout.
 * @param   {Boolean} verticalCompact Whether or not to compact the layout vertically.
 * @param   {Object}  minPositions
 * @return  {TLayout}                 Compacted Layout.
 */
export function compactLayout(layout: TLayout, verticalCompact: boolean, minPositions?: any): TLayout {
    // Statics go in the compareWith array right away so items flow around them.
    const compareWith = getAllStaticGridItems(layout);
    // We go through the items by row and column.
    const sorted = sortLayoutItemsByRowCol(layout);
    // Holding for new items.
    const out: TLayout = Array(layout.length);

    for (let i = 0, len = sorted.length; i < len; i++) {
        let l = sorted[i];

        // Don't move static elements
        if (!l.isStatic) {
            l = compactItem(compareWith, l, verticalCompact, minPositions);

            // Add to comparison array. We only collide with items before this one.
            // Statics are already in this array.
            compareWith.push(l);
        }

        // Add to output array to make sure they still come out in the right order.
        out[layout.indexOf(l)] = l;

        // Clear moved flag, if it exists.
        l.moved = false;
    }
    return out;
}

/**
 * Get a layout item by ID. Used so we can override later on if necessary.
 *
 * @param  {Array}      layout  Layout array.
 * @param  {String}     id      ID
 * @return {ILayoutItem}        Item at ID.
 * @throws {Error}              Invalid parameters
 */
export function getLayoutItem(
    layout: TLayout,
    id: string | number | undefined,
): ILayoutItem | undefined {
    if (layout === undefined) {
        throw new Error(ErrorMsg.INVALID_LAYOUT);
    }
    for (let i = 0, len = layout.length; i < len; i++) {
        if (layout[i].i === id) {
            return layout[i];
        }
    }
    return undefined;
}

/**
 * Returns default direction
 *
 * @param top
 * @param left
 * @param width
 * @param height
 * @returns {ITransformStyle}
 */
export function setTransform(
    top: number,
    left: number,
    width: number,
    height: number,
): ITransformStyle {
    // Replace unit less items with px
    const translate = `translate3d(${left}px,${top}px, 0)`;
    return {
        MozTransform: translate,
        OTransform: translate,
        WebkitTransform: translate,
        height: `${height}px`,
        msTransform: translate,
        position: `absolute`,
        transform: translate,
        width: `${width}px`,
    };
}

/**
 * Just like the setTransform method, but instead it will return a negative value of right.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {ITransformStyle}
 */
export function setTransformRtl(
    top: number,
    right: number,
    width: number,
    height: number,
): ITransformStyle {
    // Replace unit less items with px
    const translate = `translate3d(${right * -1}px,${top}px, 0)`;
    return {
        MozTransform: translate,
        OTransform: translate,
        WebkitTransform: translate,
        height: `${height}px`,
        msTransform: translate,
        position: `absolute`,
        transform: translate,
        width: `${width}px`,
    };
}

export function setTopLeft(top: number, left: number, width: number, height: number): ITopLeftStyle {
    return {
        height: `${height}px`,
        left: `${left}px`,
        position: `absolute`,
        top: `${top}px`,
        width: `${width}px`,
    };
}

/**
 * Just like the setTopLeft method, but instead, it will return a right property instead of left.
 *
 * @param top
 * @param right
 * @param width
 * @param height
 * @returns {ITopRightStyle}
 */
export function setTopRight(
    top: number,
    right: number,
    width: number,
    height: number,
): ITopRightStyle {
    return {
        height: `${height}px`,
        position: `absolute`,
        right: `${right}px`,
        top: `${top}px`,
        width: `${width}px`,
    };
}
