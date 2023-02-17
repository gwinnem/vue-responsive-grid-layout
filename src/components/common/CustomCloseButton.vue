<template>
  <button
    class="btn-close"
    type="button"
    @click="removeItem">
    <span class="icon-cross"></span>
    <span class="visually-hidden">Close</span>
  </button>
</template>

<script lang="ts" setup>
  import { EGridItemEvent } from '@/core/enums/EGridItemEvents';

  interface IProps {
    i: string | number;
  }

  const props = withDefaults(defineProps<IProps>(), {
    i: -1,
  });

  const emit = defineEmits<{
    (e: EGridItemEvent.REMOVE_ITEM, value: string | number): void;
  }>();

  const removeItem = (): void => {
    if(Number(props.i) === -1) {
      return;
    }
    emit(EGridItemEvent.REMOVE_ITEM, props.i);
  };
</script>

<style lang="scss" scoped>
// Display a cross with CSS only.
//
// $size  : px or em
// $color : color
// $thickness : px
@mixin cross($size: 20px, $color: currentColor, $thickness: 1px) {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  position: relative;
  width: $size;
  height: $size;

  &:before,
  &:after {
    content: '';
    position: absolute;
    top: calc(($size - $thickness) / 2);
    left: 0;
    right: 0;
    height: $thickness;
    background: $color;
    border-radius: $thickness;
  }

  &:before {
    transform: rotate(45deg);
  }

  &:after {
    transform: rotate(-45deg);
  }

  span {
    display: block;
  }

}

.btn-close {
  align-items: center;
  background: #464548;
  border: 0;
  border-radius: 50%;
  cursor: pointer !important;
  display: flex;
  flex-flow: column nowrap;
  height: 40px;
  justify-content: center;
  margin: 0;
  padding: 0;
  transition: all 150ms;
  width: 40px;

  .icon-cross {
    @include cross(20px, #fff, 6px);
  }

  &:hover,
  &:focus {
    transform: rotateZ(90deg);
    background: hsl(216, 100, 40);
  }

}

// For screen readers.
.visually-hidden {
  position: absolute !important;
  clip: rect(1px, 1px, 1px, 1px);
  padding: 0 !important;
  border: 0 !important;
  height: 1px !important;
  width: 1px !important;
  overflow: hidden;
}
</style>
