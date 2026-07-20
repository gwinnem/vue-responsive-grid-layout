import { keysValidator } from './keys-validator';
import { TBreakpoints } from '@/components/Grid/layout-definition';

/**
 * The set of breakpoint keys a `breakpoints`/`cols` object must have
 * exactly. Exported (rather than kept private) so `tests/breakpointValidator.spec.ts`
 * can reuse the same key list instead of duplicating it.
 */
export const keysValidatorPayload = {
  invalidKeys1: [`lg`, `md`, `sm`, `xs`, `xxs`],
  invalidKeys2: [`1`, `2`, `3`, `4`, `5`],
  validKeys: [`xxl`, `xl`, `lg`, `md`, `sm`, `xs`, `xxs`],
};

/**
 * Validates a `breakpoints`/`cols`-shaped object: it must have exactly the
 * seven standard breakpoint keys (`xxl`...`xxs`), each with a numeric
 * value.
 *
 * @param cols The breakpoints or columns object to validate.
 * @returns `true` if every required key is present with a numeric value.
 */
export const breakpointsValidator = (cols: TBreakpoints): boolean => {
  const propColsKeys = Object.keys(cols) as (keyof typeof cols)[];
  const colsValues = propColsKeys.map(k => typeof cols[k] === `number`);

  return keysValidator(keysValidatorPayload.validKeys, propColsKeys) && colsValues.indexOf(false) === -1;
};
