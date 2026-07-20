<template>
  <ExampleDemo title="Snap to grid">
    <template #description>
      Distinct from <a href="/examples/26-example">alignment guides</a>
      (visual-only) — with <code>snapToGrid</code> on, dragging item "a"
      near item "b"'s edges actually snaps its position to align,
      rather than just showing a line. Try dragging "a" close to "b".
      Toggling <code>showGridLines</code> below makes the grid's own
      column/row boundaries visible, which helps make the snap itself
      easier to see happen against.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="snapToGrid"
        label="snapToGrid" />
      <ExampleToggle
        v-model="showGridLines"
        label="showGridLines" />
      <label class="example-controls-label">
        snapThreshold:
        <input
          v-model.number="snapThreshold"
          max="4"
          min="0"
          type="number" />
      </label>
    </template>

    <GridLayout
      v-model:layout="layout"
      :compact-type="ECompactType.NONE"
      :row-height="80"
      :show-grid-lines="showGridLines"
      :snap-threshold="snapThreshold"
      :snap-to-grid="snapToGrid">
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
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, ECompactType, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: 'a', w: 2, x: 0, y: 6 },
    { h: 2, i: 'b', w: 8, x: 0, y: 0 },
  ]);

  const snapToGrid = ref(true);
  const snapThreshold = ref(2);
  const showGridLines = ref(true);
</script>
