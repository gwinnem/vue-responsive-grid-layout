<template>
  <ExampleDemo title="Events">
    <template #description>
      Drag or resize an item and watch the event log below fill up in real
      time.
    </template>

    <GridLayout v-model:layout="layout" :row-height="60" @breakpoint-changed="log('breakpoint-changed')"
      @update:layout="log('update:layout')">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y"
        @item-move="log(`moving: ${item.i} -> (${item.x},${item.y})`)"
        @item-moved="log(`moved: ${item.i} -> (${item.x},${item.y})`)"
        @resized="log(`resized: ${item.i} -> ${item.w}x${item.h}`)">
        <div class="example-item">{{ item.i }}</div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <div class="event-log">
        <div v-if="events.length === 0" class="event-log__empty">Drag or resize an item to see events appear here…</div>
        <div v-for="(event, index) in events" :key="index" class="event-log__row">{{ event }}</div>
      </div>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 3, x: 0, y: 0 },
  { h: 2, i: '1', w: 3, x: 3, y: 0 },
  { h: 2, i: '2', w: 3, x: 6, y: 0 },
]);

const events = ref<string[]>([]);
const log = (message: string): void => {
  events.value.unshift(`${new Date().toLocaleTimeString()} — ${message}`);
  if (events.value.length > 8) {
    events.value.length = 8;
  }
};
</script>

<style scoped>
.event-log {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
}

.event-log__empty {
  color: var(--vp-c-text-3);
  font-style: italic;
}

.event-log__row {
  color: var(--vp-c-text-2);
  padding: 2px 0;
}
</style>
