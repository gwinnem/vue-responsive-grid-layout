<template>
  <ExampleDemo title="Configurable resize-hint appearance">
    <template #description>
      The eight per-edge resize hints are cursor-only by default —
      discoverable only by hovering. <code>showResizeHandles</code>
      (grid-level default, per-item override) renders a visible
      affordance instead, colored via <code>resizeHandleColor</code>.
      The color picker below only affects the first item ("grid
      default") — the other two set their own <code>resizeHandleColor</code>/
      <code>showResizeHandles</code> directly on the item, which takes
      precedence over the grid-level default by design, the same
      inherit pattern <code>isDraggable</code>/<code>isResizable</code>
      already use.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="showResizeHandles"
        label="showResizeHandles (grid default)" />
      <label class="example-controls-label">
        resizeHandleColor:
        <input
          v-model="resizeHandleColor"
          type="color" />
      </label>
    </template>

    <GridLayout
      v-model:layout="layout"
      :resize-handle-color="resizeHandleColor"
      :row-height="100"
      :show-resize-handles="showResizeHandles">
      <GridItem
        :h="layout[0].h"
        :i="layout[0].i"
        :w="layout[0].w"
        :x="layout[0].x"
        :y="layout[0].y">
        <div class="example-item">
          grid default
        </div>
      </GridItem>
      <GridItem
        :h="layout[1].h"
        :i="layout[1].i"
        resize-handle-color="crimson"
        show-resize-handles
        :w="layout[1].w"
        :x="layout[1].x"
        :y="layout[1].y">
        <div class="example-item">
          own override (always visible, crimson)
        </div>
      </GridItem>
      <GridItem
        :h="layout[2].h"
        :i="layout[2].i"
        :show-resize-handles="false"
        :w="layout[2].w"
        :x="layout[2].x"
        :y="layout[2].y">
        <div class="example-item">
          own override (always hidden)
        </div>
      </GridItem>
    </GridLayout>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: 'a', w: 4, x: 0, y: 0 },
    { h: 2, i: 'b', w: 4, x: 4, y: 0 },
    { h: 2, i: 'c', w: 4, x: 8, y: 0 },
  ]);

  const showResizeHandles = ref(true);
  const resizeHandleColor = ref('#5e5e5e');
</script>
