<template>
  <span class="text">
    <button>{{ props.text }}</button>
    <span class="vue-draggable-handle"></span>
  </span>
</template>

<script lang="ts" setup>

  export interface IProps {
    text: string;
  }

  const props = withDefaults(defineProps<IProps>(), {
    text: `x`,
  });

</script>

<style lang="scss" scoped>
.vue-draggable-handle {
  // noinspection CssUnknownTarget
  background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><circle cx='5' cy='5' r='5' fill='#999999'/></svg>") no-repeat bottom right;
  background-origin: content-box;
  box-sizing: border-box;
  cursor: pointer;
  height: 20px;
  left: 0;
  padding: 0 8px 8px 0;
  position: absolute;
  top: 0;
  width: 20px;
}
</style>
