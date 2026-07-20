<template>
  <ExampleDemo title="Responsive predefined layouts">
    <template #description>
      Instead of letting the library auto-generate a layout for each
      breakpoint, you can hand it exact layouts to switch between via
      <code>responsiveLayouts</code>. Shrink the panel (or your window) to
      see the hand-authored mobile layout kick in below <code>md</code>.
    </template>

    <GridLayout v-model:layout="layout" responsive :responsive-layouts="responsiveLayouts" :row-height="50">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">{{ item.i }}</div>
      </GridItem>
    </GridLayout>
    <template #footer>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout, type TResponsiveLayout } from 'vue-ts-responsive-grid-layout';

// The default (large-screen) layout — three items side by side.
const layout = ref<TLayout>([
  { h: 2, i: 'header', w: 6, x: 0, y: 0 },
  { h: 3, i: 'sidebar', w: 2, x: 0, y: 2 },
  { h: 3, i: 'content', w: 4, x: 2, y: 2 },
]);

// Hand-authored layout for narrow screens: stack everything, sidebar last.
const responsiveLayouts: TResponsiveLayout = {
  xs: [
    { h: 2, i: 'header', w: 4, x: 0, y: 0 },
    { h: 4, i: 'content', w: 4, x: 0, y: 2 },
    { h: 3, i: 'sidebar', w: 4, x: 0, y: 6 },
  ],
};
</script>
