import { Ref } from 'vue';
import { TLayout } from '@/components/Grid/layout-definition';
import { deserializeLayout, serializeLayout } from '@/core/helpers/layout-storage';

/** Options for {@link useLayoutPresets}, all optional. */
export interface IUseLayoutPresetsOptions {
  /**
   * Where to persist presets. Defaults to `window.localStorage`. Accepts
   * anything satisfying the standard `Storage` interface — same
   * convention as `useLayoutStorage`'s own `storage` option.
   */
  storage?: Storage;
}

export interface IUseLayoutPresets {
  /** Serializes the current `layout.value` and saves it under `name`, overwriting any existing preset with the same name. */
  savePreset: (name: string) => void;
  /**
   * Loads the preset saved under `name` into `layout.value`. Returns
   * `false` (leaving `layout.value` untouched) if no preset exists under
   * that name, or its stored value isn't a valid layout — same
   * "nothing usable was there" convention `useLayoutStorage`'s own
   * `load()` uses, rather than throwing.
   */
  loadPreset: (name: string) => boolean;
  /** Removes the preset saved under `name`. A no-op if it doesn't exist. */
  deletePreset: (name: string) => void;
  /** Every currently-saved preset name, in the order they were first saved. */
  listPresets: () => string[];
  /** Whether a preset exists under `name`. */
  hasPreset: (name: string) => boolean;
}

const hasWindow = (): boolean => typeof window !== `undefined`;

/**
 * Named layout presets — beyond the single `v-model:layout` +
 * `useLayoutStorage`'s one-slot persistence, a way to save and switch
 * between several named arrangements of the *same* items (e.g. a
 * "compact view" and a "detailed view" of the same dashboard widgets).
 * Layers on top of `useLayoutStorage`'s own building blocks
 * (`serializeLayout`/`deserializeLayout`) rather than replacing them —
 * reach for `useLayoutStorage` directly for the simpler single-layout
 * case, and this when a consumer specifically needs several named ones.
 *
 * Stores every preset for a given `key` together, as a single
 * `{ [name]: serializedLayoutJson }` object under one storage key —
 * one `Storage` read/write per operation, rather than one per preset,
 * and no separate index needed to know what's been saved.
 *
 * SSR-safe: every storage access is guarded behind a `typeof window`
 * check, same as `useLayoutStorage` — every method is a silent no-op
 * (returning `false`/`[]` where applicable) during a server render
 * rather than throwing.
 *
 * @param key Storage key all of this `layout`'s presets are grouped under. Use a different `key` per distinct grid/dashboard if a page has more than one.
 * @param layout The `ref<TLayout>` presets are saved from and loaded into.
 * @param options See {@link IUseLayoutPresetsOptions}.
 */
export function useLayoutPresets(
  key: string,
  layout: Ref<TLayout>,
  options: IUseLayoutPresetsOptions = {},
): IUseLayoutPresets {
  const { storage } = options;

  const resolveStorage = (): Storage | null => {
    if(storage) {
      return storage;
    }
    return hasWindow() ? window.localStorage : null;
  };

  const readAllPresets = (): Record<string, string> => {
    const target = resolveStorage();
    if(!target) {
      return {};
    }
    const raw = target.getItem(key);
    if(!raw) {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if(parsed && typeof parsed === `object` && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
      return {};
    } catch{
      return {};
    }
  };

  const writeAllPresets = (presets: Record<string, string>): void => {
    resolveStorage()?.setItem(key, JSON.stringify(presets));
  };

  const savePreset = (name: string): void => {
    if(!resolveStorage()) {
      return;
    }
    const presets = readAllPresets();
    presets[name] = serializeLayout(layout.value);
    writeAllPresets(presets);
  };

  const loadPreset = (name: string): boolean => {
    const presets = readAllPresets();
    const raw = presets[name];
    if(!raw) {
      return false;
    }
    const parsed = deserializeLayout(raw);
    if(parsed === null) {
      return false;
    }
    layout.value = parsed;
    return true;
  };

  const deletePreset = (name: string): void => {
    if(!resolveStorage()) {
      return;
    }
    const presets = readAllPresets();
    delete presets[name];
    writeAllPresets(presets);
  };

  const listPresets = (): string[] => Object.keys(readAllPresets());

  const hasPreset = (name: string): boolean => name in readAllPresets();

  return { savePreset, loadPreset, deletePreset, listPresets, hasPreset };
}
