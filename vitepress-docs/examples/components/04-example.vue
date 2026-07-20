<template>
  <ExampleDemo title="Multiple independent grids">
    <template #description>
      Each `GridLayout` manages its own state independently — there's
      nothing special to configure to have more than one on a page.
    </template>

    <div class="grids">
      <div>
        <p class="grid-label">Grid A</p>
        <GridLayout v-model:layout="layoutA" :col-num="4" :row-height="50">
          <GridItem v-for="item in layoutA" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c1">{{ item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
      <div>
        <p class="grid-label">Grid B</p>
        <GridLayout v-model:layout="layoutB" :col-num="4" :row-height="50">
          <GridItem v-for="item in layoutB" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c4">{{ item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
    </div>

    <template #footer>
      <LayoutJsonViewer label="Grid A" :layout="layoutA" />
      <LayoutJsonViewer label="Grid B" :layout="layoutB" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layoutA = ref<TLayout>([
  { h: 2, i: 'a1', w: 2, x: 0, y: 0 },
  { h: 2, i: 'a2', w: 2, x: 2, y: 0 },
]);

const layoutB = ref<TLayout>([
  { h: 2, i: 'b1', w: 4, x: 0, y: 0 },
  { h: 2, i: 'b2', w: 2, x: 0, y: 2 },
  { h: 2, i: 'b3', w: 2, x: 2, y: 2 },
]);
</script>

<style scoped>
.grids {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
}

.grid-label {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0 0 8px;
  text-transform: uppercase;
}

@media (width <= 640px) {
  .grids {
    grid-template-columns: 1fr;
  }
}
</style>
