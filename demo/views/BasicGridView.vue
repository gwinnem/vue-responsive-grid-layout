<template>
  <h2>Basic grid</h2>
  <p class="demo-description">
    The smallest possible setup: a fixed layout with draggable and resizable items.
    Drag an item by its body, or resize it from any edge or corner.
  </p>

  <div
    class="demo-grid-wrap"
    data-testid="basic-grid-wrap">
    <GridLayout
      :col-num="12"
      data-testid="basic-grid"
      :layout="layout"
      :row-height="80">
      <template #default>
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :data-testid="`grid-item-${item.i}`"
          :h="item.h"
          :i="item.i"
          :w="item.w"
          :x="item.x"
          :y="item.y">
          <div class="demo-item">
            Item {{ item.i }}
          </div>
        </GridItem>
      </template>
    </GridLayout>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridItem, GridLayout } from '@/components';
  import type { TLayout } from '@/components';

  const layout = ref<TLayout>([
    { i: '0', x: 0, y: 0, w: 3, h: 2 },
    { i: '1', x: 3, y: 0, w: 3, h: 2 },
    { i: '2', x: 6, y: 0, w: 3, h: 3 },
    { i: '3', x: 0, y: 2, w: 3, h: 2 },
  ]);
</script>
