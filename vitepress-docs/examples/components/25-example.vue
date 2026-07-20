<template>
  <ExampleDemo title="Custom drag-placeholder content">
    <template #description>
      By default the drag placeholder is a plain colored box. The
      <code>#placeholder</code> slot lets you replace that with anything —
      a ghost outline of the item being dragged, a "drop here" label, an
      icon. Scoped slot props give you the placeholder's current grid
      position/size (<code>placeholder</code>) and whether a drag is
      actually in progress (<code>isDragging</code>). Drag an item to see it.
    </template>

    <GridLayout
      v-model:layout="layout"
      :row-height="60">
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
      <template #placeholder="{ placeholder }">
        <div class="custom-placeholder">
          <span class="custom-placeholder__icon">+</span>
          <span class="custom-placeholder__label">Drop at {{ placeholder.x }}, {{ placeholder.y }}</span>
        </div>
      </template>
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
    { h: 2, i: '0', w: 2, x: 0, y: 0 },
    { h: 2, i: '1', w: 2, x: 2, y: 0 },
    { h: 2, i: '2', w: 2, x: 4, y: 0 },
  ]);
</script>

<style scoped>
.custom-placeholder {
  align-items: center;
  border: 2px dashed rgb(255 255 255 / 60%);
  border-radius: 8px;
  color: #fff;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  gap: 4px;
  height: 100%;
  justify-content: center;
  width: 100%;
}

.custom-placeholder__icon {
  font-size: 20px;
  line-height: 1;
}
</style>
