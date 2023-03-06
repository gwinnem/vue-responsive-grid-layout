<template>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <form style="border-radius: 8px;">
          <fieldset>
            <legend>Test bench</legend>
            <label for="rowHeight">Row Height(px)</label>
            <input id="rowHeight" v-model="rowHeight" type="number"/>
            <label for="colNum">Max Columns</label>
            <input id="colNum" v-model="colNum" type="number"/>
            <label for="maxRows">Max Rows</label>
            <input id="maxRows" v-model="maxRows" type="number"/>
            <label class="hide" for="mtb">Margin Top / Bottom</label>
            <input id="mtb" v-model="marginTopBottom" class="hide" type="number"/>
            <label class="hide" for="mlr">Margin Left / Right</label>
            <input id="mlr" v-model="marginLeftRight" class="hide" type="number"/>
            <label class="hide" for="borderRadius">Border Radius</label>
            <input id="borderRadius" v-model="borderRadiusPx" class="hide" type="number"/>
            <br/>
            <label for="autosize">autosize</label>
            <input id="autosize" v-model="autoResizeGridLayout" type="checkbox">
            <label for="editMode">editMode</label>
            <input id="editMode" v-model="enableEditMode" type="checkbox">
            <label for="horizontalShift">horizontalShift</label>
            <input id="horizontalShift" v-model="horizontalShift" type="checkbox">
            <label for="isBounded">isBounded</label>
            <input id="isBounded" v-model="isBounded" type="checkbox">
            <label for="isDraggable">isDraggable</label>
            <input id="isDraggable" v-model="isDraggable" type="checkbox">
            <label for="isMirrored">isMirrored</label>
            <input id="isMirrored" v-model="isMirrored" type="checkbox">
            <label for="isResizable">isResizable</label>
            <input id="isResizable" v-model="isResizable" type="checkbox">
            <label for="isResponsive">isResponsive</label>
            <input id="isResponsive" v-model="isResponsive" type="checkbox">
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
      <div class="col-sm-2">
        <div
          class="droppable-element"
          draggable="true"
          @drag="drag"
          @dragend="dragend">
          Droppable Element (Drag me!)
        </div>
      </div>
      <div class="col-sm-6">
        <div class="layoutJSON">
          Displayed as <code>[x, y, w, h]</code>:
          <div class="columns">
            <div v-for="item in testLayout">
              <b>{{ item.i }}</b>: [{{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }}]
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-4">
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
              :class="{grid: showGridLines}"
              :col-num="colNum"
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
              :use-border-radius="useBorderRadius"
              :use-css-transforms="true"
              :vertical-compact="verticalCompact"
              @columns-changed="colNumChanged">
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
                @resize="resizeEvent"
                @resized="resizedEvent">
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
      Copyright © 2022-present Geirr Winnem
    </p>
    <p style="text-align: center">
      <a href="https://winnem.tech" target="_blank">winnem.tech</a>
    </p>
  </footer>
</template>

