# Localizable ARIA strings

<CustomComponent/>

## Code

```vue
<!-- Grid-wide default, applies to every item that doesn't override it -->
<GridLayout v-model:layout="layout" :aria-labels="{ closeButton: 'Cerrar', moveInstruction: 'Presiona las flechas para mover.' }">
  ...
  <!-- Per-item override -->
  <GridItem :aria-labels="{ closeButton: 'Fermer' }" ...>
</GridLayout>
```

```ts
import type { IGridAriaLabels } from 'vue-ts-responsive-grid-layout';

const labels: IGridAriaLabels = {
  closeButton: 'Cerrar',                                       // default: 'Close'
  itemRoleDescription: 'Elemento arrastrable y redimensionable', // default: 'Draggable, resizable item'
  moveInstruction: 'Presiona las flechas para mover.',           // default: 'Press arrow keys to move.'
  resizeInstruction: 'Presiona shift más flechas para redimensionar.', // default: 'Press shift plus arrow keys to resize.'
};
```

Merges three layers, each only overriding the keys it actually sets:
built-in English defaults <- `GridLayout`'s own `ariaLabels` (a
grid-wide override) <- a specific `GridItem`'s own `ariaLabels` (a
per-item override). You only need to supply the keys you actually want
to change — anything left unset falls through to the next layer down.

Deliberately a small, fixed set of props, not a full i18n system — no
pluralization, no ICU message format, no locale negotiation. If you
have a real translation pipeline, wire its output into these props;
this just makes the strings reachable instead of baked into the
component.

<script setup>
import CustomComponent from './components/36-example.vue';
</script>
