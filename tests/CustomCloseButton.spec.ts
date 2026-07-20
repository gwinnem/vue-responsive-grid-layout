// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CustomCloseButton from '../src/components/common/CustomCloseButton.vue';
import { EGridItemEvent } from '../src/core/griditem/enums/EGridItemEvents';

describe(`CustomCloseButton`, () => {
  it(`Should render a close button`, () => {
    const wrapper = mount(CustomCloseButton, { props: { i: `1` } });

    expect(wrapper.find(`button.btn-close`).exists()).toBe(true);
  });

  it(`Should have an accessible name (regression: previously had none at all)`, () => {
    const wrapper = mount(CustomCloseButton, { props: { i: `1` } });

    expect(wrapper.find(`button.btn-close`).attributes(`aria-label`)).toBe(`Close`);
  });

  it(`Should emit remove-grid-item with the item id when clicked`, async () => {
    const wrapper = mount(CustomCloseButton, { props: { i: `42` } });

    await wrapper.find(`button.btn-close`).trigger(`click`);

    expect(wrapper.emitted(EGridItemEvent.REMOVE_ITEM)).toStrictEqual([[`42`]]);
  });

  it(`Should not emit when i defaults to -1 (no item associated)`, async () => {
    const wrapper = mount(CustomCloseButton);

    await wrapper.find(`button.btn-close`).trigger(`click`);

    expect(wrapper.emitted(EGridItemEvent.REMOVE_ITEM)).toBeUndefined();
  });

  it(`Should not emit when i is explicitly set to -1`, async () => {
    const wrapper = mount(CustomCloseButton, { props: { i: -1 } });

    await wrapper.find(`button.btn-close`).trigger(`click`);

    expect(wrapper.emitted(EGridItemEvent.REMOVE_ITEM)).toBeUndefined();
  });

  it(`Should emit for a numeric id of 0 (falsy but valid)`, async () => {
    const wrapper = mount(CustomCloseButton, { props: { i: 0 } });

    await wrapper.find(`button.btn-close`).trigger(`click`);

    expect(wrapper.emitted(EGridItemEvent.REMOVE_ITEM)).toStrictEqual([[0]]);
  });
});
