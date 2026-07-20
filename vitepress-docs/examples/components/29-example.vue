<template>
  <ExampleDemo title="compactNow, rearrange & duplicateItem">
    <template #description>
      <code>gridRef.compactNow()</code>/<code>rearrange()</code> (an
      alias for the same thing) re-run compaction on demand — the exact
      sequence that already runs automatically after drag/resize/add/
      remove, exposed for a "Tidy up" button or after a bulk
      programmatic layout edit. <code>gridRef.duplicateItem(id)</code>
      clones an item with a collision-safe id, placed directly below
      the source.
    </template>
    <template #controls>
      <button
        class="example-button"
        type="button"
        @click="scatter">
        Scatter items (leaves gaps)
      </button>
      <button
        class="example-button"
        type="button"
        @click="gridRef?.compactNow()">
        Tidy up (compactNow)
      </button>
      <button
        class="example-button example-button--secondary"
        type="button"
        @click="gridRef?.duplicateItem('a')">
        Duplicate item "a"
      </button>
    </template>

    <GridLayout
      ref="gridRef"
      v-model:layout="layout"
      :compact-type="ECompactType.NONE"
      :row-height="80"
      show-close-button>
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :w="item.w"
        :x="item.x"
        :y="item.y"
        @remove-grid-item="removeItem">
        <div class="example-item">
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
  import { ref } from 'vue';
  import { GridLayout, GridItem, ECompactType, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: 'a', w: 2, x: 0, y: 0 },
    { h: 2, i: 'b', w: 2, x: 2, y: 0 },
    { h: 2, i: 'c', w: 2, x: 4, y: 0 },
  ]);

  const gridRef = ref<InstanceType<typeof GridLayout>>();

  function scatter(): void {
    layout.value = layout.value.map((item, index) => ({ ...item, y: index * 5 }));
  }

  function removeItem(id: string | number): void {
    layout.value = layout.value.filter(item => item.i !== id);
  }
</script>
