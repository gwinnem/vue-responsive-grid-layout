import DefaultTheme from 'vitepress/theme';
import './styles/index.css';

export default {
  ...DefaultTheme,
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
  },
};
