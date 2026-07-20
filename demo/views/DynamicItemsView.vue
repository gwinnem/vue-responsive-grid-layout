<template>
  <h2>Add &amp; remove items</h2>
  <p class="demo-description">
    Widgets can be added or removed at runtime without rebuilding the grid.
    New items scroll into view and receive focus automatically
    (<code>scrollToItem</code>/<code>focusItem</code>), since a newly-added
    widget can land anywhere below the currently-visible area once there
    are enough items to need scrolling.
  </p>

  <div class="demo-controls">
    <button data-testid="add-item" type="button" @click="addItem">Add item</button>
    <span>{{ layout.length }} item(s)</span>
  </div>

  <div class="demo-grid-wrap demo-scroll-area">
    <GridLayout ref="gridRef" v-model:layout="layout" :row-height="80" show-close-button data-testid="dynamic-grid">
      <template #default>
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :h="item.h"
          :w="item.w"
          :x="item.x"
          :y="item.y"
          :i="item.i"
          :data-testid="`grid-item-${item.i}`"
          @remove-grid-item="removeItem"
        >
          <div class="demo-item">Item {{ item.i }}</div>
        </GridItem>
      </template>
    </GridLayout>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridItem, GridLayout } from '@/components';
import { findFirstFitSlot } from '@/core';
import type { TLayout } from '@/components';

const colNum = 12;
const nextId = ref(3);

const layout = ref<TLayout>([
  { i: '0', x: 0, y: 0, w: 3, h: 2 },
  { i: '1', x: 3, y: 0, w: 3, h: 2 },
  { i: '2', x: 6, y: 0, w: 3, h: 2 },
]);

const gridRef = ref<InstanceType<typeof GridLayout>>();

/**
 * Bug fix: this used to place every new item at `x: 0, y: Infinity` and
 * rely on compaction to settle it — but plain vertical compaction only
 * ever moves an item straight up within its *own* x range, it doesn't
 * search other columns for a better fit. With `x` hardcoded to `0`,
 * removing an item from the middle of a row (e.g. item "1" at x:3) and
 * adding a new one never reused that gap; the new item always landed
 * in a fresh row at the bottom instead. Reported as "bin-packing
 * placement algorithm" (missing one). Now uses the library's own
 * exported `findFirstFitSlot` — a real first-fit bin-pack.
 */
const addItem = () => {
  const id = String(nextId.value++);
  const { x, y } = findFirstFitSlot(layout.value, colNum, 3, 2);
  layout.value = [...layout.value, { i: id, x, y, w: 3, h: 2 }];
  // Bug fix: this comment previously (incorrectly) claimed the new
  // item's element already existed in the DOM by this point, so no
  // nextTick was needed — Vue's own reactivity actually batches DOM
  // updates asynchronously, so calling these synchronously right here
  // found nothing and did nothing. Fixed at the library level instead
  // (both methods now await nextTick() internally) rather than pushing
  // that requirement onto every caller — this call site doesn't need
  // to change at all, or know anything about the timing, for it to
  // work correctly now.
  gridRef.value?.scrollToItem(id);
  gridRef.value?.focusItem(id);
};

const removeItem = (id: string | number) => {
  layout.value = layout.value.filter(item => item.i !== id);
};
</script>

<style scoped>
.demo-scroll-area {
  max-height: 340px;
  overflow-y: auto;
}
</style>
