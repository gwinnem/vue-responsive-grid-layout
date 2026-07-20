import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useLayoutPresets } from '../src/composables/useLayoutPresets';

/** A minimal in-memory Storage implementation, so these tests exercise the custom-`storage` option explicitly rather than only ever going through jsdom's own localStorage. */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe(`useLayoutPresets`, () => {
  it(`Should save and load a named preset`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { savePreset, loadPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    savePreset(`compact`);
    layout.value = [{ h: 4, i: `0`, w: 4, x: 0, y: 0 }];

    const result = loadPreset(`compact`);

    expect(result).toBe(true);
    expect(layout.value).toStrictEqual([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
  });

  it(`Should support multiple distinct named presets independently`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { savePreset, loadPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    savePreset(`compact`);
    layout.value = [{ h: 6, i: `0`, w: 6, x: 0, y: 0 }];
    savePreset(`detailed`);

    loadPreset(`compact`);
    expect(layout.value[0].w).toBe(2);

    loadPreset(`detailed`);
    expect(layout.value[0].w).toBe(6);
  });

  it(`Should return false and leave layout untouched when loading a preset that doesn't exist`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { loadPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    const result = loadPreset(`does-not-exist`);

    expect(result).toBe(false);
    expect(layout.value).toStrictEqual([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
  });

  it(`Should list every saved preset name`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { savePreset, listPresets } = useLayoutPresets(`dashboard`, layout, { storage });

    expect(listPresets()).toStrictEqual([]);

    savePreset(`compact`);
    savePreset(`detailed`);

    expect(listPresets()).toStrictEqual([`compact`, `detailed`]);
  });

  it(`Should report hasPreset correctly`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { savePreset, hasPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    expect(hasPreset(`compact`)).toBe(false);
    savePreset(`compact`);
    expect(hasPreset(`compact`)).toBe(true);
  });

  it(`Should delete a preset, after which it's no longer listed or loadable`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { savePreset, deletePreset, listPresets, loadPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    savePreset(`compact`);
    deletePreset(`compact`);

    expect(listPresets()).toStrictEqual([]);
    expect(loadPreset(`compact`)).toBe(false);
  });

  it(`Should not throw deleting a preset that doesn't exist`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { deletePreset } = useLayoutPresets(`dashboard`, layout, { storage });

    expect(() => deletePreset(`does-not-exist`)).not.toThrow();
  });

  it(`Should keep presets for different keys fully independent`, () => {
    const storage = new MemoryStorage();
    const layoutA = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const layoutB = ref([{ h: 4, i: `0`, w: 4, x: 0, y: 0 }]);
    const presetsA = useLayoutPresets(`dashboard-a`, layoutA, { storage });
    const presetsB = useLayoutPresets(`dashboard-b`, layoutB, { storage });

    presetsA.savePreset(`compact`);
    presetsB.savePreset(`compact`);

    expect(presetsA.listPresets()).toStrictEqual([`compact`]);
    expect(presetsB.listPresets()).toStrictEqual([`compact`]);

    presetsA.deletePreset(`compact`);
    expect(presetsA.listPresets()).toStrictEqual([]);
    expect(presetsB.listPresets()).toStrictEqual([`compact`]);
  });

  it(`Should not throw and should no-op when window/storage is unavailable (SSR)`, () => {
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const originalWindow = globalThis.window;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).window;

    try {
      const { savePreset, loadPreset, listPresets, hasPreset, deletePreset } = useLayoutPresets(`dashboard`, layout);

      expect(() => savePreset(`compact`)).not.toThrow();
      expect(loadPreset(`compact`)).toBe(false);
      expect(listPresets()).toStrictEqual([]);
      expect(hasPreset(`compact`)).toBe(false);
      expect(() => deletePreset(`compact`)).not.toThrow();
    } finally {
      globalThis.window = originalWindow;
    }
  });

  it(`Should default to window.localStorage when no custom storage option is provided`, () => {
    // Every other test in this file passes an explicit MemoryStorage —
    // this is the one exercising the actual default path (hasWindow()
    // true, no storage option), previously never covered.
    window.localStorage.clear();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { savePreset, loadPreset, hasPreset } = useLayoutPresets(`dashboard-default-storage`, layout);

    savePreset(`compact`);
    expect(hasPreset(`compact`)).toBe(true);
    expect(window.localStorage.getItem(`dashboard-default-storage`)).not.toBeNull();

    layout.value = [];
    expect(loadPreset(`compact`)).toBe(true);
    expect(layout.value).toStrictEqual([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    window.localStorage.clear();
  });

  it(`Should treat entirely invalid JSON in the presets storage key as "no presets" rather than throwing`, () => {
    const storage = new MemoryStorage();
    storage.setItem(`dashboard`, `this is not valid json {{{`);
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { listPresets, loadPreset, hasPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    expect(() => listPresets()).not.toThrow();
    expect(listPresets()).toStrictEqual([]);
    expect(loadPreset(`compact`)).toBe(false);
    expect(hasPreset(`compact`)).toBe(false);
  });

  it(`Should treat valid JSON that isn't a plain object (an array, a number, a string) as "no presets" rather than throwing`, () => {
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    for (const corruptValue of [`[1,2,3]`, `42`, `"just a string"`, `null`]) {
      const storage = new MemoryStorage();
      storage.setItem(`dashboard`, corruptValue);
      const { listPresets } = useLayoutPresets(`dashboard`, layout, { storage });

      expect(listPresets()).toStrictEqual([]);
    }
  });

  it(`Should return false, not throw, when a specific saved preset's own stored value is a malformed layout`, () => {
    const storage = new MemoryStorage();
    // A well-formed presets object, but the "compact" entry's own value
    // isn't a serialized layout at all — simulating storage corruption
    // affecting one preset without affecting the whole blob's own JSON
    // validity.
    storage.setItem(`dashboard`, JSON.stringify({ compact: `not a serialized layout` }));
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const originalLayout = layout.value;
    const { loadPreset, hasPreset } = useLayoutPresets(`dashboard`, layout, { storage });

    expect(hasPreset(`compact`)).toBe(true);
    expect(loadPreset(`compact`)).toBe(false);
    // layout.value should be left completely untouched, not partially
    // overwritten with whatever deserializeLayout managed to salvage.
    expect(layout.value).toBe(originalLayout);
  });
});
