<template>
  <div>
    <div ref="eventsDiv" class="eventsJSON">
      <div v-for="event in eventLog">
        {{ event }}
      </div>
    </div>
    <div style="margin-top:10px;">
      <grid-layout :col-num="12"
                   :is-draggable="draggable"
                   :is-resizable="resizable"
                   :layout.sync="layout"
                   :row-height="30"
                   :use-css-transforms="true"
                   :vertical-compact="true"
                   @layout-created="layoutCreatedEvent"
                   @layout-before-mount="layoutBeforeMountEvent"
                   @layout-mounted="layoutMountedEvent"
                   @layout-ready="layoutReadyEvent"
                   @layout-updated="layoutUpdatedEvent"
      >
        <grid-item v-for="item in layout"
                   :h="item.h"
                   :i="item.i"
                   :w="item.w"
                   :x="item.x"
                   :y="item.y"
                   @move="moveEvent"
                   @moved="movedEvent"
                   @resize="resizeEvent"
                   @resized="resizedEvent"
                   @container-resized="containerResizedEvent"
        >
          <span class="text">{{ item.i }}</span>
        </grid-item>
      </grid-layout>
    </div>
  </div>
</template>

<script lang="ts">
  import { GridLayout, GridItem } from '../../../../src/components';
  import { layout } from './example-layout';
  import './examples.css';

  export default {
    components: {
      GridLayout,
      GridItem
    },
    data() {
      return {
        layout,
        draggable: true,
        resizable: true,
        index: 0,
        eventLog: []
      };
    },
    watch: {
      eventLog: function () {
        const eventsDiv = this.$refs.eventsDiv;
        eventsDiv.scrollTop = eventsDiv.scrollHeight;
      }
    },
    methods: {
      moveEvent: function (i, newX, newY) {
        const msg = "MOVE i=" + i + ", X=" + newX + ", Y=" + newY;
        this.eventLog.push(msg);
        console.log(msg);

      },
      movedEvent: function (i, newX, newY) {
        const msg = "MOVED i=" + i + ", X=" + newX + ", Y=" + newY;
        this.eventLog.push(msg);
        console.log(msg);

      },
      resizeEvent: function (i, newH, newW, newHPx, newWPx) {
        const msg = "RESIZE i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx;
        this.eventLog.push(msg);
        console.log(msg);
      },
      resizedEvent: function (i, newX, newY, newHPx, newWPx) {
        const msg = "RESIZED i=" + i + ", X=" + newX + ", Y=" + newY + ", H(px)=" + newHPx + ", W(px)=" + newWPx;
        this.eventLog.push(msg);
        console.log(msg);

      },
      containerResizedEvent: function (i, newH, newW, newHPx, newWPx) {
        const msg = "CONTAINER RESIZED i=" + i + ", H=" + newH + ", W=" + newW + ", H(px)=" + newHPx + ", W(px)=" + newWPx;
        this.eventLog.push(msg);
        console.log(msg);
      },

      layoutCreatedEvent: function (newLayout) {
        this.eventLog.push("Created layout");
        console.log("Created layout: ", newLayout);
      },
      layoutBeforeMountEvent: function (newLayout) {
        this.eventLog.push("beforeMount layout");
        console.log("beforeMount layout: ", newLayout);
      },
      layoutMountedEvent: function (newLayout) {
        this.eventLog.push("Mounted layout");
        console.log("Mounted layout: ", newLayout);
      },
      layoutReadyEvent: function (newLayout) {
        this.eventLog.push("Ready layout");
        console.log("Ready layout: ", newLayout);
      },
      layoutUpdatedEvent: function (newLayout) {
        this.eventLog.push("Updated layout");
        console.log("Updated layout: ", newLayout);
      },
    }
  };
</script>

