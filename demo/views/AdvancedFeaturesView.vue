<template>
  <h2>Layout tools & feedback</h2>
  <p class="demo-description">
    <code>compactNow()</code>/<code>rearrange()</code>,
    <code>duplicateItem(id)</code>, blocked-move feedback
    (<code>@move-blocked-by-collision</code>), <code>snapToGrid</code>,
    per-item <code>autoHeight</code>, configurable resize handles
    (<code>showResizeHandles</code> plus a custom
    <code>#resize-handle</code> slot), named layout presets
    (<code>useLayoutPresets</code>), localizable ARIA strings
    (<code>ariaLabels</code>), a layout-level <code>enableEditMode</code>,
    and <code>multiSelect</code> + group move/resize — combined here
    rather than as separate views, the same way "Per-item overrides"
    groups several smaller props together. Grouped into sections below
    by what each actually affects, rather than one flat list — this view
    packs in a lot, and a flat list made it hard to tell which control
    went with which feature.
  </p>

  <div class="demo-controls-groups">
  <fieldset class="demo-controls">
    <legend>Compaction & collision</legend>
    <label>
      <input v-model="preventCollision" data-testid="toggle-prevent-collision" type="checkbox" />
      preventCollision
    </label>
    <label>
      <input v-model="useCustomCompactor" data-testid="toggle-custom-compactor" type="checkbox" />
      Custom compactor (compacts downward instead of up)
    </label>
    <button data-testid="compact-now" type="button" @click="gridRef?.compactNow()">Tidy up (compactNow)</button>
  </fieldset>

  <fieldset class="demo-controls">
    <legend>Visual aids</legend>
    <label>
      <input v-model="snapToGrid" data-testid="toggle-snap-to-grid" type="checkbox" />
      snapToGrid
    </label>
    <label>
      <input v-model="showGridLines" data-testid="toggle-show-grid-lines" type="checkbox" />
      showGridLines
    </label>
    <label>
      <input v-model="showResizeHandles" data-testid="toggle-show-resize-handles" type="checkbox" />
      showResizeHandles
    </label>
  </fieldset>

  <fieldset class="demo-controls">
    <legend>Accessibility & editing</legend>
    <label>
      <input v-model="spanishLabels" data-testid="toggle-spanish-labels" type="checkbox" />
      ariaLabels (Spanish)
    </label>
    <label>
      <input v-model="enableEditMode" data-testid="toggle-enable-edit-mode" type="checkbox" />
      enableEditMode (grid-wide)
    </label>
  </fieldset>

  <fieldset class="demo-controls">
    <legend>Multi-select & history</legend>
    <label>
      <input v-model="multiSelect" data-testid="toggle-multi-select" type="checkbox" />
      multiSelect
    </label>
    <button data-testid="undo-button" type="button" :disabled="!gridRef?.canUndo" @click="gridRef?.undo()">Undo</button>
    <button data-testid="redo-button" type="button" :disabled="!gridRef?.canRedo" @click="gridRef?.redo()">Redo</button>
  </fieldset>

  <fieldset class="demo-controls">
    <legend>Item actions</legend>
    <button data-testid="duplicate-item" type="button" @click="duplicateFirstItem">Duplicate first item</button>
  </fieldset>

  <fieldset class="demo-controls">
    <legend>Layout presets</legend>
    <button data-testid="save-preset-compact" type="button" @click="savePreset('compact')">Save preset "compact"</button>
    <button data-testid="save-preset-detailed" type="button" @click="savePreset('detailed')">Save preset "detailed"</button>
    <button
      v-for="name in presetNames"
      :key="name"
      :data-testid="`load-preset-${name}`"
      type="button"
      @click="loadPreset(name)"
    >Load "{{ name }}"</button>
  </fieldset>
  </div>

  <div class="demo-grid-wrap">
    <GridLayout
      ref="gridRef"
      v-model:layout="layout"
      :aria-labels="ariaLabels"
      :compactor="useCustomCompactor ? downwardCompactor : null"
      data-testid="advanced-features-grid"
      enable-undo-redo
      :enable-edit-mode="enableEditMode"
      :multi-select="multiSelect"
      :prevent-collision="preventCollision"
      :row-height="80"
      :show-resize-handles="showResizeHandles"
      :show-grid-lines="showGridLines"
      :snap-to-grid="snapToGrid"
      :compact-type="ECompactType.NONE"
      @move-blocked-by-collision="onBlocked"
    >
      <GridItem v-for="item in layout" :key="item.i" auto-height :data-testid="`grid-item-${item.i}`" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">
          {{ item.i }}
          <template v-if="item.i === 'growable'">
            <button data-testid="grow-content" type="button" @click.stop="lineCount++">+line</button>
            <p v-for="n in lineCount" :key="n" style=" font-size: 11px;margin: 2px 0;">line {{ n }}</p>
          </template>
        </div>
        <template #resize-handle>
          <span class="demo-resize-icon" data-testid="custom-resize-handle">⤡</span>
        </template>
      </GridItem>
    </GridLayout>
  </div>

  <p class="demo-description" data-testid="blocked-feedback">
    Blocked moves: {{ blockedCount }}<span v-if="lastBlockedId"> (last: "{{ lastBlockedId }}")</span>
  </p>
  <p class="demo-description" data-testid="selected-items-feedback">
    Selected: {{ gridRef?.selectedItems?.join(', ') || 'none' }}
  </p>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { ECompactType, GridLayout, GridItem, useLayoutPresets, type IGridAriaLabels, type TLayout, type ICompactor } from '@/components';
import { collides } from '@/core';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 4, i: 'wall', isStatic: true, w: 2, x: 4, y: 0 },
  { h: 2, i: 'growable', w: 3, x: 0, y: 6 },
]);

