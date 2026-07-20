<template>
  <ExampleDemo title="Drag, drop from outside">
    <template #description>
      Drag the chip below into the grid to drop a new item where you
      release it. The grid sets <code>allowOutsideDrop</code> — the
      library's own built-in support for native HTML5 drag-and-drop from
      a source that isn't a grid item at all. Toggle
      <code>compactType</code> to compare: vertical (the default), a
      dropped item settles upward if there's a gap above where it
      landed; none, it stays exactly where you dropped it.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="verticalCompactEnabled"
        label="compactType (vertical vs none)" />
      <div
        class="droppable"
        draggable="true"
        @dragstart="onDragStart">
        ⠿ Drag me into the grid
      </div>
    </template>

    <GridLayout
      v-model:layout="layout"
      allow-outside-drop
      :compact-type="compactType"
      :outside-drop-height="2"
      :outside-drop-width="2"
      :row-height="60"
      @item-dropped-from-outside="onDropped">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :w="item.w"
        :x="item.x"
        :y="item.y">
        <div class="example-item example-item--c5">
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
  import { computed, ref } from 'vue';
  import { GridLayout, GridItem, ECompactType, type TLayout } from 'vue-ts-responsive-grid-layout';

  const verticalCompactEnabled = ref(true);
  const compactType = computed(() => (verticalCompactEnabled.value ? ECompactType.VERTICAL : ECompactType.NONE));

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 2, x: 0, y: 0 },
  ]);

  const onDragStart = (event: DragEvent): void => {
    event.dataTransfer?.setData('text/plain', 'dropped-widget');
    if(event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
  };

  const onDropped = (payload: { x: number; y: number; w: number; h: number }): void => {
    layout.value = [...layout.value, { h: payload.h, i: String(Date.now()), w: payload.w, x: payload.x, y: payload.y }];
  };
</script>

<style scoped>
.droppable {
  background: var(--vp-c-brand-soft);
  border: 1px dashed var(--vp-c-brand-1);
  border-radius: 8px;
  cursor: grab;
  font-size: 13px;
  padding: 6px 14px;
}
</style>
