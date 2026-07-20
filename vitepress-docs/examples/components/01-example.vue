<template>
  <ExampleDemo title="Basic drag &amp; resize">
    <template #description>
      Every item is draggable and resizable by default. Drag from anywhere
      on a card; resize from the bottom-right corner.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="isDraggable"
        label="isDraggable" />
      <ExampleToggle
        v-model="isResizable"
        label="isResizable" />
      <ExampleNumberField
        v-model="colNum"
        label="colNum"
        :max="12"
        :min="1" />
    </template>

    <GridLayout
      v-model:layout="layout"
      :col-num="colNum"
      :is-draggable="isDraggable"
      :is-resizable="isResizable"
      :row-height="60">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :w="item.w"
        :x="item.x"
        :y="item.y">
        <div class="example-item">
          {{ item.i }}
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

  const isDraggable = ref(true);
  const isResizable = ref(true);
  const colNum = ref(12);

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 2, x: 0, y: 0 },
    { h: 2, i: '1', w: 2, x: 2, y: 0 },
    { h: 2, i: '2', w: 2, x: 4, y: 0 },
    { h: 4, i: '3', w: 2, x: 6, y: 0 },
    { h: 2, i: '4', w: 2, x: 8, y: 0 },
  ]);
</script>
