<template>
  <ExampleDemo title="Border radius">
    <template #description>
      <code>useBorderRadius</code> plus <code>borderRadiusPx</code> round
      every item's corners.
    </template>
    <template #controls>
      <ExampleToggle v-model="useBorderRadius" label="useBorderRadius" />
      <ExampleNumberField v-model="borderRadiusPx" label="borderRadiusPx" :min="0" :max="40" :step="1" />
    </template>

    <GridLayout v-model:layout="layout" :row-height="60">
      <GridItem v-for="item in layout" :key="item.i" :border-radius-px="borderRadiusPx" :h="item.h" :i="item.i"
        :use-border-radius="useBorderRadius" :w="item.w" :x="item.x" :y="item.y">
        <!--
          .example-item (shared across every example) has its own fixed
          10px border-radius, filling 100% of GridItem's box — it would
          otherwise completely mask useBorderRadius/borderRadiusPx's
          effect on the outer element regardless of what those props are
          set to, making this control look broken even though the
          library itself applies it correctly (verified directly:
          GridItem's own borderRadiusStyle computed reacts fine on its
          own). Overriding it here with the *same* bound values is what
          actually makes the control visibly do something.
        -->
        <div class="example-item" :style="{ borderRadius: useBorderRadius ? `${borderRadiusPx}px` : 0 }">
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
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const useBorderRadius = ref(true);
const borderRadiusPx = ref(16);

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 3, x: 0, y: 0 },
  { h: 2, i: '1', w: 3, x: 3, y: 0 },
  { h: 2, i: '2', w: 3, x: 6, y: 0 },
]);
</script>
