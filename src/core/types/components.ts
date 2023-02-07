type TInnerKeys = `h` | `w` | `x` | `y`;
export type TGridLayoutEvent = [string, number, number, number, number, number];
export type TInner<Type> = Record<TInnerKeys, Type>;
// eslint-disable-next-line no-undef
export type TIntersectionObserverConfig = IntersectionObserverInit;
