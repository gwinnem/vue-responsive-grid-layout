<template>
  <div>
    <span class="text">
      {{ text }}
    </span>
    <span
      class="remove"
      @click="$emit('removeItem', text)">x</span>
  </div>
</template>

<script lang="ts">
  export default {
    name: `TestElement`,
    props: {
      text: {
        type: String,
        default: `x`,
      },
    },
    mounted(): void {
      // eslint-disable-next-line no-console
      console.debug(`### ${this.text} ready!`);
    },
  };
</script>

<style lang="scss" scoped>
.remove {
  position: absolute;
  right: 2px;
  top: 0;
  cursor: pointer;
}
</style>
