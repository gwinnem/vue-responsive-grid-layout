// Don't remove this file, because it registers the demo components.
import { GridLayout, GridItem } from '../../../dist/vue-fluid-grid-layout.mjs';

// import Example02Events fro

export function useComponents(app) {
  app.component('grid-layout', GridLayout);
  app.component('grid-item', GridItem);
}
