import { GridLayout, GridItem } from '/vue-ts-responsive-grid-layout.';

export function useComponents(app) {
  app.component('grid-layout', GridLayout);
  app.component('grid-item', GridItem);
}
