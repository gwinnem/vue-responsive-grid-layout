import DefaultTheme from 'vitepress/theme';
import './styles/index.css';
import './styles/examples.css';
import ExampleDemo from './components/ExampleDemo.vue';
import ExampleToggle from './components/ExampleToggle.vue';
import ExampleNumberField from './components/ExampleNumberField.vue';
import LayoutJsonViewer from './components/LayoutJsonViewer.vue';

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
    ctx.app.component('ExampleDemo', ExampleDemo);
    ctx.app.component('ExampleToggle', ExampleToggle);
    ctx.app.component('ExampleNumberField', ExampleNumberField);
    ctx.app.component('LayoutJsonViewer', LayoutJsonViewer);
  },
};
