import GridItem from './GridItem/GridItem.vue';
import GridLayout from './GridLayout/GridLayout.vue';

const VueFluidGridLayout = {
  GridItem,
  GridLayout,
};

export {
  GridItem,
  GridLayout,
};

/* eslint-disable  @typescript-eslint/no-explicit-any */
function install(app: any): void {
  if(app.$_VueFluidGridLayout) {
    return;
  }

  app.$_VueFluidGridLayout = true;
  (Object.keys(VueFluidGridLayout) as (keyof typeof VueFluidGridLayout)[]).forEach(name => {
    app.component(name, VueFluidGridLayout[name]);
  });
}

export default {
  VueFluidGridLayout,
  install,
};
