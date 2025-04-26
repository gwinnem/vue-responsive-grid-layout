// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import {
  getLayoutItem,
  setTopRight,
  setTopLeft,
  setTransformRtl,
  setTransform,
  cloneLayoutItem,
  cloneLayout
} from '../src/core/helpers/utils';
import {
  ITopRightStyle,
  ITopLeftStyle,
  ITransformStyle,
} from '../src/core/common/interfaces/transformStyle.interfaces';
import { ErrorMsg } from '../src/core/common/enums/ErrorMessages';
import { TLayout, ILayoutItem } from '../src/components';
import { testLayoutOne, testLayoutTwo } from './testLayout';

describe('cloneLayoutItem', () => {
  it('Should return exact copy of layout item', () => {
    const item: ILayoutItem = {
      i: 2,
      h: 1,
      w: 2,
      x: 1,
      y: 0,
    };
    const result = cloneLayoutItem(item);
    expect(result).toStrictEqual(item);
  });
});

describe('cloneLayout', () => {
  it('Should return exact copy of layout', () => {
    const result = cloneLayout(testLayoutOne);
    expect(result).toStrictEqual(testLayoutOne);
  });
});

// describe('compactItem', () => {

// });

describe(`getLayoutItem`, () => {
  it(`Should throw an exception when layout is empty`, () => {
    expect(() => getLayoutItem()).toThrowError(ErrorMsg.INVALID_LAYOUT);
  });

  it(`Should throw an exception when id is less than 0`, () => {
    expect(() => getLayoutItem(testLayoutOne, -1)).toThrowError(ErrorMsg.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is undefined`, () => {
    expect(() => getLayoutItem(testLayoutOne, undefined)).toThrowError(ErrorMsg.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is null`, () => {
    expect(() => getLayoutItem(testLayoutOne, null)).toThrowError(ErrorMsg.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is whitespace only`, () => {
    expect(() => getLayoutItem(testLayoutOne, "  ")).toThrowError(ErrorMsg.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should throw an exception when id is empty string`, () => {
    expect(() => getLayoutItem(testLayoutOne, "")).toThrowError(ErrorMsg.INVALID_LAYOUT_ITEM_ID);
  });

  it(`Should Return correct layout item when it exists by number`, () => {
    const expectedResult: ILayoutItem = {
      i: 2,
      h: 1,
      w: 2,
      x: 1,
      y: 0,
    };
    const result: ILayoutItem = getLayoutItem(testLayoutOne, 2);
    expect(result).toStrictEqual(expectedResult);
  });

  
  it(`Should Return correct layout item when it exists by string`, () => {
    const expectedResult: ILayoutItem = {
      i: "qwerty",
      h: 1,
      w: 1,
      x: 0,
      y: 0,
    };
    const result: ILayoutItem = getLayoutItem(testLayoutTwo, "qwerty");
    expect(result).toStrictEqual(expectedResult);
  });

  
  it(`Should Return correct layout item when it exists by string and case is wrong`, () => {
    const expectedResult: ILayoutItem = {
      i: "qwerty",
      h: 1,
      w: 1,
      x: 0,
      y: 0,
    };
    const result: ILayoutItem = getLayoutItem(testLayoutTwo, "QwerTy");
    expect(result).toStrictEqual(expectedResult);
  });

  it(`Should Return undefined when layout item does not exists by string`, () => {
    const result: ILayoutItem = getLayoutItem(testLayoutOne, 'abc');
    expect(result).toBe(undefined);
  });

  it(`Should Return undefined when layout item does not exists by number`, () => {
    const result: ILayoutItem = getLayoutItem(testLayoutOne, 999);
    expect(result).toBe(undefined);
  });
});

describe('setTransform', () => {
  it('Should return correct values', () => {
    const result: ITransformStyle = setTransform(1, 1, 1, 1);
    const expectedValue: ITransformStyle = {
      MozTransform: 'translate3d(1px,1px, 0)',
      OTransform: 'translate3d(1px,1px, 0)',
      WebkitTransform: 'translate3d(1px,1px, 0)',
      height: '1px',
      msTransform: 'translate3d(1px,1px, 0)',
      position: 'absolute',
      transform: 'translate3d(1px,1px, 0)',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});

describe('setTransformRtl', () => {
  it('Should return correct values', () => {
    const result: ITransformStyle = setTransformRtl(1, 1, 1, 1);
    const expectedValue: ITransformStyle = {
      MozTransform: 'translate3d(-1px,1px, 0)',
      OTransform: 'translate3d(-1px,1px, 0)',
      WebkitTransform: 'translate3d(-1px,1px, 0)',
      height: '1px',
      msTransform: 'translate3d(-1px,1px, 0)',
      position: 'absolute',
      transform: 'translate3d(-1px,1px, 0)',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});

describe('setTopLeft', () => {
  it('Should return correct values', () => {
    const result: ITopLeftStyle = setTopLeft(1, 1, 1, 1);
    const expectedValue: ITopLeftStyle = {
      height: '1px',
      position: 'absolute',
      left: '1px',
      top: '1px',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});

describe('setTopRight', () => {
  it('Should return correct values', () => {
    const result: ITopRightStyle = setTopRight(1, 1, 1, 1);
    const expectedValue: ITopRightStyle = {
      height: '1px',
      position: 'absolute',
      right: '1px',
      top: '1px',
      width: '1px',
    };
    expect(result).toStrictEqual(expectedValue);
  });
});
