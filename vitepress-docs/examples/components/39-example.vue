<template>
  <ExampleDemo title="autoScroll">
    <template #description>
      <code>autoScroll</code> scrolls a scrollable ancestor automatically
      while dragging or resizing an item near its edge, rather than the
      interaction being limited to whatever's currently in the viewport.
      Try dragging or resizing item "0" toward the bottom of this
      scrollable box.
    </template>

    <div class="scroll-box">
      <GridLayout v-model:layout="layout" :max-rows="20" :row-height="60">
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :auto-scroll="item.i === '0'"
          :h="item.h"
          :i="item.i"
          :w="item.w"
          :x="item.x"
          :y="item.y"
        >
          <div class="example-item">
            {{ item.label }}
          </div>
        </GridItem>
      </GridLayout>
    </div>
    <template #footer>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<(TLayout[number] & { label: string })[]>([
  { h: 2, i: '0', label: 'autoScroll enabled', w: 4, x: 0, y: 0 },
  { h: 2, i: '1', label: 'autoScroll off (default)', w: 4, x: 4, y: 0 },
  { h: 2, i: '2', label: 'spacer', w: 12, x: 0, y: 8 },
]);
</script>

<style scoped>
.scroll-box {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  height: 320px;
  overflow: auto;
}
</style>
