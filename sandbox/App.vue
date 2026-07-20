<template>
  <div class="sandbox-shell">
    <header class="sandbox-header">
      <h1>vue-ts-responsive-grid-layout — Test bench</h1>
      <p class="demo-description">
        Every prop, in one place — a denser, single-page companion to the
        curated <code>demo/</code> app's per-feature views.
      </p>
    </header>
    <main class="sandbox-main">
      <div class="demo-controls-groups">
        <fieldset class="demo-controls">
          <legend>Item actions & lookup</legend>
          <button class="sandbox-hidden" type="button" @click.prevent="resetLayout">Reset Layout</button>
          <label for="scrollFocusItemId">
            scrollToItem/focusItem id:
            <input id="scrollFocusItemId" v-model="scrollFocusItemId" type="text" style="width: 60px">
          </label>
          <button type="button" @click.prevent="refLayout.scrollToItem(scrollFocusItemId)">Scroll to item</button>
          <button type="button" @click.prevent="refLayout.focusItem(scrollFocusItemId)">Focus item</button>
          <button type="button" @click.prevent="refLayout.compactNow()">compactNow</button>
          <button type="button" @click.prevent="refLayout.rearrange()">rearrange</button>
          <button type="button" @click.prevent="refLayout.duplicateItem(scrollFocusItemId)">duplicateItem</button>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Grid geometry</legend>
          <label for="rowHeight">Row Height (px)<input id="rowHeight" v-model="rowHeight" type="number" @change="onRowHeightChange"/></label>
          <label for="colNum">Max Columns<input id="colNum" v-model="colNum" type="number" @change="onColNumChange"/></label>
          <label for="maxRows">Max Rows<input id="maxRows" v-model="maxRows" type="number" @change="onMaxRowsChange"/></label>
          <label for="mtb">Margin Top / Bottom<input id="mtb" v-model="marginTopBottom" type="number" @change="onMarginTopBottomChange"/></label>
          <label for="mlr">Margin Left / Right<input id="mlr" v-model="marginLeftRight" type="number" @change="onMarginLeftRightChange"/></label>
          <label for="borderRadius">Border Radius<input id="borderRadius" v-model="borderRadiusPx" type="number"/></label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Panel visibility</legend>
          <label for="hideLayout"><input id="hideLayout" v-model="hideLayout" type="checkbox">Hide Layout</label>
          <label for="hideEventLog"><input id="hideEventLog" v-model="hideEventLog" type="checkbox">Hide Event Log</label>
          <label for="hideDroppable"><input id="hideDroppable" v-model="hideDroppable" type="checkbox">Hide Droppable</label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Compaction & collision</legend>
          <label for="distributeEvenly"><input id="distributeEvenly" v-model="distributeEvenly" type="checkbox">distributeEvenly</label>
          <label for="preventCollision"><input id="preventCollision" v-model="preventCollision" type="checkbox">preventCollision</label>
          <label for="restoreOnDrag"><input id="restoreOnDrag" v-model="restoreOnDrag" type="checkbox">restoreOnDrag</label>
          <label for="horizontalShift"><input id="horizontalShift" v-model="horizontalShift" type="checkbox">horizontalShift</label>
          <label for="compactType">compactType
            <select id="compactType" v-model="compactType">
              <option :value="ECompactType.VERTICAL">Vertical</option>
              <option :value="ECompactType.HORIZONTAL">Horizontal</option>
              <option :value="ECompactType.NONE">None</option>
              <option :value="ECompactType.VERTICAL_OVERLAP">Vertical (overlap)</option>
              <option :value="ECompactType.HORIZONTAL_OVERLAP">Horizontal (overlap)</option>
            </select>
          </label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Drag & resize behavior</legend>
          <label for="autosize"><input id="autosize" v-model="autoResizeGridLayout" type="checkbox">autosize</label>
          <label for="isBounded"><input id="isBounded" v-model="isBounded" type="checkbox">isBounded</label>
          <label class="sandbox-hidden" for="isDraggable"><input id="isDraggable" v-model="isDraggable" type="checkbox">isDraggable</label>
          <label class="sandbox-hidden" for="isResizable"><input id="isResizable" v-model="isResizable" type="checkbox">isResizable</label>
          <label for="isMirrored"><input id="isMirrored" v-model="isMirrored" type="checkbox">isMirrored</label>
          <label for="isResponsive"><input id="isResponsive" v-model="isResponsive" type="checkbox">isResponsive</label>
          <label for="preserveAspectRatio"><input id="preserveAspectRatio" v-model="preserveAspectRatio" type="checkbox">preserveAspectRatio</label>
          <label for="showResizeHandles"><input id="showResizeHandles" v-model="showResizeHandles" type="checkbox">showResizeHandles</label>
          <label for="customResizeHandle"><input id="customResizeHandle" v-model="customResizeHandle" type="checkbox">custom #resize-handle</label>
          <label for="autoScroll"><input id="autoScroll" v-model="autoScroll" type="checkbox">autoScroll</label>
          <label for="useBorderRadius"><input id="useBorderRadius" v-model="useBorderRadius" type="checkbox">useBorderRadius</label>
          <label for="resizeHandleColor">
            resizeHandleColor:
            <input id="resizeHandleColor" v-model="resizeHandleColor" type="text" style="width: 100px">
          </label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Visual aids</legend>
          <label for="showGridLines"><input id="showGridLines" v-model="showGridLines" type="checkbox">showGridLines</label>
          <label for="snapToGrid"><input id="snapToGrid" v-model="snapToGrid" type="checkbox">snapToGrid</label>
          <label for="snapThreshold">
            snapThreshold:
            <input id="snapThreshold" v-model.number="snapThreshold" min="0" type="number" style="width: 50px">
          </label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Editing, accessibility & close button</legend>
          <label for="editMode"><input id="editMode" v-model="enableEditMode" type="checkbox">editMode</label>
          <label for="layoutEnableEditMode"><input id="layoutEnableEditMode" v-model="layoutEnableEditMode" type="checkbox">enableEditMode (grid-wide)</label>
          <label for="showCloseButton"><input id="showCloseButton" v-model="showCloseButton" type="checkbox">showCloseButton</label>
          <label for="spanishLabels"><input id="spanishLabels" v-model="spanishLabels" type="checkbox">ariaLabels (Spanish)</label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Multi-select & auto-height</legend>
          <label for="multiSelect"><input id="multiSelect" v-model="multiSelect" type="checkbox">multiSelect</label>
          <label for="autoHeight"><input id="autoHeight" v-model="autoHeight" type="checkbox">autoHeight</label>
        </fieldset>

        <fieldset class="demo-controls">
          <legend>Outside drop</legend>
          <label for="allowOutsideDrop"><input id="allowOutsideDrop" v-model="allowOutsideDrop" type="checkbox">allowOutsideDrop</label>
        </fieldset>

        <fieldset v-if="!hideEventLog" class="demo-controls">
          <legend>Event log filter</legend>
          <button type="button" @click.prevent="clearEventLog">Clear Event Log</button>
          <VueMultiselect
              v-model="selected"
              :hide-selected="false"
              :multiple="true"
              :taggable="true"
              :options="options"
              class="sandbox-multiselect"
              deselect-label="Remove me"
              placeholder="Select events to log"
              select-label="Select me"
              @change="updateSelected">
          </VueMultiselect>
        </fieldset>
      </div>
      <div class="sandbox-panels">
        <div v-if="!hideDroppable && enableEditMode" class="demo-grid-wrap">
          <div
              class="droppable-element"
              draggable="true"
              @drag="drag"
              @dragend="dragend">
            Droppable Element (Drag me!)
          </div>
        </div>
        <div v-if="!hideLayout" class="demo-grid-wrap">
          <p class="demo-grid-label">Layout, as [x, y, w, h]</p>
          <div class="layoutJSON">
            <div class="columns">
              <div v-for="item in testLayout">
                <b>{{ item.i }}</b>: [{{ item }}]
              </div>
            </div>
          </div>
        </div>
        <div v-if="!hideEventLog" class="demo-grid-wrap">
          <p class="demo-grid-label">Event log</p>
          <div ref="eventsDiv" class="demo-log">
            <div
                v-for="event in eventsLog"
                :key="event">
              {{ event }}
            </div>
          </div>
        </div>
      </div>
      <div v-if="allowOutsideDrop" class="demo-controls">
        <div draggable="true" class="demo-droppable" @dragstart="onOutsideDragStart">
          ⠿ Drag me into the grid (allowOutsideDrop)
        </div>
      </div>
      <div class="demo-grid-wrap">
        <div id="content">
          <GridLayout
              ref="refLayout"
              v-model:layout="testLayout"
                :auto-size="autoResizeGridLayout"
                :col-num="colNum"
                :distribute-evenly="distributeEvenly"
                :horizontal-shift="horizontalShift"
                :is-bounded="isBounded"
                :is-draggable="isDraggable"
                :is-mirrored="isMirrored"
                :is-resizable="isResizable"
                :margin="margin"
                :max-rows="maxRows"
                :prevent-collision="preventCollision"
                :responsive="isResponsive"
                :restore-on-drag="restoreOnDrag"
                :row-height="rowHeight"
                :border-radius-px="borderRadiusPx"
                :show-close-button="showCloseButton"
                :show-grid-lines="showGridLines"
                :use-border-radius="useBorderRadius"
                :use-css-transforms="true"
                :compact-type="compactType"
                :allow-outside-drop="allowOutsideDrop"
                :outside-drop-width="2"
                :outside-drop-height="2"
                :show-resize-handles="showResizeHandles"
                :multi-select="multiSelect"
                :enable-edit-mode="layoutEnableEditMode"
                :aria-labels="ariaLabels"
                :resize-handle-color="resizeHandleColor"
                :snap-to-grid="snapToGrid"
                :snap-threshold="snapThreshold"
                @item-dropped-from-outside="onItemDroppedFromOutside"
                @move-blocked-by-collision="onMoveBlockedByCollision"
                @breakpoint-changed="onBreakpointChanged"
                @changed-direction="onChangedDirection"
                @columns-changed="onColNumChanged"
                @container-resized="onContainerResized"
                @dragend="onDragEnd"
                @dragmove="onDragMove"
                @dragstart="onDragStart"
                @layout-before-mount="onLayoutBeforeMount"
                @layout-created="onLayoutCreated"
                @layout-mounted="onLayoutMounted"
                @layout-ready="onLayoutReady"
                @layout-updated="onLayoutUpdated"
                @layout-update="onLayoutUpdate">
              <GridItem
                  v-for="item in testLayout"
                  :key="item.i"
                  :ref="el => setChildRef(el)"
                  :enable-edit-mode="enableEditMode"
                  :h="item.h"
                  :i="item.i"
                  :is-draggable="item.isDraggable"
                  :is-resizable="item.isResizable"
                  :isStatic="item.isStatic"
                  :auto-scroll="autoScroll"
                  :auto-height="autoHeight"
                  :min-h="item.minH"
                  :min-w="item.minW"
                  :preserve-aspect-ratio="preserveAspectRatio"
                  :border-radius-px="borderRadiusPx"
                  :show-close-button="showCloseButton"
                  :use-border-radius="useBorderRadius"
                  :w="item.w"
                  :x="item.x"
                  :y="item.y"
                  class="test"
                  @container-resized="containerResizedEvent"
                  @drag="dragEvent"
                  @dragged="draggedEvent"
                  @move="moveEvent"
                  @moved="movedEvent"
                  @remove-grid-item="removeGridItem"
                  @resize="onResizeStartEvent"
                  @resized="onResizeEndEvent">
                <!-- Default slot content goes here. -->
                <span class="text">
                  {{ itemTitle(item) }}
                </span>
                <template v-if="customResizeHandle" #resize-handle="{ edge }">
                  <span class="sandbox-resize-icon" :title="edge">⤡</span>
                </template>
              </GridItem>
            </GridLayout>
          </div>
        </div>
      </main>
      <footer class="sandbox-footer">
        <p style="text-align: center">
          Copyright © 2022-{{ getCurrentDate() }} Geirr Winnem
        </p>
        <p style="text-align: center">
          <a href="https://winnem.tech" target="_blank">winnem.tech</a>
        </p>
      </footer>
  </div>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, Ref, UnwrapRef} from 'vue';
