<!--
  A small drag-handle widget, exported for consumers to place inside a
  `GridItem`'s slot content when they want dragging restricted to a single
  handle rather than the whole item — pair it with `GridItem`'s
  `dragAllowFrom` prop (e.g. `drag-allow-from=".vue-draggable-handle"`) so
  only this element starts a drag.

  Not used anywhere internally in this library; it's a standalone opt-in
  utility component, exported from the package's public entry point
  alongside `CustomCloseButton`.
-->
<template>
  <span class="text">
    <button>{{ props.text }}</button>
    <span class="vue-draggable-handle"></span>
  </span>
</template>

<script lang="ts" setup>

  export interface ICustomDragElementProps {
    /** Label rendered inside the handle's button. Default `'x'`. */
    text?: string;
  }

  const props = withDefaults(defineProps<ICustomDragElementProps>(), {
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

  // Positioned at 14px, not flush against the corner (0px, the
  // original value here) — interact.js's own default resize-edge
  // margin for mouse input is ~10px, and a handle sitting inside that
  // margin lands in a zone where resize's edge-proximity detection and
  // this handle's drag-allow region both consider themselves active
  // for the same pointer-down, regardless of resizeIgnoreFrom (which
  // excludes by DOM target, not by shrinking interact.js's own margin
  // zone around the excluded element). See docs/REFACTORING.md #64.
  left: 14px;
  padding: 0 8px 8px 0;
  position: absolute;
  top: 14px;
  width: 20px;
}
</style>
