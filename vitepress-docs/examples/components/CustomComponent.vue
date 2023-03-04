<template>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <form style="border-radius: 8px;">
          <fieldset>
            <legend>Test bench</legend>
            <label for="rowHeight">Row Height(px)</label>
            <input
              id="rowHeight"
              v-model="rowHeight"
              type="number" />
            <label for="colNum">Max Columns</label>
            <input
              id="colNum"
              v-model="colNum"
              type="number" />
            <label for="maxRows">Max Rows</label>
            <input
              id="maxRows"
              v-model="maxRows"
              type="number" />
            <label for="mtb">Margin Top / Bottom</label>
            <input
              id="mtb"
              v-model="marginTopBottom"
              type="number" />
            <label for="mlr">Margin Left / Right</label>
            <input
              id="mlr"
              v-model="marginLeftRight"
              type="number" />
            <label for="borderRadius">Border Radius</label>
            <input
              id="borderRadius"
              v-model="borderRadiusPx"
              type="number" />
            <br />
            <label for="autosize">autosize</label>
            <input
              id="autosize"
              v-model="autoResizeGridLayout"
              type="checkbox" />
            <label for="editMode">editMode</label>
            <input
              id="editMode"
              v-model="enableEditMode"
              type="checkbox" />
            <label for="horizontalShift">horizontalShift</label>
            <input
              id="horizontalShift"
              v-model="horizontalShift"
              type="checkbox" />
            <label for="isBounded">isBounded</label>
            <input
              id="isBounded"
              v-model="isBounded"
              type="checkbox" />
            <label for="isDraggable">isDraggable</label>
            <input
              id="isDraggable"
              v-model="isDraggable"
              type="checkbox" />
            <label for="isMirrored">isMirrored</label>
            <input
              id="isMirrored"
              v-model="isMirrored"
              type="checkbox" />
            <label for="isResizable">isResizable</label>
            <input
              id="isResizable"
              v-model="isResizable"
              type="checkbox" />
            <label for="isResponsive">isResponsive</label>
            <input
              id="isResponsive"
              v-model="isResponsive"
              type="checkbox" />
            <label for="preserveAspectRatio">preserveAspectRatio</label>
            <input
              id="preserveAspectRatio"
              v-model="preserveAspectRatio"
              type="checkbox" />
            <label for="preventCollision">preventCollision</label>
            <input
              id="preventCollision"
              v-model="preventCollision"
              type="checkbox" />
            <label for="restoreOnDrag">restoreOnDrag</label>
            <input
              id="restoreOnDrag"
              v-model="restoreOnDrag"
              type="checkbox" />
            <label for="showCloseButton">showCloseButton</label>
            <input
              id="showCloseButton"
              v-model="showCloseButton"
              type="checkbox" />
            <label for="showGridLines">showGridLines</label>
            <input
              id="showGridLines"
              v-model="showGridLines"
              type="checkbox" />
            <label for="useBorderRadius">useBorderRadius</label>
            <input
              id="useBorderRadius"
              v-model="useBorderRadius"
              type="checkbox" />
            <label for="verticalCompact">verticalCompact</label>
            <input
              id="verticalCompact"
              v-model="verticalCompact"
              type="checkbox" />
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
      <div class="col-sm-7">
        <div class="layoutJSON">
          Displayed as <code>[x, y, w, h]</code>:
          <div class="columns">
            <div v-for="item in testLayout">
              <b>{{ item.i }}</b>: [{{ item.x }}, {{ item.y }}, {{ item.w }}, {{ item.h }}]
            </div>
          </div>
        </div>
      </div>
      <div class="col-sm-3">
        <textarea style="width: 100%"></textarea>
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
                class="test"
                :ref="el => setChildRef(el)"
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
                @remove-grid-item="removeGridItem">
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
      <a
        href="https://winnem.tech"
        target="_blank">winnem.tech</a>
    </p>
  </footer>
</template>

<style lang="scss" scoped>
// @import '../node_modules/vue-ts-responsive-grid-layout/dist/style.css';
@import '../src/styles/variables';
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
  padding: 10px;
}

.eventsJSON {
  background: #ddd;
  border: 1px solid black;
  margin-top: 10px;
  padding: 10px;
  height: 100px;
  overflow-y: scroll;
}

.columns {
  -moz-columns: 120px;
  -webkit-columns: 120px;
  columns: 120px;
}
</style>
