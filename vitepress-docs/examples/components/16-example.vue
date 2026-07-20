<template>
  <ExampleDemo title="Show grid lines">
    <template #description>
      <code>showGridLines</code> renders faint guide lines behind the
      items, at every row/column boundary.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="showGridLines"
        label="showGridLines" />
    </template>

    <GridLayout
      v-model:layout="layout"
      :row-height="60"
      :show-grid-lines="showGridLines">
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
  import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

  const showGridLines = ref(true);

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 3, x: 0, y: 0 },
    { h: 2, i: '1', w: 3, x: 3, y: 0 },
  ]);
</script>
