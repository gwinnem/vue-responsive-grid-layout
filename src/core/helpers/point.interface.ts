/**
 * A pixel coordinate pair, e.g. the result of
 * {@link offsetXYFromParentOf} (`draggable-utils.ts`) — a mouse position
 * relative to its offset parent, before it's been translated to grid
 * units.
 */
export interface IPoint {
  x: number;
  y: number;
}
