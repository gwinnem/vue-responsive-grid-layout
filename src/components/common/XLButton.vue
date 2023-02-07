<template>
  <button :class="['xl-button', props.type ? 'xl-button--' + props.type : '']">
    <slot></slot>
  </button>
</template>

<script lang="ts" setup>
  interface IProps {
    type: string;
    default: string;
  }

  const props = withDefaults(defineProps<IProps>(), {
    default: `default`,
    type: ``,
  });
</script>

<style lang="scss" scoped></style>
