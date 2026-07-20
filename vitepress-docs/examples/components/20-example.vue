<template>
  <ExampleDemo title="Auto-size grid on content">
    <template #description>
      <code>autoSize</code> (default <code>true</code>, on
      <code>GridLayout</code>) grows the container's height to fit the
      layout's content — no fixed-height wrapper needed.
    </template>
    <template #controls>
      <button class="example-button" type="button" @click="addRow">+ Add row</button>
      <button class="example-button example-button--secondary" type="button" @click="removeRow">- Remove row</button>
    </template>

    <GridLayout v-model:layout="layout" :auto-size="true" :row-height="50">
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

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 6, x: 0, y: 0 },
  { h: 2, i: '1', w: 6, x: 6, y: 0 },
]);

let nextRow = 1;
const addRow = (): void => {
  const y = layout.value.reduce((max, item) => Math.max(max, item.y + item.h), 0);
  layout.value.push({ h: 2, i: `row-${nextRow}`, w: 12, x: 0, y });
  nextRow += 1;
};

const removeRow = (): void => {
  if (layout.value.length > 1) {
    layout.value.pop();
  }
};
</script>
