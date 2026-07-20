<template>
  <ExampleDemo title="Grid dimensions (rowHeight, colNum, margin)">
    <template #description>
      Three fundamental `GridLayout` props that control the grid's own
      geometry, adjusted live below rather than shown as separate static
      examples: <strong>rowHeight</strong> — the pixel height of one grid
      row (column width is always derived from the container's own
      measured width divided by <strong>colNum</strong>, not set
      directly). <strong>colNum</strong> — how many columns the grid is
      divided into; changing this while items already have a fixed
      `x`/`w` can make an item overflow the new, narrower column count
      (try dropping it below 6 with the default layout below). Both
      `rowHeight` and `colNum` affect every item's pixel size and
      position identically, immediately, without needing a drag/resize
      to "apply" — watch item "0" resize itself as you move either
      slider. <strong>margin</strong> is `[horizontal, vertical]` gap
      between items in pixels — the two axes are independent, so a wide
      horizontal gap with a tight vertical one (or vice versa) is a
      valid, common layout choice, not a mistake.
      <strong>showGridLines</strong> draws the underlying column/row
      structure directly, making exactly how `rowHeight`/`colNum`/
      `margin` shape the grid immediately visible as you adjust them,
      rather than having to infer it from where items happen to land.
    </template>
    <template #controls>
      <label>
        rowHeight ({{ rowHeight }}px)
        <input v-model.number="rowHeight" max="150" min="20" step="5" type="range" />
      </label>
      <label>
        colNum ({{ colNum }})
        <input v-model.number="colNum" max="16" min="2" step="1" type="range" />
      </label>
      <label>
        margin horizontal ({{ marginH }}px)
        <input v-model.number="marginH" max="40" min="0" step="2" type="range" />
      </label>
      <label>
        margin vertical ({{ marginV }}px)
        <input v-model.number="marginV" max="40" min="0" step="2" type="range" />
      </label>
      <ExampleToggle v-model="showGridLines" label="Show gridlines" />
    </template>

    <GridLayout v-model:layout="layout" :col-num="colNum" :margin="[marginH, marginV]" :row-height="rowHeight"
      :show-grid-lines="showGridLines">
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
  { h: 2, i: '0', w: 3, x: 0, y: 0 },
  { h: 2, i: '1', w: 3, x: 3, y: 0 },
  { h: 2, i: '2', w: 3, x: 6, y: 0 },
  { h: 2, i: '3', w: 3, x: 9, y: 0 },
]);

const rowHeight = ref(80);
const colNum = ref(12);
const marginH = ref(10);
const marginV = ref(10);
const showGridLines = ref(true);
</script>
