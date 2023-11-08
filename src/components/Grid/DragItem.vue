<template>
  <div
    class="droppable-element"
    draggable="true"
    @drag="drag"
    @dragend="dragend">
    <slot name="default"></slot>
    <!-- Droppable Element (Drag me!) -->
  </div>
</template>

<script lang='ts'>
  import {
    defineComponent, toRef, PropType, onMounted, onBeforeUnmount, nextTick, ref,
  } from 'vue';

  export default defineComponent({
    name: `DragItem`,
  });
</script>
<script setup lang='ts'>

  import { TLayoutItem, TLayout } from './layout-definition';
  import GridLayout from './GridLayout.vue';
  // import GridItem from './GridItem.vue';

  const prop = defineProps({
    enableEditMode: {
      type: Boolean,
      default: true,
    },
    isDraggable: {
      type: Boolean,
      default: true,
    },
    testLayout: {
      type: Array as PropType<TLayoutItem[]>,
      default: () => ([]),
    },
    colNum: {
      type: Number,
      default: 12,
    },
    refLayout: {
      type: (null as unknown) as PropType<typeof GridLayout | null>,
      default: null,
    },
    mapCache: {
      type: (null as unknown) as PropType<Map<string, any> | null>,
      default: null,
    },
  });

  // const emit = defineEmits(['updateTestLayout']);

  const enableEditMode = toRef(prop, `enableEditMode`);
  const isDraggable = toRef(prop, `isDraggable`);
  const propTestLayout = toRef(prop, `testLayout`);
  const testLayout = ref<TLayout>(propTestLayout.value);
  const colNum = toRef(prop, `colNum`);
  const refLayout = toRef(prop, `refLayout`);
  const mapCache = toRef(prop, `mapCache`);

  const mouseXY = {
    x: 0,
    y: 0,
  };

  const DragPos = {
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    i: ``,
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
        i: "drop",
      });
      // emit('updateTestLayout', testLayout.value);
    }

    const index = testLayout.value.findIndex(item => item.i === "drop");

    if(index !== -1 && refLayout.value && mapCache.value) {
      try {
        refLayout.value.defaultGridItem.$el.style.display = "none";
      } catch(e) {
        console.error('refLayout error', e);
      }
      const el = mapCache.value.get("drop");
      if(!el) {
        return;
      }

      el.dragging = {
        top: mouseXY.y - parentRect.top,
        left: mouseXY.x - parentRect.left,
      };

      const newPos = el.calcXY(mouseXY.y - parentRect.top, mouseXY.x - parentRect.left);
      if(mouseInGrid === true) {
        refLayout.value.dragEvent("dragstart", "drop", newPos.x, newPos.y, 2, 2);
        DragPos.i = String(index);
        DragPos.x = testLayout.value[index].x;
        DragPos.y = testLayout.value[index].y;
        DragPos.w = 2;
        DragPos.h = 2;
        // emit('updateTestLayout', testLayout.value);
      }
      if(mouseInGrid === false) {
        if(newPos.x === null) {
          newPos.x = 0;
        }
        if(newPos.y === null) {
          newPos.y = 0;
        }
        refLayout.value.dragEvent("dragend", "drop", newPos.x, newPos.y, 2, 2);
        testLayout.value = testLayout.value.filter(obj => obj.i !== "drop").slice(0);

        // emit('updateTestLayout', testLayout.value);
      }
    }
  };

  function addDragOverEvent(e: DragEvent): void {
    mouseXY.x = e.clientX;
    mouseXY.y = e.clientY;
  }

  function dragend(): void {
    const t = document.getElementById("content") as HTMLElement;
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

    if(mouseInGrid === true && refLayout.value) {
      refLayout.value.dragEvent("dragend", "drop", DragPos.x, DragPos.y, 2, 2);
      testLayout.value = testLayout.value.filter(obj => obj.i !== "drop");
      nextTick(() => {
        testLayout.value.push({
          x: DragPos.x,
          y: DragPos.y,
          w: 2,
          h: 2,
          minH: 1,
          minW: 1,
          i: DragPos.i,
        });
        if(refLayout.value && mapCache.value) {
          refLayout.value.dragEvent("dragend", DragPos.i, DragPos.x, DragPos.y, 2, 2);
          mouseXY.x = 0;
          mouseXY.y = 0;
          mapCache.value.delete("drop");
          // emit('updateTestLayout', testLayout.value);
        }
      });
    }
  }

  onMounted(() => {
    document.addEventListener("dragover", addDragOverEvent);
  });
  onBeforeUnmount(() => {
    document.removeEventListener("dragover", addDragOverEvent);
  });

</script>

<style lang='scss' scoped>
.droppable-element {
  // background: #fdd;
  border: 1px solid black;
  border-radius: 8px;
  cursor: grab;
  height: 100px;
  margin: 0;
  max-width: 250px;
  padding: 10px;
  text-align: center;
}
</style>
