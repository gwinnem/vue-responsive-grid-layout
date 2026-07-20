import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useLayoutStorage } from '../src/composables/useLayoutStorage';

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

const settle = async (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe(`useLayoutStorage`, () => {
  it(`Should save the current layout to the given storage`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const { save } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });

    save();

    expect(storage.getItem(`key`)).toBe(JSON.stringify(layout.value));
  });

  it(`Should strip the internal moved field when saving`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, moved: true, w: 2, x: 0, y: 0 }]);
    const { save } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });

    save();

    expect(JSON.parse(storage.getItem(`key`)!)[0]).not.toHaveProperty(`moved`);
  });

  it(`Should load a previously saved layout and replace layout.value`, () => {
    const storage = new MemoryStorage();
    storage.setItem(`key`, JSON.stringify([{ h: 3, i: `saved`, w: 3, x: 1, y: 1 }]));
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    const { load } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    const result = load();

    expect(result).toBe(true);
    expect(layout.value).toStrictEqual([{ h: 3, i: `saved`, w: 3, x: 1, y: 1 }]);
  });

  it(`Should return false and leave layout.value untouched when nothing is stored`, () => {
    const storage = new MemoryStorage();
    const original = [{ h: 2, i: `0`, w: 2, x: 0, y: 0 }];
    const layout = ref(original);

    const { load } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    const result = load();

    expect(result).toBe(false);
    expect(layout.value).toStrictEqual(original);
  });

  it(`Should return false and leave layout.value untouched when the stored value is malformed`, () => {
    const storage = new MemoryStorage();
    storage.setItem(`key`, `not valid json {`);
    const original = [{ h: 2, i: `0`, w: 2, x: 0, y: 0 }];
    const layout = ref(original);

    const { load } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    const result = load();

    expect(result).toBe(false);
    expect(layout.value).toStrictEqual(original);
  });

  it(`Should auto-load from storage by default`, () => {
    const storage = new MemoryStorage();
    storage.setItem(`key`, JSON.stringify([{ h: 3, i: `saved`, w: 3, x: 1, y: 1 }]));
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    useLayoutStorage(`key`, layout, { storage });

    expect(layout.value).toStrictEqual([{ h: 3, i: `saved`, w: 3, x: 1, y: 1 }]);
  });

  it(`Should not auto-load when autoLoad is false`, () => {
    const storage = new MemoryStorage();
    storage.setItem(`key`, JSON.stringify([{ h: 3, i: `saved`, w: 3, x: 1, y: 1 }]));
    const original = [{ h: 2, i: `0`, w: 2, x: 0, y: 0 }];
    const layout = ref(original);

    useLayoutStorage(`key`, layout, { autoLoad: false, storage });

    expect(layout.value).toStrictEqual(original);
  });

  it(`Should clear the stored value`, () => {
    const storage = new MemoryStorage();
    storage.setItem(`key`, JSON.stringify([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]));
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    const { clear } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    clear();

    expect(storage.getItem(`key`)).toBeNull();
  });

  it(`Should report hasSaved correctly before and after a save`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    const { save, hasSaved } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    expect(hasSaved()).toBe(false);

    save();
    expect(hasSaved()).toBe(true);
  });

  it(`Should auto-save (debounced) when autoSave is true`, async () => {
    vi.useFakeTimers();
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    useLayoutStorage(`key`, layout, { autoLoad: false, autoSave: true, debounceMs: 100, storage });

    layout.value = [{ h: 2, i: `0`, w: 4, x: 0, y: 0 }];
    await vi.advanceTimersByTimeAsync(150);

    expect(storage.getItem(`key`)).toBe(JSON.stringify(layout.value));
    vi.useRealTimers();
  });

  it(`Should debounce rapid successive changes into a single save, not one per change`, async () => {
    vi.useFakeTimers();
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const setItemSpy = vi.spyOn(storage, `setItem`);

    useLayoutStorage(`key`, layout, { autoLoad: false, autoSave: true, debounceMs: 100, storage });

    layout.value = [{ h: 2, i: `0`, w: 3, x: 0, y: 0 }];
    await vi.advanceTimersByTimeAsync(20);
    layout.value = [{ h: 2, i: `0`, w: 4, x: 0, y: 0 }];
    await vi.advanceTimersByTimeAsync(20);
    layout.value = [{ h: 2, i: `0`, w: 5, x: 0, y: 0 }];
    await vi.advanceTimersByTimeAsync(150);

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(storage.getItem(`key`)!)[0].w).toBe(5);
    vi.useRealTimers();
  });

  it(`Should not auto-save when autoSave is false (the default)`, async () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    layout.value = [{ h: 2, i: `0`, w: 4, x: 0, y: 0 }];
    await settle();

    expect(storage.getItem(`key`)).toBeNull();
  });

  it(`Should not throw when window/storage isn't available (SSR)`, () => {
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);
    const originalWindow = globalThis.window;
    // @ts-expect-error -- intentionally simulating an environment where this global doesn't exist at all
    delete globalThis.window;

    let helper: ReturnType<typeof useLayoutStorage> | undefined;
    expect(() => {
      helper = useLayoutStorage(`key`, layout);
    }).not.toThrow();
    expect(helper?.load()).toBe(false);
    expect(() => helper?.save()).not.toThrow();
    expect(() => helper?.clear()).not.toThrow();
    expect(helper?.hasSaved()).toBe(false);

    globalThis.window = originalWindow;
  });

  it(`Should use window.localStorage by default when no storage option is passed`, () => {
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    const { save } = useLayoutStorage(`useLayoutStorage-default-test-key`, layout, { autoLoad: false });
    save();

    expect(window.localStorage.getItem(`useLayoutStorage-default-test-key`)).toBe(JSON.stringify(layout.value));
    window.localStorage.removeItem(`useLayoutStorage-default-test-key`);
  });

  it(`Should use an explicitly-passed storage even when window is available`, () => {
    const storage = new MemoryStorage();
    const layout = ref([{ h: 2, i: `0`, w: 2, x: 0, y: 0 }]);

    const { save } = useLayoutStorage(`key`, layout, { autoLoad: false, storage });
    save();

    expect(storage.getItem(`key`)).not.toBeNull();
    expect(window.localStorage.getItem(`key`)).toBeNull();
  });
});
