export const keysValidator = (requiredKeys: string[], propsKeys: string[]): boolean => {
  const coincidenceKeys = propsKeys.filter(k => requiredKeys.indexOf(k) >= 0);

  return propsKeys.length >= requiredKeys.length && coincidenceKeys.length === requiredKeys.length;
};
