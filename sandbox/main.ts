import App from './App.vue'
import GridLayout from '../dist/vue-responsive-grid-layout.mjs'
import GridItem  from '../dist/vue-responsive-grid-layout.mjs'
import { createApp } from 'vue'

const app = createApp(App)

app.use(GridLayout)
app.use(GridItem)

app.mount('#app')
