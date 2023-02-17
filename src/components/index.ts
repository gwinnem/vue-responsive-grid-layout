import GridItem from './Grid/GridItem.vue';
import GridLayout from './Grid/GridLayout.vue';
import CustomCloseButton from './common/CustomCloseButton.vue';
import CustomDragElement from './common/CustomDragElement.vue';

const components = {
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout,
};

function install(app: any): void {
  if(app.VueResponsiveGridLayout) {
    return;
  }

  app.VueResponsiveGridLayout = true;
  (Object.keys(components) as (keyof typeof components)[]).forEach(name => {
    app.component(name, components[name]);
  });
}

export {
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout,
};

export default {
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout,
  install,
};
