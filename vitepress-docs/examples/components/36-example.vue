<template>
  <ExampleDemo title="Localizable ARIA strings">
    <template #description>
      The close button's visually-hidden label, the item's
      <code>aria-roledescription</code>, and the keyboard move/resize
      instructions were previously hardcoded English literals.
      <code>ariaLabels</code> (grid-wide default on <code>GridLayout</code>,
      per-item override on <code>GridItem</code>) makes them overridable.
      All of these are deliberately visually hidden (screen-reader-only)
      in normal use, so switching languages below doesn't visibly change
      anything about the grid itself — the readout panel underneath
      shows the actual current strings, live, so the effect is visible
      here without needing devtools or a screen reader.
    </template>
    <template #controls>
      <ExampleToggle
        v-model="spanish"
        label="Use Spanish grid-wide labels" />
    </template>

    <GridLayout
      ref="gridRef"
      v-model:layout="layout"
      :aria-labels="gridAriaLabels"
      :row-height="80">
      <GridItem
        :h="layout[0].h"
        :i="layout[0].i"
        show-close-button
        :w="layout[0].w"
        :x="layout[0].x"
        :y="layout[0].y">
        <div class="example-item">
          Uses grid-wide labels
        </div>
      </GridItem>
      <GridItem
        :aria-labels="{ closeButton: 'Fermer' }"
        :h="layout[1].h"
        :i="layout[1].i"
        show-close-button
        :w="layout[1].w"
        :x="layout[1].x"
        :y="layout[1].y">
        <div class="example-item">
          Own override (French close button)
        </div>
      </GridItem>
    </GridLayout>

    <template #footer>
      <div class="aria-readout">
        <h4>Current ARIA strings (normally screen-reader-only)</h4>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>aria-roledescription</th>
              <th>Move/resize instructions</th>
              <th>Close button label</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in ariaReadout"
              :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.roleDescription }}</td>
              <td>{{ row.instructions }}</td>
              <td>{{ row.closeButtonLabel }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </ExampleDemo>
</template>

<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue';
  import { GridLayout, GridItem, type IGridAriaLabels, type TLayout } from 'vue-ts-responsive-grid-layout';

  const layout = ref<TLayout>([
    { h: 2, i: 'a', w: 6, x: 0, y: 0 },
    { h: 2, i: 'b', w: 6, x: 6, y: 0 },
  ]);

  const spanish = ref(false);
  const gridRef = ref<InstanceType<typeof GridLayout>>();

  const gridAriaLabels = computed<IGridAriaLabels>(() =>
    spanish.value
      ? {
        closeButton: 'Cerrar',
        itemRoleDescription: 'Elemento arrastrable y redimensionable',
        moveInstruction: 'Presiona las flechas para mover.',
        resizeInstruction: 'Presiona shift más flechas para redimensionar.',
      }
      : {},
  );

  // Bug fix (well, missing-feature fix — the strings themselves already
  // worked correctly): every one of the strings this example is about is
  // deliberately visually hidden in normal use, so toggling the language
  // above produced no visible change at all — the example's own
  // description said to "inspect the accessibility tree, or turn on a
  // screen reader" to see anything happen, which is a real barrier for
  // anyone just skimming the docs in a browser. Reading these same
  // values back out of the real, rendered DOM (not duplicating the
  // `ariaLabels` logic separately) and displaying them in an ordinary,
  // visible table makes the actual effect immediately visible without
  // either of those. Reported as "Localizable ARIA strings — unclear
  // demo purpose."
  interface IAriaReadoutRow {
    id: string;
    roleDescription: string;
    instructions: string;
    closeButtonLabel: string;
  }

  const ariaReadout = ref<IAriaReadoutRow[]>([]);

  const refreshAriaReadout = async (): Promise<void> => {
    await nextTick();
    const container = gridRef.value?.$el as HTMLElement | undefined;
    if(!container) {
      return;
    }
    ariaReadout.value = layout.value.map(item => {
      const el = container.querySelector<HTMLElement>(`[data-grid-item-id="${item.i}"]`);
      const closeButtonEl = el?.querySelector<HTMLElement>(`.btn-close .visually-hidden`);
      const instructionsEl = el ? container.querySelector<HTMLElement>(`#${el.getAttribute(`aria-describedby`)}`) : null;
      return {
        closeButtonLabel: closeButtonEl?.textContent?.trim() ?? '(none)',
        id: item.i,
        instructions: instructionsEl?.textContent?.trim().replace(/\s+/g, ' ') ?? '(none)',
        roleDescription: el?.getAttribute(`aria-roledescription`) ?? '(none)',
      };
    });
  };

  watch([spanish, layout], refreshAriaReadout, { immediate: true });
</script>

<style scoped>
.aria-readout {
  margin-top: 16px;
}

.aria-readout table {
  border-collapse: collapse;
  font-size: 0.85em;
  width: 100%;
}

.aria-readout th,
.aria-readout td {
  border: 1px solid var(--vp-c-divider);
  padding: 6px 10px;
  text-align: left;
}
</style>
