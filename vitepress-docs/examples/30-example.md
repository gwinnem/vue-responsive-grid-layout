# Blocked-move feedback

<CustomComponent/>

## Code

```vue
<GridLayout v-model:layout="layout" prevent-collision @move-blocked-by-collision="onBlocked">
  ...
</GridLayout>
```

```ts
function onBlocked(id: string | number): void {
  lastBlockedId.value = id;
  blockedCount.value += 1;
  // Toggle a CSS class on briefly (see this example's own component
  // for the full re-trigger-safe version) — any visible cue works:
  // a flash, a shake, a toast. The point is giving the person a
  // moment to actually notice, not just updating text silently.
  isFlashing.value = true;
  setTimeout(() => { isFlashing.value = false; }, 500);
}
```

Fires whenever `preventCollision` actually blocks a drag or resize —
on drag, when the item is rejected entirely and stays at its pre-move
position; on resize, whenever the requested size gets clamped at all
(a resize can still partially succeed, unlike a fully-rejected drag).
Without this event, a blocked move looks identical to "the pointer
hasn't moved yet" from a consumer's perspective — there's no other
signal that a collision was actually the reason nothing happened.

<script setup>
import CustomComponent from './components/30-example.vue';
</script>
