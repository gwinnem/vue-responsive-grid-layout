// Vite/TypeScript ambient module declaration so `import Foo from './Foo.vue'`
// type-checks (TypeScript doesn't know how to type a .vue file's default
// export without this). Excluded from the published type declarations
// (see tsconfig.build-types.json) since it's a dev-time-only shim.
declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
