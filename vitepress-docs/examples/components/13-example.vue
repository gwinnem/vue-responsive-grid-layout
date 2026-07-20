<template>
  <ExampleDemo title="Show close button">
    <template #description>
      Set <code>showCloseButton</code> to render a built-in remove button
      on each item. Setting it on <code>GridLayout</code> (rather than
      on every individual item) controls the default for every item that
      doesn't set its own — toggle it here to show or hide every close
      button on the grid at once.
    </template>
    <template #controls>
      <ExampleToggle v-model="showCloseButton" label="showCloseButton (all items)" />
    </template>

    <GridLayout v-model:layout="layout" :show-close-button="showCloseButton" :row-height="60">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y"
        @remove-grid-item="removeItem">
        <div class="example-item">{{ item.i }}</div>
      </GridItem>
    </GridLayout>
    <template #footer>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const showCloseButton = ref(true);

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
  { h: 2, i: '2', w: 2, x: 4, y: 0 },
]);

const removeItem = (id: string | number): void => {
  layout.value = layout.value.filter(item => item.i !== id);
};
</script>
