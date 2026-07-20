<template>
  <ExampleDemo title="Drag, drop from outside into multiple grids">
    <template #description>
      Drag a widget from the palette below into either grid. Both grids
      set <code>allowOutsideDrop</code> — the library's own built-in
      support for native HTML5 drag-and-drop from a source that isn't a
      grid item at all. The library handles the live preview and resolves
      the drop position on its own; what to actually add to
      <code>layout</code> is entirely up to the
      <code>@item-dropped-from-outside</code> handler, since the library
      has no way to know what a plain draggable element represents —
      that's what <code>dataTransfer</code> is for, the same mechanism
      any native drag-and-drop uses to carry data from source to target.
      Both grids also set <code>allowCrossGridDrag</code>, a separate,
      independent mechanism — so an item already placed in one grid can
      be dragged into the other too, not just new items from the palette.
      Grid 2 keeps a minimum height so it stays a usable drop target
      while still empty.
    </template>
    <template #controls>
      <div
        v-for="widget in widgets"
        :key="widget.label"
        class="droppable"
        draggable="true"
        @dragstart="onDragStart($event, widget.label)"
      >
        ⠿ {{ widget.label }}
      </div>
    </template>

    <div class="grids">
      <div>
        <p class="grid-label">Grid 1</p>
        <GridLayout
          v-model:layout="leftLayout"
          allow-outside-drop
          allow-cross-grid-drag
          layout-id="example-23-left"
          :outside-drop-width="2"
          :outside-drop-height="2"
          :row-height="60"
          :col-num="6"
          @item-dropped-from-outside="onDropped('left', $event)"
        >
          <GridItem v-for="item in leftLayout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c5">{{ item.label ?? item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
      <div>
        <p class="grid-label">Grid 2</p>
        <GridLayout
          v-model:layout="rightLayout"
          allow-outside-drop
          allow-cross-grid-drag
          layout-id="example-23-right"
          :outside-drop-width="2"
          :outside-drop-height="2"
          :row-height="60"
          :col-num="6"
          @item-dropped-from-outside="onDropped('right', $event)"
        >
          <GridItem v-for="item in rightLayout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
            <div class="example-item example-item--c1">{{ item.label ?? item.i }}</div>
          </GridItem>
        </GridLayout>
      </div>
    </div>

    <template #footer>
      <LayoutJsonViewer label="Grid 1" :layout="leftLayout" />
      <LayoutJsonViewer label="Grid 2" :layout="rightLayout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const widgets = [{ label: 'A' }, { label: 'B' }];

type DroppableLayout = (TLayout[number] & { label?: string })[];
const leftLayout = ref<DroppableLayout>([{ h: 2, i: 'left-0', w: 2, x: 0, y: 0 }]);
const rightLayout = ref<DroppableLayout>([]);

const onDragStart = (event: DragEvent, label: string): void => {
  event.dataTransfer?.setData('text/plain', label);
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
};

interface OutsideDropPayload {
  x: number;
  y: number;
  w: number;
  h: number;
  dataTransfer: DataTransfer | null;
}

const onDropped = (gridId: 'left' | 'right', payload: OutsideDropPayload): void => {
  const label = payload.dataTransfer?.getData('text/plain') || 'New';
  const target = gridId === 'left' ? leftLayout : rightLayout;
  target.value = [
    ...target.value,
    { h: payload.h, i: String(Date.now()), label, w: payload.w, x: payload.x, y: payload.y },
  ];
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

.grids {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr 1fr;
}

.grids .vue-grid-layout {
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
