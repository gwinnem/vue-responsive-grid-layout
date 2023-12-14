<template>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <form style="border-radius: 8px;">
          <fieldset>
            <legend>Test bench</legend>
            <div class="row hidden">
              <button
                  class="col-sm-2 secondary small"
                  @click.prevent="resetLayout">
                Reset Layout
              </button>
            </div>
            <div
                v-if="!hideEventLog"
                class="row">
              <button
                  class="col-sm-2 tertiary small"
                  @click.prevent="clearEventLog">
                Clear Event Log
              </button>
              <VueMultiselect
                  v-model="selected"
                  :hide-selected="false"
                  :multiple="true"
                  :taggable="true"
                  :options="options"
                  class="col-sm-9"
                  deselect-label="Remove me"
                  placeholder="Select events to log"
                  select-label="Select me"
                  style="width: 50%" @update:model-value="updateSelected">
              </VueMultiselect>
            </div>
            <hr/>
            <label for="rowHeight">Row Height(px)</label>
            <input id="rowHeight" v-model="rowHeight" type="number" @change="onRowHeightChange"/>
            <label for="colNum">Max Columns</label>
            <input id="colNum" v-model="colNum" type="number" @change="onColNumChange"/>
            <label for="maxRows">Max Rows</label>
            <input id="maxRows" v-model="maxRows" type="number" @change="onMaxRowsChange"/>
            <label class="" for="mtb">Margin Top / Bottom</label>
            <input id="mtb" v-model="marginTopBottom" class="" type="number" @change="onMarginTopBottomChange"/>
            <label class="" for="mlr">Margin Left / Right</label>
            <input id="mlr" v-model="marginLeftRight" class="" type="number" @change="onMarginLeftRightChange"/>
            <label class="hide" for="borderRadius">Border Radius</label>
            <input id="borderRadius" v-model="borderRadiusPx" class="hide" type="number"/>
            <label for="hideLayout">Hide Layout</label>
            <input id="hideLayout" v-model="hideLayout" type="checkbox">
            <label for="hideEventLog">Hide Event Log</label>
            <input id="hideEventLog" v-model="hideEventLog" type="checkbox">
            <label for="hideDroppable">Hide Droppable</label>
            <input id="hideDroppable" v-model="hideDroppable" type="checkbox">
            <br/>
            <label for="autosize">autosize</label>
            <input id="autosize" v-model="autoResizeGridLayout" type="checkbox">
            <label for="distributeEvenly">distributeEvenly</label>
            <input id="distributeEvenly" v-model="distributeEvenly" type="checkbox">
            <label for="editMode">editMode</label>
            <input id="editMode" v-model="enableEditMode" type="checkbox">
            <label for="horizontalShift">horizontalShift</label>
            <input id="horizontalShift" v-model="horizontalShift" type="checkbox">
            <label for="isBounded">isBounded</label>
            <input id="isBounded" v-model="isBounded" type="checkbox">
            <label class="hide" for="isDraggable">isDraggable</label>
            <input id="isDraggable" class="hide" v-model="isDraggable" type="checkbox">
            <label for="isMirrored">isMirrored</label>
            <input id="isMirrored" v-model="isMirrored" type="checkbox">
            <label class="hide" for="isResizable">isResizable</label>
            <input id="isResizable" class="hide" v-model="isResizable" type="checkbox">
            <label for="isResponsive">isResponsive</label>
            <input id="isResponsive" v-model="isResponsive" type="checkbox">
            <br/>
            <label for="preserveAspectRatio">preserveAspectRatio</label>
            <input id="preserveAspectRatio" v-model="preserveAspectRatio" type="checkbox">
            <label for="preventCollision">preventCollision</label>
            <input id="preventCollision" v-model="preventCollision" type="checkbox">
            <label for="restoreOnDrag">restoreOnDrag</label>
            <input id="restoreOnDrag" v-model="restoreOnDrag" type="checkbox">
            <label for="showCloseButton">showCloseButton</label>
            <input id="showCloseButton" v-model="showCloseButton" type="checkbox">
            <label for="showGridLines">showGridLines</label>
            <input id="showGridLines" v-model="showGridLines" type="checkbox">
            <label for="useBorderRadius">useBorderRadius</label>
            <input id="useBorderRadius" v-model="useBorderRadius" type="checkbox">
            <label for="verticalCompact">verticalCompact</label>
            <input id="verticalCompact" v-model="verticalCompact" type="checkbox">
          </fieldset>
        </form>
      </div>
    </div>
    <div class="row">
      <div
          v-if="!hideDroppable && enableEditMode"
          class="col-sm-2">
        <div
            class="droppable-element"
            draggable="true"
            @drag="drag"
            @dragend="dragend">
          Droppable Element (Drag me!)
        </div>
        <!-- <DragItem
          :testLayout="testLayout"
          :colNum="colNum"
          :refLayout="refLayout"
          :map-cache="mapCache"
          @updateTestLayout="updateTestLayout">
        </DragItem> -->
      </div>
      <div
        v-if="!hideLayout"
        class="col-sm-6">
        <div class="layoutJSON">
          Displayed as <code>[x, y, w, h]</code>:
          <div class="columns">
            <div v-for="item in testLayout">
              <b>{{ item.i }}</b>: [{{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }}]
            </div>
          </div>
        </div>
      </div>
      <div
          v-if="!hideEventLog"
          class="col-sm-4">
        <div
            ref="eventsDiv"
            class="eventsJSON">
          <div
              v-for="event in eventsLog"
              :key="event">
            {{ event }}
          </div>
        </div>
      </div>
    </div>
    <div style="font-size: 0; height: 5px; margin:0; padding: 0;"></div>
    <div class="row">
      <div class="col-sm">
        <div class="layout">
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
                :show-close-button="showCloseButton"
                :show-grid-lines="showGridLines"
                :use-border-radius="useBorderRadius"
                :use-css-transforms="true"
                :vertical-compact="verticalCompact"
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
                  :min-h="item.minH"
                  :min-w="item.minW"
                  :preserve-aspect-ratio="preserveAspectRatio"
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
              </GridItem>
            </GridLayout>
          </div>
        </div>
      </div>
    </div>
  </div>
  <footer>
    <p style="text-align: center">
      Copyright © 2022-{{getCurrentDate()}} Geirr Winnem
    </p>
    <p style="text-align: center">
      <a href="https://winnem.tech" target="_blank">winnem.tech</a>
    </p>
  </footer>