const gridRef = ref<InstanceType<typeof GridLayout>>();
const preventCollision = ref(false);
const snapToGrid = ref(false);
const showGridLines = ref(false);
const showResizeHandles = ref(false);
const spanishLabels = ref(false);
const enableEditMode = ref(true);
const multiSelect = ref(false);
const lineCount = ref(1);
const useCustomCompactor = ref(false);

// A minimal demo of the `compactor` prop: items settle toward the
// *bottom* of the grid instead of floating up, the opposite of the
// built-in default. Processes bottom-most items first (so they claim
// their own lowest possible spot before anything above them does),
// mirroring the "gravity" example pattern common to pluggable-
// compactor designs — not meant as a production-grade algorithm, just
// something visibly, testably different from the built-in one.
const downwardCompactor: ICompactor = {
  compact(layoutToCompact) {
    // Bug fix: this was `20` — far more headroom than this demo's own
    // small layout needs, and since compaction re-runs on every drag
    // end (not just an explicit "tidy up"), every drag pushed items
    // toward y:20, ballooning the grid container's own height and
    // leaving items scrolled out of view below the visible demo area.
    const maxY = 10;
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

const ariaLabels = computed<IGridAriaLabels>(() => (spanishLabels.value
  ? {
    itemRoleDescription: `Elemento arrastrable y redimensionable`,
    moveInstruction: `Presiona las flechas para mover.`,
    resizeInstruction: `Presiona shift más flechas para redimensionar.`,
  }
  : {}));

const blockedCount = ref(0);
const lastBlockedId = ref<string | number | null>(null);

function onBlocked(id: string | number): void {
  blockedCount.value += 1;
  lastBlockedId.value = id;
}

function duplicateFirstItem(): void {
  gridRef.value?.duplicateItem(layout.value[0]?.i);
}

const { savePreset: savePresetImpl, loadPreset, listPresets } = useLayoutPresets('demo-advanced-features', layout);
const presetNames = ref(listPresets());

function savePreset(name: string): void {
  savePresetImpl(name);
  presetNames.value = listPresets();
}
</script>

<style scoped>
.demo-resize-icon {
  color: var(--color-primary);
  font-size: 11px;
  pointer-events: none;
  user-select: none;
}
</style>
