import { keysValidator } from './keys-validator';
import { TBreakpoints } from '@/components/Grid/layout-definition';

export const keysValidatorPayload = {
  invalidKeys1: [`lg`, `md`, `sm`, `xs`, `xxs`],
  invalidKeys2: [`1`, `2`, `3`, `4`, `5`],
  validKeys: [`xxl`, `xl`, `lg`, `md`, `sm`, `xs`, `xxs`],
};

export const breakpointsValidator = (cols: TBreakpoints): boolean => {
  const propColsKeys = (Object.keys(cols) as (keyof typeof cols)[]);
  const colsValues = propColsKeys.map(k => typeof cols[k] === `number`);

  return keysValidator(keysValidatorPayload.validKeys, propColsKeys) && colsValues.indexOf(false) === -1;
};
