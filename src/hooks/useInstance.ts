import { AppContext, ComponentInternalInstance, ComponentPublicInstance, getCurrentInstance } from 'vue';

/** Return shape of {@link useCurrentInstance}. */
export interface ICurrentInstance {
  appContext: AppContext;
  globalProperties: NonNullable<AppContext['config']['globalProperties']>;
  proxy: ComponentPublicInstance | null;
}

/**
 * Thin wrapper around Vue's `getCurrentInstance()`, used by `GridItem.vue`
 * purely to get at `proxy.$parent` (cast to `GridLayout`'s exposed shape —
 * see `docs/ARCHITECTURE.md` for why `$parent` is used instead of props).
 * Must be called synchronously during a component's `setup()`, like any
 * other composition API function — it will throw if called later (e.g.
 * inside a `setTimeout` or after an `await`).
 */
export default function useCurrentInstance(): ICurrentInstance {
  const { appContext, proxy } = getCurrentInstance() as ComponentInternalInstance;

  const { globalProperties } = appContext.config;

  return {
    appContext,
    globalProperties,
    proxy,
  };
}
