export type TBreakpointsKeys = `lg` | `md` | `sm` | `xs` | `xxs` | ``;

export type TRecordBreakpoint<Type> = Partial<Record<TBreakpointsKeys, Type>>;
export type TBreakpoints = TRecordBreakpoint<number>;
