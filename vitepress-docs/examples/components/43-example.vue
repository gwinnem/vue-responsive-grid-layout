<template>
  <ExampleDemo title="Undo/redo (enableUndoRedo)">
    <template #description>
      `enableUndoRedo` opts into an `undo()`/`redo()` history — off by
      default, since it keeps up to `undoHistoryLimit` cloned layout
      snapshots in memory. A snapshot is taken at each *committed*
      change (drag start→end, resize start→end, item add/remove,
      `compactNow()`/`rearrange()`), not per intermediate drag-move
      frame, and skipped entirely for a gesture that doesn't actually
      change anything. `undoHistoryLimit` is set low here (default 3,
      well below the library's own default of 50) specifically so the
      limit itself is easy to observe: add more items than the limit,
      then keep undoing — <code>canUndo</code> becomes <code>false</code>
      before every addition is undone, since the oldest snapshot was
      already dropped to stay under the cap.
    </template>
    <template #controls>
      <button
        data-testid="undo-button"
        :disabled="!gridRef?.canUndo"
        type="button"
        @click="gridRef?.undo()">
        Undo
      </button>
      <button
        data-testid="redo-button"
        :disabled="!gridRef?.canRedo"
        type="button"
        @click="gridRef?.redo()">
        Redo
      </button>
      <button
        data-testid="add-item-button"
        type="button"
        @click="addItem">
        Add item
      </button>
      <ExampleNumberField
        v-model="undoHistoryLimit"
        label="undoHistoryLimit"
        :max="20"
        :min="1" />
    </template>

    <GridLayout
      ref="gridRef"
      v-model:layout="layout"
      enable-undo-redo
      :row-height="60"
      :undo-history-limit="undoHistoryLimit">
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

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 2, x: 0, y: 0 },
    { h: 2, i: '1', w: 2, x: 2, y: 0 },
    { h: 2, i: '2', w: 2, x: 4, y: 0 },
  ]);

  const gridRef = ref<InstanceType<typeof GridLayout>>();
  let nextId = 3;
  const undoHistoryLimit = ref(3);

  const addItem = (): void => {
    layout.value.push({ h: 2, i: String(nextId), w: 2, x: 0, y: Infinity });
    nextId += 1;
  };
</script>
