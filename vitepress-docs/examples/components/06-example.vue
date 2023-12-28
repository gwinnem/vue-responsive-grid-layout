<template>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <form>
          <fieldset>
            <legend>Test bench</legend>
            <label
              class="hide"
              for="rowHeight">
              Row Height(px)
            </label>
            <input
              id="rowHeight"
              v-model="rowHeight"
              class="hide"
              type="number" />
            <label
              class="hide"
              for="colNum">
              Max Columns
            </label>
            <input
              id="colNum"
              v-model="colNum"
              class="hide"
              type="number" />
            <label
              class="hide"
              for="maxRows">
              Max Rows
            </label>
            <input
              id="maxRows"
              v-model="maxRows"
              class="hide"
              type="number" />
            <br class="hide" />
            <label
              class="hide"
              for="autosize">
              autosize
            </label>
            <input
              id="autosize"
              v-model="autoResizeGridLayout"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="editMode">
              editMode
            </label>
            <input
              id="editMode"
              v-model="enableEditMode"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="horizontalShift">
              horizontalShift
            </label>
            <input
              id="horizontalShift"
              v-model="horizontalShift"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="isBounded">
              isBounded
            </label>
            <input
              id="isBounded"
              v-model="isBounded"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="isDraggable">
              isDraggable
            </label>
            <input
              id="isDraggable"
              v-model="isDraggable"
              class="hide"
              type="checkbox" />
            <label
              class=""
              for="isMirrored">
              isMirrored
            </label>
            <input
              id="isMirrored"
              v-model="isMirrored"
              class=""
              type="checkbox" />
            <label
              class="hide"
              for="isResizable">
              isResizable
            </label>
            <input
              id="isResizable"
              v-model="isResizable"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="isResponsive">
              isResponsive
            </label>
            <input
              id="isResponsive"
              v-model="isResponsive"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="preserveAspectRatio">
              preserveAspectRatio
            </label>
            <input
              id="preserveAspectRatio"
              v-model="preserveAspectRatio"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="preventCollision">
              preventCollision
            </label>
            <input
              id="preventCollision"
              v-model="preventCollision"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="restoreOnDrag">
              restoreOnDrag
            </label>
            <input
              id="restoreOnDrag"
              v-model="restoreOnDrag"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="showCloseButton">
              showCloseButton
            </label>
            <input
              id="showCloseButton"
              v-model="showCloseButton"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="showGridLines">
              showGridLines
            </label>
            <input
              id="showGridLines"
              v-model="showGridLines"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="useBorderRadius">
              useBorderRadius
            </label>
            <input
              id="useBorderRadius"
              v-model="useBorderRadius"
              class="hide"
              type="checkbox" />
            <label
              class="hide"
              for="verticalCompact">
              verticalCompact
            </label>
            <input
              id="verticalCompact"
              v-model="verticalCompact"
              class="hide"
              type="checkbox" />
          </fieldset>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col-sm-2 hide">
        <div
          class="droppable-element"
          draggable="true"
          @drag="drag"
          @dragend="dragend">
          Droppable Element (Drag me!)
        </div>
      </div>
      <div class="col-sm-7">
        <div class="layoutJSON">
          Displayed as <code>[x, y, w, h]</code>:
          <div class="columns">
            <div
              v-for="item in testLayout"
              :key="item.i">
              <b>{{ item.i }}</b>: [{{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }}]
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-3 hide">
        <textarea style="width: 100%; margin-top: 15px; height: 150px; border-radius: 12px;"></textarea>
      </div>
    </div>
    <div style="font-size: 0; height: 5px; margin:0; padding: 0;"></div>
    <div class="row">
      <div class="col-sm">
        <div class="layout">
          <div
            id="content"
            class="content">
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
              :margin="[10, 10]"
              :max-rows="maxRows"
              :prevent-collision="preventCollision"
              :responsive="isResponsive"
              :restore-on-drag="restoreOnDrag"
              :row-height="rowHeight"
              :use-border-radius="useBorderRadius"
              :use-css-transforms="true"
              :vertical-compact="verticalCompact"
              @columns-changed="colNumChanged">
              <GridItem
                v-for="item in testLayout"
                :key="item.i"
                :ref="el => setChildRef(el)"
                class="test"
                :enable-edit-mode="enableEditMode"
                :h="item.h"
                :i="item.i"
                :is-draggable="item.isDraggable"
                :is-resizable="item.isResizable"
                :is-static="item.isStatic"
                :min-h="item.minH"
                :min-w="item.minW"
                :preserve-aspect-ratio="preserveAspectRatio"
                :show-close-button="showCloseButton"
                :use-border-radius="useBorderRadius"
                :w="item.w"
                :x="item.x"
                :y="item.y"
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
</template>

