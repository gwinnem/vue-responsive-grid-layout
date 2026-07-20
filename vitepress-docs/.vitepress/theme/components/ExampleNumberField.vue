<!--
  A labeled number input, styled to match ExampleToggle for a consistent
  control-panel look. `v-model` compatible.
-->
<template>
  <label class="number-field">
    <span class="number-field__label">{{ label }}</span>
    <input
      class="number-field__input"
      :max="max"
      :min="min"
      :step="step"
      type="number"
      :value="modelValue"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))" />
  </label>
</template>

<script setup lang="ts">
  withDefaults(defineProps<{
    modelValue: number;
    label: string;
    min?: number;
    max?: number;
    /** The input's step increment. Default `1` — matches the native `<input type="number">` default explicitly rather than relying on it implicitly, so it's visible/adjustable per-usage. */
    step?: number;
  }>(), {
    max: undefined,
    min: undefined,
    step: 1,
  });
  defineEmits<{
    (e: 'update:modelValue', value: number): void;
  }>();
</script>

<style scoped>
.number-field {
  align-items: center;
  color: var(--vp-c-text-1);
  display: inline-flex;
  font-size: 13px;
  gap: 8px;
}

.number-field__label {
  white-space: nowrap;
}

.number-field__input {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  font-size: 13px;
  padding: 3px 8px;
  width: 64px;
}

.number-field__input:focus {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -1px;
}
</style>