</template>

<script lang="ts" setup>
import {ref, onMounted, nextTick, onBeforeUnmount, computed, Ref, UnwrapRef} from 'vue';
import {testData} from './test';
import GridLayout from '../src/components/Grid/GridLayout.vue';
import GridItem from '../src/components/Grid/GridItem.vue';
import {
  getStatics,
  getFirstCollision,
} from '@/core/helpers/utils';
import {ILayoutItem, TLayout} from "@/components/Grid/layout-definition";
import VueMultiselect from 'vue-multiselect';
// import {EGridLayoutEvent} from "@/core/enums/EGridLayoutEvents";
// import DragItem from '@/components/Grid/DragItem.vue';

// Used for testing the package before publishing to npm.
// import '../node_modules/vue-ts-responsive-grid-layout/dist/style.css';
// import { GridLayout, GridItem, TLayoutItem } from 'vue-ts-responsive-grid-layout';

/**
 * Removing all selected items in dropdown if All is selected
 * @param {string}  val   The selected value
 */

// Model for select dropdown.
const updateSelected = (val: any): void => {
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
const colNum = ref(6);
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
const useBorderRadius = ref(false);
const verticalCompact = ref(true);

// Model for the layout definition
const testLayout = ref([...testData]);

const onRowHeightChange = (): void => {
  if(rowHeight.value < 1) {
    rowHeight.value = 1;
  }
};

const onColNumChange = (): void => {
  if(colNum.value < 1) {
    colNum.value = 1;
  }
};

const onMaxRowsChange = (): void => {
  if(maxRows.value < 1) {
    maxRows.value = 1;
  }
};

const onMarginTopBottomChange = (): void => {
  if(marginTopBottom.value < 1) {
    marginTopBottom.value = 1;
  }
};

const onMarginLeftRightChange = (): void => {
  if(marginLeftRight.value < 1) {
    marginLeftRight.value = 1;
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
  if(insertNewLine) {
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
  if ((selected.value.includes('All') || selected.value.includes('movedEvent')) && moveData.startI.toString() !== i.toString() && moveData.startX !== newX && moveData.startY !== newY) {
    publishToEventLog(i, 'Moved', newX, newY);
  } else {
    publishToEventLog(i, 'Moved End', newX, newY);
  }
};

const onResizeEndEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('resizedEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'resizedEvent', newX, newY);
  }
};

const onResizeStartEvent = (i: number | string, newX: number, newY: number): void => {
  if (selected.value.includes('resizeEvent') || selected.value.includes('All')) {
    publishToEventLog(i, 'resizeEvent', newX, newY);
  }
};

const itemTitle = (item: ILayoutItem): string => {
  let result = item.i;
  if (item.isStatic) {
    result += " - isStatic";
  }
  if(!item.isStatic && (item.isResizable || item.isResizable === undefined)) {
    result += " - isResizeable";
  }

  if(!item.isStatic && (item.isDraggable || item.isDraggable === undefined)) {
    result += " - isDraggable";
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
      console.log(e);
    }

    let new_pos = el.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);

    const static_item = getStatics(testLayout.value)
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
    const static_item = getStatics(testLayout.value)
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
<style lang="scss" scoped>
@import '../src/styles/variables';
@import '../node_modules/vue-multiselect/dist/vue-multiselect.css';

.hide {
  display: none;
}

form {
  margin-left: 0 !important;
  margin-right: 0 !important;
}

#rowHeight {
  max-width: 70px !important;
}

#colNum {
  max-width: 70px !important;
}

#mlr {
  max-width: 70px !important;
}

#mtb {
  max-width: 70px !important;
}

#maxRows {
  max-width: 70px !important;
}

#borderRadius {
  max-width: 70px !important;
}

.container {
  background: #646cff;
  min-width: 330px;
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

.layout {
  background-color: #58749f;
  border-radius: 8px;
  margin-bottom: 20px;
}

.test {
  background-color: #a86666;
}

.droppable-element {
  background: #fdd;
  border: 1px solid black;
  border-radius: 8px;
  cursor: grab;
  height: 100px;
  margin: 0;
  max-width: 250px;
  padding: 10px;
  text-align: center;
}

.layoutJSON {
  background: #ddd;
  border: 1px solid black;
  border-radius: 8px;
  height: 100px;
  overflow-y: scroll;
  padding: 10px;
}

.eventsJSON {
  background: #ddd;
  border: 1px solid black;
  border-radius: 8px;
  height: 100px;
  margin-top: 0;
  overflow-y: scroll;
  padding: 10px;
}

.columns {
  -moz-columns: 120px;
  -webkit-columns: 120px;
  columns: 120px;
}

//colors
$red: #E1332D;
$white: #fff;
$black: #000;

.btn-hover {
  background: $black;
  border: 1px solid;
  color: $white;
  line-height: 1.4;
  padding: .35em;
  text-decoration: none;

  &:hover {
    background: rgba($white, 1);
    color: $red;
  }
}

</style>