<script lang="ts" setup>
  import {
    ref, onMounted, nextTick, onBeforeUnmount,
  } from 'vue';
  import '../../../node_modules/vue-ts-responsive-grid-layout/dist/style.css';
  import { GridLayout, GridItem, ILayoutItem } from 'vue-ts-responsive-grid-layout';
  import { testData } from './test';

  const autoResizeGridLayout = ref(true);
  const colNum = ref(8);
  const enableEditMode = ref(false);
  const horizontalShift = ref(false);
  const isBounded = ref(false);
  const isDraggable = ref(false);
  const isMirrored = ref(false);
  const isResizable = ref(false);
  const isResponsive = ref(true);
  const maxRows = ref(20);
  const preserveAspectRatio = ref(false);
  const preventCollision = ref(false);
  const rowHeight = ref(50);
  const restoreOnDrag = ref(false);
  const showCloseButton = ref(false);
  const showGridLines = ref(false);
  const useBorderRadius = ref(true);
  const verticalCompact = ref(true);

  const testLayout = ref(testData);
  const refLayout = ref();
  const mapCache: Map<string, any> = new Map();

  let orgColNum = colNum.value;
  const colNumChanged = (value: number): void => {
    if(orgColNum !== value) {
      orgColNum = value;
      colNum.value = value;
    }
  };
  const containerResizedEvent = (): void => {
    // TBD
  };

  const dragEvent = (): void => {
    // TBD
  };

  const draggedEvent = (): void => {
    // TBD
  };

  const moveEvent = (): void => {
    // TBD
  };

  const movedEvent = (): void => {
    // TBD
  };

  const resizeEvent = (): void => {
    // TBD
  };

  const resizedEvent = (): void => {
    // TBD
  };

  const removeGridItem = (id: string | number): void => {
    testLayout.value = testLayout.value.filter(item => {
      return item.i !== id;
    });
    // emits(EGridItemEvent.REMOVE_ITEM);
  };

  const itemTitle = (item: ILayoutItem): string => {
    let result = item.i;
    if(item.isStatic) {
      result += ` - Static`;
    }
    return <string>result;
  };

  const setChildRef = (vm: ILayoutItem): void => {
    if(vm && vm.i) {
      mapCache.set(vm.i, vm);
    }
  };

  const mouseXY = {
    x: 0,
    y: 0,
  };

  const DragPos = {
    h: 1,
    i: ``,
    w: 1,
    x: 0,
    y: 0,
  };

  const drag = (e: DragEvent): void => {
    e.stopPropagation();
    e.preventDefault();
    if(!enableEditMode.value && !isDraggable.value) {
      return;
    }
    const t = document.getElementById(`content`) as HTMLElement;
    const parentRect = t.getBoundingClientRect();
    let mouseInGrid = false;
    if(
      mouseXY.x > parentRect.left
      && mouseXY.x < parentRect.right
      && mouseXY.y > parentRect.top
      && mouseXY.y < parentRect.bottom
    ) {
      mouseInGrid = true;
    }
    if(mouseInGrid === true && testLayout.value.findIndex(item => item.i === `drop`) === -1) {
      testLayout.value.push({
        h: 2,
        i: `drop`,
        w: 2,
        x: (testLayout.value.length * 2) % colNum.value,
        y: testLayout.value.length + colNum.value, // puts it at the bottom
      });
    }

    const index = testLayout.value.findIndex(item => item.i === `drop`);

    if(index !== -1) {
      try {
        refLayout.value.defaultGridItem.$el.style.display = `none`;
      } catch{
        // Do nothing
      }
      const el = mapCache.get(`drop`);
      if(!el) {
        return;
      }

      el.dragging = {
        left: mouseXY.x - parentRect.left,
        top: mouseXY.y - parentRect.top,
      };
      const newPos = el.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);
      if(mouseInGrid === true) {
        refLayout.value.dragEvent(`dragstart`, `drop`, newPos.x, newPos.y, 2, 2);
        DragPos.i = String(index);
        DragPos.x = testLayout.value[index].x;
        DragPos.y = testLayout.value[index].y;
      }
      if(mouseInGrid === false) {
        refLayout.value.dragEvent(`dragend`, `drop`, newPos.x, newPos.y, 2, 2);
        testLayout.value = testLayout.value.filter(obj => obj.i !== `drop`);
      }
    }
  };

  const dragend = (): void => {
    const t = document.getElementById(`content`) as HTMLElement;
    const parentRect = t.getBoundingClientRect();
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
      refLayout.value.dragEvent(`dragend`, `drop`, DragPos.x, DragPos.y, 2, 2);
      testLayout.value = testLayout.value.filter(obj => obj.i !== `drop`);
      nextTick(() => {
        testLayout.value.push({
          h: 1,
          i: DragPos.i,
          minH: 1,
          minW: 1,
          w: 1,
          x: DragPos.x,
          y: DragPos.y,
        });
        refLayout.value.dragEvent(`dragend`, DragPos.i, DragPos.x, DragPos.y, 2, 2);
        mapCache.delete(`drop`);
      });
    }
  };

  const addDragOverEvent = (e: DragEvent): void => {
    mouseXY.x = e.clientX;
    mouseXY.y = e.clientY;
  };

  onMounted(() => {
    document.addEventListener(`dragover`, addDragOverEvent);
    nextTick();
    document.body.style.direction = `unset`;
  });
  onBeforeUnmount(() => {
    document.removeEventListener(`dragover`, addDragOverEvent);
  });
