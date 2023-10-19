import DefaultTheme from 'vitepress/theme';
// import { useComponents } from './useComponents';
import './styles/index.css';

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
//   ctx.app.component('GridLayout', GridLayout);
//   ctx.app.component('GridItem', GridItem);
    // useComponents(ctx.app);
  },
};
