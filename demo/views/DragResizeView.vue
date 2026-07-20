<template>
  <h2>Drag &amp; resize</h2>
  <p class="demo-description">
    A playground for every meaningful <code>GridLayout</code> option — toggle behavior and watch
    the layout events fire live in the log below.
  </p>

  <div class="demo-controls">
    <label>
      <input v-model="isDraggable" data-testid="toggle-draggable" type="checkbox" />
      Draggable
    </label>
    <label>
      <input v-model="isResizable" data-testid="toggle-resizable" type="checkbox" />
      Resizable
    </label>
    <label>
      <input v-model="isBounded" data-testid="toggle-bounded" type="checkbox" />
      Bounded
    </label>
    <label>
      <input v-model="enableEditMode" data-testid="toggle-edit-mode" type="checkbox" />
      Edit mode
    </label>
    <label>
      <input v-model="preventCollision" data-testid="toggle-prevent-collision" type="checkbox" />
      Prevent collision
    </label>
    <label>
      compactType
      <select v-model="compactType" data-testid="select-compact-type">
        <option :value="ECompactType.VERTICAL">Vertical</option>
        <option :value="ECompactType.HORIZONTAL">Horizontal</option>
        <option :value="ECompactType.NONE">None</option>
        <option :value="ECompactType.VERTICAL_OVERLAP">Vertical (overlap)</option>
        <option :value="ECompactType.HORIZONTAL_OVERLAP">Horizontal (overlap)</option>
      </select>
    </label>
    <label>
      <input v-model="horizontalShift" data-testid="toggle-horizontal-shift" type="checkbox" />
      Horizontal shift
    </label>
    <label>
      <input v-model="distributeEvenly" data-testid="toggle-distribute-evenly" type="checkbox" />
      Distribute evenly
    </label>
    <label>
      <input v-model="restoreOnDrag" data-testid="toggle-restore-on-drag" type="checkbox" />
      Restore on drag
    </label>
    <label>
      <input v-model="isMirrored" data-testid="toggle-mirrored" type="checkbox" />
      Mirrored (RTL)
    </label>
    <label>
      <input v-model="showGridLines" data-testid="toggle-grid-lines" type="checkbox" />
      Show grid lines
    </label>
    <label>
      <input v-model="useCssTransforms" data-testid="toggle-css-transforms" type="checkbox" />
      Use CSS transforms
    </label>
    <label>
      <input v-model="showCloseButton" data-testid="toggle-close-button" type="checkbox" />
      Show close button
    </label>
    <label>
      <input v-model="useBorderRadius" data-testid="toggle-use-border-radius" type="checkbox" />
      Use border radius
    </label>
    <label>
      Border radius (px)
      <input v-model.number="borderRadiusPx" data-testid="input-border-radius" max="60" min="0" step="1" type="number" />
    </label>
    <label>
      Transform scale
      <input v-model.number="transformScale" data-testid="input-transform-scale" max="2" min="0.25" step="0.05" type="number" />
    </label>
    <label>
      Max rows
      <input v-model.number="maxRows" data-testid="input-max-rows" min="1" step="1" type="number" />
    </label>
    <label>
      Row height
      <input v-model.number="rowHeight" data-testid="input-row-height" max="300" min="20" step="10" type="number" />
    </label>
    <label>
      Columns
      <input v-model.number="colNum" data-testid="input-col-num" max="24" min="1" step="1" type="number" />
    </label>
    <label>
      Margin (h)
      <input v-model.number="marginH" data-testid="input-margin-h" max="60" min="0" step="1" type="number" />
    </label>
    <label>
      Margin (v)
      <input v-model.number="marginV" data-testid="input-margin-v" max="60" min="0" step="1" type="number" />
    </label>
    <button data-testid="clear-log" type="button" @click="log = []">Clear log</button>
  </div>

  <div class="demo-grid-wrap">
    <div class="demo-scale-wrap" :style="{ transform: `scale(${transformScale})`, transformOrigin: 'top left' }">
    <GridLayout
      v-model:layout="layout"
      :border-radius-px="borderRadiusPx"
      :col-num="colNum"
      :distribute-evenly="distributeEvenly"
      :horizontal-shift="horizontalShift"
      :is-bounded="isBounded"
      :is-draggable="isDraggable"
      :is-mirrored="isMirrored"
      :is-resizable="isResizable"
      :margin="[marginH, marginV]"
      :max-rows="maxRows"
      :prevent-collision="preventCollision"
      :restore-on-drag="restoreOnDrag"
      :row-height="rowHeight"
      :show-close-button="showCloseButton"
      :show-grid-lines="showGridLines"
      :transform-scale="transformScale"
      :use-border-radius="useBorderRadius"
      :use-css-transforms="useCssTransforms"
      :compact-type="compactType"
      data-testid="drag-resize-grid"
      @dragstart="record('dragstart')"
      @dragend="record('dragend')"
      @layout-updated="record('layout-updated')"
    >
      <template #default>
        <GridItem
          v-for="item in layout"
          :key="item.i"
          :enable-edit-mode="enableEditMode"
          :h="item.h"
          :w="item.w"
          :x="item.x"
          :y="item.y"
          :i="item.i"
          :data-testid="`grid-item-${item.i}`"
          @remove-grid-item="removeItem"
        >
          <div class="demo-item">Item {{ item.i }}</div>
        </GridItem>
      </template>
    </GridLayout>
    </div>
  </div>

  <div class="demo-log" data-testid="event-log">
    <div v-for="(entry, idx) in log" :key="idx">{{ entry }}</div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { ECompactType, GridItem, GridLayout } from '@/components';
import type { TLayout } from '@/components';

const layout = ref<TLayout>([
  { i: '0', x: 0, y: 0, w: 4, h: 2 },
  { i: '1', x: 4, y: 0, w: 4, h: 2 },
  { i: '2', x: 8, y: 0, w: 4, h: 2 },
]);

// Bug fix: `showCloseButton` had a working test toggle here and the
// button rendered and was clickable once on, but nothing was
// listening for `@remove-grid-item` at all — clicking it silently did
// nothing. Confirmed directly: the click handler fired every time,
// correctly gated on edit mode being on, but the item was never
// actually removed from `layout`, since there was no listener to do
// that removal.
const removeItem = (id: string | number): void => {
  layout.value = layout.value.filter(item => item.i !== id);
};

// Interaction
const isDraggable = ref(true);
const isResizable = ref(true);
const isBounded = ref(false);
const enableEditMode = ref(true);

// Collision & compaction
const preventCollision = ref(false);
const compactType = ref(ECompactType.VERTICAL);
const horizontalShift = ref(false);
const distributeEvenly = ref(false);
const restoreOnDrag = ref(false);

// Layout & rendering
const isMirrored = ref(false);
const showGridLines = ref(false);
const useCssTransforms = ref(true);
const showCloseButton = ref(false);
const useBorderRadius = ref(false);
const borderRadiusPx = ref(10);
const transformScale = ref(1);
const maxRows = ref(100);
const rowHeight = ref(80);
const colNum = ref(12);
const marginH = ref(10);
const marginV = ref(10);

const log = ref<string[]>([]);
const record = (label: string) => {
  log.value = [...log.value, `${new Date().toLocaleTimeString()}  ${label}`].slice(-50);
};
</script>
