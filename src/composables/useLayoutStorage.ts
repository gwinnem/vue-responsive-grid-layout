import { Ref, watch } from 'vue';
import { TLayout } from '@/components/Grid/layout-definition';
import { deserializeLayout, serializeLayout } from '@/core/helpers/layout-storage';

/** Options for {@link useLayoutStorage}, all optional. */
export interface IUseLayoutStorageOptions {
  /**
   * Where to persist the layout. Defaults to `window.localStorage`.
   * Accepts anything satisfying the standard `Storage` interface
   * (`localStorage`, `sessionStorage`, or a custom implementation) —
   * pass one explicitly to use `sessionStorage` instead, or a test
   * double in a unit test.
   */
  storage?: Storage;
  /**
   * If `true`, calls `load()` once immediately (synchronously, before
   * this composable returns) rather than requiring an explicit call.
   * Default `true` — restoring a consumer's last-saved arrangement on
   * page load is the common case this composable exists for.
   */
  autoLoad?: boolean;
  /**
   * If `true`, watches `layout` (deep) and calls `save()` automatically
   * on every change, debounced by `debounceMs`. Default `false` — an
   * explicit `save()` call (e.g. on a "Save layout" button, or a
   * specific `@resizeend`/`@dragend` handler) is the safer default,
   * since a grid actively being dragged mutates `layout` continuously
   * and an un-debounced or overly-eager auto-save would write far more
   * often than actually needed.
   */
  autoSave?: boolean;
  /**
   * Debounce window, in milliseconds, for `autoSave`. Only relevant
   * when `autoSave` is `true`. Default `500`.
   */
  debounceMs?: number;
}

export interface IUseLayoutStorage {
  /** Serializes the current `layout.value` (via `serializeLayout` — stripping the internal `moved` field) and writes it to storage under `key`. */
  save: () => void;
  /**
   * Reads `key` from storage, and if a valid layout is found (via
   * `deserializeLayout`), replaces `layout.value` with it and returns
   * `true`. Leaves `layout.value` untouched and returns `false` if
   * nothing was stored, the stored value wasn't valid JSON, or it
   * didn't parse into a valid layout shape.
   */
  load: () => boolean;
  /** Removes `key` from storage entirely. Does not modify `layout.value`. */
  clear: () => void;
  /** Whether storage currently holds *anything* under `key` — not whether it's valid; use `load()`'s return value to check that. */
  hasSaved: () => boolean;
}

const hasWindow = (): boolean => typeof window !== `undefined`;

/**
 * Persists a `v-model:layout` ref to browser storage (or any
 * `Storage`-compatible backend) and restores it later, removing the
 * boilerplate every consumer doing this by hand otherwise has to
 * reimplement themselves: stripping the internal `moved` field before
 * saving, and handling a missing/malformed stored value gracefully on
 * load. See
 * [v-model & save/load layout](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/19-example.md)
 * for the manual pattern this replaces, and
 * `serializeLayout`/`deserializeLayout` if you need the underlying pure
 * functions directly (a non-`localStorage` backend, or a framework other
 * than Vue's own reactivity).
 *
 * SSR-safe: every storage access is guarded behind a `typeof window`
 * check (the same pattern `core/helpers/DOM.ts` already uses elsewhere
 * in this library, after a real SSR crash found and fixed — see
 * docs/REFACTORING.md #51). `autoLoad` and `autoSave` are silently
 * no-ops during a server render rather than throwing; the client
 * re-hydrates and this composable behaves normally once real browser JS
 * runs.
 *
 * @param key Storage key to read/write under.
 * @param layout The `ref<TLayout>` this composable reads from (on save) and writes to (on load).
 * @param options See {@link IUseLayoutStorageOptions}.
 */
export function useLayoutStorage(
  key: string,
  layout: Ref<TLayout>,
  options: IUseLayoutStorageOptions = {},
): IUseLayoutStorage {
  const { storage, autoLoad = true, autoSave = false, debounceMs = 500 } = options;

  const resolveStorage = (): Storage | null => {
    if(storage) {
      return storage;
    }
    return hasWindow() ? window.localStorage : null;
  };

  const save = (): void => {
    const target = resolveStorage();
    if(!target) {
      return;
    }
    target.setItem(key, serializeLayout(layout.value));
  };

  const load = (): boolean => {
    const target = resolveStorage();
    if(!target) {
      return false;
    }
    const parsed = deserializeLayout(target.getItem(key));
    if(parsed === null) {
      return false;
    }
    layout.value = parsed;
    return true;
  };

  const clear = (): void => {
    resolveStorage()?.removeItem(key);
  };

  const hasSaved = (): boolean => {
    const target = resolveStorage();
    return target !== null && target.getItem(key) !== null;
  };

  if(autoLoad) {
    load();
  }

  if(autoSave) {
    let debounceHandle: ReturnType<typeof setTimeout> | undefined;
    watch(
      layout,
      () => {
        if(debounceHandle !== undefined) {
          clearTimeout(debounceHandle);
        }
        debounceHandle = setTimeout(save, debounceMs);
      },
      { deep: true },
    );
  }

  return { save, load, clear, hasSaved };
}