</script>

<style lang="scss" scoped>
// @import '../../../node_modules/vue-ts-responsive-grid-layout/dist/style.css';

.hide {
  display: none;
}

form {
  background-color: #7f8497;
  border-radius: 12px;
}

fieldset {
  color: #000;
  padding: 15px;
}

legend {
  font-weight: bold;
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
  padding: 10px;
}

.grid::before {
  content: '';
  background-size: calc(calc(100% - 5px) / v-bind(colNum)) v-bind(rowHeightPx);
  background-image: linear-gradient(
      to right,
      black 1px,
      transparent 1px
  ),
  linear-gradient(
      to bottom,
      black 1px,
      transparent 1px);
  height: calc(100% - 5px);
  width: calc(100% - 5px);
  position: absolute;
  background-repeat: repeat;
  margin: 5px;
}

.vue-grid-item .text {
  bottom: 0;
  font-size: 20px;
  height: 100%;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  text-align: center;
  top: 20px;
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
  margin: 0;
  height: 100px;
  padding: 10px;
  text-align: center;
  max-width: 250px;
}

.layoutJSON {
  background: #ddd;
  border: 1px solid black;
  border-radius: 8px;
  color: #000;
  margin-top: 10px;
  padding: 10px;
}

.eventsJSON {
  background: #726e6e;
  border: 1px solid black;
  border-radius: 12px;
  color: #000;
  height: 200px;
  padding: 10px;
  overflow-y: scroll;
}

.columns {
  -moz-columns: 120px;
  -webkit-columns: 120px;
  columns: 120px;
}
</style>
