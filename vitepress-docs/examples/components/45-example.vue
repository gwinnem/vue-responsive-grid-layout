<template>
  <ExampleDemo title="Switching layouts & forcing a remount">
    <template #description>
      Reassigning <code>layout</code> to a completely different array (a
      different "page" or "view" in your own app, say) reactively updates
      the same <code>GridLayout</code> instance — which means whatever
      internal state it's holding keeps existing too, even once it no
      longer refers to anything meaningful for the new layout.
      <code>multiSelect</code>'s own selection is <em>not</em> an example
      of this — it's automatically pruned to just the ids still present
      whenever the layout's length changes, so switching to an unrelated
      layout already clears it correctly on its own. <code>enableUndoRedo</code>'s
      history is a real example, though: it's a stack of full layout
      snapshots with no such pruning, so it stays populated and
      "answerable" (<code>canUndo</code> stays `true`) even after
      switching to a layout it has nothing to do with. Toggle
      <strong>Force remount on switch</strong> below to compare: off,
      drag an item in Layout A, then switch to Layout B —
      <code>canUndo</code> is still `true`, a stale answer about a
      layout that's no longer showing. On, switching layouts changes the
      <code>GridLayout</code>'s own <code>:key</code>, which tells Vue to
      fully destroy and recreate the component instance from scratch —
      the same pattern any Vue component uses to force a hard reset
      rather than a reactive prop update, not something specific to this
      library — and `canUndo` correctly resets to `false`.
    </template>
    <template #controls>
      <label><input
        v-model="forceRemount"
        type="checkbox" /> Force remount on switch</label>
      <button
        data-testid="switch-to-a"
        type="button"
        @click="switchTo('a')">
        Switch to Layout A
      </button>
      <button
        data-testid="switch-to-b"
        type="button"
        @click="switchTo('b')">
        Switch to Layout B
      </button>
    </template>

    <GridLayout
      :key="forceRemount ? gridKey : 'stable'"
      ref="gridRef"
      v-model:layout="layout"
      enable-undo-redo
      :row-height="70">
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
      <p data-testid="current-layout-name">
        Current layout: <strong>{{ currentLayoutName }}</strong>
      </p>
      <p data-testid="can-undo-feedback">
        canUndo: {{ gridRef?.canUndo ?? false }}
      </p>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layoutA: TLayout = [
    { h: 2, i: 'a0', w: 2, x: 0, y: 0 },
    { h: 2, i: 'a1', w: 2, x: 2, y: 0 },
    { h: 2, i: 'a2', w: 2, x: 4, y: 0 },
  ];

  // Deliberately the same length (3 items) as layoutA — GridLayout has
  // its own `watch(() => props.layout.length, ...)` that commits an
  // undo point whenever the length changes (see GridLayout.vue), which
  // would otherwise fire on every switch regardless of whether anything
  // was actually dragged, confounding this example's own demonstration
  // of canUndo staying stale specifically from Layout A's own drag.
  const layoutB: TLayout = [
    { h: 3, i: 'b0', w: 4, x: 0, y: 0 },
    { h: 3, i: 'b1', w: 4, x: 4, y: 0 },
    { h: 2, i: 'b2', w: 8, x: 0, y: 3 },
  ];

  const layout = ref<TLayout>(structuredClone(layoutA));
  const currentLayoutName = ref<'A' | 'B'>('A');
  const forceRemount = ref(false);
  const gridRef = ref<InstanceType<typeof GridLayout>>();

  // Only meaningful while forceRemount is on — changing this changes the
  // GridLayout's own :key above, which is what actually triggers Vue to
  // unmount and remount the component (a fresh instance, all internal
  // state reset) rather than just reactively updating props on the
  // existing one. Incrementing on every switch (not just toggling
  // true/false once) means switching back and forth between A and B
  // remounts every time, not just the first switch after enabling it.
  const gridKey = ref(0);

  function switchTo(target: 'a' | 'b'): void {
    layout.value = structuredClone(target === 'a' ? layoutA : layoutB);
    currentLayoutName.value = target === 'a' ? 'A' : 'B';
    gridKey.value += 1;
  }
</script>
