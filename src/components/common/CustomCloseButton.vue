<template>
  <button
    class="btn-close"
    type="button"
    @click="removeItem">
    <span class="icon-cross"></span>
  </button>
</template>

<script lang="ts" setup>
  import { EGridItemEvent } from '@/core/enums/EGridItemEvents';

  export interface IProps {
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
// $size  : px or em
// $color : color
// $thickness : px
@mixin cross($size: 20px, $color: currentColor, $thickness: 1px) {
  background: none;
  border: 0;
  height: $size;
  margin: 0;
  padding: 0;
  position: relative;
  width: $size;

  &:before,
  &:after {
    background: $color;
    border-radius: $thickness;
    content: '';
    height: $thickness;
    left: 0;
    position: absolute;
    right: 0;
    top: calc(($size - $thickness) / 2);
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

    // background: hsl(216, 100, 40%);
  }
}
</style>
