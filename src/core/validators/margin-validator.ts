/**
 * Validates a `margin` prop tuple: exactly two numbers, both strictly
 * positive (a `[0, 0]` margin fails this check). Not currently called
 * anywhere in `src/` outside its own test — `GridLayout`'s `margin` prop
 * isn't run through this validator, so a `[0, 0]` margin is accepted by
 * the component today despite what this function would say. See
 * `docs/REFACTORING.md` for this discrepancy.
 *
 * @param value The `[horizontal, vertical]` margin tuple to validate.
 * @returns `true` if both values are positive numbers.
 */
export const marginValidator = (value: [number, number]): boolean => {
  const values = value.map(v => typeof v === `number`);
  const isLength = value.length === 2;

  return values.indexOf(false) === -1 && isLength && value[0] > 0 && value[1] > 0;
};
