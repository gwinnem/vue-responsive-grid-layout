/**
 * Payload shape for the `eventBus`'s `dragEvent`/`resizeEvent` messages —
 * a `GridItem` reporting its current drag/resize state up to the parent
 * `GridLayout` (see `docs/ARCHITECTURE.md` for the full eventBus contract).
 */
export interface IEventsData {
  /** The originating DOM/interact.js event type, e.g. `'dragstart'`, `'resizemove'`, `'resizeend'`. */
  eventType: string | symbol;
  /** Current height, in grid row units. */
  h: number;
  /** The reporting item's id. */
  i: string | number;
  /** Current width, in grid column units. */
  w: number;
  /** Current horizontal position, in grid column units. */
  x: number;
  /** Current vertical position, in grid row units. */
  y: number;
  /**
   * The originating pointer event's `clientX`/`clientY` — real viewport
   * pixel coordinates, straight from interact.js's own drag event, not
   * grid units. Only sent for drag events (`resizeEvent` doesn't need
   * them). Exists specifically so cross-grid drag/drop
   * (`allowCrossGridDrag`, see `cross-grid-registry.ts`) can check the
   * pointer's position against *other* grids' bounding rects using the
   * exact same coordinates interact.js itself is already using for this
   * drag — rather than a second, independent `document`-level
   * `mousemove` listener, which isn't guaranteed to fire reliably during
   * an active interact.js-driven drag (pointer capture can redirect or
   * suppress native mouse events depending on the browser and input
   * type) — see docs/REFACTORING.md #35.
   */
  clientX?: number;
  clientY?: number;
}
