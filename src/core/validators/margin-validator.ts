export const marginValidator = (value: [number, number]): boolean => {
  const values = value.map(v => typeof v === `number`);
  const isLength = value.length === 2;

  return values.indexOf(false) === -1 && isLength && value[0] > 0 && value[1] > 0;
};
