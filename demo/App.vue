<template>
  <div class="demo-shell">
    <nav class="demo-nav">
      <h1>vue-ts-responsive-grid-layout</h1>
      <ul>
        <li
          v-for="view in views"
          :key="view.id">
          <button
            :class="{ active: activeView === view.id }"
            :data-testid="`nav-${view.id}`"
            type="button"
            @click="activeView = view.id">
            {{ view.label }}
          </button>
        </li>
      </ul>
    </nav>
    <main class="demo-main">
      <component :is="views.find(v => v.id === activeView)?.component" />
    </main>
  </div>
</template>

<script lang="ts" setup>
  import { ref, shallowRef } from 'vue';
  import BasicGridView from './views/BasicGridView.vue';
  import DragResizeView from './views/DragResizeView.vue';
  import DynamicItemsView from './views/DynamicItemsView.vue';
  import ResponsiveView from './views/ResponsiveView.vue';
  import CrossGridView from './views/CrossGridView.vue';
  import ItemOverridesView from './views/ItemOverridesView.vue';
  import ExternalDropView from './views/ExternalDropView.vue';
  import AdvancedFeaturesView from './views/AdvancedFeaturesView.vue';

  const views = shallowRef([
    { id: 'basic', label: 'Basic grid', component: BasicGridView },
    { id: 'drag-resize', label: 'Drag & resize', component: DragResizeView },
    { id: 'dynamic', label: 'Add / remove items', component: DynamicItemsView },
    { id: 'responsive', label: 'Responsive breakpoints', component: ResponsiveView },
    { id: 'cross-grid', label: 'Cross-grid drag/drop', component: CrossGridView },
    { id: 'item-overrides', label: 'Per-item overrides', component: ItemOverridesView },
    { id: 'external-drop', label: 'Drag from outside (multi-grid)', component: ExternalDropView },
    { id: 'advanced-features', label: 'Layout tools & feedback', component: AdvancedFeaturesView },
  ]);

  const activeView = ref('basic');
</script>
