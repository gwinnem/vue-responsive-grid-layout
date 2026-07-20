<template>
  <h2>Cross-grid drag/drop</h2>
  <p class="demo-description">
    Drag items between the two grids below. Each grid's participation is independently
    toggleable via <code>allowCrossGridDrag</code>; the right grid can also refuse incoming
    drops via <code>disableExternalDrop</code> while still sending its own items out.
  </p>

  <div class="demo-controls">
    <label>
      <input
        v-model="leftEnabled"
        data-testid="toggle-left-enabled"
        type="checkbox" />
      Left grid: allowCrossGridDrag
    </label>
    <label>
      <input
        v-model="rightEnabled"
        data-testid="toggle-right-enabled"
        type="checkbox" />
      Right grid: allowCrossGridDrag
    </label>
    <label>
      <input
        v-model="rightRejects"
        data-testid="toggle-right-rejects"
        type="checkbox" />
      Right grid: disableExternalDrop
    </label>
    <button
      data-testid="clear-log"
      type="button"
      @click="log = []">
      Clear log
    </button>
  </div>

  <div
    class="demo-cross-grids"
    data-testid="cross-grid-view-wrap">
    <div class="demo-grid-wrap">
      <p class="demo-grid-label">
        Left (layoutId: left)
      </p>
      <GridLayout
        v-model:layout="leftLayout"
        :allow-cross-grid-drag="leftEnabled"
        data-testid="cross-grid-left"
        layout-id="left"
        :row-height="70"
        @cross-grid-drop-rejected="onRejected('left', $event)"
        @cross-grid-item-dropped="onDropped('left', $event)">
        <GridItem
          v-for="item in leftLayout"
          :key="item.i"
          :data-testid="`grid-item-${item.i}`"
          :h="item.h"
          :i="item.i"
          :is-static="item.isStatic"
          :w="item.w"
          :x="item.x"
          :y="item.y">
          <div class="demo-item">
            {{ item.i }}<small v-if="item.isStatic"> (locked)</small>
          </div>
        </GridItem>
      </GridLayout>
    </div>
    <div class="demo-grid-wrap">
      <p class="demo-grid-label">
        Right (layoutId: right)
      </p>
      <GridLayout
        v-model:layout="rightLayout"
        :allow-cross-grid-drag="rightEnabled"
        data-testid="cross-grid-right"
        :disable-external-drop="rightRejects"
        layout-id="right"
        :row-height="70"
        @cross-grid-drop-rejected="onRejected('right', $event)"
        @cross-grid-item-dropped="onDropped('right', $event)">
        <GridItem
          v-for="item in rightLayout"
          :key="item.i"
          :data-testid="`grid-item-${item.i}`"
          :h="item.h"
          :i="item.i"
          :w="item.w"
          :x="item.x"
          :y="item.y">
          <div class="demo-item">
            {{ item.i }}
          </div>
        </GridItem>
      </GridLayout>
    </div>
  </div>

  <div
    class="demo-log"
    data-testid="event-log">
    <div v-if="log.length === 0">
      Drag an item between the two grids to see events here.
    </div>
    <div
      v-for="(entry, idx) in log"
      :key="idx">
      {{ entry }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridItem, GridLayout } from '@/components';
  import type { TLayout } from '@/components';

  const leftEnabled = ref(true);
  const rightEnabled = ref(true);
  const rightRejects = ref(false);

  const leftLayout = ref<TLayout>([
    { i: 'A', x: 0, y: 0, w: 2, h: 2 },
    { i: 'B', x: 2, y: 0, w: 2, h: 2 },
    { i: 'locked', x: 0, y: 2, w: 2, h: 2, isStatic: true },
  ]);
  const rightLayout = ref<TLayout>([]);

  const log = ref<string[]>([]);
  const record = (label: string): void => {
    log.value = [...log.value, `${new Date().toLocaleTimeString()}  ${label}`].slice(-50);
  };

  const onDropped = (targetName: string, payload: { item: { i: string | number }; sourceLayoutId: string }): void => {
    record(`dropped: "${payload.item.i}" moved into ${targetName} (from ${payload.sourceLayoutId})`);
  };

  const onRejected = (targetName: string, payload: { itemId: string | number; sourceLayoutId: string }): void => {
    record(`rejected: ${targetName} refused "${payload.itemId}" from ${payload.sourceLayoutId}`);
  };
</script>
