<template>
  <h2>Responsive breakpoints</h2>
  <p class="demo-description">
    Drag the "simulated container width" slider to trigger breakpoint changes without resizing
    your actual browser window — useful for quickly testing every breakpoint in turn.
  </p>

  <div class="demo-controls">
    <span data-testid="current-breakpoint">Current breakpoint: {{ currentBreakpoint }}</span>
    <label>
      Simulated container width (px)
      <input
        v-model.number="containerWidth"
        data-testid="input-container-width"
        max="2000"
        min="200"
        step="10"
        type="range" />
      {{ containerWidth }}px
    </label>
    <label>
      cols.lg
      <input
        v-model.number="cols.lg"
        data-testid="input-cols-lg"
        min="1"
        step="1"
        type="number" />
    </label>
    <label>
      cols.md
      <input
        v-model.number="cols.md"
        data-testid="input-cols-md"
        min="1"
        step="1"
        type="number" />
    </label>
    <label>
      cols.sm
      <input
        v-model.number="cols.sm"
        data-testid="input-cols-sm"
        min="1"
        step="1"
        type="number" />
    </label>
  </div>

  <div
    class="demo-grid-wrap"
    :style="{ maxWidth: `${containerWidth}px` }">
    <GridLayout
      :cols="cols"
      data-testid="responsive-grid"
      :layout="layout"
      :responsive="true"
      :responsive-layouts="responsiveLayouts"
      :row-height="80"
      @breakpoint-changed="onBreakpointChanged">
      <template #default>
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :data-testid="`grid-item-${item.i}`"
          :h="item.h"
          :i="item.i"
          :w="item.w"
          :x="item.x"
          :y="item.y">
          <div class="demo-item">
            Item {{ item.i }}
          </div>
        </GridItem>
      </template>
    </GridLayout>
  </div>
</template>

<script lang="ts" setup>
  import { reactive, ref } from 'vue';
  import { GridItem, GridLayout } from '@/components';
  import type { TLayout } from '@/components';

  const layout = ref<TLayout>([
    { i: '0', x: 0, y: 0, w: 3, h: 2 },
    { i: '1', x: 3, y: 0, w: 3, h: 2 },
    { i: '2', x: 6, y: 0, w: 3, h: 2 },
    { i: '3', x: 9, y: 0, w: 3, h: 2 },
  ]);

  const responsiveLayouts: Record<string, TLayout> = {
    md: [
      { i: '0', x: 0, y: 0, w: 5, h: 2 },
      { i: '1', x: 5, y: 0, w: 5, h: 2 },
      { i: '2', x: 0, y: 2, w: 5, h: 2 },
      { i: '3', x: 5, y: 2, w: 5, h: 2 },
    ],
    sm: [
      { i: '0', x: 0, y: 0, w: 6, h: 2 },
      { i: '1', x: 0, y: 2, w: 6, h: 2 },
      { i: '2', x: 0, y: 4, w: 6, h: 2 },
      { i: '3', x: 0, y: 6, w: 6, h: 2 },
    ],
  };

  // Overridable per-breakpoint column counts, matching GridLayout's own
  // `cols` default shape — used as the demo's live-editable copy so the
  // number inputs above can mutate it directly.
  const cols = reactive({
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxl: 12,
    xxs: 2,
    xl: 12,
  });

  // GridLayout measures its *real* container width via ResizeObserver —
  // there's no prop to fake that. Capping the wrapping div's max-width via
  // this slider is what actually drives a breakpoint change here, letting
  // the whole panel work without touching the browser window's real size.
  // Defaults high enough (larger than any realistic viewport) to be a
  // no-op until the person actually drags the slider down — existing
  // coverage for the plain viewport-resize path (see
  // e2e/responsive.spec.ts, which resizes the real browser viewport up to
  // 1800px) depends on this not artificially capping the container by
  // default.
  const containerWidth = ref(2000);

  const currentBreakpoint = ref('lg');
  const onBreakpointChanged = (breakpoint: string): void => {
    currentBreakpoint.value = breakpoint;
  };
</script>