import {testData as testData} from './test';
import GridLayout from '../src/components/Grid/GridLayout.vue';
import GridItem from '../src/components/Grid/GridItem.vue';
import {ILayoutItem, TLayout} from "../src/components/Grid/layout-definition";
import VueMultiselect from 'vue-multiselect';
import {getAllStaticGridItems} from "../src/core/common/helpers/grid-item-type-helpers";
import {getFirstCollision} from "../src/core/gridlayout/helpers/collision-helper";
import {ECompactType} from "../src/core/gridlayout/enums/ECompactType";

/**
 * Removing all selected items in dropdown if All is selected
 * @param {string}  val   The selected value
 */

// Model for select dropdown.
const updateSelected = (val: string[]): void => {
  if (val.length > 0 && val.includes('All')) {
    selected.value = ['All'];
  }
};

// model values linked to input properties.
const hideLayout = ref(true);
const hideEventLog = ref(false);
const hideDroppable = ref(true);

const autoResizeGridLayout = ref(true);
const borderRadiusPx = ref(8);
const colNum = ref(8);
const distributeEvenly = ref(true);
const enableEditMode = ref(true);
const horizontalShift = ref(true);
const isBounded = ref(true);
const isDraggable = ref(true);
const isMirrored = ref(false);
const isResizable = ref(true);
const isResponsive = ref(true);
const marginLeftRight = ref(10);
const marginTopBottom = ref(10);
const maxRows = ref(10);
const preserveAspectRatio = ref(false);
const preventCollision = ref(false);
const rowHeight = ref(60);
const restoreOnDrag = ref(false);
const showCloseButton = ref(false);
const showGridLines = ref(false);
const autoScroll = ref(false);
const scrollFocusItemId = ref(`0`);
const showResizeHandles = ref(false);
const customResizeHandle = ref(false);
const multiSelect = ref(false);
const layoutEnableEditMode = ref(true);
const spanishLabels = ref(false);
const ariaLabels = computed(() => (spanishLabels.value
  ? {
    closeButton: `Cerrar`,
    itemRoleDescription: `Elemento arrastrable y redimensionable`,
    moveInstruction: `Presiona las flechas para mover.`,
    resizeInstruction: `Presiona shift más flechas para redimensionar.`,
  }
  : {}));
