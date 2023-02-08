<template>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <form>
          <fieldset>
            <legend>Test bench</legend>
            <label for="rowHeight">Row Height(px)</label>
            <input v-model="rowHeight" type="number" id="rowHeight" placeholder="Row Height"/>
            <label for="colNum">Columns</label>
            <input v-model="colNum" id="colNum" type="number" placeholder="Columns"/>
            <label for="mtb">Margin Top / Bottom</label>
            <input v-model="marginTopBottom" id="mtb" type="number" placeholder="Margin Top / Bottom" disabled/>
            <label for="mlr">Margin Left / Right</label>
            <input v-model="marginLeftRight" id="mlr" type="number" placeholder="Margin Left / Right" disabled/>
            <label for="maxRows">Max Rows</label>
            <input v-model="maxRows" id="maxRows" type="number" placeholder="Max rows" disabled/>
            <label for="borderRadius">Border Radius</label>
            <input v-model="borderRadiusPx" id="borderRadius" type="number" placeholder="Border Radius"/>
            <br/>
            <label for="draggable">Draggable</label>
            <input v-model="isDraggable" id="draggable" type="checkbox">
            <label for="resize">Resizable</label>
            <input v-model="isResizable" id="resize" type="checkbox">
            <label for="responsive">Responsive</label>
            <input v-model="isResponsive" id="responsive" type="checkbox">
            <label for="gridlines">Show Gridlines</label>
            <input v-model="showGridLines" id="gridlines" type="checkbox">
            <label for="autosize">Auto resize GridLayout</label>
            <input v-model="autoResizeGridLayout" id="autosize" type="checkbox">
            <label for="verticalCompact">Compact</label>
            <input v-model="vertCompact" id="verticalCompact" type="checkbox">
            <label for="horizontalShift">Horizontal Shift</label>
            <input v-model="horizontalShift" id="horizontalShift" type="checkbox">
            <label for="useBorderRadius">Use Radius</label>
            <input v-model="useBorderRadius" id="useBorderRadius" type="checkbox">
            <label for="preventCollision">Prevent Collision</label>
            <input v-model="preventCollision" id="preventCollision" type="checkbox">
            <label for="showCloseButton">Show Close Button</label>
            <input v-model="showCloseButton" id="showCloseButton" type="checkbox">
          </fieldset>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col-sm">
        <grid-layout
          ref="gridLayout"
          v-model:layout="demoLayout"
          :auto-size="autoResizeGridLayout"
          :border-radius-px="borderRadiusPx"
          :class="{grid: showGridLines}"
          :col-num="colNum"
          :horizontal-shift="horizontalShift"
          :is-draggable="isDraggable"
          :is-resizable="isResizable"
          :margin="[marginLeftRight, marginTopBottom]"
          :max-rows="maxRows"
          :prevent-collision="preventCollision"
          :responsive="isResponsive"
          :row-height="rowHeight"
          :show-close-button="showCloseButton"
          :use-border-radius="useBorderRadius"
          :use-css-transform="true"
          :vertical-compact="vertCompact"
          @item-resize="containerResized">
          <template #gridItemContent="slotProps">
            <div>
              {{ slotProps.item.i }}
            </div>
          </template>
        </grid-layout>
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
  import { GridLayout } from '../src';
  import { data } from './layoutPayload';
  import { ref } from 'vue';
  import { Layout } from '../src/core/types/helpers';

  const demoLayout = ref<Layout>(data);
  const colNum = ref(12);
  const rowHeight = ref(120);
  const rowHeightPx = ref(rowHeight.value + 10 + 'px');
  const showGridLines = ref(false);
  const isDraggable = ref(true);
  const isResizable = ref(true);
  const isResponsive = ref(false);
  const marginTopBottom = ref(10); // TODO Not working as expected
  const marginLeftRight = ref(10); // TODO Not working as expected
  const autoResizeGridLayout = ref(true);
  const vertCompact= ref(true);
  const horizontalShift = ref(false);
  const maxRows = ref(6); // TODO not working as expected
  const useBorderRadius = ref(false);
  const borderRadiusPx = ref(8);
  const preventCollision = ref(false);
  const showCloseButton = ref(true);

  const containerResized = (e: Event): void => {
    console.debug(e);
  };
</script>

<style lang="scss" scoped>
@import '../src/styles/index.scss';
#rowHeight {
  max-width: 100px !important;
}
#colNum {
  max-width: 100px !important;
}
#mlr {
  max-width: 100px !important;
}
#mtb {
  max-width: 100px !important;
}
#maxRows {
  max-width: 100px !important;
}

#borderRadius {
  max-width: 100px !important;
}

.container {
  background: #646cff;
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
</style>
