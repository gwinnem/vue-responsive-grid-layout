# Architecture

This is the map a new contributor needs before changing `GridLayout.vue` or
`GridItem.vue` — the two components carry almost the entire library, and
their relationship isn't obvious from reading either file in isolation.

## Two entry points, not one

`src/components/index.ts` (the main package entry) is the Vue
components, their props/events, and everything that needs a live
component instance or DOM. `src/core/index.ts` (published as the
`/core` subpath — see `vitepress-docs/api/core.md`) is the pure
grid-layout math those components are built on: collision detection,
compaction, movement, alignment guides, breakpoint resolution,
serialization, and validation, with zero Vue dependency and no live
DOM required.

This split isn't new architecture — every function `/core` exports
already lived in `src/core/` and was already Vue-free before that
entry point existed. What changed was making it a *public* door, not a
new dependency direction. That did require one real fix first: several
of these helpers imported their shared types (`ILayoutItem`, `TLayout`,
etc.) via the main component barrel (`import { ILayoutItem } from
'@/components'`) rather than the type-only file that actually defines
them (`@/components/Grid/layout-definition`) — harmless while
everything shipped as one bundle, since TypeScript types are erased at
compile time either way, but exactly the kind of import path that
would risk silently pulling the entire Vue component tree into a
"Vue-free" bundle if a bundler's tree-shaking ever proved less
thorough than assumed. Every such import in `src/core/` was redirected
to the direct, type-only file before `/core` shipped — see
`docs/REFACTORING.md` for the specific files.

`/core` is built as its own Vite config (`vite.core.config.js`), not a
second entry in the main `vite.config.js`, because Vite doesn't
support multiple entry points when any output format includes `umd` —
and the main library needs to keep shipping a UMD build for script-
tag/CDN consumers. `/core` only needs `es`/`cjs`, which don't have
that restriction.

## Pluggable compaction (`compactType` and `compactor` props)

