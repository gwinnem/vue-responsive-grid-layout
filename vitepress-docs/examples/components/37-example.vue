<template>
  <ExampleDemo title="Multi-select & group move/resize">
    <template #description>
      <code>multiSelect</code> — click an item to select only it, Shift or
      Ctrl/Cmd+click to add to the selection, click empty background to
      clear it. Dragging or resizing any <em>selected</em> item while more
      than one is selected moves/resizes every other selected item by the
      same delta — works from the keyboard too (arrow keys/Shift+arrow on
      a selected item, not just mouse/touch drag). Item "d" is static —
      select it alongside the others and drag one of them: "d" never
      moves, and never resizes past its own <code>maxW</code> either. Also
      demonstrates the <code>#resize-handle</code> slot — a custom icon
      per edge/corner, instead of only a color/visibility toggle.
    </template>
    <template #controls>
      <span class="demo-description">Selected: {{ gridRef?.selectedItems?.join(', ') || 'none' }}</span>
      <span class="demo-description">Try it: select two items, then Tab to one and press an arrow key — the other moves too.</span>
    </template>

    <GridLayout ref="gridRef" v-model:layout="layout" multi-select :row-height="80" :compact-type="ECompactType.NONE">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :is-static="item.i === 'd'" :max-w="item.i === 'd' ? 3 : undefined" show-resize-handles :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">{{ item.i }}{{ item.i === 'd' ? ' (static)' : '' }}</div>
        <template #resize-handle="{ edge }">
          <span class="resize-dot" :title="edge">⤡</span>
        </template>
      </GridItem>
    </GridLayout>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, ECompactType, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: 'a', w: 3, x: 0, y: 0 },
  { h: 2, i: 'b', w: 3, x: 3, y: 0 },
  { h: 2, i: 'c', w: 3, x: 6, y: 0 },
  { h: 2, i: 'd', w: 3, x: 0, y: 2 },
]);

const gridRef = ref<InstanceType<typeof GridLayout>>();
</script>

<style scoped>
.resize-dot {
  color: var(--color-primary);
  font-size: 12px;
  pointer-events: none;
  user-select: none;
}
</style>
