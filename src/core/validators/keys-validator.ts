
export const keysValidator = (requiredKeys: string[], propsKeys: string[]): boolean => {
  const coincidenceKeys = propsKeys.filter((k) => requiredKeys.indexOf(k) >= 0);

  return propsKeys.length >= requiredKeys.length && coincidenceKeys.length === requiredKeys.length;
};

const isKeyNumericAndMinValidValue = (value: any, str: string, minValue: number): boolean => {
  const result = value[str];
  if(typeof result !== 'number') {
    return false;
  }

  return (Number.isFinite(result) && result > minValue) || result === minValue;
};

const isLayoutCorrectSize = (layoutItem: object): boolean => {
  if (
    layoutItem.hasOwnProperty('i') &&
    layoutItem.hasOwnProperty('h') &&
    layoutItem.hasOwnProperty('w') &&
    layoutItem.hasOwnProperty('x') &&
    layoutItem.hasOwnProperty('y')
  )
    return true;

  return false;
};

const isKeyNumeric = (value: any, str: string): boolean => {
  return Number.isFinite(value[str]);
};

const isValidIKeyString = (value: any): boolean => {
  const result = value['i'];
  return typeof result === 'string' && value['i'].length > 0;
};

const isIValid = (layoutItem: object): boolean => {
  const tmpIsNumeric = isKeyNumeric(layoutItem, 'i');
  const tmpIsString = isValidIKeyString(layoutItem);
  if ((!tmpIsNumeric && !tmpIsString) || (tmpIsNumeric && tmpIsString)) return false;
  return true;
};

export const validateLayoutItemRequiredKeys = (layoutItem: Object): boolean => {
  if (!isLayoutCorrectSize(layoutItem)) return false;
  if (!isIValid(layoutItem)) return false;
  if (!isKeyNumericAndMinValidValue(layoutItem, 'h', 1)) return false;
  if (!isKeyNumericAndMinValidValue(layoutItem, 'w', 1)) return false;
  if (!isKeyNumericAndMinValidValue(layoutItem, 'x', 0)) return false;
  if (!isKeyNumericAndMinValidValue(layoutItem, 'y', 0)) return false;

  return true;
};
