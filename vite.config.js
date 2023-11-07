import { defineConfig } from 'vite';
import * as path from 'path';
import vue from '@vitejs/plugin-vue';
import stylelint from 'vite-plugin-stylelint';

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, `src/components/index.ts`),
      fileName: format => `vue-ts-responsive-grid-layout.${format}.js`,
      formats: [
        `es`,
        `umd`,
      ],
      name: `vue-ts-responsive-grid-layout`,
    },
    outDir: `./dist`,
    rollupOptions: {
      external: [`vue`],
      output: {
        globals: {
          vue: `Vue`,
        },
      },
    },
  },
  define: { 'process.env': {} },
  plugins: [
    vue(),
    stylelint({
      fix: true,
      include: [
        'src/**/*.{css,scss,sass,vue}'
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, `./src`),
    },
  },
  server: {
    open: false,
    port: 9000,
  },
});
