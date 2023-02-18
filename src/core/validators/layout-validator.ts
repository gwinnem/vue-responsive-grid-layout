import { TLayout } from '@/components/Grid/layout-definition';
import { keysValidator } from '@/core/validators/keys-validator';

export const layoutValidatorPayload = {
  invalidOptionalLayout: {
    h: 1,
    i: 0,
    isDraggable: true,
    isResizable: false,
    isStatic: false,
    maxH: 0,
    maxW: 0,
    minH: `a`,
    minW: 0,
    moved: false,
    w: 1,
    x: 0,
    y: 0,
  },
  invalidRequiredLayout: {
    h: 0, i: `string`, w: 0, x: 0, y: `0`,
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
    h: 0, i: -1, w: 0, x: 0, y: 0,
  },
};

export const layoutValidator = (layout: TLayout): boolean => {
  const { validOptionalLayout, validRequiredLayout } = layoutValidatorPayload;
  const validLayout = { ...validRequiredLayout, ...validOptionalLayout };
  const requiredKeys = Object.keys(validRequiredLayout);
  const requiredKeysValid = layout.map(l => keysValidator(requiredKeys, Object.keys(l)));

  if(requiredKeysValid.includes(false)) {
    return false;
  }

  const validTypes = layout.map(l => {
    const layoutItemKeys = (Object.keys(l) as (keyof typeof l)[]);

    return layoutItemKeys
      .map(k => (validLayout[k] ? typeof l[k] === typeof validLayout[k] : true))
      .includes(false);
  });

  return !validTypes.includes(true);
};
