<template>
  <ExampleDemo title="Blocked-move feedback">
    <template #description>
      With <code>preventCollision</code> on, try dragging item "a" onto
      the static item "wall" — the drag is rejected and the item stays
      put, but nothing else signals that happened. Listening for
      <code>@move-blocked-by-collision</code> makes that moment visible
      (a brief flash below), without reimplementing collision detection
      against the layout array yourself.
    </template>

    <GridLayout v-model:layout="layout" :row-height="80" prevent-collision @move-blocked-by-collision="onBlocked">
      <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :is-static="item.isStatic" :w="item.w" :x="item.x" :y="item.y">
        <div class="example-item" :class="{ 'is-static': item.isStatic }">{{ item.i }}</div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <p class="demo-description">
        Last blocked move:
        <strong v-if="lastBlockedId" class="blocked-flash" :class="{ 'blocked-flash--active': isFlashing }">item "{{ lastBlockedId }}", {{ blockedCount }} time(s) total</strong>
        <em v-else>none yet — try dragging "a" onto "wall"</em>
      </p>
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: 'a', w: 2, x: 0, y: 0 },
  { h: 4, i: 'wall', isStatic: true, w: 2, x: 4, y: 0 },
]);

const lastBlockedId = ref<string | number | null>(null);
const blockedCount = ref(0);
const isFlashing = ref(false);
let flashTimeout: ReturnType<typeof setTimeout> | undefined;

/**
 * Bug fix: the description promised "a brief flash" here, but the
 * original implementation only ever updated plain text — no flash, no
 * animation of any kind, a real mismatch between what the example
 * claimed to demonstrate and what it actually did. Reported directly.
 * `isFlashing` toggles a CSS class on for a moment (see the scoped
 * style below), giving `@move-blocked-by-collision` an actual visible
 * moment to point at, matching the description's own claim. Re-firing
 * mid-flash (dragging repeatedly into the wall, exactly what someone
 * exploring this example would naturally do) restarts the timer via
 * a keyed re-render (`:key` below) rather than letting a stale
 * `clearTimeout`/`setTimeout` pair leave the flash stuck fully on or
 * cut short partway through.
 */
function onBlocked(id: string | number): void {
  lastBlockedId.value = id;
  blockedCount.value += 1;
  isFlashing.value = false;
  clearTimeout(flashTimeout);
  // Re-triggers the CSS animation even on a repeat block by forcing a
  // reflow between removing and re-adding the class — a plain
  // `isFlashing.value = true` alone would be a no-op if it was already
  // true from a previous, still-settling flash.
  requestAnimationFrame(() => {
    isFlashing.value = true;
    flashTimeout = setTimeout(() => {
      isFlashing.value = false;
    }, 500);
  });
}
</script>

<style scoped>
.blocked-flash {
  border-radius: 4px;
  display: inline-block;
  padding: 1px 4px;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.blocked-flash--active {
  background-color: var(--vp-c-danger-1, #e5484d);
  color: #fff;
}
</style>
