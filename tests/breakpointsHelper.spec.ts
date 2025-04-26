// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {describe, expect, it} from 'vitest';
import {IBreakpoints, IColumns} from "@/components/Grid/grid-layout-props.interface";
import {
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  sortBreakpoints
} from "../src/core/common/helpers/breakpointsHelper";
import {ErrorMsg} from "../src/core/common/enums/ErrorMessages";

const breakpoints: IBreakpoints = {
  // eslint-disable-next-line vue/sort-keys
  xl: 1400,
  xxl: 1600,
  // eslint-disable-next-line vue/sort-keys
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
};

describe(`sortBreakpoints`, () => {
  it(`Breakpoints are sorted correctly`, () => {
    const sortedBreakPoints = sortBreakpoints(breakpoints);
    const resultBreakPoints = [
      `xxs`,
      `xs`,
      `sm`,
      `md`,
      `lg`,
      `xl`,
      `xxl`
    ];

    expect(sortedBreakPoints).toMatchObject(resultBreakPoints);
  });

  it(`Breakpoints are sorted correctly 1`, () => {
    const breakpoints: IBreakpoints = {
      xxs: 0,
      md: 996,
      xs: 480,
      sm: 768,
    };
    const sortedBreakPoints = sortBreakpoints(breakpoints);
    const resultBreakPoints = [
      `xxs`,
      `xs`,
      `sm`,
      `md`
    ];

    expect(sortedBreakPoints).toMatchObject(resultBreakPoints);
  });

  it(`Empty Breakpoint array throws error`, () => {
    expect(() => sortBreakpoints([])).toThrowError(ErrorMsg.INVALID_BREAKPOINT);
  });

  it(`Returned Breakpoint array has correct length`, () => {
    const breakpoints: IBreakpoints = {
      xxs: 0,
      md: 996,
      xs: 480,
      sm: 768,
    };
    expect(() => sortBreakpoints(breakpoints).length === 4).toBeTruthy();
  });
});

describe(`getBreakpointFromWidth`, () => {
  it('Should throw error when no breakpoint is passed', () => {
    expect(() => getBreakpointFromWidth({}, 1200)).toThrowError(ErrorMsg.INVALID_BREAKPOINT);
  });

  it(`Correct Breakpoint is returned 1500 = xl`, () => {
    expect(getBreakpointFromWidth(breakpoints, 1500) === `xl`).toBeTruthy();
  });

  it(`Correct Breakpoint is returned 1201 = lg`, () => {
    expect(getBreakpointFromWidth(breakpoints, 1201) === `lg`).toBeTruthy();
  });

  it(`Correct Breakpoint is returned 2000`, () => {
    expect(getBreakpointFromWidth(breakpoints, 2000) === `xxl`).toBeTruthy();
  });

  it(`Invalid width should throw error`, () => {
    expect(() => getBreakpointFromWidth(breakpoints, -99)).toThrowError(ErrorMsg.INVALID_WIDTH);
  });
  it(`Empty breakpoints should throw error`, () => {
    expect(() => getBreakpointFromWidth([], 99)).toThrowError(ErrorMsg.INVALID_BREAKPOINT);
  });
});

const columns: IColumns = {
  xxl: 16,
  // eslint-disable-next-line vue/sort-keys
  xl: 12,
  // eslint-disable-next-line vue/sort-keys
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2,
};

describe(`getColsFromBreakpoint tests`, () => {
  it(`Should throw error when breakpoint is not found`, () => {
    expect(() => getColsFromBreakpoint('invalid', columns)).toThrowError(ErrorMsg.INVALID_BREAKPOINT_NOT_FOUND);
  });

  it(`Should throw error when breakpoint is empty`, () => {
    expect(() => getColsFromBreakpoint(``, columns)).toThrowError(ErrorMsg.INVALID_BREAKPOINT);
  });

  it(`Should return 'columns.sm' for breakpoint sm`, () => {
    const colNum = getColsFromBreakpoint('sm', columns);
    expect(colNum).toBe(columns.sm);
  });
});
