<template>
  <h2>Drag &amp; drop from outside (multiple grids)</h2>
  <p class="demo-description">
    Drag a widget from the palette below into either grid. Both grids set
    <code>allowOutsideDrop</code> — the library's own built-in support for
    native HTML5 drag-and-drop from a source that isn't a grid item at all.
    The library shows the live placeholder and resolves the drop position
    for you; what to actually add to <code>layout</code> is up to the
    <code>@item-dropped-from-outside</code> handler below, since the
    library has no way to know what a plain draggable element represents.
    Both grids also set <code>allowCrossGridDrag</code>, so an existing
    item already in one of the grids can be dragged into the other one
    too — a separate, independent mechanism from the outside-drop palette
    above it. <code>outsideDropAccept</code> rejects the "Incompatible"
    widget below before the placeholder even appears (it doesn't set the
    expected payload type); <code>readOutsideDropPayload</code> parses
    the accepted ones' JSON without hand-rolled
    <code>getData</code>/<code>JSON.parse</code>. Toggle
    <code>compactType</code> below to compare: vertical (the default), a
    dropped item settles upward if there's a gap above where it landed;
    none, it stays exactly where you dropped it.
  </p>

  <div class="demo-controls">
    <label>
      <input
        v-model="verticalCompactEnabled"
        data-testid="toggle-vertical-compact"
        type="checkbox" /> compactType (vertical vs none)
    </label>
    <div
      v-for="widget in widgets"
      :key="widget.label"
      class="demo-droppable"
      :data-testid="`drop-widget-${widget.label.toLowerCase()}`"
      draggable="true"
      @dragstart="onDragStart($event, widget.label)">
      ⠿ {{ widget.label }}
    </div>
    <div
      class="demo-droppable"
      data-testid="drop-widget-incompatible"
      draggable="true"
      style="background: var(--color-text-muted)"
      @dragstart="onIncompatibleDragStart">
      ⠿ Incompatible
    </div>
    <button
      data-testid="reset-grids"
      type="button"
      @click="resetGrids">
      Reset
    </button>
  </div>

  <div
    class="demo-cross-grids"
    data-testid="external-drop-view-wrap">
    <div class="demo-grid-wrap">
      <p class="demo-grid-label">
        Grid 1
      </p>
      <GridLayout
        v-model:layout="leftLayout"
        allow-cross-grid-drag
        allow-outside-drop
        :compact-type="compactType"
        data-testid="drop-grid-left"
        layout-id="external-drop-left"
        :outside-drop-accept="acceptOnlyDemoWidgets"
        :outside-drop-height="2"
        :outside-drop-width="2"
        :row-height="60"
        @item-dropped-from-outside="onDropped('left', $event)">
        <GridItem
          v-for="item in leftLayout"
          :key="item.i"
          :data-testid="`grid-item-${item.i}`"
          :h="item.h"
          :i="item.i"
          :w="item.w"
          :x="item.x"
          :y="item.y">
          <div class="demo-item">
            {{ item.label ?? item.i }}
          </div>
        </GridItem>
      </GridLayout>
    </div>
    <div class="demo-grid-wrap">
      <p class="demo-grid-label">
        Grid 2
      </p>
      <GridLayout
        v-model:layout="rightLayout"
        allow-cross-grid-drag
        allow-outside-drop
        :compact-type="compactType"
        data-testid="drop-grid-right"
        layout-id="external-drop-right"
        :outside-drop-accept="acceptOnlyDemoWidgets"
        :outside-drop-height="2"
        :outside-drop-width="2"
        :row-height="60"
        @item-dropped-from-outside="onDropped('right', $event)">
        <GridItem
          v-for="item in rightLayout"
          :key="item.i"
          :data-testid="`grid-item-${item.i}`"
          :h="item.h"
          :i="item.i"
          :w="item.w"
          :x="item.x"
          :y="item.y">
          <div class="demo-item">
            {{ item.label ?? item.i }}
          </div>
        </GridItem>
      </GridLayout>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { ECompactType, GridItem, GridLayout, readOutsideDropPayload } from '@/components';
  import type { TLayout } from '@/components';

  const MIME_TYPE = `application/x-demo-widget`;

  // Kept as a simple checkbox (rather than a full compactType select, as
  // DragResizeView's own demo now uses) specifically because this
  // example's own point is the vertical-vs-none comparison for
  // outside-dropped items — a two-state toggle matches that framing more
  // directly than a 5-option dropdown would.
  const verticalCompactEnabled = ref(true);
  const compactType = computed(() => (verticalCompactEnabled.value ? ECompactType.VERTICAL : ECompactType.NONE));
  const widgets = [{ label: 'A' }, { label: 'B' }];

  type TDroppableLayout = (TLayout[number] & { label?: string })[];
  const leftLayout = ref<TDroppableLayout>([{ h: 2, i: 'left-0', w: 2, x: 0, y: 0 }]);
  const rightLayout = ref<TDroppableLayout>([]);

  /**
   * `allowOutsideDrop` only tells the library "show a live preview here,
   * and tell me the resolved position on drop" — it doesn't (and can't)
   * know what a dropped element represents. That's what
   * `dataTransfer.setData(...)` here and `readOutsideDropPayload` in
   * onDropped are for: the same mechanism any native HTML5 drag-and-drop
   * uses to carry data between a drag source and its drop target.
   */
  const onDragStart = (event: DragEvent, label: string): void => {
    event.dataTransfer?.setData(MIME_TYPE, JSON.stringify({ label }));
    if(event.dataTransfer) {
      event.dataTransfer.effectAllowed = `copy`;
    }
  };

  /** Doesn't set MIME_TYPE at all — outsideDropAccept below checks dataTransfer.types, which won't include it for this one. */
  const onIncompatibleDragStart = (event: DragEvent): void => {
    event.dataTransfer?.setData(`text/plain`, `incompatible`);
  };

  /** Checked in dragenter/dragover/drop, before the placeholder appears at all — dataTransfer.types is available throughout a drag, unlike getData()'s actual values (only readable at drop). */
  const acceptOnlyDemoWidgets = (dataTransfer: DataTransfer | null): boolean =>
    !!dataTransfer?.types.includes(MIME_TYPE);

  interface IOutsideDropPayload {
    x: number;
    y: number;
    w: number;
    h: number;
    dataTransfer: DataTransfer | null;
  }

  const onDropped = (gridId: 'left' | 'right', payload: IOutsideDropPayload): void => {
    const data = readOutsideDropPayload<{ label: string }>(payload.dataTransfer, MIME_TYPE);
    const target = gridId === `left` ? leftLayout : rightLayout;
    target.value = [
      ...target.value,
      { h: payload.h, i: String(Date.now()), label: data?.label ?? `New`, w: payload.w, x: payload.x, y: payload.y },
    ];
  };

  const resetGrids = (): void => {
    leftLayout.value = [{ h: 2, i: 'left-0', w: 2, x: 0, y: 0 }];
    rightLayout.value = [];
  };
</script>
