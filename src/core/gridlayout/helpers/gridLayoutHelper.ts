import {TLayout} from "@/components";

/**
 * Return the bottom coordinate of the layout.
 *
 * @param  {Array} layout Layout array.
 * @return {Number}       Bottom coordinate.
 */
export function getBottomYCoordinate(layout: TLayout): number {
    if(layout === undefined || layout.length === 0){
        throw new Error(`Invalid parameter values`);
    }
    let max = 0;
    let bottomY;
    for (let i = 0, len = layout.length; i < len; i++) {
        bottomY = layout[i].y + layout[i].h;
        if (bottomY > max) max = bottomY;
    }
    return max;
}
