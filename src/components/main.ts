import type { App } from 'vue';
import {
  CustomCloseButton, CustomDragElement, GridItem, GridLayout,
} from '@/components';

export default {
  install: (app: App): void => {
    app.component(`CustomCloseButton`, CustomCloseButton);
    app.component(`CustomDragElement`, CustomDragElement);
    app.component(`GridItem`, GridItem);
    app.component(`GridLayout`, GridLayout);
  },
};

export {
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout,
};
