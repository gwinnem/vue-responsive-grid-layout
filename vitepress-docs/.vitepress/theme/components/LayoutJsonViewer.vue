<!--
  Compact "current layout state" readout, used by examples that want to
  show the live x/y/w/h of every item as it's dragged/resized without a
  full JSON dump.
-->
<template>
  <div class="layout-json">
    <p
      v-if="label"
      class="layout-json__label">
      {{ label }}
    </p>
    <div class="layout-json__grid">
      <div
        v-for="item in layout"
        :key="item.i"
        class="layout-json__item">
        <strong>{{ item.i }}</strong>
        <span class="layout-json__coords">x:{{ item.x }} y:{{ item.y }} w:{{ item.w }} h:{{ item.h }}</span>
      </div>
      <p
        v-if="layout.length === 0"
        class="layout-json__empty">
        empty
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  defineProps<{
    layout: { i: string | number; x: number; y: number; w: number; h: number }[];
    label?: string;
  }>();
</script>

<style scoped>
.layout-json + .layout-json {
  margin-top: 10px;
}

.layout-json__label {
  color: var(--vp-c-text-3);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

.layout-json__grid {
  background: var(--vp-code-block-bg);
  border-radius: 8px;
  display: grid;
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  gap: 6px 16px;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  padding: 12px 14px;
}

.layout-json__item {
  color: var(--vp-c-text-2);
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.layout-json__item strong {
  color: var(--vp-c-brand-1);
}

.layout-json__empty {
  color: var(--vp-c-text-3);
  font-style: italic;
  margin: 0;
}
</style>
