<template>
  <ExampleDemo title="Custom drag handle &amp; close button">
    <template #description>
      Swap the default close button for the library's exported
      <code>CustomCloseButton</code>, and add <code>CustomDragElement</code>
      as a dedicated drag handle.
    </template>

    <GridLayout
      v-model:layout="layout"
      :row-height="70">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        drag-allow-from=".drag-handle-slot"
        :h="item.h"
        :i="item.i"
        resize-ignore-from=".drag-handle-slot"
        :show-close-button="false"
        :w="item.w"
        :x="item.x"
        :y="item.y">
        <div class="example-item example-item--c2">
          <CustomDragElement
            class="drag-handle-slot"
            text="⠿" />
          {{ item.i }}
          <CustomCloseButton
            :i="item.i"
            @remove-grid-item="removeItem" />
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
  import { GridLayout, GridItem, CustomCloseButton, CustomDragElement, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: '0', w: 3, x: 0, y: 0 },
    { h: 2, i: '1', w: 3, x: 3, y: 0 },
  ]);

  const removeItem = (id: string | number): void => {
    layout.value = layout.value.filter(item => item.i !== id);
  };
</script>

<style scoped>
/*
 * Positioned at 14px, not flush against the corner (8px, the original
 * value here) — the resize-hint spans are real, positioned DOM elements
 * (not a margin-based proximity zone the way interact.js used to work),
 * so a handle placed too close to a corner can visually and physically
 * overlap one of them, with both elements competing for the same
 * pointerdown. `resizeIgnoreFrom` excludes this element by DOM target
 * for the *resize* engine specifically, but doesn't change either
 * element's own layout — moving the handle just outside the resize
 * hint's own footprint sidesteps the overlap entirely, which is more
 * reliable than depending on ignoreFrom alone once two absolutely-
 * positioned elements are stacked in the same corner. See
 * docs/REFACTORING.md #64.
 */
.drag-handle-slot {
  left: 14px;
  position: absolute;
  top: 14px;
}
</style>
