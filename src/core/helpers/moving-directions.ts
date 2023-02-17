export enum EMovingDirections {
  DOWN = `DOWN`,
  LEFT = `LEFT`,
  RIGHT = `RIGHT`,
  UP = `UP`,
}

export type TMovingDirection = keyof typeof EMovingDirections;
