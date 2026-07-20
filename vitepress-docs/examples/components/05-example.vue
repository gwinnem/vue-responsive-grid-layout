<template>
  <ExampleDemo title="Drag allow / ignore elements">
    <template #description>
      The first item can only be dragged from its handle
      (<code>dragAllowFrom</code>). The second can be dragged from
      anywhere <em>except</em> its button (<code>dragIgnoreFrom</code>).
    </template>

    <GridLayout v-model:layout="layout" :row-height="70">
      <GridItem :h="layout[0].h" :i="layout[0].i" :w="layout[0].w" :x="layout[0].x" :y="layout[0].y"
        drag-allow-from=".drag-handle">
        <div class="example-item example-item--c2">
          <span class="drag-handle">⠿ Drag handle</span>
        </div>
      </GridItem>
      <GridItem :h="layout[1].h" :i="layout[1].i" :w="layout[1].w" :x="layout[1].x" :y="layout[1].y"
        drag-ignore-from=".no-drag">
        <div class="example-item example-item--c3">
          <button class="no-drag example-button example-button--secondary" type="button" @click.stop>
            Click me (won't drag)
          </button>
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
  { h: 2, i: 'handle', w: 4, x: 0, y: 0 },
  { h: 2, i: 'ignore', w: 4, x: 4, y: 0 },
]);
</script>

<style scoped>
.drag-handle {
  background: rgb(0 0 0 / 20%);
  border-radius: 6px;
  cursor: grab;
  font-size: 13px;
  padding: 4px 10px;
}
</style>
