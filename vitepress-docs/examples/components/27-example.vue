<template>
  <ExampleDemo title="scrollToItem &amp; focusItem">
    <template #description>
      <code>gridRef.scrollToItem(id)</code>/<code>gridRef.focusItem(id)</code>
      — accessed via a template ref — scroll to and/or focus a specific
      item by id. Useful for "jump to the widget you just added" after a
      programmatic <code>addItem()</code>-style flow, or for restoring
      focus sensibly after a keyboard-driven action removes or relocates
      the currently-focused item. This grid has more rows than fit in
      the scroll area below — add an item and watch it scroll into view
      and receive focus automatically.
    </template>
    <template #controls>
      <button class="example-button" type="button" @click="addAndJumpToItem">+ Add item (scrolls &amp; focuses it)</button>
      <button class="example-button example-button--secondary" type="button" @click="jumpToFirst">Scroll to item 0</button>
    </template>

    <div class="scroll-area">
      <GridLayout ref="gridRef" v-model:layout="layout" :row-height="60">
        <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
          <div class="example-item">{{ item.i }}</div>
        </GridItem>
      </GridLayout>
    </div>

    <template #footer>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>(
  Array.from({ length: 6 }, (_, i) => ({ h: 2, i: String(i), w: 4, x: 0, y: i * 2 })),
);

const gridRef = ref<InstanceType<typeof GridLayout>>();

function addAndJumpToItem(): void {
  const id = `new-${Date.now()}`;
  layout.value.push({ h: 2, i: id, w: 4, x: 0, y: layout.value.length * 2 });
  // Bug fix: this comment previously (incorrectly) claimed the new
  // item's element already existed in the DOM by this point, so no
  // nextTick was needed — Vue's own reactivity actually batches DOM
  // updates asynchronously, so calling scrollToItem/focusItem
  // synchronously right here used to find nothing and do nothing, in
  // exactly the scenario they're meant for. Fixed at the library level
  // instead (both now await nextTick() internally) — this call site
  // doesn't need to change at all, or know anything about the timing,
  // for it to work correctly.
  gridRef.value?.scrollToItem(id);
  gridRef.value?.focusItem(id);
}

function jumpToFirst(): void {
  gridRef.value?.scrollToItem('0');
  gridRef.value?.focusItem('0');
}
</script>

<style scoped>
.scroll-area {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  max-height: 220px;
  overflow-y: auto;
  padding: 8px;
}
</style>
