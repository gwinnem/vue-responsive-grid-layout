<template>
  <ExampleDemo title="Edit mode toggle (view-only dashboard)">
    <template #description>
      <code>enableEditMode</code> is a single master switch — turn it off
      and dragging, resizing, and the close button are all disabled at
      once, without touching <code>isDraggable</code>/<code>isResizable</code>
      individually. Unlike <a href="/examples/17-example">static items</a>,
      this is meant to be toggled at runtime (a "done editing" button, a
      viewer-vs-editor permission check), not set once per item.
    </template>
    <template #controls>
      <ExampleToggle v-model="editMode" label="Edit mode" />
    </template>

    <GridLayout v-model:layout="layout" :enable-edit-mode="editMode" :row-height="60" :show-close-button="editMode">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w"
        :x="item.x" :y="item.y" @remove-grid-item="removeItem">
        <div class="example-item" :class="{ 'example-item--static': !editMode }">
          {{ item.label }}
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

const editMode = ref(false);

const layout = ref<(TLayout[number] & { label: string })[]>([
  { h: 1, i: '0', label: 'Revenue', w: 4, x: 0, y: 0 },
  { h: 1, i: '1', label: 'Active users', w: 4, x: 4, y: 0 },
  { h: 1, i: '2', label: 'Signups', w: 4, x: 8, y: 0 },
  { h: 3, i: '3', label: 'Traffic over time', w: 8, x: 0, y: 1 },
  { h: 3, i: '4', label: 'Top referrers', w: 4, x: 8, y: 1 },
]);

// Bug fix: this example rendered a fully-working, clickable close
// button once `editMode` was on (`showCloseButton && enableEditMode &&
// !isStatic`, all satisfied) — but nothing was listening for
// `@remove-grid-item` at all, so clicking it silently did nothing.
// Confirmed directly: the click handler fired every time (verified via
// temporary logging), correctly gated on edit mode being on, but the
// item was never actually removed from `layout`, since there was no
// listener to do that removal. Reported as "edit mode toggle — delete
// button test."
const removeItem = (id: string | number): void => {
  layout.value = layout.value.filter(item => item.i !== id);
};
</script>
