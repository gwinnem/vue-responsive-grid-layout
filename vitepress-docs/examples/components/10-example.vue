<template>
  <ExampleDemo title="Add or remove items">
    <template #description>
      Widgets can be added or removed at runtime without rebuilding the
      grid — <code>GridLayout</code> just reacts to the bound
      <code>layout</code> array changing, the same way any other
      <code>v-model</code> would. Where a newly-added item actually lands
      is entirely up to the consumer, though — the library only places
      the item wherever <code>x</code>/<code>y</code> say to, then
      compacts around it. This demo's own <code>addItem</code> does a
      real first-fit bin-pack — remove an item from the middle of the
      grid, then add a new one, and it lands in the gap left behind
      rather than always at the very bottom.
    </template>
    <template #controls>
      <ExampleToggle v-model="appendToFirstRow" label="Add to end of first row (instead of a new row)" />
      <button class="example-button" type="button" @click="addItem">+ Add item</button>
      <button class="example-button example-button--secondary" type="button" @click="layout = []">Clear all</button>
    </template>

    <GridLayout v-model:layout="layout" :col-num="colNum" :row-height="60">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y"
        show-close-button @remove-grid-item="removeItem">
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
import { findFirstFitSlot } from 'vue-ts-responsive-grid-layout/core';

const colNum = 12;

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
]);

const appendToFirstRow = ref(false);
let nextId = 2;

/**
 * Bug fix: this used to only ever place a new item past the bottom-most
 * occupied row across the *entire* layout — so removing an item from
 * the middle of the grid (opening up a gap) and then adding a new one
 * never reused that gap; the new item always landed in a fresh row at
 * the very bottom, even when there was clearly room for it much
 * higher up. Reported as "bin-packing placement algorithm" (missing
 * one). Now uses the library's own exported `findFirstFitSlot` — a
 * real first-fit bin-pack, scanning row by row from the top and
 * column by column from the left for the first open gap.
 */
const addItem = (): void => {
  const newItem = { h: 2, i: String(nextId), w: 2, x: 0, y: 0 };
  nextId += 1;

  if (appendToFirstRow.value) {
    const firstRowItems = layout.value.filter(item => item.y === 0);
    // Bug fix: this used to sum every first-row item's own width and
    // use that total as the new item's x — which only happens to
    // equal "the first free column" when the row is packed with no
    // gaps. Remove an item from the middle of a full first row (not
    // the end), and the sum stays the same as before the removal
    // (widths don't change), so the new item lands at the OLD
    // rightmost edge, colliding with whatever item is already sitting
    // there — collision-avoidance then pushes it down into the next
    // row instead of into the gap this toggle is meant to fill.
    // Reported directly: clear all, add 6 items filling a 12-column
    // row exactly, remove the 3rd from the left, add one more —
    // landed at the last column of the *next* row instead of the gap.
    // Fixed to the actual rightmost occupied edge (max of x+w across
    // first-row items), which is correct with or without gaps.
    const rightmostEdge = firstRowItems.reduce((max, item) => Math.max(max, item.x + item.w), 0);
    if (rightmostEdge + newItem.w <= colNum) {
      newItem.x = rightmostEdge;
      layout.value.push(newItem);
      return;
    }
    // First row is full — fall through to the bin-pack placement below.
  }

  const slot = findFirstFitSlot(layout.value, colNum, newItem.w, newItem.h);
  newItem.x = slot.x;
  newItem.y = slot.y;
  layout.value.push(newItem);
};

const removeItem = (id: string | number): void => {
  layout.value = layout.value.filter(item => item.i !== id);
};
</script>
