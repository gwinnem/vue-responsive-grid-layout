# Named layout presets

<CustomComponent/>

## Code

```ts
import { useLayoutPresets } from 'vue-ts-responsive-grid-layout';

const { savePreset, loadPreset, deletePreset, listPresets, hasPreset } = useLayoutPresets('my-dashboard', layout);

savePreset('compact');           // saves the current layout under this name
loadPreset('compact');           // returns false (no-op) if it doesn't exist
listPresets();                  // ['compact', 'detailed', ...]
hasPreset('compact');            // true
deletePreset('compact');
```

Stores every named preset for a given key together, as a single
`{ [name]: serializedLayoutJson }` object under one storage key — one
`Storage` read/write per operation, rather than one per preset and no
separate index needed to know what's been saved. Use a different key
per distinct grid/dashboard if a page has more than one. Same
`Storage`-compatible `storage` option and SSR-safety as
[`useLayoutStorage`](/examples/19-example) — this is for the
several-named-arrangements case; reach for `useLayoutStorage` directly
for the simpler single-layout one.

<script setup>
import CustomComponent from './components/35-example.vue';
</script>
