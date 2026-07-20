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
    setupFiles: [`./tests/setup.ts`],
    include: [`tests/*.spec.ts`, `tests/unit/*.spec.ts`],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/coverage',
      // Main library source only — demo app, sandbox, docs, config and
      // build output are all out of scope for the coverage gate.
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/vite-env.d.ts',
        // Pure type declarations: no JS is emitted for these, so there is
        // nothing runtime tests could ever cover.
        'src/core/common/interfaces/**',
        'src/core/common/types/**',
        'src/core/griditem/interfaces/**',
        'src/core/gridlayout/interfaces/**',
        'src/core/helpers/point.interface.ts',
        'src/components/Grid/layout-definition.ts',
        'src/components/Grid/grid-layout-props.interface.ts',
        'src/components/Grid/grid-item-props.interface.ts',
        'src/components/Grid/composables/grid-item-composable-context.ts',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
