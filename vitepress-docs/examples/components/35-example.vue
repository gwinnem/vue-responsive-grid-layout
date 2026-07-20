<template>
  <ExampleDemo title="Named layout presets">
    <template #description>
      <code>useLayoutPresets</code> saves and switches between several
      named arrangements of the same items (e.g. a "compact" and a
      "detailed" view of the same dashboard) — layered on top of
      <code>serializeLayout</code>/<code>deserializeLayout</code>
      rather than duplicating that logic.
    </template>
    <template #controls>
      <button class="example-button" type="button" @click="save('compact')">Save as "compact"</button>
      <button class="example-button" type="button" @click="save('detailed')">Save as "detailed"</button>
      <button
        v-for="name in presetNames"
        :key="name"
        class="example-button example-button--secondary"
        type="button"
        @click="load(name)"
      >Load "{{ name }}"</button>
    </template>

    <GridLayout v-model:layout="layout" :row-height="80">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item">{{ item.i }}</div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <p class="demo-description">Saved presets: {{ presetNames.length ? presetNames.join(', ') : 'none yet' }}</p>
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, useLayoutPresets, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: 'a', w: 4, x: 0, y: 0 },
  { h: 2, i: 'b', w: 4, x: 4, y: 0 },
  { h: 2, i: 'c', w: 4, x: 8, y: 0 },
]);

const { savePreset, loadPreset, listPresets } = useLayoutPresets('vitepress-example-35', layout);
const presetNames = ref(listPresets());

function save(name: string): void {
  savePreset(name);
  presetNames.value = listPresets();
}

function load(name: string): void {
  loadPreset(name);
}
</script>
