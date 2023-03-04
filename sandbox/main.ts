import App from './App.vue'
// @ts-ignore
import { GridLayout, GridItem, CustomCloseButton, CustomDragElement } from 'vue-ts-responsive-grid-layout';
import { createApp } from 'vue'

const app = createApp(App)

app.use(GridLayout)
app.use(GridItem)

app.mount('#app')

export default {
  // CustomCloseButton,
  // CustomDragElement,
  GridItem,
  GridLayout
};
