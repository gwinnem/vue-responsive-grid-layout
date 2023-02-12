import { App } from 'vue';
import GridItem from './Grid/GridItem.vue';
import GridLayout from './Grid/GridLayout.vue';

export { GridItem, GridLayout };

const components = [GridLayout, GridItem];

const Vue3GridLayout = {
  install(App: App): void {
    components.forEach(item => {
      App.component(item.name, item);
    });
  },
};

export default Vue3GridLayout;
