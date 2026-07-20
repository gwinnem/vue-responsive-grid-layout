import { TLayout } from '@/components/Grid/layout-definition';
import { keysValidator } from './keys-validator';

/**
 * Reference "shape" objects used by {@link layoutValidator} to check both
 * the required keys of a layout item (`validRequiredLayout`'s keys) and
 * the *type* of each optional key present (`validOptionalLayout`, checked
 * via `typeof`, not value). Also imported directly by
 * `tests/layoutValidator.spec.ts` so the test fixtures and the validator's
 * own reference shapes can't drift apart.
 */
export const layoutValidatorPayload = {
  invalidOptionalLayout: {
    h: 1,
    i: -1,
    isDraggable: true,
    isResizable: false,
    isStatic: false,
    maxH: 0,
    maxW: 0,
    minH: -1,
    minW: 0,
    moved: false,
    w: 1,
    x: 0,
    y: 0,
  },
  invalidRequiredLayout: {
    h: 1,
    i: 1,
    w: 0,
    x: 0,
    y: 'a',
  },
  invalidRequiredLayoutTwo: {
    h: 0,
    i: 1,
    w: 0,
    x: 0,
  },
  validOptionalLayout: {
    h: 1,
    i: 0,
    isDraggable: true,
    isResizable: false,
    isStatic: false,
    maxH: 0,
    maxW: 0,
    minH: 0,
    minW: 0,
    moved: true,
    w: 1,
    x: 0,
    y: 0,
  },
  validRequiredLayout: {
    h: 0,
    i: -1,
    w: 0,
    x: 0,
    y: 0,
  },
};

/**
 * Validates an entire layout array: every item must have the required
 * position keys (`i`, `h`, `w`, `x`, `y`), and any *optional* key present
 * (`isDraggable`, `minH`, etc.) must be the right JavaScript type — values
 * aren't range-checked here (that's `validateLayoutItemRequiredKeys` in
 * `keys-validator.ts`, used elsewhere). Called once, from `GridLayout`'s
 * `onMounted`, before the layout is used for anything.
 *
 * @param layout The layout array to validate.
 * @returns `true` for an empty array (nothing to violate — see docs/REFACTORING.md #9/#33: a grid mounting with no items yet, e.g. an empty cross-grid-drop target, is a normal state, not an error) or if every item has the required keys and correctly-typed optional keys.
 */
export const layoutValidator = (layout: TLayout): boolean => {
  if(layout.length === 0) {
    return true;
  }

  const { validOptionalLayout, validRequiredLayout } = layoutValidatorPayload;
  const validLayout = { ...validRequiredLayout, ...validOptionalLayout };
  const requiredKeys = Object.keys(validRequiredLayout);
  const requiredKeysValid = layout.map(l => keysValidator(requiredKeys, Object.keys(l)));

  if(requiredKeysValid.includes(false)) {
    return false;
  }

  const validTypes = layout.map(l => {
    const layoutItemKeys = Object.keys(l) as (keyof typeof l)[];
    // `data` (and any other key not present in validLayout) correctly
    // falls through to `true` below — it's a consumer-defined payload of
    // arbitrary type, not one of the fixed-type optional fields this
    // validator actually checks, so it was never meant to be
    // type-checked against a reference shape here. The cast is only for
    // TypeScript's benefit: validLayout's own inferred type doesn't
    // declare `data` as a key (nor should it, since there's no single
    // correct `typeof` for an arbitrary payload), but indexing with a
    // key it doesn't have is exactly the runtime case this ternary's
    // `: true` branch already handles correctly.
    const validLayoutIndexable = validLayout as Record<string, unknown>;
    return layoutItemKeys
      .map(k => (validLayoutIndexable[k] ? typeof l[k] === typeof validLayoutIndexable[k] : true))
      .includes(false);
  });
  return !validTypes.includes(true);
};
