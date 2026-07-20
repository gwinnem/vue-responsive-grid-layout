<template>
  <ExampleDemo title="outsideDropAccept & readOutsideDropPayload">
    <template #description>
      <code>outsideDropAccept</code> rejects incompatible drags before
      the placeholder even appears — try dragging the "wrong" widget
      below (a plain <code>draggable</code> element without the
      expected payload type) versus the "right" one.
      <code>readOutsideDropPayload</code> then parses the accepted
      drop's JSON payload without hand-rolled <code>getData</code>/
      <code>JSON.parse</code>.
    </template>
    <template #controls>
      <span
        class="demo-droppable"
        draggable="true"
        @dragstart="onDragStart($event, true)">Compatible widget</span>
      <span
        class="demo-droppable"
        draggable="true"
        style="background: var(--color-text-muted)"
        @dragstart="onDragStart($event, false)">Incompatible widget</span>
    </template>

    <GridLayout
      v-model:layout="layout"
      allow-outside-drop
      :outside-drop-accept="acceptOnlyOurWidgets"
      :row-height="80"
      @item-dropped-from-outside="onDropped">
      <GridItem
        v-for="item in layout"
        :key="item.i"
        :h="item.h"
        :i="item.i"
        :w="item.w"
        :x="item.x"
        :y="item.y">
        <div class="example-item">
          {{ item.label }}
        </div>
      </GridItem>
    </GridLayout>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { ref } from 'vue';
  import { GridLayout, GridItem, readOutsideDropPayload, type TLayout } from 'vue-ts-responsive-grid-layout';

  const MIME_TYPE = 'application/x-example-widget';

  const layout = ref<(TLayout[number] & { label: string })[]>([]);

  function onDragStart(event: DragEvent, compatible: boolean): void {
    if(compatible) {
      event.dataTransfer?.setData(MIME_TYPE, JSON.stringify({ label: 'Dropped widget' }));
    } else {
      // No MIME_TYPE data set at all — outsideDropAccept below checks
      // dataTransfer.types, which won't include MIME_TYPE for this one.
      event.dataTransfer?.setData('text/plain', 'incompatible');
    }
  }

  function acceptOnlyOurWidgets(dataTransfer: DataTransfer | null): boolean {
    return !!dataTransfer?.types.includes(MIME_TYPE);
  }

  function onDropped(payload: { x: number; y: number; w: number; h: number; dataTransfer: DataTransfer | null }): void {
    const data = readOutsideDropPayload<{ label: string }>(payload.dataTransfer, MIME_TYPE);
    layout.value = [
      ...layout.value,
      { h: payload.h, i: String(Date.now()), label: data?.label ?? 'widget', w: payload.w, x: payload.x, y: payload.y },
    ];
  }
</script>

<style scoped>
/*
 * Bug fix: this grid starts completely empty and had no min-height of
 * its own — an empty GridLayout's real height collapses to almost
 * nothing (confirmed directly: ~10px), which makes it a drop target
 * a person can easily miss entirely, especially right after page load
 * before knowing exactly where the (barely visible) grid boundary is.
 * Reported directly as "compatible widget is not added when dropped" —
 * confirmed the drop mechanism itself works correctly; the actual
 * issue was the target being too small to reliably hit. Examples 12
 * and 23 already set this same min-height for the identical reason
 * (see their own descriptions) — this one was simply missing it.
 */
.vue-grid-layout {
  min-height: 140px;
}
</style>
