# v-model & save / load layout

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout">...</GridLayout>
```

```ts
import { useLayoutStorage } from 'vue-ts-responsive-grid-layout';

const { save, load, hasSaved } = useLayoutStorage('my-layout', layout, { autoLoad: false });
```

`v-model:layout` is exactly `:layout="layout" @update:layout="v => layout = v"`
— there's nothing special about the array itself, so anywhere you'd persist
normal application state (`localStorage`, a backend API, a database) works.

`useLayoutStorage` handles the two things a hand-rolled
`localStorage.setItem('my-layout', JSON.stringify(layout.value))` has to
account for manually: stripping the internal `moved` field (set by the
compaction/collision helpers, not meant to round-trip through storage)
before saving, and returning `false` from `load()` rather than throwing
when nothing valid is stored. It defaults to `localStorage` and to
auto-loading on creation (`autoLoad: true`) — this example turns that off
to show an explicit "Load saved layout" button instead, but for a
"restore my last session automatically" use case, the default is usually
what you want. Pass any other `Storage`-compatible backend (`sessionStorage`,
a custom implementation) via the `storage` option.

Need the underlying logic without Vue's reactivity system involved (a
non-browser storage backend, or a different framework)? `serializeLayout`/
`deserializeLayout` are the plain functions this composable is built on,
exported separately.

<script setup>
import CustomComponent from './components/19-example.vue';
</script>
