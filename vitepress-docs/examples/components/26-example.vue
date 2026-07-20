<template>
  <ExampleDemo title="Alignment guides while dragging">
    <template #description>
      With <code>showAlignmentGuides</code> enabled, dragging or resizing
      an item shows a guide line whenever one of its edges lines up with
      another item's edge — not restricted to same-side matches (a left
      edge lining up with another item's right edge counts too). Purely
      visual — it doesn't snap or constrain movement, just highlights
      alignments you might want to line up to. Drag item 2 (bottom-right)
      around to see guides appear against items 0 and 1.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="showAlignmentGuides"
        label="showAlignmentGuides" />
    </template>

    <GridLayout
      v-model:layout="layout"
      :compact-type="ECompactType.NONE"
      :row-height="60"
      :show-alignment-guides="showAlignmentGuides">
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

    <template #footer>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, ECompactType, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 2, x: 0, y: 0 },
    { h: 2, i: '1', w: 3, x: 4, y: 0 },
    { h: 2, i: '2', w: 2, x: 6, y: 4 },
  ]);

  const showAlignmentGuides = ref(true);
</script>
