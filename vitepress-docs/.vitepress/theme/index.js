import DefaultTheme from 'vitepress/theme';
import 'vitepress-theme-demoblock/dist/theme/styles/index.css';
// import { useComponents } from './useComponents';
import './styles/index.css';
import { GridItem, GridLayout } from '../../../dist/vue-fluid-grid-layout.mjs';


export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
    ctx.app.component('GridLayout', GridLayout);
    ctx.app.component('GridItem', GridItem);
    // useComponents(ctx.app);
    // ctx.app.component('XLButton', Button);
  },
};
