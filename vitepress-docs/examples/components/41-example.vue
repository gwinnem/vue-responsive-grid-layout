<template>
  <ExampleDemo title="Layout bounds & rendering options">
    <template #description>
      A handful of `GridLayout` options that don't have a dedicated
      example elsewhere. What to actually look for with each:
      <strong>maxRows: 3</strong> caps the grid at 3 rows — items that
      would overflow it get squeezed into the remaining columns instead
      of spilling past the boundary. <strong>restoreOnDrag</strong>
      holds off compaction until a drag actually ends, instead of
      compacting on every intermediate move — drag item "0" down and
      back with this on vs off to feel the difference.
      <strong>distributeEvenly</strong> spreads items that would
      otherwise overflow `maxRows` across columns more evenly, rather
      than just clamping them into whatever's left. `transformScale`
      compensates the drag/resize math for a scaled ancestor — this
      demo wraps the whole grid in a real `transform: scale(...)`, so
      dragging stays accurate at any zoom level below.
      `useCssTransforms` switches the item's own positioning mechanism
      between `transform: translate3d(...)` (the default, GPU-
      accelerated) and plain `top`/`left` — visually identical either
      way, so the readout below shows which one is actually in effect,
      live.
    </template>
    <template #controls>
      <label><input v-model="maxRowsEnabled" type="checkbox" /> maxRows: 3</label>
      <label><input v-model="restoreOnDrag" type="checkbox" /> restoreOnDrag</label>
      <label><input v-model="distributeEvenly" type="checkbox" /> distributeEvenly</label>
      <label>transformScale <input v-model.number="transformScale" max="2" min="0.5" step="0.1" type="number" /></label>
      <label><input v-model="useCssTransforms" type="checkbox" /> useCssTransforms</label>
    </template>

    <div class="demo-scale-wrap" :style="{ transform: `scale(${transformScale})`, transformOrigin: 'top left' }">
      <GridLayout
        ref="gridRef"
        v-model:layout="layout"
        :distribute-evenly="distributeEvenly"
        :max-rows="maxRowsEnabled ? 3 : Infinity"
        :restore-on-drag="restoreOnDrag"
        :row-height="60"
        :transform-scale="transformScale"
        :use-css-transforms="useCssTransforms"
      >
        <GridItem v-for="item in layout" :key="item.i" ref="itemRefs" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
          <div class="example-item">{{ item.i }}</div>
        </GridItem>
      </GridLayout>
    </div>

    <template #footer>
      <p>
        Item "0"'s own positioning right now:
        <strong>{{ positioningMechanism }}</strong>
      </p>
      <p>
        <button data-testid="calc-xy-button" type="button" @click="runCalcXY">
          Read item "0"'s own calcXY(50, 50)
        </button>
        <span v-if="calcXyResult"> → x: {{ calcXyResult.x }}, y: {{ calcXyResult.y }}</span>
      </p>
      <LayoutJsonViewer :layout="layout" />
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 4, x: 0, y: 0 },
  { h: 2, i: '1', w: 4, x: 4, y: 0 },
  { h: 2, i: '2', w: 4, x: 8, y: 0 },
]);

const maxRowsEnabled = ref(false);
const restoreOnDrag = ref(false);
const distributeEvenly = ref(false);
const transformScale = ref(1);
const useCssTransforms = ref(true);
const gridRef = ref<InstanceType<typeof GridLayout>>();

// Bug fix (missing-feature fix, really — `useCssTransforms` itself now
// works correctly, see the library-level fix in docs/REFACTORING.md):
// toggling this switches between two mechanisms that render visually
// identically, so there was no way to actually see the toggle do
// anything without opening devtools. Reading the real, current inline
// style back out of the rendered DOM (not duplicating the toggle's own
// state, which would just echo the control rather than confirm the
// grid itself changed) and displaying it directly makes the effect
// visible here.
const positioningMechanism = ref('');

const refreshPositioningReadout = async (): Promise<void> => {
  await nextTick();
  const el = gridRef.value?.$el?.querySelector<HTMLElement>(`[data-grid-item-id="0"]`);
  if (!el) {
    return;
  }
  positioningMechanism.value = el.style.transform
    ? `transform: ${el.style.transform}`
    : `top: ${el.style.top}, left: ${el.style.left}`;
};

watch(useCssTransforms, refreshPositioningReadout, { immediate: true });

// GridItem's own exposed calcXY(top, left) — converts a pixel position
// to the equivalent grid-unit x/y, using this item's own current
// colWidth/rowHeight/margin. A low-level utility; rarely needed
// directly since drag/resize already handle this internally, but
// useful for e.g. snapping an externally-dropped element's raw pixel
// coordinates to the grid yourself.
// Vue collects same-named refs inside a v-for into an array, in
// render order — itemRefs[0] is item "0" here since it's rendered
// first.
const itemRefs = ref<InstanceType<typeof GridItem>[]>([]);
const calcXyResult = ref<{ x: number; y: number } | null>(null);
function runCalcXY(): void {
  calcXyResult.value = itemRefs.value[0]?.calcXY(50, 50) ?? null;
}
</script>