const resizeHandleColor = ref(`rgb(94 94 94 / 45%)`);
const snapToGrid = ref(false);
const snapThreshold = ref(1);
const autoHeight = ref(false);
const useBorderRadius = ref(false);
const compactType = ref(ECompactType.VERTICAL);
const allowOutsideDrop = ref(false);

const onOutsideDragStart = (event: DragEvent): void => {
  event.dataTransfer?.setData('text/plain', 'sandbox-widget');
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy';
  }
};

const onItemDroppedFromOutside = (payload: { x: number; y: number; w: number; h: number }): void => {
  testLayout.value.push({ h: payload.h, i: String(Date.now()), w: payload.w, x: payload.x, y: payload.y });
};

// Model for the layout definition
const testLayout = ref([...testData]);

const onRowHeightChange = (): void => {
  if (rowHeight.value < 1) {
    rowHeight.value = 1;
  }
};

const onColNumChange = (): void => {
  if (colNum.value < 1) {
    colNum.value = 1;
  }
};

const onMaxRowsChange = (): void => {
  if (maxRows.value < 1) {
    maxRows.value = 1;
  }
};

const onMarginTopBottomChange = (): void => {
  if (marginTopBottom.value < 0) {
    marginTopBottom.value = 0;
  }
};

const onMarginLeftRightChange = (): void => {
  if (marginLeftRight.value < 0) {
    marginLeftRight.value = 0;
  }
};

