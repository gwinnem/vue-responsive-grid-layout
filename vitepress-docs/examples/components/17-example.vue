<template>
  <ExampleDemo title="Static items">
    <template #description>
      A static item can't be dragged, resized, or removed, and other
      items compact around it as if it were a fixed obstacle.
    </template>

    <GridLayout v-model:layout="layout" :row-height="60">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :is-static="item.isStatic" :w="item.w"
        :x="item.x" :y="item.y">
        <div class="example-item" :class="{ 'example-item--static': item.isStatic }">
          {{ item.i }}<small v-if="item.isStatic">static</small>
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

const layout = ref<TLayout>([
  { h: 2, i: 'locked', isStatic: true, w: 3, x: 3, y: 0 },
  { h: 2, i: '0', w: 3, x: 0, y: 0 },
  { h: 2, i: '1', w: 3, x: 6, y: 0 },
]);
</script>
