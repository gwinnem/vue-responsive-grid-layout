<template>
  <ExampleDemo title="Per-item autoHeight">
    <template #description>
      <code>autoHeight</code> automatically re-measures an item's slot
      content whenever it actually changes size — a chart that renders
      taller with more data points, for instance — without needing the
      whole grid to also be auto-sized, and without manually calling the
      exposed <code>autoSize()</code> method yourself. Add or remove
      lines below and watch the item resize on its own.
    </template>
    <template #controls>
      <button class="example-button" type="button" @click="addLine">+ Add a line</button>
      <button class="example-button example-button--secondary" type="button" @click="removeLine">- Remove a line</button>
    </template>

    <GridLayout v-model:layout="layout" :row-height="40">
      <GridItem :h="layout[0].h" :i="layout[0].i" auto-height :w="layout[0].w" :x="layout[0].x" :y="layout[0].y">
        <div class="example-item auto-height-content">
          <p v-for="n in lineCount" :key="n">Line {{ n }} — content grows, the item follows.</p>
        </div>
      </GridItem>
    </GridLayout>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([{ h: 2, i: 'a', w: 4, x: 0, y: 0 }]);
const lineCount = ref(2);

function addLine(): void {
  lineCount.value += 1;
}

function removeLine(): void {
  lineCount.value = Math.max(1, lineCount.value - 1);
}
</script>

<style scoped>
.auto-height-content {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  height: auto;
  padding: 12px;
  text-align: left;
}

.auto-height-content p {
  margin: 2px 0;
}
</style>
