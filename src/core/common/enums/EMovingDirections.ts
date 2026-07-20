/**
 * The four cardinal directions a grid item can move in when
 * {@link moveElementAwayFromCollision} (see `move-helper.ts`) shifts it out
 * of the way of a colliding item.
 */
export enum EMovingDirections {
  DOWN = `DOWN`,
  LEFT = `LEFT`,
  RIGHT = `RIGHT`,
  UP = `UP`,
}
