<template>
  <ExampleDemo title="Configurable transition duration &amp; easing">
    <template #description>
      <code>transitionDurationMs</code>/<code>transitionTimingFunction</code>
      control the CSS transition applied to item position/size changes and
      this grid's own auto-height resizing — applied via inherited CSS
      custom properties, not per-item props, so setting them once here
      affects every item underneath. Drag or resize an item to see the
      current settings in effect — <strong>Reset layout</strong> restores
      the original arrangement afterward, so comparing different
      durations/easings doesn't require reloading the whole page to get
      back to a consistent starting point.
    </template>
    <template #controls>
      <ExampleNumberField v-model="transitionDurationMs" label="transitionDurationMs" :min="0" :max="2000" :step="50" />
      <label class="timing-select">
        <span>transitionTimingFunction</span>
        <select v-model="transitionTimingFunction">
          <option value="ease">ease</option>
          <option value="ease-in">ease-in</option>
          <option value="ease-out">ease-out</option>
          <option value="linear">linear</option>
          <option value="cubic-bezier(0.68, -0.55, 0.27, 1.55)">cubic-bezier (overshoot)</option>
        </select>
      </label>
      <button class="example-button example-button--secondary" type="button" @click="resetLayout">Reset layout</button>
    </template>

    <GridLayout
      v-model:layout="layout"
      :transition-duration-ms="transitionDurationMs"
      :transition-timing-function="transitionTimingFunction"
      :row-height="60"
    >
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">{{ item.i }}</div>
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

// Bug fix: this example had no way to get back to a consistent
// starting arrangement after dragging/resizing an item to compare
// settings — the only option was reloading the whole page. Kept as its
// own constant (not read back out of `layout` itself) so resetting
// always restores the exact original positions, not whatever the
// layout happened to compact into after some interaction. Reported as
// "transition duration/easing — needs reload button."
const INITIAL_LAYOUT: TLayout = [
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
  { h: 2, i: '2', w: 2, x: 4, y: 0 },
];

const layout = ref<TLayout>(INITIAL_LAYOUT.map(item => ({ ...item })));

const transitionDurationMs = ref(200);
const transitionTimingFunction = ref('ease');

const resetLayout = (): void => {
  layout.value = INITIAL_LAYOUT.map(item => ({ ...item }));
};
</script>

<style scoped>
.timing-select {
  align-items: center;
  color: var(--vp-c-text-1);
  display: inline-flex;
  font-size: 13px;
  gap: 8px;
}

.timing-select select {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  padding: 3px 8px;
}

.timing-select select:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
</style>
