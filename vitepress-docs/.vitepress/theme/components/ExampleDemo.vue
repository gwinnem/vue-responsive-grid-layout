<!--
  Shared shell every example page uses so every demo looks and feels
  consistent: a titled card, an optional control panel row, and a bordered
  stage for the actual GridLayout. Keeps individual example .vue files
  focused on just the grid logic instead of re-implementing layout chrome
  each time.
-->
<template>
  <div class="example-demo">
    <div v-if="title || $slots.description" class="example-demo__header">
      <h3 v-if="title" class="example-demo__title">{{ title }}</h3>
      <p v-if="$slots.description" class="example-demo__description">
        <slot name="description" />
      </p>
    </div>

    <div v-if="$slots.controls" class="example-demo__controls">
      <slot name="controls" />
    </div>

    <div class="example-demo__stage">
      <slot />
    </div>

    <div v-if="$slots.footer" class="example-demo__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
}>();
</script>

<style scoped>
.example-demo {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  margin: 24px 0;
  overflow: hidden;
}

.example-demo__header {
  background: var(--vp-c-bg-alt);
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 16px 20px;
}

.example-demo__title {
  align-items: center;
  border: none !important;
  color: var(--vp-c-text-1);
  display: flex;
  font-size: 15px !important;
  font-weight: 600;
  gap: 8px;
  margin: 0 !important;
  padding: 0 !important;
}

.example-demo__title::before {
  background: var(--vp-c-brand-1);
  border-radius: 50%;
  content: '';
  display: inline-block;
  flex-shrink: 0;
  height: 8px;
  width: 8px;
}

.example-demo__description {
  color: var(--vp-c-text-2);
  font-size: 13.5px;
  line-height: 1.6;
  margin: 8px 0 0;
}

.example-demo__controls {
  background: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  padding: 14px 20px;
}

.example-demo__stage {
  padding: 20px;
}

.example-demo__footer {
  background: var(--vp-c-bg-alt);
  border-top: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-size: 13px;
  padding: 12px 20px;
}
</style>
