import { ICrossGridZone } from '@/core/gridlayout/interfaces/cross-grid.interfaces';

/**
 * Every mounted `GridLayout` with `allowCrossGridDrag` enabled registers
 * itself here (see `GridLayout.vue`'s `onMounted`/`onBeforeUnmount`) and
 * deregisters on unmount. Deliberately a plain module-level `Set`, not
 * Vue reactive state or a `provide`/`inject` value — grids that drag
 * items between each other are frequently not in a Vue ancestor/descendant
 * relationship (siblings under different parents, or in entirely separate
 * component trees), so discovery can't rely on the component tree shape
 * at all. This is the same category of "shared, cross-instance state
 * that isn't naturally Vue state" as the `eventBus` `GridLayout` already
 * hands each `GridItem` — just needed across separate `GridLayout`
 * instances instead of within one.
 */
const zones = new Set<ICrossGridZone>();

/** Registers a zone; returns a function that deregisters it (call from `onBeforeUnmount`). */
export function registerCrossGridZone(zone: ICrossGridZone): () => void {
  zones.add(zone);
  return () => {
    zones.delete(zone);
  };
}

/**
 * Finds the first registered zone (other than `excludeLayoutId`, so a
 * grid never matches itself) whose current bounding rect contains the
 * given viewport coordinates. Rects are read fresh via each zone's own
 * `getRect()` on every call rather than cached, since scroll position and
 * layout can change between one drag and the next — or even during one,
 * if a page is scrollable.
 */
export function findCrossGridZoneAt(x: number, y: number, excludeLayoutId: string): ICrossGridZone | undefined {
  for(const zone of zones) {
    if(zone.layoutId === excludeLayoutId) {
      continue;
    }
    const rect = zone.getRect();
    if(!rect) {
      continue;
    }
    if(x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return zone;
    }
  }
  return undefined;
}
