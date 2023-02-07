import App from './App.vue'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import GridLayout from '../src/components/index';
import { createApp } from 'vue'

const app = createApp(App)

app.use(GridLayout)

app.mount('#app')