/**
 * Ref to the html object.
 */
const refLayout = ref();
const mapCache = new Map();

/**
 * Used to get the full year displayed in the footer.
 * @return {number} The current year.
 */
const getCurrentDate = (): number => {
  const tmpDate = new Date(Date.now());
  return tmpDate.getFullYear();
}

/**
 * Computing the margin values
 * @return {Array}  The new margin value.
 */
const margin = computed(() => {
  return [marginLeftRight.value, marginTopBottom.value];
});

/**
 * Values used in the select dropdown.
 */
const selected = ref([
  'layoutReadyEvent'
]);

/**
 * The events for the select dropdown.
 */
const options = [
  'All',
  'breakpointChangedEvent',
  'changedDirectionEvent',
  'colNumChangedEvent',
  'containerResizedEvent',
  'dragStartEvent',
  'dragMoveEvent',
  'dragEndEvent',
  'layoutBeforeMountEvent',
  'layoutCreatedEvent',
  'layoutMountedEvent',
  'layoutReadyEvent',
  'layoutUpdateEvent',
  'layoutUpdatedEvent',
  'resizeStartEvent',
  'resizeEndEvent'];

// Event handlers
const publishToEventLog = (i: number | string, msg: string, newX: number, newY: number): void => {
  eventsLog.value.push(`${msg} i=${i}, X=${newX}, Y=${newY}`);
  if (eventsDiv.value)
    eventsDiv.value.scrollTop = eventsDiv.value.scrollHeight;
}
const publishStringToEventLog = (message: string, insertNewLine: boolean = false): void => {
  if (insertNewLine) {
    eventsLog.value.push('');
  }

  eventsLog.value.push(message);
  if (eventsDiv.value) {
    eventsDiv.value.scrollTop = eventsDiv.value.scrollHeight;
  }
};
const publishToEventLogWithNewLine = (firstLine: string, message: string): void => {
  eventsLog.value.push(firstLine);
  eventsLog.value.push('');
  eventsLog.value.push(message);
  if (eventsDiv.value) {
    eventsDiv.value.scrollTop = eventsDiv.value.scrollHeight;
  }
};

