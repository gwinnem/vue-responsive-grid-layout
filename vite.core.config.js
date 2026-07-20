import { defineConfig } from 'vite';
import * as path from 'path';
import dts from 'vite-plugin-dts';

// Separate config file, not a second entry in vite.config.js's own
// `build.lib.entry` map, because Vite doesn't support multiple entry
// points when the output formats include `umd`/`iife` — and the main
// library build needs to keep shipping a UMD bundle for script-tag/CDN
// consumers. `es`/`cjs` don't have that restriction, and are the only
// formats a Vue-free "core utilities" entry actually needs — a global-
// variable UMD build makes little sense for a package whose whole
// point is being importable without any component/runtime wiring.
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, `src/core/index.ts`),
      fileName: format => `vue-ts-responsive-grid-layout-core.${format}.js`,
      formats: [
        `es`,
        `cjs`,
      ],
      name: `vue-ts-responsive-grid-layout-core`,
    },
    outDir: `./dist/core`,
    rollupOptions: {
      // No `external`/`globals` needed — this entry has no runtime
      // dependencies at all (confirmed via the import-path audit in
      // docs/REFACTORING.md), Vue included.
    },
  },
  define: { 'process.env': {} },
  plugins: [
    dts({
      entryRoot: `src/core`,
      outDir: `dist/types/core`,
      tsconfigPath: `./tsconfig.build-types-core.json`,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, `./src`),
    },
  },
});
