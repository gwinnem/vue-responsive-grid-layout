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
            <label for="mtb">Margin Top / Bottom</label>
            <input id="mtb" v-model="marginTopBottom" disabled type="number"/>
            <label for="mlr">Margin Left / Right</label>
            <input id="mlr" v-model="marginLeftRight" disabled type="number"/>
            <label for="borderRadius">Border Radius</label>
            <input id="borderRadius" v-model="borderRadiusPx" type="number"/>
            <br/>
            <label for="autosize">autosize</label>
            <input id="autosize" v-model="autoResizeGridLayout" type="checkbox">
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
            <label for="preventCollision">preventCollision</label>
            <input id="preventCollision" v-model="preventCollision" type="checkbox">
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
      <div class="col-sm">
        <div class="layout">
          <div style="font-size: 0; height: 1px; margin:0; padding: 0;"></div>
          <div
            class="droppable-element"
            draggable="true"
            @drag="drag"
            @dragend="dragend">
            Droppable Element (Drag me!)
          </div>
          <div id="content">
            <GridLayout
              ref="refLayout"
              v-model:layout="testLayout"
              :auto-size="autoResizeGridLayout"
              :class="{grid: showGridLines}"
              :col-num="colNum"
              :is-bounded="isBounded"
              :is-draggable="isDraggable"
              :is-mirrored="isMirrored"
              :is-resizable="isResizable"
              :responsive="isResponsive"
              :row-height="rowHeight"
              :show-close-button="showCloseButton"
              :use-css-transforms="true"
              :vertical-compact="verticalCompact"
              @columns-changed="colNumChanged">
              <GridItem
                v-for="item in testLayout"
                :key="item.i"
                :h="item.h"
                :i="item.i"
                :min-h="3"
                :min-w="3"
                :ref="el => setChildRef(el)"
                :show-close-button="showCloseButton"
                :x="item.x"
                :y="item.y"
                :w="item.w"
                class="test"
                @resized="handleResize">
                <span class="text">
                  {{ item.i }}
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
  import { ref, onMounted, nextTick } from "vue";
  import { testData } from "./test";

  import GridLayout from "../src/components/Grid/GridLayout.vue";
  import GridItem from "../src/components/Grid/GridItem.vue";

  const autoResizeGridLayout = ref(true);
  const borderRadiusPx = ref(8);
  const colNum = ref(12);
  const horizontalShift = ref(false);
  const isBounded = ref(false);
  const isDraggable = ref(true);
  const isMirrored = ref(false); // TODO Not auto updating
  const isResizable = ref(true);
  const isResponsive = ref(true);
  const marginLeftRight = ref(10); // TODO Not working as expected
  const marginTopBottom = ref(10); // TODO Not working as expected
  const maxRows = ref(40);
  const preventCollision = ref(false);
  const rowHeight = ref(30);
  const rowHeightPx = ref(rowHeight.value + marginTopBottom.value + 'px');
  const showCloseButton = ref(true);
  const showGridLines = ref(false);
  const useBorderRadius = ref(false);
  const verticalCompact = ref(true);

  let testLayout = ref(testData);
  const refLayout = ref();
  const mapCache: Map<string, any> = new Map();
  let orgColNum = colNum.value;
  const colNumChanged = (value: number): void => {
    if(orgColNum !== value){
      orgColNum = value;
      colNum.value = value;
    }
  };
  function handleResize(i: string | number, w: number, h: number, x: number, y: number) {
    console.log(i, w, h, x, y);
  }

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
        w: 3,
        h: 4,
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
      if(!el) return;
      console.log("jjj");

      el.dragging = {
        top: mouseXY.y - parentRect.top,
        left: mouseXY.x - parentRect.left
      };
      let new_pos = el.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);
      if(mouseInGrid === true) {
        refLayout.value.dragEvent("dragstart", "drop", new_pos.x, new_pos.y, 3, 4);
        DragPos.i = String(index);
        DragPos.x = testLayout.value[index].x;
        DragPos.y = testLayout.value[index].y;
      }
      if(mouseInGrid === false) {
        refLayout.value.dragEvent("dragend", "drop", new_pos.x, new_pos.y, 3, 4);
        testLayout.value = testLayout.value.filter(obj => obj.i !== "drop");
      }
    }
  }

  function dragend() {
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

    if(mouseInGrid === true) {
      refLayout.value.dragEvent("dragend", "drop", DragPos.x, DragPos.y, 3, 4);
      testLayout.value = testLayout.value.filter(obj => obj.i !== "drop");
      // UNCOMMENT below if you want to add a grid-item
      nextTick(() => {
        testLayout.value.push({
          x: DragPos.x,
          y: DragPos.y,
          w: 3,
          h: 4,
          i: DragPos.i
        });
        refLayout.value.dragEvent("dragend", DragPos.i, DragPos.x, DragPos.y, 3, 4);
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
</script>

<style lang="scss" scoped>
@import '../src/styles/index.scss';
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
  //margin-left: 9px;
  //margin-right: 9px;
}

.test {
  background-color: #a86666;
}

.droppable-element {
  background: #fdd;
  border: 1px solid black;
  border-radius: 8px;
  cursor: grab;
  margin: 10px 0 0 10px;
  padding: 10px;
  text-align: center;
  width: 150px;
}
</style>
