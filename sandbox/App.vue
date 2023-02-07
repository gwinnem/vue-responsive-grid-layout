<template>
  <div class="container">
    <div class="row responsive-label">
      <div class="col-sm">
        <form>
          <fieldset>
            <legend>Test bench</legend>
            <label for="rowheight">Row Height(px)</label>
            <input v-model="rowHeight" type="number" id="rowheight" placeholder="Row Height"/>
            <label for="rownum">Columns</label>
            <input v-model="colNum" id="rownum" type="number" placeholder="Columns"/>
            <label for="draggable">Draggable</label>
            <input v-model="isDraggable" id="draggable" type="checkbox">
            <label for="resize">Resizable</label>
            <input v-model="isResizable" id="resize" type="checkbox">
            <label for="responsive">Responsive</label>
            <input v-model="isResponsive" id="responsive" type="checkbox">
            <label for="gridlines">Show Gridlines</label>
            <input v-model="showGridLines" id="gridlines" type="checkbox">
          </fieldset>
          <fieldset style="display: none">
            <label for="mtb">Margin Top / Bottom</label>
            <input v-model="marginTopBottom" id="mtb" type="number" placeholder="Margin Top / Bottom" disabled/>
            <label for="mlr">Margin Left / Right</label>
            <input v-model="marginLeftRight" id="mlr" type="number" placeholder="Margin Left / Right" disabled/>
          </fieldset>
        </form>
      </div>
    </div>
    <div class="row">
      <div class="col-sm">
        <grid-layout
          ref="gridLayout"
          v-model:layout="demoLayout"
          :class="{grid: showGridLines}"
          :col-num="colNum"
          :is-draggable="isDraggable"
          :is-resizable="isResizable"
          :margin="[marginLeftRight, marginTopBottom]"
          :responsive="isResponsive"
          :row-height="rowHeight"
          :use-css-transform="true"
          :vertical-compact="true"
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
  const marginTopBottom = ref(10);
  const marginLeftRight = ref(10);

  const containerResized = (e: Event): void => {
    console.debug(e);
  };
</script>

<style lang="scss" scoped>
@import '../src/styles/index.scss';
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
