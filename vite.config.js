import { defineConfig } from 'vite';
import * as path from 'path';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, `src/components/index.ts`),
      // Name of the library.
      fileName: `vue-fluid-grid-layout`,
      formats: [
        `es`,
        `umd`,
      ],
      name: `vue-fluid-grid-component`,
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
  optimizeDeps: {
    include: [`interactjs`],
  },
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, `./src`),
    },
  },
  server: {
    open: true,
    port: 9000,
  },
});
