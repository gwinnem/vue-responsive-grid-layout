<template>
  <ExampleDemo title="Export layout as SVG">
    <template #description>
      <code>exportLayoutAsSvg(layout, options?)</code> — a
      dependency-free grid-to-SVG export. Draws each item as a labeled
      rectangle from the layout data alone (no rasterization dependency,
      but it won't capture custom slot content's actual rendered
      appearance — a chart inside a real <code>GridItem</code>, for
      instance, wouldn't show up in the exported SVG the way a true
      screenshot would).
    </template>
    <template #controls>
      <button class="example-button" type="button" @click="showExport = !showExport">
        {{ showExport ? 'Hide' : 'Show' }} exported SVG
      </button>
    </template>

    <GridLayout v-model:layout="layout" :row-height="80">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">{{ item.i }}</div>
      </GridItem>
    </GridLayout>

    <template v-if="showExport" #footer>
      <p class="demo-description">Exported SVG (rendered below, and available as a data URL for download):</p>
      <div class="svg-preview" v-html="exportedSvg"></div>
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { GridLayout, GridItem, exportLayoutAsSvg, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: 'a', w: 3, x: 0, y: 0 },
  { h: 2, i: 'b', w: 3, x: 3, y: 0 },
  { h: 2, i: 'c', w: 6, x: 0, y: 2 },
]);

const showExport = ref(false);

const exportedSvg = computed(() =>
  exportLayoutAsSvg(layout.value, {
    backgroundColor: '#f8fafc',
    containerWidth: 700,
    rowHeight: 80,
  }),
);
</script>

<style scoped>
.svg-preview {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: hidden;
}

.svg-preview :deep(svg) {
  display: block;
  max-width: 100%;
}
</style>
