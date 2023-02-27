import App from './App.vue'
// @ts-ignore
import { GridLayout, GridItem, CustomCloseButton, CustomDragElement } from 'vue-responsive-grid-layout';
// import GridLayout from '../src/components/Grid/GridLayout.vue';
// import GridItem  from '../src/components/Grid/GridItem.vue';
import { createApp } from 'vue'

const app = createApp(App)

app.use(GridLayout)
app.use(GridItem)

app.mount('#app')

export default {
  CustomCloseButton,
  CustomDragElement,
  GridItem,
  GridLayout
};
