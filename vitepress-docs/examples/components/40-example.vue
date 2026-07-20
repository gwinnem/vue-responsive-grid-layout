<template>
  <ExampleDemo title="Layout lifecycle events">
    <template #description>
      Every lifecycle event `GridLayout` fires, from before mount through
      every subsequent update — plus the raw `dragstart`/`dragmove`/`dragend`
      pair `GridLayout` itself emits (distinct from `GridItem`'s own
      `item-move`/`item-moved`), and `GridItem`'s `container-resized`/
      `item-clicked`. Drag or resize an item, resize the browser window, and
      watch the log below.
    </template>

    <GridLayout
      ref="gridRef"
      v-model:layout="layout"
      :row-height="60"
      @columns-changed="log(`columns-changed: ${$event}`)"
      @dragend="log(`dragend: ${$event}`)"
      @dragmove="log('dragmove')"
      @dragstart="log(`dragstart: ${$event}`)"
      @layout-before-mount="log('layout-before-mount')"
      @layout-created="log('layout-created')"
      @layout-mounted="log('layout-mounted')"
      @layout-ready="onLayoutReady"
      @layout-updated="log('layout-updated')">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :w="item.w"
        :x="item.x"
        :y="item.y"
        @container-resized="log(`container-resized: ${item.i}`)"
        @item-clicked="log(`item-clicked: ${item.i}`)"
        @resize="log(`resize: ${item.i} -> ${item.w}x${item.h}`)">
        <div class="example-item">
          {{ item.i }}
        </div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <p v-if="lastBreakpoint">
        Last known breakpoint (read via a template ref): <code>{{ lastBreakpoint }}</code>
      </p>
      <div class="event-log">
        <div
          v-if="events.length === 0"
          class="event-log__empty">
          Drag/resize an item, click one, or resize the window to see events appear here…
        </div>
        <div
          v-for="(event, index) in events"
          :key="index"
          class="event-log__row">
          {{ event }}
        </div>
      </div>
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 4, x: 0, y: 0 },
    { h: 2, i: '1', w: 4, x: 4, y: 0 },
    { h: 2, i: '2', w: 4, x: 8, y: 0 },
  ]);

  const events = ref<string[]>([]);
  const log = (message: string): void => {
    events.value.unshift(`${new Date().toLocaleTimeString()} — ${message}`);
    events.value.length = Math.min(events.value.length, 20);
  };

  const gridRef = ref<InstanceType<typeof GridLayout>>();
  const lastBreakpoint = ref<string | null>(null);

  // layout-ready fires once, after the container's width is known and
  // every item's size is stable — the first reliable point to read
  // exposed state like lastBreakpoint.
  function onLayoutReady(): void {
    log('layout-ready');
    lastBreakpoint.value = gridRef.value?.lastBreakpoint ?? null;
  }
</script>
