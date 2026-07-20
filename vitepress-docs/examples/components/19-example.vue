<template>
  <ExampleDemo title="v-model &amp; save / load layout">
    <template #description>
      <code>layout</code> is a plain reactive array — persist it however
      you like. This example uses the library's own
      <code>useLayoutStorage</code> composable (backed by browser
      <code>localStorage</code> here, but it accepts any
      <code>Storage</code>-compatible backend), which handles stripping
      the internal <code>moved</code> field before saving and gracefully
      handling a missing/malformed stored value on load — the two things
      a hand-rolled <code>localStorage.setItem(key, JSON.stringify(layout))</code>
      has to account for manually.
    </template>
    <template #controls>
      <button
        class="example-button"
        type="button"
        @click="onSave">
        Save layout
      </button>
      <button
        class="example-button example-button--secondary"
        type="button"
        @click="onLoad">
        Load saved layout
      </button>
      <button
        class="example-button example-button--secondary"
        type="button"
        @click="reset">
        Reset to default
      </button>
    </template>

    <GridLayout
      v-model:layout="layout"
      :row-height="60">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :w="item.w"
        :x="item.x"
        :y="item.y">
        <div class="example-item">
          {{ item.i }}
        </div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <span v-if="status">{{ status }}</span>
      <span v-else>Drag or resize items, then click "Save layout".</span>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, useLayoutStorage, type TLayout } from 'vue-ts-responsive-grid-layout';

  const STORAGE_KEY = 'vue-grid-layout-docs-example-19';

  const defaultLayout = (): TLayout => [
    { h: 2, i: '0', w: 2, x: 0, y: 0 },
    { h: 2, i: '1', w: 2, x: 2, y: 0 },
    { h: 2, i: '2', w: 2, x: 4, y: 0 },
  ];

  const layout = ref<TLayout>(defaultLayout());
  const status = ref('');

  // autoLoad: false — this example wants an explicit "Load saved layout"
  // button rather than silently restoring on page load, so the default
  // (empty) layout above is what visitors see first.
  const { save, load, hasSaved } = useLayoutStorage(STORAGE_KEY, layout, { autoLoad: false });

  const onSave = (): void => {
    save();
    status.value = `Saved at ${new Date().toLocaleTimeString()}`;
  };

  const onLoad = (): void => {
    if(!hasSaved()) {
      status.value = 'No saved layout found yet — try "Save layout" first.';
      return;
    }
    load();
    status.value = 'Loaded saved layout.';
  };

  const reset = (): void => {
    layout.value = defaultLayout();
    status.value = 'Reset to default layout.';
  };
</script>
