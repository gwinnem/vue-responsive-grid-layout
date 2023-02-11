<template>
  <div class="container">
    <div class="row">
      <div class="col-sm">
        <form>
          <fieldset>
            <legend>Test bench</legend>
            <label for="rowHeight">Row Height(px)</label>
            <input v-model="rowHeight" type="number" id="rowHeight" placeholder="Row Height"/>
            <label for="colNum">Max Columns</label>
            <input v-model="colNum" id="colNum" type="number" placeholder="Max Columns"/>
            <label for="maxRows">Max Rows</label>
            <input v-model="maxRows" id="maxRows" type="number" placeholder="Max rows"/>
            <label for="mtb">Margin Top / Bottom</label>
            <input v-model="marginTopBottom" id="mtb" type="number" placeholder="Margin Top / Bottom" disabled/>
            <label for="mlr">Margin Left / Right</label>
            <input v-model="marginLeftRight" id="mlr" type="number" placeholder="Margin Left / Right" disabled/>
            <label for="borderRadius">Border Radius</label>
            <input v-model="borderRadiusPx" id="borderRadius" type="number" placeholder="Border Radius"/>
            <br/>
            <label for="draggable">isDraggable</label>
            <input v-model="isDraggable" id="draggable" type="checkbox">
            <label for="resize">isResizable</label>
            <input v-model="isResizable" id="resize" type="checkbox">
            <label for="responsive">responsive</label>
            <input v-model="isResponsive" id="responsive" type="checkbox">
            <label for="gridlines">showGridLines</label>
            <input v-model="showGridLines" id="gridlines" type="checkbox">
            <label for="autosize">autosize</label>
            <input v-model="autoResizeGridLayout" id="autosize" type="checkbox">
            <label for="verticalCompact">verticalCompact</label>
            <input v-model="vertCompact" id="verticalCompact" type="checkbox">
            <label for="horizontalShift">horizontalShift</label>
            <input v-model="horizontalShift" id="horizontalShift" type="checkbox">
            <label for="useBorderRadius">useBorderRadius</label>
            <input v-model="useBorderRadius" id="useBorderRadius" type="checkbox">
            <label for="preventCollision">preventCollision</label>
            <input v-model="preventCollision" id="preventCollision" type="checkbox">
            <label for="showCloseButton">showCloseButton</label>
            <input v-model="showCloseButton" id="showCloseButton" type="checkbox">
            <label for="useBootstrapBreakpoints">useBootstrapBreakpoints</label>
            <input v-model="useBootstrapBreakpoints" id="useBootstrapBreakpoints" type="checkbox">
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
          :use-bootstrap-breakpoints="useBootstrapBreakpoints"
          :use-border-radius="useBorderRadius"
          :use-css-transform="true"
          :vertical-compact="vertCompact"
          @item-resize="containerResized"
          @update-breakpoint="breakpointUpdated">
          <template #gridItemContent="slotProps">
            <span class="text">
              {{ slotProps.item.i }}
            </span>
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
  import { ref, watch } from 'vue';
  import { TLayout } from '../src/core/types/helpers';

  const demoLayout = ref<TLayout>(data);
  const colNum = ref(12);
  const rowHeight = ref(30);
  const showGridLines = ref(false);
  const isDraggable = ref(true);
  const isResizable = ref(true);
  const isResponsive = ref(false);
  const marginTopBottom = ref(10); // TODO Not working as expected
  const marginLeftRight = ref(10); // TODO Not working as expected
  const rowHeightPx = ref(rowHeight.value + marginTopBottom.value + 'px');
  const autoResizeGridLayout = ref(true);
  const vertCompact= ref(true);
  const horizontalShift = ref(false);
  const maxRows = ref(40);
  const useBorderRadius = ref(true);
  const borderRadiusPx = ref(8);
  const preventCollision = ref(false);
  const showCloseButton = ref(true);
  const useBootstrapBreakpoints = ref(false);

  const containerResized = (e: Event): void => {
    console.error(`containerResized=> GridItem: i=`, e);
  };

  const breakpointUpdated = (newBreakpoint: string, layout: TLayout): void => {
    // console.error(`breakpointUpdated`, newBreakpoint, layout);
  };

  // watch(() => borderRadiusPx.value, (newValue) => {
  //   console.error(newValue);
  // });
</script>

<style lang="scss" scoped>
@import '../src/styles/index.scss';
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

.static {
  background: #cce;
}
.vue-grid-item .text {
  font-size: 24px;
  text-align: center;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
  height: 100%;
  width: 100%;
}
</style>
