<template>
  <ExampleDemo title="Bounded drag to container">
    <template #description>
      With <code>isBounded</code> enabled, items can't be dragged past the
      edges of the grid container.
    </template>
    <template #controls>
      <ExampleToggle v-model="isBounded" label="isBounded" />
    </template>

    <GridLayout v-model:layout="layout" :is-bounded="isBounded" :row-height="60">
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
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const isBounded = ref(true);

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 4, y: 0 },
  { h: 2, i: '2', w: 2, x: 8, y: 0 },
]);
</script>
