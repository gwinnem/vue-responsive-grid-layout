<template>
  <ExampleDemo title="Drag, drop from grid to grid">
    <template #description>
      Drag an item from one grid straight into the other — no native
      browser drag-and-drop involved. Both grids below set
      <code>allowCrossGridDrag</code>, the library's own built-in support
      for this — <strong>it needs to be set on both grids</strong>; toggle
      it off on either one to see dragging confine itself back to within
      that grid only, silently, with no error or event of any kind (a
      grid without this prop was never part of the cross-grid system in
      the first place, so there's nothing to reject the drop from). The
      item keeps the library's own smooth drag feedback the entire time.
      The target starts completely empty — given a minimum height here so
      there's still a reasonable drop target to aim for, since an
      actually-empty grid's own height would otherwise collapse to
      almost nothing. Toggle <code>preventCollision</code> to compare
      dragging an item over another one directly (default: pushes the
      other item aside) against blocking the move entirely instead.
    </template>
    <template #controls>
      <ExampleToggle v-model="sourceEnabled" label="Left grid: allow cross-grid drag" />
      <ExampleToggle v-model="targetEnabled" label="Right grid: allow cross-grid drag" />
      <ExampleToggle v-model="preventCollision" label="preventCollision" />
    </template>

    <div class="grids">
      <div id="grid-source">
        <p class="grid-label">Source</p>
        <GridLayout v-model:layout="sourceLayout" :allow-cross-grid-drag="sourceEnabled" layout-id="example-12-source"
          :col-num="2" :row-height="60" :prevent-collision="preventCollision">
          <GridItem v-for="item in sourceLayout" :key="item.i" :h="item.h" :i="item.i" :is-static="item.isStatic"
            :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item" :class="item.isStatic ? 'example-item--static' : 'example-item--c6'">
              {{ item.i }}<small v-if="item.isStatic">locked</small>
            </div>
          </GridItem>
        </GridLayout>
      </div>
      <div id="grid-target">
        <p class="grid-label">Target</p>
        <GridLayout v-model:layout="targetLayout" :allow-cross-grid-drag="targetEnabled" layout-id="example-12-target"
          :col-num="2" :row-height="60" :prevent-collision="preventCollision">
          <GridItem v-for="item in targetLayout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x"
            :y="item.y">
            <div class="example-item example-item--c1">{{ item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
    </div>

    <template #footer>
      <LayoutJsonViewer label="Source" :layout="sourceLayout" />
      <LayoutJsonViewer label="Target" :layout="targetLayout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const sourceEnabled = ref(true);
const targetEnabled = ref(true);
const preventCollision = ref(false);

const sourceLayout = ref<TLayout>([
  { h: 2, i: 'A', w: 2, x: 0, y: 0 },
  { h: 2, i: 'B', w: 2, x: 0, y: 2 },
  { h: 2, i: 'locked', isStatic: true, w: 2, x: 0, y: 4 },
]);
const targetLayout = ref<TLayout>([]);
</script>

<style scoped>
.grids {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
}

#grid-source .vue-grid-layout,
#grid-target .vue-grid-layout {
  min-height: 140px;
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
