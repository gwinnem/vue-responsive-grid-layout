<template>
  <ExampleDemo title="Size constraints & aspect ratio">
    <template #description>
      Per-item <code>minW</code>/<code>maxW</code>/<code>minH</code>/<code>maxH</code>
      clamp how far a resize can go; <code>preserveAspectRatio</code> keeps
      width/height proportional while resizing. Try resizing each item from
      a corner.
    </template>

    <GridLayout
      v-model:layout="layout"
      :row-height="60">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :max-h="item.maxH"
        :max-w="item.maxW"
        :min-h="item.minH"
        :min-w="item.minW"
        :preserve-aspect-ratio="item.preserveAspectRatio"
        :w="item.w"
        :x="item.x"
        :y="item.y">
        <div class="example-item">
          {{ item.label }}
        </div>
      </GridItem>
    </GridLayout>
    <template #footer>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<(TLayout[number] & {
    label: string;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    preserveAspectRatio?: boolean;
  })[]>([
    { h: 2, i: '0', label: 'minW: 2, maxW: 4', maxW: 4, minW: 2, w: 3, x: 0, y: 0 },
    { h: 2, i: '1', label: 'minH: 2, maxH: 3', maxH: 3, minH: 2, w: 3, x: 3, y: 0 },
    { h: 2, i: '2', label: 'preserveAspectRatio', preserveAspectRatio: true, w: 3, x: 6, y: 0 },
  ]);
</script>
