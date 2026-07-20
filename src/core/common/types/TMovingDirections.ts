import { EMovingDirections } from '@/core/common/enums/EMovingDirections';

/**
 * A single direction key from {@link EMovingDirections} (`'UP' | 'DOWN' |
 * 'LEFT' | 'RIGHT'`), used to describe which way a colliding item is being
 * pushed in `move-helper.ts`'s collision-resolution logic.
 */
export type TMovingDirection = keyof typeof EMovingDirections;