<script lang="ts" setup>
  import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue';
  import { testData } from './test';
  import GridLayout from '../src/components/Grid/GridLayout.vue';
  import GridItem from '../src/components/Grid/GridItem.vue';
  import { TLayoutItem } from '../src/components/Grid/layout-definition';

  // Used for testing the package before publishing to npm.
  // import '../node_modules/vue-ts-responsive-grid-layout/dist/style.css';
  // import { GridLayout, GridItem, TLayoutItem } from 'vue-ts-responsive-grid-layout';

  const autoResizeGridLayout = ref(true);
  const borderRadiusPx = ref(8);
  const colNum = ref(12);
  const enableEditMode = ref(true);
  const horizontalShift = ref(false);
  const isBounded = ref(false);
  const isDraggable = ref(true);
  const isMirrored = ref(false); // TODO Not auto updating
  const isResizable = ref(true);
  const isResponsive = ref(true);
  const marginLeftRight = ref(10); // TODO Not working as expected
  const marginTopBottom = ref(10); // TODO Not working as expected
  const maxRows = ref(40);
  const preserveAspectRatio = ref(false);
  const preventCollision = ref(false);
  const rowHeight = ref(50);
  const rowHeightPx = ref(rowHeight.value + marginTopBottom.value + 'px');
  const restoreOnDrag = ref(false);
  const showCloseButton = ref(false);
  const showGridLines = ref(false);
  const useBorderRadius = ref(false);
  const verticalCompact = ref(true);

  const testLayout = ref(testData);
  const refLayout = ref();
  const mapCache: Map<string, any> = new Map();

  const margin = computed(() => {
    return [marginTopBottom.value, marginLeftRight.value];
  });

  let orgColNum = colNum.value;
  const colNumChanged = (value: number): void => {
    if(orgColNum !== value) {
      orgColNum = value;
      colNum.value = value;
    }
  };

  const removeGridItem = (id: string | number): void => {
    testLayout.value = testLayout.value.filter((item) => {
      return item.i !== id;
    });
  };

  const eventsDiv = ref<HTMLDivElement>();
  const eventsLog = ref<string[]>([]);

  const publishToEventLog = (i, msg, newX, newY): void => {
    eventsLog.value.push(`${msg} i=${i}, X=${newX}, Y=${newY}`);
    eventsDiv.value.scrollTop = eventsDiv.value.scrollHeight;
  }
  const containerResizedEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'containerResizedEvent', newX, newY);
  };

  const dragEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'dragEvent', newX, newY);
  };

  const draggedEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'draggedEvent', newX, newY);
  };

  const moveEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'moveEvent', newX, newY);
  };

  const movedEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'movedEvent', newX, newY);
  };

  const resizeEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'resizeEvent', newX, newY);
  };

  const resizedEvent = (i, newX, newY): void => {
    publishToEventLog(i, 'resizedEvent', newX, newY);
  };

  const itemTitle = (item: TLayoutItem): string => {
    let result = item.i;
    if(item.isStatic) {
      result += " - Static";
    }
    return <string>result;
  };

  function setChildRef(vm: any) {
    if(vm && vm.i) {
      mapCache.set(vm.i, vm);
    }
  }

  let mouseXY = {
    x: 0,
    y: 0,
  };

  let DragPos = {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    i: ``,
  };

  function drag(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
    if(!enableEditMode && !isDraggable) {
      return;
    }
    const t = document.getElementById("content") as HTMLElement;
    let parentRect = t.getBoundingClientRect();
    let mouseInGrid = false;
    if(
      mouseXY.x > parentRect.left &&
      mouseXY.x < parentRect.right &&
      mouseXY.y > parentRect.top &&
      mouseXY.y < parentRect.bottom
    ) {
      mouseInGrid = true;
    }
    if(mouseInGrid === true && testLayout.value.findIndex(item => item.i === "drop") === -1) {
      testLayout.value.push({
        x: (testLayout.value.length * 2) % colNum.value,
        y: testLayout.value.length + colNum.value, // puts it at the bottom
        w: 2,
        h: 2,
        i: "drop"
      });
    }

    let index = testLayout.value.findIndex(item => item.i === "drop");

    if(index !== -1) {
      try {
        refLayout.value.defaultGridItem.$el.style.display = "none";
      } catch {
        // Do nothing
      }
      let el = mapCache.get("drop");
      if(!el) {
        return;
      }

      el.dragging = {
        top: mouseXY.y - parentRect.top,
        left: mouseXY.x - parentRect.left
      };
      let new_pos = el.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);
      if(mouseInGrid === true) {
        refLayout.value.dragEvent("dragstart", "drop", new_pos.x, new_pos.y, 2, 2);
        DragPos.i = String(index);
        DragPos.x = testLayout.value[index].x;
        DragPos.y = testLayout.value[index].y;
      }
      if(mouseInGrid === false) {
        refLayout.value.dragEvent("dragend", "drop", new_pos.x, new_pos.y, 2, 2);
        testLayout.value = testLayout.value.filter(obj => obj.i !== "drop");
      }
    }
  }

  function dragend() {
    const t = document.getElementById("content") as HTMLElement;
    let parentRect = t.getBoundingClientRect();
    let mouseInGrid = false;
    if(
      mouseXY.x > parentRect.left
      && mouseXY.x < parentRect.right
      && mouseXY.y > parentRect.top
      && mouseXY.y < parentRect.bottom
    ) {
      mouseInGrid = true;
    }

    if(mouseInGrid === true) {
      refLayout.value.dragEvent("dragend", "drop", DragPos.x, DragPos.y, 2, 2);
      testLayout.value = testLayout.value.filter(obj => obj.i !== "drop");
      nextTick(() => {
        testLayout.value.push({
          x: DragPos.x,
          y: DragPos.y,
          w: 1,
          h: 1,
          minH: 1,
          minW: 1,
          i: DragPos.i
        });
        refLayout.value.dragEvent("dragend", DragPos.i, DragPos.x, DragPos.y, 2, 2);
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

<style lang="scss" scoped>
@import '../src/styles/variables';

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

.grid::before {
  content: '';
  background-size: calc(calc(100% - 5px) / v-bind(colNum)) v-bind(rowHeightPx);
  background-image: linear-gradient(
      to right,
      $grid-line-color 1px,
      transparent 1px
  ),
  linear-gradient(
      to bottom,
      $grid-line-color 1px,
      transparent 1px);
  height: calc(100% - 5px);
  width: calc(100% - 5px);
  position: absolute;
  background-repeat: repeat;
  margin: 5px;
}

.vue-grid-item .text {
  bottom: 0;
  font-size: 24px;
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
</style>