`GridLayout`'s own compaction calls (drag end, resize end, mount,
breakpoint change, `compactNow()`) all route through a single
`runCompaction()` helper (in `GridLayout.vue`), which checks
`props.compactor` (an `ICompactor`, from
`src/core/gridlayout/helpers/compactor.ts`) first, falling back to
`getCompactor(props.compactType)` — the built-in strategy matching
whichever of the five `ECompactType` values is selected. `compactor`
being `null` (the default) means "use whichever built-in strategy
`compactType` selects" — this is a purely additive override, not a
replacement for that prop, which keeps working the same either way.
`verticalCompactor`/`horizontalCompactor`/`noCompactor`/
`verticalOverlapCompactor`/`horizontalOverlapCompactor` (the five
built-ins `compactor`'s own default falls back to, via `getCompactor`)
are exported from both the main entry and `/core`. `compactType`
replaced an earlier, separate `verticalCompact: boolean` prop that only
covered two of these five strategies — see `docs/REFACTORING.md` for
the full rationale and `MIGRATION.md` for the exact mapping.

## Undo/redo (`enableUndoRedo` prop)

Opt-in (`false` by default — a real memory cost otherwise), snapshot-
at-committed-change granularity, not per intermediate drag-move frame.
`commitUndoPoint(before)` takes the pre-mutation layout explicitly as
an argument, rather than reading a single shared "last known state"
implicitly — a design correction made *before* shipping, after tracing
through why an implicit read doesn't work for a gesture: calling it at
`dragstart` (before anything has moved) can only ever see "nothing's
changed yet," since the actual change happens later, at `dragend`.
`dragstart`/`resizestart` instead only *capture* a local snapshot
(`dragStartSnapshot`/`resizeStartSnapshot`); the actual commit happens
at `dragend`/`resizeend`, *after* the position update and compaction
have already run, passing that captured snapshot in as `before`. The
length watcher (item add/remove) and `compactNow()` don't need this
two-step split — both fire (or, for `compactNow()`, are called)
*after* their own mutation already happened, so `commitUndoPoint` gets
a real "before" state either from the shared `lastSnapshot` (updated
only by a successful commit, never by the mutation itself) or a
locally-captured one, either way already correct by the time it's
read. See `docs/REFACTORING.md` #80 for the full account of the bug
this correction fixed.

## The two components and how they talk to each other

```
<GridLayout>              <-- owns the layout array, breakpoints, eventBus
  <slot />                <-- consumer renders <GridItem> elements here
  <GridItem />            <-- the drag placeholder, rendered internally
</GridLayout>
```

A consumer renders `GridItem`s themselves, inside `GridLayout`'s default
slot (see `demo/views/*.vue` for real examples) — `GridLayout` does not
create your items for you. It creates exactly one extra, hidden `GridItem`
itself: the drag placeholder shown while dragging/resizing.

`GridLayout` and every `GridItem` communicate two ways, and both matter:

### 1. `$parent`

`GridItem` reads `proxy?.$parent` and casts it to `IGridLayoutProps &
ILayoutData` (see `GridItem.vue`'s `thisLayout` constant). This works
*because* GridItem is always rendered as a direct child of GridLayout's
template (via the default slot), so Vue's real parent-child relationship
lines up with the logical one. `GridLayout`'s `defineExpose({ ...props,
width, lastBreakpoint, layouts, ... })` call is what makes those properties
visible through `$parent` — Vue 3 restricts a `<script setup>` component's
public instance (what `$parent`/template refs can see) to whatever it
explicitly exposes, so if a prop or field isn't in that `defineExpose` call,
`GridItem` cannot read it this way, silently.

If you add a piece of `GridLayout` state that `GridItem` needs to read
(e.g. a new prop, or an internal ref), it has to be added to
`defineExpose(...)` or `thisLayout.whatever` will just be `undefined` —
this is the single most common "why isn't my prop reaching GridItem" bug
shape in this codebase.

**`thisLayout` is a one-time snapshot, not a live reactive reference —
this is the second most common bug shape, and a more subtle one.**
`defineExpose({ ...props, ... })` spreads the props object's *current
values* into a new plain object once, when `defineExpose` runs during
setup. `thisLayout.margin` (or any other spread prop) will never reflect
a later change to that prop, no matter how many times it's read —
confirmed directly: reading a mounted `GridLayout`'s own exposed
`wrapper.vm.someProp` before and after changing that prop returns the
same value both times. A `watch(() => thisLayout?.someProp, ...)` in
`GridItem.vue` will silently never fire — see
`docs/REFACTORING.md` #26, where exactly this cost `margin` its ability to
update after mount for years. If a `GridLayout` setting needs to reach
already-mounted `GridItem`s after the fact, it needs the `setXxx` eventBus
pattern below — `thisLayout` is only safe to read once, at mount.

### 2. The `eventBus`

`GridLayout` creates a `mitt()` instance and `provide()`s it under the key
`eventBus`; every `GridItem` `inject()`s it. This is the *other* direction
of communication — GridLayout pushing updates down to potentially many
GridItems at once (a prop-based approach would mean GridLayout re-rendering
every item on every relevant change; the eventBus lets it push targeted
updates instead) and GridItems reporting drag/resize activity back up.

There is no single place that documents every event — the closest thing is
this table, kept in sync by hand (there's no compiler check that GridLayout
emits what GridItem expects, or vice versa; see `REFACTORING.md` for the
class of bug that causes):

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `changeDirection` | Layout → Item | `boolean` (isMirrored) | RTL toggle |
| `compact` | Layout → Item | — | "recompute your style, something upstream changed" |
| `setBounded` / `setDraggable` / `setResizable` / `setShowCloseButton` | Layout → Item | `boolean` | Prop cascades — only applied by items whose own prop is `null` (see `setDraggableHandler` etc. in `GridItem.vue`). `setShowCloseButton` was added later (see `docs/REFACTORING.md` #31) — the other three had this from the start. |
| `setColNum` / `setMaxRows` / `setRowHeight` / `setTransformScale` | Layout → Item | `number` | Layout-level config cascades |
| `setMargin` | Layout → Item | `number[]` | `[horizontal, vertical]` margin cascade — see `docs/REFACTORING.md` #26 for why this one needed its own eventBus message rather than relying on `thisLayout` |
| `updateWidth` | Layout → Item | `number` | Container width, for grid-unit↔pixel math |
| `dragEvent` / `resizeEvent` | Item → Layout | `IEventsData` | An item reporting drag/resize progress; GridLayout uses this to move other items out of the way and update the placeholder |

If you're adding a new cascading setting, follow the `setXxx` pattern:
`GridLayout` watches its own prop and `eventBus.emit('setXxx', value)`;
`GridItem` has a small handler function registered via `eventBus.on('setXxx',
handler)` in the eventbus registration block, and deregistered in
`onBeforeUnmount`. Forgetting the `onBeforeUnmount` half leaks a listener
per unmounted `GridItem`.

## Inside `GridItem.vue`: the composable split

`GridItem.vue` used to be 1,345 lines with drag logic, resize logic, and
rendering all interleaved. It's now four files (line counts approximate
and will keep drifting as features are added — re-measured directly
against the current source rather than carried forward from when this
section was first written):

```
GridItem.vue                        (~1,140 lines)
  ├─ props, emits, eventBus wiring
  ├─ shared layout state (cols, containerWidth, rowHeight, margin,
  │  innerX/Y/W/H, renderRtl, bounded, resizeHandleRefs)
  ├─ createStyle() / classObj — rendering, using both composables' output
  └─ watchers that call into both composables' exposed functions

