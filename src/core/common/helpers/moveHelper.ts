import {ILayoutItem} from "@/components";
import {getFirstCollision} from "@/core/gridlayout/helpers/collissionHelper";

/**
 * Moving a GridItem to the correct place in the layout.
 *
 * @param {ILayoutItem}     layoutItem
 * @param {ILayoutItem}     bounds
 * @param {ILayoutItem[]}   staticItems
 */
export const moveToCorrectPlace = (layoutItem: ILayoutItem, bounds: {
    cols: number
}, staticItems: ILayoutItem[]): void => {
    if (layoutItem.x + layoutItem.w > bounds.cols) {
        layoutItem.x = 0;
        layoutItem.y += 1;
    }
    // eslint-disable-next-line no-cond-assign
    while (getFirstCollision(staticItems, layoutItem)) {
        layoutItem.x += layoutItem.w;
        // move x to next place which might be able to contain it
        if (layoutItem.x + layoutItem.w > bounds.cols) {
            // if this width is out of layout
            layoutItem.y += 1; // move y to next y
            layoutItem.x = 0; // start x from 0
        }
    }
};