const onBreakpointChanged = (oldValue: string): void => {
  if (selected.value.includes('breakpointChangedEvent') || selected.value.includes('All')) {
    publishStringToEventLog(`Layout breakpoint changed to: ${oldValue}`);
  }
};

const onChangedDirection = (value: string): void => {
  if (selected.value.includes('changedDirectionEvent') || selected.value.includes('All')) {
    publishStringToEventLog(`Layout layout direction changed to: ${value}`);
  }
};

let orgColNum = colNum.value;
const onColNumChanged = (value: number): void => {
  if (orgColNum !== value) {
    orgColNum = value;
    colNum.value = value;
    if (selected.value.includes('colNumChangedEvent') || selected.value.includes('All')) {
      publishStringToEventLog(`Columns changed to: ${value}`);
    }
  }
};

const onContainerResized = (value: any): void => {
  if (selected.value.includes('containerResizedEvent') || selected.value.includes('All')) {
    publishStringToEventLog(`Container changed to: ${value}`);
  }
};

const onDragEnd = (itemId: string | number): void => {
  if (selected.value.includes('dragEndEvent') || selected.value.includes('All')) {
    publishStringToEventLog(`GridItem: ${itemId} Drag End`);
  }
};

const onDragMove = (i: any, newX: number, newY: number): void => {
  if (selected.value.includes('dragMoveEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'dragMoveEvent', newX, newY);
  }
};

const onDragStart = (i: any, newX: number, newY: number): void => {
  if (selected.value.includes('dragStartEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'dragStartEvent', newX, newY);
  }
};

const onLayoutBeforeMount = (value: TLayout[]): void => {
  if (selected.value.includes('layoutBeforeMountEvent') || selected.value.includes('All')) {
    publishToEventLogWithNewLine('Layout before mount:', JSON.stringify(value));
  }
};

const onLayoutCreated = (value: TLayout[]): void => {
  if (selected.value.includes('layoutCreatedEvent') || selected.value.includes('All')) {
    publishToEventLogWithNewLine(`Layout created:`, JSON.stringify(value));
  }
};

const onLayoutMounted = (value: TLayout[]): void => {
  if (selected.value.includes('layoutMountedEvent') || selected.value.includes('All')) {
    publishToEventLogWithNewLine(`Layout mounted:`, JSON.stringify(value));
  }
};

const onLayoutReady = (value: TLayout[]): void => {
  if (selected.value.includes('layoutReadyEvent') || selected.value.includes('All')) {
    publishToEventLogWithNewLine(`Layout ready:`, JSON.stringify(value));
  }
};

const onLayoutUpdated = (value: TLayout[]): void => {
  if (selected.value.includes('layoutUpdatedEvent') || selected.value.includes('All')) {
    publishToEventLogWithNewLine(`Layout updated:`, JSON.stringify(value));
  }
};

const onMoveBlockedByCollision = (id: string | number): void => {
  publishToEventLogWithNewLine(`Move blocked by collision:`, String(id));
};

const onLayoutUpdate = (value: TLayout[]): void => {
  if (selected.value.includes('layoutUpdateEvent') || selected.value.includes('All')) {
    publishToEventLogWithNewLine(`Layout update:`, JSON.stringify(value));
  }
};


const removeGridItem = (id: string | number): void => {
  testLayout.value = testLayout.value.filter((item) => {
    return item.i !== id;
  });
};

const eventsDiv = ref<HTMLDivElement>();
const eventsLog = ref<string[]>([]);
const clearEventLog = (): void => {
  eventsLog.value = [];
};

const resetLayout = (): void => {
  testLayout.value = [];
  testLayout.value = [...testData];
};

const containerResizedEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('containerResizedEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'containerResizedEvent', newX, newY);
  }
};

const dragEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('dragEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'dragEvent', newX, newY);
  }
};

const draggedEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('draggedEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'draggedEvent', newX, newY);
  }
};

let moveData: any, IMovedData: Ref<UnwrapRef<null>>;

const moveEvent = (i: number | string, newX: number, newY: number): void => {
  moveData = {
    startI: i,
    startMsg: 'Move start',
    startX: newX,
    startY: newY
  };
  publishToEventLog(i, 'Move Start: ', newX, newY);
};

const movedEvent = (i: number | string, newX: number, newY: number): void => {
  if (
      (selected.value.includes('All') || selected.value.includes('movedEvent'))
      && moveData.startI.toString() !== i.toString()
      && moveData.startX !== newX
      && moveData.startY !== newY
  )
  {
    publishToEventLog(i, 'Moved', newX, newY);
  } else {
    publishToEventLog(i, 'Move End', newX, newY);
  }
};

const onResizeEndEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('resizedEndEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'Resize End', newX, newY);
  }
};

const onResizeStartEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('resizeStartEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'Resize start', newX, newY);
  }
};

const itemTitle = (item: ILayoutItem): string => {
  let result = item.i;
  if (item.isStatic) {
    result += " - Static";
  }
  return <string>result;
};

function setChildRef(vm: any) {
  if (vm && vm.i) {
    mapCache.set(vm.i, vm);
  }
}

let mouseXY = {
  x: 0,
  y: 0,
};

// const updateTestLayout = (updateLayout: TLayout) => {
//   console.log(`update layout`);
//   testLayout.value = updateLayout;
// }

interface position {
  x: number | undefined
  y: number | undefined
  w: number
  h: number
  i: string
}

let DragPos: position = {
  x: undefined,
  y: undefined,
  w: 1,
  h: 1,
  i: ``,
};

const drag = (e: DragEvent): void => {
  e.stopPropagation();
  e.preventDefault();
  if (!enableEditMode.value && !isDraggable.value) {
    return;
  }
  const t = document.getElementById(`content`) as HTMLElement;
  const parentRect = t.getBoundingClientRect();
  let mouseInGrid = false;
  if (
      ((mouseXY.x > parentRect.left) && (mouseXY.x < parentRect.right)) &&
      ((mouseXY.y > parentRect.top) && (mouseXY.y < parentRect.bottom))) {
    mouseInGrid = true;
  }
  if (mouseInGrid && testLayout.value.findIndex(item => item.i === "drop") === -1) {
    testLayout.value.push({
      x: (testLayout.value.length * 2) % colNum.value,
      y: testLayout.value.length + colNum.value, // puts it at the bottom
      w: 2,
      h: 2,
      i: "drop",
    });
    // emit('updateTestLayout', testLayout.value);
  }

  const index = testLayout.value.findIndex(item => item.i === "drop");

  if (index !== -1) {
    let el = mapCache.get("drop");
    if (!el) {
      return;
    }

    try {
      refLayout.value.$refs.refsLayout.children[index].style.display = "none"
    } catch (e) {
      console.error(e);
    }

    let new_pos = el.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);

    const static_item = getAllStaticGridItems(testLayout.value)
    if (getFirstCollision(static_item, {
      i: `index`,
      h: 2,
      w: 2,
      x: new_pos.x,
      y: new_pos.y,
    })) {
      testLayout.value = testLayout.value.filter(obj => obj.i !== "drop").slice(0);
      return
    }

    if (DragPos.x === new_pos.x && DragPos.y === new_pos.y)
      return

    el.dragging = {
      top: mouseXY.y - parentRect.top,
      left: mouseXY.x - parentRect.left
    };
    if (mouseInGrid) {
      refLayout.value.dragEvent("dragstart", "drop", new_pos.x, new_pos.y, 2, 2);
      DragPos.i = String(testLayout.value.length + 1);
      DragPos.x = testLayout.value[index].x;
      DragPos.y = testLayout.value[index].y;
      DragPos.w = 2;
      DragPos.h = 2;
    }
    if (!mouseInGrid) {
      refLayout.value.dragEvent("dragend", "drop", new_pos.x, new_pos.y, 2, 2);
      testLayout.value = testLayout.value.filter(obj => obj.i !== "drop").slice(0);
    }

  }
};

