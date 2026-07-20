<!--
  The default close button rendered inside a `GridItem` when
  `showCloseButton` is true. Also exported standalone from the package's
  public entry point in case a consumer wants to render the same button
  (e.g. in a custom header) and wire it to the same `remove-grid-item`
  event manually.
-->
<template>
  <button
    aria-label="Close"
    class="btn-close"
    type="button"
    @click="removeItem">
    <span
      aria-hidden="true"
      class="icon-cross"></span>
  </button>
</template>

<script lang="ts" setup>
  import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';

  export interface ICustomCloseButtonProps {
    /** The id of the `GridItem` this button removes when clicked. `-1` (the default) is treated as "no item" and the click is a no-op. */
    i?: string | number;
  }

  const props = withDefaults(defineProps<ICustomCloseButtonProps>(), {
    i: -1,
  });

  const emit = defineEmits<{
    (e: EGridItemEvent.REMOVE_ITEM, value: string | number): void;
  }>();

  /** Emits `EGridItemEvent.REMOVE_ITEM` with the configured `i`, unless `i` is the default `-1` sentinel. */
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
