<template>
  <ExampleDemo title="Horizontal shift">
    <template #description>
      With <code>horizontalShift</code>, colliding items are pushed
      left/right instead of down. Drag item 1 into item 0's space to see
      the difference. Note: this only affects the mid-drag bump —
      <code>compactType: HORIZONTAL</code> (see
      <a href="/examples/42-example">Pluggable compaction</a>) is a
      separate, after-the-fact settling pass that only ever adjusts
      <code>x</code>. It won't undo a vertical bump this being off
      already caused; for consistently-horizontal behavior both during
      a drag and once settled, use both together.
    </template>
    <template #controls>
      <ExampleToggle v-model="horizontalShift" label="horizontalShift" />
    </template>

    <GridLayout v-model:layout="layout" :horizontal-shift="horizontalShift" :row-height="60">
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

const horizontalShift = ref(true);

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 3, x: 0, y: 0 },
  { h: 2, i: '1', w: 3, x: 3, y: 0 },
  { h: 2, i: '2', w: 3, x: 6, y: 0 },
]);
</script>
