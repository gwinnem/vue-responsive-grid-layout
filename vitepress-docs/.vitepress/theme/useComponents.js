// Don't remove this file, because it registers the demo components.
import { GridLayout, GridItem } from '../../../dist/vue-responsive-grid-layout.mjs';

export function useComponents(app) {
  app.component('grid-layout', GridLayout);
  app.component('grid-item', GridItem);
}
