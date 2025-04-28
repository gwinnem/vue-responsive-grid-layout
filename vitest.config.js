import * as path from 'path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, `./src`),
    },
  },
  test: {
    environment: `jsdom`,
    globals: true,
    include: [`tests/*.spec.ts`, `tests/unit/*.spec.ts`],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      exclude: [
        './sandbox',
        './vitepress-docs',
        './docs',
        './dist',
        './tests',
        './vite.config.js',
        './vitest.config.js',
        './.*',
        './env.d.ts',
        './changelog.config.js',
        './src/vite-env.d.ts',
        './src/core/helpers/DOM.ts',
        './src/core/common/interfaces',
        './src/core/common/types',
        './src/core/common/enums',
        './src/core/griditem/enums',
        './src/core/griditem/interfaces',
        './src/core/gridlayout/enums',
        './src/core/gridlayout/interfaces',
        './src/hooks',
        './src/components/common',
        './src/components/index.ts',
        './src/components/Grid'
      ],
    },
  },
});
