<template>
  <ExampleDemo title="Mirrored (RTL)">
    <template #description>
      Flips the layout horizontally — items count from the right edge
      instead of the left. Useful for right-to-left languages.
    </template>
    <template #controls>
      <ExampleToggle v-model="isMirrored" label="isMirrored" />
    </template>

    <GridLayout v-model:layout="layout" :is-mirrored="isMirrored" :row-height="60">
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

const isMirrored = ref(true);

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
  { h: 2, i: '2', w: 2, x: 4, y: 0 },
]);
</script>
