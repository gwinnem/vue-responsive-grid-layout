export type TGridLayoutEvent = [
  string,
  number,
  number,
  number,
  number,
  number,
];

type TInnerKeys = `h` | `w` | `x` | `y`;
export type TInner<Type> = Record<TInnerKeys, Type>;
