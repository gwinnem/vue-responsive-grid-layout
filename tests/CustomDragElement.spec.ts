// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import CustomDragElement from '../src/components/common/CustomDragElement.vue';

describe(`CustomDragElement`, () => {
  it(`Should render the default text when no prop is given`, () => {
    const wrapper = mount(CustomDragElement);

    expect(wrapper.find(`button`).text()).toBe(`x`);
  });

  it(`Should render the provided text`, () => {
    const wrapper = mount(CustomDragElement, { props: { text: `Drag me` } });

    expect(wrapper.find(`button`).text()).toBe(`Drag me`);
  });

  it(`Should render the drag handle element`, () => {
    const wrapper = mount(CustomDragElement, { props: { text: `Drag me` } });

    expect(wrapper.find(`.vue-draggable-handle`).exists()).toBe(true);
  });
});
