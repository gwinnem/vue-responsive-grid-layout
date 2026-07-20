# outsideDropAccept & readOutsideDropPayload

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" allow-outside-drop :outside-drop-accept="acceptOnlyOurWidgets">
  ...
</GridLayout>
```

```ts
import { readOutsideDropPayload } from 'vue-ts-responsive-grid-layout';

function acceptOnlyOurWidgets(dataTransfer: DataTransfer | null): boolean {
  // Checked in dragenter/dragover/drop — dataTransfer.types is
  // available throughout a drag, unlike getData()'s actual values,
  // which the native HTML5 API only exposes at drop.
  return !!dataTransfer?.types.includes('application/x-example-widget');
}

function onDropped(payload: { dataTransfer: DataTransfer | null /* ...x/y/w/h */ }) {
  const data = readOutsideDropPayload<{ label: string }>(payload.dataTransfer, 'application/x-example-widget');
  // data is the parsed payload, or null if nothing was set under that
  // MIME type, or what was there wasn't valid JSON — never throws.
}
```

Without `outsideDropAccept`, any `draggable="true"` element anywhere on
the page can trigger the live placeholder and drop handling — including
drags a consumer never intended to be droppable there (a native OS file
drag, or an unrelated draggable element from a third-party widget on
the same page). The predicate returning `false` means no
`preventDefault()` is called, so the browser shows its own native
"not allowed" cursor instead of this grid's placeholder.

<script setup>
import CustomComponent from './components/34-example.vue';
</script>
