<template>
  <ExampleDemo title="Prevent collision">
    <template #description>
      With <code>preventCollision</code> enabled, dragging or resizing an
      item stops as soon as it would overlap another — instead of pushing
      the other item out of the way.
    </template>
    <template #controls>
      <ExampleToggle v-model="preventCollision" label="preventCollision" />
    </template>

    <GridLayout v-model:layout="layout" :prevent-collision="preventCollision" :row-height="60">
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

const preventCollision = ref(true);

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 3, x: 0, y: 0 },
  { h: 2, i: '1', w: 3, x: 3, y: 0 },
  { h: 2, i: '2', w: 3, x: 6, y: 0 },
]);
</script>
