<template>
  <ExampleDemo title="Pluggable compaction (compactType & compactor)">
    <template #description>
      <code>compactType</code> selects one of five built-in compaction
      strategies (see <code>ECompactType</code>) — <code>VERTICAL</code>
      (the default) floats items upward, <code>HORIZONTAL</code> floats
      them leftward, <code>NONE</code> leaves them exactly where placed,
      and the two <code>*_OVERLAP</code> variants move every item
      straight to `0` on their own axis unconditionally, ignoring
      collisions entirely. <code>compactor</code> goes further, replacing
      the compaction algorithm entirely — `null` (the default) falls back
      to whichever built-in strategy `compactType` selects. This demo's
      own custom compactor settles items toward the *bottom* of the grid
      instead of floating them up, using nothing but the `ICompactor`
      interface and the `collides` function this package already exports.
      Note: <code>HORIZONTAL</code> only ever adjusts <code>x</code> —
      it won't undo a vertical bump from a live drag collision. See
      <a href="/examples/15-example">Horizontal shift</a> for the
      separate <code>horizontalShift</code> prop that controls that.
    </template>
    <template #controls>
      <label>
        compactType
        <select v-model="compactType" :disabled="useCustomCompactor">
          <option :value="ECompactType.VERTICAL">Vertical</option>
          <option :value="ECompactType.HORIZONTAL">Horizontal</option>
          <option :value="ECompactType.NONE">None</option>
          <option :value="ECompactType.VERTICAL_OVERLAP">Vertical (overlap)</option>
          <option :value="ECompactType.HORIZONTAL_OVERLAP">Horizontal (overlap)</option>
        </select>
      </label>
      <label><input v-model="useCustomCompactor" type="checkbox" /> Use custom compactor instead (settles downward)</label>
    </template>

    <GridLayout
      ref="gridRef"
      v-model:layout="layout"
      :compact-type="compactType"
      :compactor="useCustomCompactor ? downwardCompactor : null"
      :row-height="60"
    >
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">{{ item.i }}</div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <p>
        <button data-testid="compactor-tidy-up" type="button" @click="gridRef?.compactNow()">Tidy up (compactNow)</button>
      </p>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, ECompactType, type TLayout, type ICompactor } from 'vue-ts-responsive-grid-layout';
import { collides } from 'vue-ts-responsive-grid-layout/core';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 3 },
  { h: 2, i: '2', w: 2, x: 4, y: 1 },
]);

const gridRef = ref<InstanceType<typeof GridLayout>>();
const compactType = ref(ECompactType.VERTICAL);
const useCustomCompactor = ref(false);

// Bottom-most items are processed first (via the descending sort), so
// each one claims its own lowest possible spot before anything above
// it does — otherwise an item higher up could "steal" the very bottom
// row before a lower item gets a chance to settle there itself.
const downwardCompactor: ICompactor = {
  compact(layoutToCompact) {
    // Bug fix: this was `20` — far more headroom than this demo's own
    // 3 small items need, and since compaction re-runs on every drag
    // end (not just an explicit "tidy up"), every drag pushed items
    // toward y:20, ballooning the grid container's own height to ~20
    // rows tall and leaving the items scrolled out of view below the
    // visible demo area. `8` is enough room to see items settle toward
    // the bottom without that runaway growth.
    const maxY = 8;
    const placed: TLayout = [];
    const sorted = [...layoutToCompact].sort((a, b) => b.y - a.y);
    for (const item of sorted) {
      const moved = { ...item };
      if (!moved.isStatic) {
        while (moved.y + moved.h <= maxY && !placed.some((other) => collides({ ...moved, y: moved.y + 1 }, other))) {
          moved.y++;
        }
      }
      placed.push(moved);
    }
    return layoutToCompact.map((item) => placed.find((entry) => entry.i === item.i) ?? item);
  },
  type: `downward`,
};
</script>
