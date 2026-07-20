---
aside: false
---

# Persistence

Saves/loads a `v-model:layout` ref to `localStorage` (or any
`Storage`-compatible backend). See
[v-model & save/load layout](/examples/19-example) for a full working
example.

## `useLayoutStorage(key, layout, options?)`

```ts
function useLayoutStorage(
  key: string,
  layout: Ref<TLayout>,
  options?: IUseLayoutStorageOptions,
): IUseLayoutStorage;
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | Storage key to read/write under. |
| `layout` | `Ref<TLayout>` | The ref this composable reads from (on save) and writes to (on load). |
| `options` | `IUseLayoutStorageOptions` | See below. |

### `IUseLayoutStorageOptions`

| Option | Type | Default | Description |
|---|---|---|---|
| `storage` | `Storage` | `window.localStorage` | Accepts anything satisfying the standard `Storage` interface — `sessionStorage`, or a test double. |
| `autoLoad` | `boolean` | `true` | Calls `load()` once immediately, synchronously, before the composable returns. |
| `autoSave` | `boolean` | `false` | Watches `layout` (deep) and calls `save()` automatically, debounced by `debounceMs`. |
| `debounceMs` | `number` | `500` | Debounce window for `autoSave`. |

`autoSave` defaults to `false` deliberately: a grid actively being dragged
mutates `layout` continuously, and an eager auto-save would write far
more often than actually needed even with debouncing. An explicit
`save()` call — a button, or a specific `@resizeend`/`@dragend` handler —
is the safer default; turn `autoSave` on once you've decided how often
you actually want writes to happen.

### `IUseLayoutStorage` (return value)

| Method | Signature | Description |
|---|---|---|
| `save` | `() => void` | Serializes the current `layout.value` and writes it to storage under `key`. |
| `load` | `() => boolean` | Reads `key` from storage; if a valid layout is found, replaces `layout.value` and returns `true`. Returns `false` and leaves `layout.value` untouched otherwise (nothing stored, malformed JSON, or an invalid layout shape). |
| `clear` | `() => void` | Removes `key` from storage entirely. Does not modify `layout.value`. |
| `hasSaved` | `() => boolean` | Whether storage currently holds *anything* under `key` — not whether it's valid; use `load()`'s return value to check that. |

### Example

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, useLayoutStorage, type TLayout } from 'vue-ts-responsive-grid-layout';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
]);

// autoLoad (default true) restores the last-saved layout immediately;
// autoSave persists every change, debounced.
const { save, clear } = useLayoutStorage('my-dashboard', layout, { autoSave: true });
</script>
```

### SSR safety

Every storage access is guarded behind a `typeof window` check — calling
`useLayoutStorage` during a server render doesn't throw. `load()` returns
`false`, and `save()`/`clear()` are no-ops, until the client re-hydrates
and real browser JS runs.

## `serializeLayout(layout)` / `deserializeLayout(json)`

The plain, storage-agnostic functions `useLayoutStorage` is built on —
use these directly for a non-browser backend (a file, an API request
body) or outside Vue's reactivity system entirely.

```ts
function serializeLayout(layout: TLayout): string;
function deserializeLayout(json: string | null | undefined): TLayout | null;
```

`serializeLayout` strips the internal `moved` field (set by the
compaction/collision helpers to short-circuit infinite loops while
cascading moves — not meaningful state to persist) before calling
`JSON.stringify`.

`deserializeLayout` never throws: malformed JSON, a valid JSON value
that isn't an array, or an array that doesn't match the layout item
shape (checked with the same validator `GridLayout` itself uses at
mount) all return `null` rather than propagating a parse or validation
error.

```ts
import { serializeLayout, deserializeLayout } from 'vue-ts-responsive-grid-layout';

const json = serializeLayout(layout.value);
// ... write json somewhere ...

const restored = deserializeLayout(json);
if (restored !== null) {
  layout.value = restored;
}
```

## `useLayoutPresets(key, layout, options?)`

Named layout presets — beyond `useLayoutStorage`'s single-slot
persistence, save and switch between several named arrangements of the
*same* items (e.g. a "compact" and a "detailed" view of the same
dashboard). Layered on top of `serializeLayout`/`deserializeLayout`
rather than duplicating that logic. See
[Named layout presets](/examples/35-example).

```ts
function useLayoutPresets(
  key: string,
  layout: Ref<TLayout>,
  options?: IUseLayoutPresetsOptions,
): IUseLayoutPresets;
```

| Parameter | Type | Description |
|---|---|---|
| `key` | `string` | Storage key all of this `layout`'s presets are grouped under. Use a different `key` per distinct grid/dashboard if a page has more than one. |
| `layout` | `Ref<TLayout>` | The ref presets are saved from and loaded into. |
| `options` | `IUseLayoutPresetsOptions` | `{ storage?: Storage }` — same convention as `useLayoutStorage`'s own `storage` option. |

### `IUseLayoutPresets` (return value)

| Method | Signature | Description |
|---|---|---|
| `savePreset` | `(name: string) => void` | Serializes the current `layout.value` and saves it under `name`, overwriting any existing preset with the same name. |
| `loadPreset` | `(name: string) => boolean` | Loads the preset saved under `name`. Returns `false` (leaving `layout.value` untouched) if no preset exists under that name, or its stored value isn't a valid layout. |
| `deletePreset` | `(name: string) => void` | Removes the preset saved under `name`. A no-op if it doesn't exist. |
| `listPresets` | `() => string[]` | Every currently-saved preset name, in the order they were first saved. |
| `hasPreset` | `(name: string) => boolean` | Whether a preset exists under `name`. |

Stores every preset for a given `key` together, as a single
`{ [name]: serializedLayoutJson }` object under one storage key — one
`Storage` read/write per operation, rather than one per preset. Same
SSR-safety as `useLayoutStorage`.

```ts
import { useLayoutPresets } from 'vue-ts-responsive-grid-layout';

const { savePreset, loadPreset, listPresets } = useLayoutPresets('my-dashboard', layout);

savePreset('compact');
loadPreset('compact');
listPresets(); // ['compact', ...]
```
