import { App } from 'vue';
import GridItem from './Grid/GridItem.vue';
import GridLayout from './Grid/GridLayout.vue';

export { GridItem, GridLayout };

const components = [GridLayout, GridItem];

const VueResponsiveGridLayout = {
  install(App: App): void {
    components.forEach(item => {
      App.component(item.name, item);
    });
  },
};

export default VueResponsiveGridLayout;
