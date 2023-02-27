import GridItem from './Grid/GridItem.vue';
import GridLayout from './Grid/GridLayout.vue';
import CustomCloseButton from './common/CustomCloseButton.vue';
import CustomDragElement from './common/CustomDragElement.vue';
import { TLayout, TLayoutItem, TResponsiveLayout } from '@/components/Grid/layout-definition';

// const components = {
//   CustomCloseButton,
//   CustomDragElement,
//   GridItem,
//   GridLayout,
// };

// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-ignore
// function install(Vue: any): void {
//   if(Vue.VueResponsiveGridLayout) {
//     return;
//   }
//
//   Vue.VueResponsiveGridLayout = true;
//   (Object.keys(components) as (keyof typeof components)[]).forEach(name => {
//     Vue.component(name, components[name]);
//   });
// }

// export default {
// // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// // @ts-ignore
//   install: (app): void => {
//     if(app.VueResponsiveGridLayout) {
//       return;
//     }
//
//     app.VueResponsiveGridLayout = true;
//     (Object.keys(components) as (keyof typeof components)[]).forEach(name => {
//       app.component(name, components[name]);
//     });
//   },
// };

export {
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout,
};

export type { TLayout, TLayoutItem, TResponsiveLayout };

// export default {
//   CustomCloseButton,
//   CustomDragElement,
//   GridItem,
//   GridLayout,
//   install,
// };
