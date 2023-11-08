import { defineConfig } from 'vite';
import * as path from 'path';
import vue from '@vitejs/plugin-vue';

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