composables/useGridItemDrag.ts      (~295 lines)
  └─ isDragging, dragging, calcXY, handleDrag, tryMakeDraggable

composables/useGridItemResize.ts    (~535 lines)
  └─ isResizing, resizing, calcWH, calcPosition, handleResize,
     tryMakeResizable, autoSize — grew substantially past its original
     ~340 lines once RTL resize direction got the same per-edge
     independent-condition treatment the LTR case already had (see
     docs/REFACTORING.md #25 and #53)

composables/useGridItemKeyboard.ts  (~140 lines)
  └─ handleKeydown — the keyboard-operable alternative to
     mouse/touch drag and resize (see docs/ACCESSIBILITY.md). Depends on
     the *resolved* `draggable`/`resizable` refs from the two composables
     above (not the raw, possibly-`null`-meaning-"inherit" props), so it's
     constructed last, after both.
```

**Why the split isn't "clean" in the zero-coupling sense.** All three
interaction composables take a wide context object
(`IGridItemComposableContext` in `composables/grid-item-composable-context.ts`)
because the underlying state genuinely is shared: all three need the container's
measured width, and both drag and keyboard need to know when a
resize is in progress or resolved-draggable/resizable state
(`IGridItemDragContext` extends the base context with
`isResizing`, which is why `useGridItemResize` is constructed first in
`GridItem.vue`, and the keyboard composable's context extends it with the
resolved `draggable`/`resizable` refs, which is why it's constructed
last — get any of this construction order backwards and the dependent
composable reads `undefined` instead of the value it needs).

The point of the split isn't to eliminate that coupling — it's real,
physical (drag/resize act on the same DOM element, via the same
native pointer-driven engine; keyboard reuses drag/resize's own
resolved state and event paths on purpose, see below) — but to give
each concern its own file, its own name, and (as of the Phase 1
test-infrastructure work) the ability to be exercised through
`GridItem`'s public behavior without reading 1,300 lines to find the
relevant 200.

**`useGridItemKeyboard` deliberately reuses drag/resize's own event path**
rather than inventing a parallel one: a keyboard move emits the same
`MOVE`/`MOVED` events and the same eventBus `dragEvent` message
(`eventType: 'dragend'`) the mouse-driven composable emits on release, and
a keyboard resize does the same for `RESIZE`/`RESIZED`/`resizeEvent`. This
means `GridLayout`'s compaction/collision handling — already tested
against the mouse path — applies identically without needing its own
keyboard-specific handling on the `GridLayout` side at all.

**`calcPosition` lives in the resize composable**, not the main component,
even though `createStyle()` (rendering, in the main component) calls it —
it's returned from `useGridItemResize` for exactly that reason. It ended up
there because `tryMakeResizable()`'s min/max-size calculation and
`handleResize()`'s pixel math are its two other call sites, both
resize-specific; `createStyle()` importing it from the composable was less
code than duplicating it or inventing a fourth module for one function.

## Native drag/resize engine wiring

Both composables lazily wire up the native pointer-driven engine
(`src/core/helpers/native-interaction.ts`) once per `GridItem`:
`useGridItemDrag.ts`'s `tryMakeDraggable()` calls `createNativeDraggable`
on `gridItem.value` (the item's own root element — the whole item is the
drag handle), and `useGridItemResize.ts`'s `tryMakeResizable()` calls
`createNativeResizable` on the same root plus the 8 resize-hint spans as
individual hit targets, one per edge/corner. Unlike interact.js's own
`.draggable(opts)`/`.resizable(opts)`, which needed re-invoking on every
relevant prop/state change to reconfigure an existing `Interactable`,
the native engine reads `draggable`/`resizable`/`isStatic`/
`dragAllowFrom`/`dragIgnoreFrom`/`resizeIgnoreFrom` fresh via a
`getOptions()` callback on every `pointerdown` — so `tryMakeDraggable()`/
`tryMakeResizable()` only need to actually attach anything once; every
call after the first (from the same watchers that used to call
`.draggable()`/`.resizable()` repeatedly) is a no-op. Each also stores its
own teardown handle (`teardownDraggable`/`teardownResizable`), called from
`GridItem.vue`'s `onBeforeUnmount` — the replacement for interact.js's own
`interactObj.value.unset()`.

Both `onPointerDown` handlers enforce one gesture at a time per element
(a `pointerId !== null` guard, checked before starting a new one) —
interact.js's own `Interactable` had this invariant implicitly; the
native engine's first version didn't carry it over explicitly, which
was a real bug (a second concurrent pointer — two fingers on the same
item, or an accidental palm touch mid-drag — could silently hijack
tracking and abandon the first gesture's own `dragend`/`resizeend`; see
docs/REFACTORING.md #77) rather than just an untested edge case.

`autoScroll` (when the prop is on) is backed by
`createNativeAutoScroll()` — a `requestAnimationFrame` loop started on
`dragstart`/`resizestart`, fed the latest pointer position on every
`dragmove`/`resizemove`, and stopped on `dragend`/`resizeend`.
`preserveAspectRatio` is implemented directly in `handleResize`'s
`resizemove` case rather than via a separate modifier object: the
dimension not directly driven by the active edge(s) is derived from the
one that is, using the ratio captured at `resizestart`.

See `docs/REFACTORING.md` for the full account of what replaced
interact.js and why the migration was more tractable than it might
sound — the actual interact.js surface this project used turned out to
be narrow (start/move/end callbacks, `allowFrom`/`ignoreFrom` filtering,
per-edge resize targets, and the aspect-ratio modifier), since the grid
math itself (collision, compaction, snapping) was always this
library's own code, never interact.js's.

## Cross-grid drag/drop: a second, module-level "eventBus" for talking between `GridLayout` instances

Everything above this point is about one `GridLayout` and its own
`GridItem` children, connected via `provide`/`inject`'s `eventBus` —
that mechanism only works within a single component's descendant tree.
`allowCrossGridDrag` needed *separate* `GridLayout` instances, frequently
with no Vue ancestor/descendant relationship to each other at all, to
find one another.

`src/core/gridlayout/helpers/cross-grid-registry.ts` is the answer: a
plain module-level `Set`, not Vue reactive state and not
`provide`/`inject`. Every `GridLayout` with `allowCrossGridDrag` set
registers an `ICrossGridZone` record of itself on mount (its `layoutId`,
a `getRect()` getter read fresh on every lookup rather than cached, live
reads of its own `disableExternalDrop`, and `acceptDrop`/`rejectDrop`
callbacks) and deregisters on unmount. `findCrossGridZoneAt(x, y,
excludeLayoutId)` is the only lookup either side needs — a linear scan
over whatever's currently registered, which is fine at the scale this
feature operates at (a handful of grids on a page, not hundreds).

The actual drag tracking lives in `composables/useCrossGridDrag.ts`
(extracted from `GridLayout.vue`'s `dragEvent()` — see
docs/REFACTORING.md #68): `dragstart` records the dragged item's id
(only when `allowCrossGridDrag` is on), and `dragend` checks
`findCrossGridZoneAt` against the pointer's current position. That
comes from `clientX`/`clientY` on the `eventBus` `dragEvent` payload
(`IEventsData`) — sourced directly from the native drag engine's own
event object in `useGridItemDrag.ts`'s `handleDrag`, the same
coordinates the drag itself is already using.
`GridLayout.vue`'s own `dragEvent()` calls the composable's
`handleDragStart`/`handleDragEnd` at the same two points this logic used
to live inline, and treats a `true` return from `handleDragEnd` (item
accepted by another grid) as a signal to `return` immediately rather
than also running its own normal end-of-drag handling — every side
effect the accept path needs (removing the item from this grid's
layout, compaction, the relevant emits) already ran inside the
composable by that point. An earlier version tracked pointer position
via a separate `document`-level `mousemove` listener instead, which
turned out not to fire reliably during an active drag on a real browser
(see docs/REFACTORING.md #35) — cross grid drops silently
never completed, always falling through to the normal intra-grid
drag-end path. See docs/REFACTORING.md #34 for the rest of the
mechanics and the bugs that came up building the feature — notably that
this file's existing convention of mutating `props.layout` in place
(never replacing the array) applies here too, and broke the first
version of the accept/remove logic when it didn't.

## `allowOutsideDrop`: plain native `addEventListener`, no eventBus or registry needed

Architecturally the simplest of the three drag-related features
(in-grid, cross-grid, outside), because it's the only one that never
needs to coordinate with anything else — a `GridLayout` with
`allowOutsideDrop` set only ever cares about drags happening directly
over its own root element, from a source (`draggable="true"`, not a
`GridItem` or another `GridLayout`) it has no ongoing relationship with
before or after the drop. No `provide`/`inject` eventBus (that's for a
`GridLayout` and its own `GridItem` children), no module-level registry
(that's specifically for cross-grid discovery). Lives in its own
`composables/useOutsideDrop.ts` (extracted alongside
`useCrossGridDrag.ts` — see docs/REFACTORING.md #68), which attaches
`dragenter`/`dragover`/`dragleave`/`drop` listeners directly to
`refsLayout.value` via `addEventListener`, gated by the prop and
reactive to it changing after mount (register/deregister on toggle,
same pattern `useCrossGridDrag`'s own registry entry uses).

The live preview reuses `GridLayout`'s own existing `placeholder`/
`isDragging` state — the same one a normal in-grid drag already drives —
rather than introducing a second, parallel preview mechanism just for
this. On drop, `EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE` fires with
the resolved position and the native `DataTransfer` object; `layout`
itself is never touched, since a plain draggable element could represent
anything — only the consumer's own handler, reading `dataTransfer` back,
knows what (if anything) should actually be added. See
docs/REFACTORING.md #43 for the two HTML5-drag-and-drop-specific gotchas
this ran into (`preventDefault()` being required in `dragover`, and the
enter-count workaround `dragenter`/`dragleave` bubbling needs) and why
`allowOutsideDrop` isn't named anything with "external" in it, despite
`disableExternalDrop` already existing for a completely different
purpose.

## `GridLayout.vue`: the responsive-breakpoint composable

`useResponsiveLayout` (`composables/useResponsiveLayout.ts`) owns the
per-breakpoint layout cache (`layouts`), the currently active breakpoint
(`lastBreakpoint`), and `responsiveGridLayout()` — the function that finds
or generates the right layout for the current container width and swaps to
it. It's a lighter extraction than GridItem's split: the coupling here is
narrower (mainly `originalLayout` and `width`, both passed in through the
composable's context), so the composable owns more of its own state
independently.

## `GridLayout.vue`: the undo/redo composable

`useUndoRedo` (`composables/useUndoRedo.ts`) owns `undoStack`/
`redoStack`/`canUndo`/`canRedo` and the commit/capture mechanics
(`commitUndoPoint`, `undo`, `redo`) — extracted from directly inside
`GridLayout.vue` (a code-review finding on that file's own size, not a
bug fix), alongside the two other similarly-scoped, self-contained
blocks that were candidates for the same treatment (multi-select is
still inline as of this writing).

The trickiest part of this extraction wasn't the public API
(`undo`/`redo`/`canUndo`/`canRedo`, unchanged) — it was three pieces of
plain (non-reactive) internal state (`lastSnapshot`, `dragStartSnapshot`,
`resizeStartSnapshot`) that `dragEvent`/`resizeEvent`/the
`props.layout.length` watcher/`onMounted` all needed to read or write,
none of which belong to those call sites conceptually. Rather than
exposing the raw variables (which would just move the coupling instead
of encapsulating it), the composable exposes named, purpose-specific
methods instead: `captureDragStart`/`commitDragEnd` (called at
`dragstart`/`dragend`), `captureResizeStart`/`commitResizeEnd` (same,
for resize), `initLastSnapshot` (called once at `onMounted`), and
`commitFromLastSnapshot` (called from the length watcher). Every
external call site now reads as "what is happening" rather than
"reach into this composable's internal state directly" — the same
principle `useCrossGridDrag`'s own `handleDragStart`/`handleDragEnd`
already follows for its own internal state.

`runCompaction` is passed into the composable as a dependency (`undo()`/
`redo()` both call it after restoring a layout, since the restored
layout isn't guaranteed to already be fully compacted) — the composable
doesn't own compaction itself, it just depends on it, the same relationship
`useCrossGridDrag`/`useOutsideDrop` already have with `updateHeight`.

## Alignment guides: a pure helper, not another composable

`showAlignmentGuides` follows a different pattern than the composables
above — deliberately not extracted into its own `useAlignmentGuides.ts`,
since the actual computation (`findAlignmentGuides` in
`core/gridlayout/helpers/alignment-helper.ts`) is a pure function with no
internal state of its own: given the active item's live position/size
and the rest of the layout, it returns which edges align. `GridLayout.vue`
owns the only state involved (`alignmentGuides`, a plain ref) and calls
the pure function from inside `dragEvent`/`resizeEvent`'s existing
move/start branches, right after the placeholder position updates
there — reusing an existing hook point rather than adding a parallel
watcher. Rendering (`alignmentGuideStyles`, converting grid units to
pixels) is a separate `computed`, guarded to skip the conversion
entirely when there's nothing to render or the container hasn't been
measured yet (see `docs/REFACTORING.md` #60 for why that guard is load-bearing,
not defensive — the pixel-conversion helper it calls throws on an
unmeasured width, and this computed is read directly in the template on
every render regardless of whether guides are active).

## Testing implications

See `docs/TESTING.md` for the full picture, but the short version relevant
to this file: `GridLayout` and `GridItem` are tested together
(`tests/helpers/mountGrid.ts` mounts a real `GridLayout` with real
`GridItem` children in its slot), because that's the only way to exercise
the `$parent`/`eventBus` contract above the way production actually uses
it. Testing `GridItem` with a hand-rolled fake parent would validate a
contract that might not match what `GridLayout` actually provides.