function dragend() {
  const t = document.getElementById("content") as HTMLElement;
  let parentRect = t.getBoundingClientRect();
  let mouseInGrid = false;
  if (
      mouseXY.x > parentRect.left
      && mouseXY.x < parentRect.right
      && mouseXY.y > parentRect.top
      && mouseXY.y < parentRect.bottom
  ) {
    mouseInGrid = true;
  }

  if (mouseInGrid) {
    const static_item = getAllStaticGridItems(testLayout.value)
    if (getFirstCollision(static_item, {
      i: `index`,
      h: 2,
      w: 2,
      x: DragPos.x!,
      y: DragPos.y!,
    })) {
      testLayout.value = testLayout.value.filter(obj => obj.i !== "drop").slice(0);
      return
    }
    refLayout.value.dragEvent("dragend", "drop", DragPos.x, DragPos.y, 2, 2);
    testLayout.value = testLayout.value.filter(obj => obj.i !== "drop");
    nextTick(() => {
      testLayout.value.push({
        x: DragPos.x!,
        y: DragPos.y!,
        w: 2,
        h: 2,
        minH: 1,
        minW: 1,
        i: DragPos.i
      });
      refLayout.value.dragEvent("dragend", DragPos.i, DragPos.x, DragPos.y, 2, 2);
      mouseXY.x = 0;
      mouseXY.y = 0;
      mapCache.delete("drop");
    });
  }
}

function addDragOverEvent(e: DragEvent) {
  mouseXY.x = e.clientX;
  mouseXY.y = e.clientY;
}

onMounted(() => {
  document.addEventListener("dragover", addDragOverEvent);
});

onBeforeUnmount(() => {
  document.removeEventListener("dragover", addDragOverEvent);
});

</script>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>
<style scoped>
@import '../demo/style.css';

.sandbox-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sandbox-header {
  padding: 20px 32px 0;
}

.sandbox-header h1 {
  font-size: 18px;
  margin: 0 0 6px;
}

.sandbox-main {
  flex: 1;
  padding: 0 32px 24px;
  overflow: auto;
}

.sandbox-footer {
  padding: 16px 32px 24px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.sandbox-footer a {
  color: var(--color-primary);
}

/* Reproduces mini.css's .hidden utility for the one control that relied
   on it (see docs/REFACTORING.md #44) — kept hidden rather than shown,
   since removing the CSS framework should change how things look, not
   what's currently visible. `!important` is deliberate here, not lazy:
   confirmed directly that without it, `.demo-controls label`'s own
   `display: flex` (two classes, higher specificity) silently overrode
   this rule's `display: none` (one class) once these controls moved
   inside a `.demo-controls` group — the elements were still present in
   the DOM and functional the whole time, just visibly showing instead
   of staying hidden as intended. A utility class whose entire job is
   "hide this regardless of what else applies" is the one legitimate
   case for `!important` — the alternative (matching or exceeding every
   context it might ever be nested inside) is far more fragile. */
.sandbox-hidden {
  display: none !important;
}

.sandbox-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.sandbox-multiselect {
  flex: 1 1 320px;
  min-width: 240px;
}

.vue-grid-item .text {
  bottom: 0;
  font-size: 18px;
  height: 100%;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  text-align: center;
  top: 0;
  width: 100%;
}

.vue-grid-item.test {
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  color: #3730a3;
}

.vue-grid-item.test.vue-static {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.droppable-element {
  background: var(--color-surface);
  border: 1px dashed var(--color-primary);
  border-radius: var(--radius);
  cursor: grab;
  height: 100px;
  margin: 0;
  padding: 10px;
  text-align: center;
}

.layoutJSON {
  height: 140px;
  overflow-y: auto;
  font-size: 12px;
}

.columns {
  columns: 120px;
}
</style>
