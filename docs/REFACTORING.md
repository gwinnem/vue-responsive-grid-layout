# Refactoring Suggestions

These are concrete findings from reading the current source, not generic
advice — each one points at a specific file and line. Ordered roughly by
effort-to-value ratio.

## Quick wins (low risk, do these first)

### 1. Dead conditional in `GridItem.vue` — done

```ts
// src/components/Grid/GridItem.vue, handleDrag()
let pos: ICalcXy;
if (renderRtl.value) {
  pos = calcXY(newPosition.top, newPosition.left);
} else {
  // TODO Change to newPosition.left to right
  pos = calcXY(newPosition.top, newPosition.left);
}
```

Both branches called `calcXY` with identical arguments — the RTL branch
was presumably meant to pass a mirrored `left`/`right` value but never
got filled in (see the `TODO`), silently doing nothing.

Checked directly rather than assumed still present: this exact pattern
no longer exists anywhere in the codebase (confirmed by grep — `handleDrag`
itself now lives in `useGridItemDrag.ts`, extracted from `GridItem.vue`
per the Structural section below). The RTL branch is now genuinely
differentiated, not dead, in both places that matter — `dragstart`
computes `newPosition.left` as `(cRight - pRight) * -1` for RTL vs.
`cLeft - pLeft` for LTR, and `dragmove` computes it as
`dragging.value.left - deltaX` for RTL vs. `+ deltaX` for LTR. Whichever
pass fixed this didn't record it as its own dedicated finding at the
time; noted here now since this section was being re-audited for
anything still actually open, and this specific item no longer is.

### 2. Duplicated geometry block in `handleDrag` — done

The `dragstart` and `dragend` cases used to compute the exact same six
values (`cLeft`, `pLeft`, `cRight`, `pRight`, `cTop`, `pTop`) with
identical code:

```ts
const tg = event.target as HTMLElement;
const parentTg = tg.offsetParent as HTMLElement;
const parentRect = parentTg.getBoundingClientRect();
const clientRect = tg.getBoundingClientRect();
const cLeft = clientRect.left / transformScale.value;
const pLeft = parentRect.left / transformScale.value;
const cRight = clientRect.right / transformScale.value;
const pRight = parentRect.right / transformScale.value;
const cTop = clientRect.top / transformScale.value;
const pTop = parentRect.top / transformScale.value;
```

Checked directly rather than assumed: this block now appears exactly
once in `useGridItemDrag.ts`, inside `dragstart` only. Resolved as a
side effect of finding #41's `dragend` fix, not a dedicated extraction —
that fix changed `dragend` to read the already-accumulated
`dragging.value.left`/`.top` directly instead of re-deriving position
via a fresh `getBoundingClientRect()` call (the race condition finding
#41 was actually about), which incidentally removed `dragend`'s own
copy of this geometry block entirely rather than just fixing its
result. No `getScaledEdgePositions`-style helper extraction ended up
needed, since there's only one call site left.

### 3. Dead files — done

- `src/components/Grid/DragItem.vue` (211 lines) was not exported from
  `src/components/index.ts`, with its only reference anywhere in the repo
  a commented-out block in `sandbox/App.vue`. Removed (see `CHANGELOG.md`'s
  "Removed" section).
- `src/core/helpers/layoutUtils.ts` was a 0-byte file. Removed.
- The CSS classes `.vue-resizable-handle` and `.vue-rtl-resizable-handle`
  in `GridItem.vue`'s `<style>` block targeted elements never rendered
  anywhere in the template — resizing is edge-detection on the item
  itself (`interactObj.value.resizable({ edges: {...} })`), not a
  visible handle element, confirmed by grepping the template for both
  class names and finding zero matches before removing the ~100 lines
  of scoped SCSS styling them. A nearby comment referencing
  `.vue-resizable-handle` as "the cosmetic icon below" was also stale
  once the CSS it pointed at was gone — updated rather than left
  dangling. Measured, not assumed: the built CSS shrank from 8.80 KB to
  6.63 KB (gzip: 1.73 KB to 1.43 KB) after removal, confirming this
  wasn't dead-in-name-only.

### 4. `@interactjs/dev-tools` in production source

Covered in `BUNDLE_ANALYSIS.md` — it's both a size problem and a code-hygiene
one: a devtools import has no place in library source that ships to npm.

### 5. Package metadata bugs

`"module"` missing its `dist/` prefix and `"typeings"` (typo of `types`) —
also covered in the bundle report, but worth flagging here too since they're
correctness bugs, not just size issues.

### 6. `npm run typecheck` used to fail

```
src/components/Grid/GridLayout.vue(721,9): error TS6133: 'rowHeightPx' is declared but its value is never read.
```

Root cause: `rowHeightPx` was a computed property whose only reference was
inside a fully commented-out block of the `<style>` section (a `grid::before`
rule using `v-bind(rowHeightPx)`, superseded by the active `.grid::before`
rule just below it). It had no live consumer at all. **Fixed in this pass**
by deleting the dead computed — `npm run typecheck` is clean now.

### 7. `hasWindow` was never called in `DOM.ts`

```ts
const hasWindow = (): boolean => typeof window !== `undefined`;

export const addWindowEventListener = (event, callback) => {
  if (!hasWindow) {          // always false — hasWindow is a function reference, always truthy
    callback();
    return false;
  }
  window.addEventListener(event, callback);
  return true;
};
```

Missing `()` meant the "no window" branch (used for SSR-safety) was
unreachable — `!hasWindow` negates a function reference, which is always
`false`, so the code always fell through to the real listener call. Harmless
in a browser, but the SSR guard this was presumably written for never
actually ran. **Fixed in this pass** (`hasWindow()` in both
`addWindowEventListener` and `removeWindowEventListener`), with unit tests
covering both branches added in `tests/DOM.spec.ts`.

### 8. Existing tests that never actually ran the code under test

`tests/grid-item-calculate-helper.spec.ts` had a `// TODO tests should fail but
not doing it` comment above exactly the tests that were broken:

```ts
it(`Should return correct value`, () => {
  expect(() => clamp(10, 0, 300).toBe(10));
});
```

`expect(fn)` doesn't call `fn` unless a matcher like `.toThrow()` follows —
here nothing does, so `clamp(...)` (and its `.toBe(10)`, called on whatever
`clamp` happens to return) never actually executes. The test passes no
matter what `clamp` does, including if it's deleted. This is why `clamp`
showed 0% coverage despite having "passing" tests. Three tests in that file
had this shape (`clamp`'s two happy-path cases, `calcGridItemWH`'s
"correct value" case) — **fixed in this pass** by removing the extra
wrapper closure so the matcher actually runs against the real return value.

Worth a repo-wide grep for the same shape
(`expect(() => .*\.(toBe|toEqual|toStrictEqual)\(`) before trusting current
coverage numbers for files not touched in this pass. **Done, since —
checked across the entire current test suite, zero matches.** This
exact bug shape doesn't exist anywhere else right now.

### 9. Empty layouts throw instead of being treated as "nothing to do" — done (later)

`compactLayout([], ...)`, `correctBounds([], ...)`, and
`findOrGenerateResponsiveLayout(undefined, ...)` all threw
`ErrorMsg.INVALID_EMPTY_LAYOUT`, because they called
`getAllStaticGridItems`, which explicitly rejected a zero-length array:

```ts
export function getAllStaticGridItems(layout: TLayout): ILayoutItem[] {
  if (layout.length === 0) {
    throw new Error(ErrorMsg.INVALID_EMPTY_LAYOUT);
  }
  return layout.filter(l => l.isStatic);
}
```

An empty layout is a perfectly normal state (a grid with no items yet), and
"no static items because there are no items" seems like a more natural
result than throwing. At the time this was written, this was existing,
tested behavior (see `tests/utils.spec.ts`, `tests/responsive-helper.spec.ts`),
so this note was a flag for a product decision rather than a fix applied
in that pass — changing it would have been a behavioral change for any
consumer relying on (or catching) that exception, with no concrete use
case yet forcing the question.

**A concrete use case did show up, and this got fixed** — see finding
#33 ("Close button position didn't account for `borderRadiusPx`; a real
feature request surfaced two more empty-layout throw sites beyond
finding #9") for the full account: building cross-grid drag/drop needed
an empty grid as a normal, valid drop target, and it turned out to be
broken in three more places beyond this one. `getAllStaticGridItems`
(now in `core/common/helpers/grid-item-type-helpers.ts`) no longer has
the length check at all — confirmed directly by reading its current
implementation, not assumed fixed just because a later finding
mentioned the topic.

### 10. Every window resize threw an uncaught error

Found while writing the first `GridLayout` mount test — mounting the
component at all triggered an unhandled promise rejection.

```ts
// onWindowResize(), called on every window resize AND once on mount
eventBus.emit(`resizeEvent`);   // no payload

// the handler for that event:
const resizeEventHandler = (data?: IEventsData): void => {
  if (!data) {
    resizeEvent();              // called with id = undefined
  } else { /* ... */ }
};

// resizeEvent() immediately does:
let l = getLayoutItem(props.layout, id);   // id is undefined here
```

`getLayoutItem` explicitly throws `INVALID_LAYOUT_ITEM_ID` for an undefined
id rather than returning `undefined` (unlike a lookup miss, which does
return `undefined` — see the "sometimes returns null" comment a few lines
below, which describes different, already-handled case). Since `mitt`'s
`emit` calls handlers synchronously, this throw propagates out of the
`nextTick` callback chain in `onMounted`, surfacing as an unhandled
rejection on every mount and every subsequent window resize — silent in a
browser console people don't watch, but real, and now something that fails
tests that assert on unhandled errors (which is exactly how it was found).

**Fixed in this pass**: `resizeEvent` now returns early when `id` is
undefined, treating the payload-less "just recompute sizes" signal as the
no-op it was apparently intended to be, instead of taking the
`getLayoutItem` path meant for actual resize events with a real item id.
Covered by `tests/GridLayout.spec.ts` ("mounting does not throw on the
initial resize/layout pass"). The equivalent `dragEvent()` was given the
same guard for consistency, since `dragEventHandler(undefined)` has the
identical shape — nothing currently triggers it, but there's no reason for
it to be one incoming payload away from the same crash.

### 11. Starting a drag or resize while the container width is unknown crashed the whole tree

Found while writing drag-interaction component tests. `GridLayout` tracks
its own measured width in a `width` ref that starts as `null` and stays
that way until the container has real layout (a `> 0` `offsetWidth`) — which
isn't just a test artifact: a grid rendered inside a hidden tab, an
unmounted-but-rendered modal, or anything measured before the browser has
laid it out will have `width === null` for at least one tick in production
too.

`dragEvent`/`resizeEvent` unconditionally forward that value:

```ts
eventBus.emit(`updateWidth`, width.value); // width.value can be null here
```

and `GridItem` applied it with no validation:

```ts
const updateWidth = (width: number, colNum?: number): void => {
  containerWidth.value = width;   // now null
  ...
};
```

Setting `containerWidth` to `null` immediately trips the `watch(containerWidth,
...)` watcher, which calls `tryMakeResizable()` → `calcPosition()` →
`calcColWidth(null, ...)`, and `calcColWidth` explicitly throws for any
width less than 1. The result: beginning to drag or resize any item while
the container hasn't been measured yet throws an uncaught error out of a
Vue watcher callback, for every item in the grid, not just the one being
dragged (since `compact` propagates the same recalculation to every item via
the eventBus).

**Fixed in this pass** — `updateWidth` now ignores non-positive/non-finite
widths and keeps the last known-good `containerWidth` instead, so
calculations simply resume once a real measurement arrives rather than
throwing in the meantime. Covered by `tests/GridItem.spec.ts` ("starting a
drag while the container width is unknown does not throw").

### 12. `autoSize()` — the "resize on content change" feature — threw every time it was called

Found while writing a component test for it. `useSlots()` returns slot
*functions*, not resolved VNode arrays — you have to call `slots.default()`
to get the VNodes:

```ts
const slots = useSlots();
...
const newSize = slots?.default[0].elm.getBoundingClientRect();
```

`slots.default` here is a function reference; indexing it with `[0]` is
`undefined` (functions aren't arrays), so `.elm` threw a `TypeError` on the
very first line of the function, every single time `autoSize()` was
invoked. This is the function backing the README's "GridItem automatically
resizes when content change(Useful when displaying charts)" feature.

Adding the missing `()` is necessary but **not sufficient**: calling
`slots.default()` here happens *imperatively*, outside of GridItem's own
render pass. That call creates brand-new VNodes disconnected from whatever
Vue actually mounted to the DOM, so `[0].elm` is typically still
`undefined` — there's no reliable way from inside an exposed method to
reach back into "the VNode the renderer already patched." This means the
content-measurement approach itself needs a template ref on the slot
wrapper to get a real, stable DOM reference, not a call to `slots.default()`
after the fact — a larger change than is safe to make unilaterally here,
since it may mean wrapping the slot in an element, changing the DOM
structure consumers see.

**Fixed in this pass, scoped to "stop crashing"**: `autoSize()` now bails
out as a no-op when the slot's VNode has no mounted element yet, instead of
throwing. The feature remains unreliable until the underlying
measurement approach is rewritten with a template ref — that part is a
recommendation, not something this pass changed. Covered by
`tests/GridItem.spec.ts`'s `autoSize` suite, including a regression test
that calling it doesn't throw even when there's nothing measurable yet.

### 13. Duplicate, unreachable validation check in `validateXYParams`

```ts
if (cols < 1) {
  throw new Error(ErrorMsg.INVALID_PARAM_COLS);
}
...
if (innerW < 1) {
  throw new Error(ErrorMsg.INVALID_PARAM_INNER_W);
}

if (cols < 1) {                                  // identical to the check above
  throw new Error(ErrorMsg.INVALID_PARAM_COLS);
}

if (maxRows < 1) {
  throw new Error(ErrorMsg.INVALID_PARAM_MAX_ROWS);
}
```

The second `cols < 1` check can never fire — if `cols < 1` were true, the
first, identical check earlier in the same function would already have
thrown. Almost certainly a copy-paste artifact from adding the `innerH`/
`innerW` checks. **Removed in this pass**; every other parameter this
function validates (`rowHeight`, `margin`, `maxRows`, `containerWidth`) is
checked exactly once, so this brings `cols` in line with the rest.

### 14. Empty conditional in `correctBounds`

```ts
while (staticItem[i].x + staticItem[i].w > bounds.cols || getFirstCollision(staticItem, staticItem[i])) {
  if (staticItem[i].x <= 0) {
    // Can not move the item more than to position 0 on x-axis.
  }
  staticItem[i].x -= 1;
}
```

The `if` body is just a comment — it checks a real condition (the item has
already reached the left edge) but does nothing about it, so the loop keeps
decrementing `x` below 0 regardless. Either this was meant to `break`/clamp
and never got filled in, or it's a leftover from removed logic. **Removed
in this pass** since an empty conditional has no effect either way; left as
a flag in case the maintainer intended a left-edge clamp here.

### 15. `IGridLayoutProps` was defined twice, by hand, in two files

`src/components/Grid/grid-layout-props.interface.ts` exports a complete
`IGridLayoutProps` interface — and `GridLayout.vue` also declared its own,
byte-for-byte identical copy inline, instead of importing the one next to
it. `GridItem.vue` (via `thisLayout`'s type) already imported the version
from the interface file, so the two copies had to be kept in sync by hand
across two files any time a prop was added — with no compiler error if
they drifted, just a silent type mismatch on whichever side didn't get
updated. **Fixed in this pass**: `GridLayout.vue` now imports
`IGridLayoutProps` from `grid-layout-props.interface.ts` alongside
`IBreakpoints`/`IColumns`, which it was already importing from the same
file. One definition, one source of truth.

### 16. `restoreOnDrag` silently did nothing when `verticalCompact` was false

Found by replacing an `any` with a real type and letting the compiler point
at the mismatch — exactly the value real types provide. `compactItem()`
takes an optional `minPositions` map and reads `minPositions[item.i].y`:

```ts
} else if (minPositions) {
  const minY = minPositions[layoutItem.i].y;
  while (layoutItem.y > minY && ...) { ... }
}
```

But the only place that map got built, in `GridLayout.vue`'s `dragEvent`,
stored a different shape entirely:

```ts
positionsBeforeDrag.value = props.layout.reduce(
  (result, { i, x: tmpX, y: tmpY }) => ({ ...result, [i]: { tmpX, tmpY } }),
  {},
);
```

`{ tmpX, tmpY }` has no `.y` property, so `minY` was always `undefined`,
and `layoutItem.y > undefined` is always `false` in JavaScript — the
`while` loop guarding "don't compact this item above where it was before
the drag started" never ran. This only mattered for the combination of
`restoreOnDrag: true` and `verticalCompact: false`, which is presumably why
it went unnoticed: the type was `any` on both sides of the mismatch, so
nothing ever flagged it, and the failure mode (an optional
positioning refinement quietly not applying) doesn't throw or look broken
at a glance.

**Fixed in this pass**: `positionsBeforeDrag` now stores `{ x, y }`
directly (no reason to rename via destructuring at all), matching what
`compactItem` reads, and both are typed as
`Record<string | number, { x: number; y: number }>` instead of `any`/
`{ [key: string]: string }`.

### 17. The public API barrel exported enums as types-only, silently breaking value usage

`src/components/index.ts` had:

```ts
import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
export type { EGridItemEvent, ILayoutItem, TLayout, TResponsiveLayout };
```

`EGridItemEvent` is an enum — it has both a type and a real runtime value
(`EGridItemEvent.RESIZE === 'resize'`). Re-exporting it with `export type`
tells TypeScript it's type-only, and any consumer importing it from the
package's main entry point and trying to use it as a value (e.g.
`if (eventName === EGridItemEvent.DRAG)`) gets a compile error: *"'X' cannot
be used as a value because it was exported using 'export type'."* Verified
directly: a probe file importing `EGridItemEvent` through the barrel and
referencing `EGridItemEvent.DRAG` failed to compile with exactly that
error. `EGridLayoutEvent` (the enum needed to type `@breakpoint-changed`,
`@drag-start`, etc. handlers) wasn't exported from the barrel at all.

**Fixed**: both enums are now real (value) exports. Also added to the
barrel, since they were missing entirely: `IGridItemProps`,
`IGridLayoutProps`, `IBreakpoints`, `IColumns`, `TBreakpoint`,
`TBreakpoints`, `TLayoutItem`, `ILayoutItemRequired` — the full set of
types a consumer would plausibly need to type their own wrapper components
or event handlers around this library, without reaching into `@/core/...`
internal paths.

### 18. The published `types` path didn't match what the build actually emitted

`package.json` declares:

```json
"types": "./dist/types/components/index.d.ts"
```

But `npm run build:types` (`vue-tsc --project tsconfig.json --declaration
--emitDeclarationOnly --outDir ./dist`) actually emitted to
`dist/types/src/components/index.d.ts` — an extra `src/` segment, because
`tsconfig.json`'s `include` (`["src/**/*.ts", "src/**/*.vue", "./**/*.vue"]`)
is broad enough to also pull in `demo/*.vue` (sibling to `src/`, not
excluded), which pushed TypeScript's inferred common root up to the project
root instead of `src/`. Every consumer resolving types via the declared
`types` field would fail to find them entirely.

The likely-intended fix already existed and was never wired up: a second
config, `tsconfig.build-types.json`, scoped its `include` to `src/**/*`
only — but no script referenced it; `build:types` used `tsconfig.json`
directly. Confirmed by running the build: `demo/App.vue.d.ts` and
`demo/views/*.d.ts` were present in the output.

**Fixed**: `tsconfig.build-types.json` now `extends` the main config, adds
`rootDir: "src"`, and excludes `demo/` explicitly for clarity even though
`rootDir` alone would now catch the mismatch as a build error rather than
silently mis-rooting the output. `build:types` was pointed at it.

### 19. Path aliases leaked into the published declaration files

Even after fixing #18's path, the emitted `.d.ts` files still contained
lines like:

```ts
import { EGridItemEvent } from '@/core/griditem/enums/EGridItemEvents';
```

`@/*` is a `paths` alias configured in this repo's own `tsconfig.json` —
meaningless outside it. `vue-tsc --emitDeclarationOnly` preserves import
specifiers verbatim; it doesn't know or care that `@` won't resolve in a
consuming project's `node_modules`. Any published type that transitively
imported something via `@/...` (which, per #17's expanded barrel, is now
most of the public API) would be unresolvable for consumers.

**Fixed**: wired up `vite-plugin-dts` (already a devDependency, never used
anywhere — same "installed but not connected" pattern as ESLint/husky in
Phase 0) into `vite.config.js`. It resolves aliases through Vite's own
resolver during the build, so the emitted declarations use real relative
imports (`from '../core/griditem/enums/EGridItemEvents'`) instead. This
also made the standalone `vue-tsc --emitDeclarationOnly` step in
`build:types` redundant — declaration generation is now a side effect of
`vite build` itself, so `build:types` is now just an alias for it, and
`build:all` no longer runs a separate types step.

**Verification for all three**: rebuilt from clean, diffed the emitted
`dist/types/components/index.d.ts` path against `package.json`'s `types`
field (now matches exactly), grepped the full `dist/types/**` tree for any
remaining `@/` import (none), and confirmed `demo/**` no longer appears in
the output.

### 20. Several declared events are never actually emitted

Found while documenting the event enums (`EGridItemEvent`,
`EGridLayoutEvent`). Three enum members exist with no corresponding
`defineEmits` entry and no `emit(...)` call anywhere in the codebase:

- `EGridItemEvent.DRAG` / `DRAGGED` — `GridItem`'s drag composable emits
  `MOVE`/`MOVED` instead; a consumer listening for `@drag`/`@dragged` will
  never see them.
- `EGridLayoutEvent.CHANGED_DIRECTION` / `CONTAINER_RESIZED` — not even
  wired into `GridLayout.vue`'s `defineEmits` type, let alone emitted.

Documented in place on each enum member rather than removed, since
removing a declared public event is a breaking change that deserves its
own deliberate release note, not a side effect of a documentation pass.

### 21. The eventBus type was hand-duplicated a third and fourth time

The same class of bug as #15 (`IGridLayoutProps`), found while documenting
`grid-item.interfaces.ts` and `layout-data.interface.ts`: both
`IGridItemEventBus` and `IGridLayoutEventBus` already existed as exported,
shared types (added when the drag/resize/responsive composables were
extracted, specifically so both sides of the eventBus contract would share
one definition) — but `GridItem.vue` and `GridLayout.vue` themselves still
declared their own inline, byte-for-byte-equivalent copies via
`inject('eventBus') as Emitter<{...}>` / `const eventBus: Emitter<{...}> =
mitt()`, instead of importing the type sitting right next to them. The
composables used the shared type; the components that actually create and
inject the eventBus didn't.

**Fixed**: both components now use `IGridItemEventBus`/
`IGridLayoutEventBus` directly. Removed the now-unused `Emitter` import
from both files (and `IEventsData` from `GridItem.vue`, no longer needed
there either).

### 22. `calculate-utils.ts` is entirely dead code with its own diverged duplicate

Found while documenting it. `core/helpers/calculate-utils.ts` exports a
fully-validated `calcXY` function (plus its `validateXYParams` helper) —
but nothing in `src/` imports from this file at all. `useGridItemDrag.ts`
has its own, separate inline `calcXY` implementation that does the same
grid-unit conversion *without* the parameter validation this file adds,
and the two have never been reconciled. The only thing currently exercising
`calculate-utils.ts` is its own dedicated test file
(`tests/calculate-utils.spec.ts`) — 100% coverage on code the library never
calls.

Not removed in this pass — deciding whether to wire it in (replacing
`useGridItemDrag`'s inline version) or delete it is a real design choice,
not a mechanical cleanup, since it affects the composable's validation
behavior either way. Documented in place so it's a deliberate decision for
whoever picks it up next, not something else found by accident later.

### 23. `borderRadiusPx` was a declared prop with zero effect

Found while building a VitePress example for it. Both `GridItem` and
`GridLayout` declare a `borderRadiusPx` prop (default `8`) — but the CSS
that's supposed to use it, `.vue-use-radius { border-radius:
$grid-item-border-radius; }`, references a hardcoded SCSS variable
(`12px`) instead of the prop. Changing `borderRadiusPx` to any value had
no visible effect whatsoever; only `useBorderRadius` (toggling the class
on/off) did anything.

Separately, `GridLayout`'s `borderRadiusPx`/`useBorderRadius` props only
ever affected its own internal drag placeholder — unlike
`isDraggable`/`isResizable`/`isBounded`/`showCloseButton`, there's no
`setXxx` eventBus cascade pushing these two down to consumer-rendered
`GridItem`s, so setting them on `GridLayout` alone did nothing for real
items even before this fix.

**Fixed**: `GridItem.vue` now applies `border-radius: {borderRadiusPx}px`
as an inline style (merged into the existing `:style` binding) whenever
`useBorderRadius` is true, so the prop actually does what its name
suggests. The `GridLayout`-level cascade gap is documented but not
changed — deliberately, since adding a new eventBus message is more
invasive than a docs pass should take on; set `use-border-radius`/
`border-radius-px` directly on each `GridItem` in the meantime (see the
[border radius example](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/components/14-example.vue)).

### 24. `stylelint` had one non-auto-fixable violation, now fixed

Found while wiring up Phase 1 CI (a `lint:style` gate is only meaningful
if it can pass). `GridItem.vue`'s `cssTransforms` class violated the
project's own `selector-class-pattern` (BEM/kebab-case) rule — the other
five style violations were auto-fixed straightforwardly, but a class
*name* isn't something `--fix` can safely rename on its own, since it's
also referenced from the component's `classObj`. Renamed to
`css-transforms` in both places; no tests or other files referenced the
old name. `npm run lint:style` is now fully clean, which is what makes it
safe to run as a real (blocking) CI gate rather than an advisory one —
see the new `.github/workflows/ci.yml`.

### 25. Resize from left/top edges — implemented, not just re-enabled

Following up on finding #1's dead RTL conditional and the general
"only bottom/right/bottom-right work" limitation flagged throughout this
document (and in `docs/BUNDLE_ANALYSIS.md`'s "actually used" list):
investigated whether this was a regression (something removed) or an
incomplete original implementation. The evidence points to the latter —
`useGridItemResize.ts`'s `resizemove` switch already had branches for
`Bottom left`, `Top Left`, `Top Right`, and `Left`/`Top`, each correctly
detecting the edge combination via `event.edges`, but **empty**: no code
computed a new size or position for any of them. `tryMakeResizable()`
separately configured interact.js with `left: false, top: false`, so
those edges couldn't even be grabbed. The project's own historical
changelog (`v1.2.2`, 2023) confirms this: *"resizemove edge-case handling
— right, bottom-right, and bottom fixed; left, top-left, top, and
top-right still not."* — i.e. never finished, not removed.

Two things were missing to make these directions actually work, beyond
filling in the empty branches:

1. **Position tracking during resize.** `resizing` was typed as just
   `{ width, height }` — sufficient for bottom/right (which never move the
   item's anchor point), but a left-edge resize inherently means the
   item's `x` decreases as it widens (the right edge stays fixed while the
   left edge moves outward), and symmetrically for `y` on a top-edge
   resize. `resizing` now tracks a full `IGridItemPosition`
   (`left`/`right`/`top`/`width`/`height`), and `GridItem.vue`'s
   `createStyle()` reads the live position the same way it already did for
   `dragging`.
2. **`GridLayout`'s `resizeEvent()` never wrote position at all.** It
   received `x`/`y` parameters (used only to position the drag
   placeholder) but only ever assigned `l.w`/`l.h` onto the actual layout
   item — never `l.x`/`l.y`. Without this, even a fully-correct
   resize-composable computation would have had nowhere to persist to.

**Rewritten**: the `resizemove` branches were replaced with per-edge
independent checks (`if (edges.right) { width += dx }`, `if (edges.left) {
width -= dx; horizontal += dx }`, etc.) rather than one branch per
edge-combination — every single edge and every corner falls out of four
conditions instead of needing eight near-duplicate branches, which is
also how the previously-empty diagonal branches (top-left, bottom-left,
top-right) got implemented for free rather than needing individual
attention. New `pixelsToGridX`/`pixelsToGridY` helpers convert the final
pixel position back to grid units, capped against the item's *new* size
(not its pre-resize size, which is what `useGridItemDrag.ts`'s `calcXY`
assumes — the reason this isn't just a call to that function).

**Scope boundary, stated plainly at the time — since resolved for one of
the two points**: RTL-mode resize direction handling was flagged here as
best-effort, per the pre-existing `// TODO handle rtl properly` this
pass didn't fully resolve, with the same delta arithmetic applied to the
RTL anchor (`right` instead of `left`) but not verified as thoroughly as
the LTR case. **That part is done** — see finding #53, which found and
fixed two real hardcoded-LTR-assumption bugs in exactly this RTL path
(not just verified the existing code was fine), then confirmed the fix
two ways: new unit tests for both directions, and a real browser drag
test in both directions checking actual screen-space bounding boxes.
`GridLayout`'s `preventCollision` path **still** doesn't account for a
moving anchor point, though — checked directly rather than assumed
still true: it only clamps `w`/`h` for collisions (confirmed by reading
the current code), same as at the time this finding was written — a
resize that would drag an item's left/top edge into another item still
isn't blocked. That part remains a real, open follow-up.

Covered by five new tests in `tests/GridItem.spec.ts` (left-only,
top-only, and all three previously-broken corners), each asserting the
*direction* of the resulting position/size change rather than exact pixel
values (jsdom doesn't perform real layout, so exact pixel arithmetic
isn't meaningful to assert on) — plus the existing bottom/right/
bottom-right tests, updated only where they asserted the old restricted
`edges` configuration.

### 26. Changing `margin` after mount has never actually worked

Found while adding a test for `GridItem.vue`'s `watch(() => thisLayout?.margin,
...)` — the watcher never fired, in any scenario. Root cause: `thisLayout`
is `proxy?.$parent`, which resolves to whatever `GridLayout`'s
`defineExpose({ ...props, ... })` call passed — and spreading `...props`
copies the *current values* into a new plain object once, at the moment
`defineExpose` runs during setup. It is not a live reference back to the
reactive props object. Confirmed directly: reading `wrapper.vm.margin` on
a mounted `GridLayout` instance, then changing its `margin` prop and
reading `wrapper.vm.margin` again, returns the *original* value both
times — this isn't specific to the `$parent` bridge or to `margin`, it's
true of every prop spread this way, on the instance's own exposed proxy.

Every other cascaded layout-level setting (`rowHeight`, `colNum`, `isBounded`,
etc.) already routes around this by using the `eventBus`'s `setXxx` pattern
instead of relying on `thisLayout` reactivity for anything past the
initial mount (see `docs/ARCHITECTURE.md`) — `margin` was the one
exception, and the one setting that consequently never actually
propagated a post-mount change to already-rendered items.

**Fixed** by giving `margin` the same treatment as every other cascaded
setting: `GridLayout.vue` now has a `watch(() => props.margin, (val) =>
eventBus.emit('setMargin', val))`, and `GridItem.vue` has a matching
`setMarginHandler` (registered/deregistered like every other eventBus
handler) instead of the dead `thisLayout`-based watcher, which was
removed. Both `IGridItemEventBus`/`IGridLayoutEventBus` types gained the
new `setMargin: number[]` message. Covered by a new test in
`tests/GridItem.spec.ts` asserting the item's rendered style actually
changes after the parent's `margin` prop changes post-mount — which
would have failed against the old code (that's how this was found).

### 27. The new keyboard support had two real bugs on its first re-read

Found during a deliberate fresh re-analysis pass immediately after
`useGridItemKeyboard.ts` was written — exactly the kind of review a new
feature should get before it's considered done, not a regression from
later work:

1. **It would have hijacked OS/browser/assistive-technology shortcuts.**
   `handleKeydown` only checked `event.shiftKey`, calling
   `preventDefault()` and moving/resizing the item for *any* arrow key
   press regardless of other modifiers. Ctrl+Arrow (virtual desktop
   switching on several OSes) and Alt+Arrow/Cmd+Arrow (browser history
   navigation, some screen reader commands) would have been silently
   swallowed by a focused grid item instead of reaching their normal
   handler — actively working against the accessibility goal this feature
   exists for. Fixed by ignoring the event entirely when `ctrlKey`,
   `altKey`, or `metaKey` is held.
2. **Arrow direction didn't account for RTL.** `calcPosition`'s RTL
   branch increases the item's CSS `right` value (moving it visually
   *left*) as its grid-unit `x` increases — the opposite of LTR, where
   increasing `x` moves it visually right. `moveBy` applied the same
   delta to `x` regardless of `renderRtl`, so pressing the physical
   ArrowRight key on a mirrored item would move it visually *left* —
   backwards from what every other RTL-aware part of this library
   (dragging, resizing) aims for. Fixed by flipping the horizontal delta
   when `renderRtl` is true, so the physical key pressed matches the
   physical direction the item visually moves either way.

Both covered by new tests in `tests/GridItem.spec.ts` (Ctrl/Alt/Meta+Arrow
passthrough, and RTL direction) — see `docs/ACCESSIBILITY.md`.

### 28. `npm audit` findings fixed via targeted `overrides`, not blindly `--force`d

Run on request, not as part of a scheduled check: `npm audit` reported 6
advisories (up from the 4 documented in `docs/REFACTOR_STRATEGY.md`'s
Phase 1 notes — the 2 new ones traced to `@stryker-mutator/core`, added
in Phase 3, transitively pinning a vulnerable `qs`). `npm audit fix`
(the non-`--force` form) reported a fix as "available" for the `qs`
issue but didn't actually apply one — `typed-rest-client@2.3.1` (a
transitive dependency, not a direct one) pins `qs` to the *exact* version
`6.15.1`, which npm's automatic resolution won't override on its own.

**Fixed two of the six, verified each individually rather than trusting
`--force` blindly:**

- **`qs` → `6.15.3`** via `package.json`'s `overrides` field. A two-patch
  bump of a mature, stable library, verified by actually re-running
  Stryker afterward (not just checking `npm ls`) to confirm the override
  didn't break the one thing in this project that depends on it.
- **`esbuild` → `0.25.12`** (also via `overrides`), fixing the specific
  advisory vitepress's vendored, outdated `esbuild` copy was flagged for.
  This one carried real risk — vite pins `esbuild: "^0.21.3"`, and a jump
  to `0.25.x` crosses several minor versions of a tool with a history of
  breaking its own JS↔native-binary protocol across versions — so it was
  verified by actually running `npm run docs:build` afterward, not just
  checking that `npm install` succeeded.

**Deliberately not fixed — a real breaking-change risk, not laziness:**
the remaining 3 advisories are all in vitepress's *own* vendored `vite`
(a completely separate, older major version — `5.4.21` — from this
project's own top-level `vite@6.4.3`, which was never vulnerable).
`5.4.21` is already the latest available `5.4.x` patch release — there is
no non-breaking fix available. The only path to a fix is vitepress itself
shipping a new major version pinning `vite@6.x` (vitepress currently
declares a `5.x` dependency; forcing `6.x` via `overrides` would cross a
major version boundary vitepress doesn't claim compatibility with) or
`npm audit fix --force`, which installs `@vue/theme@2.0.0` — an explicit
breaking change, and a *downgrade* from the `@vue/theme@2.4.0` currently
installed, which is its own red flag not to take that path blindly.
These 3 remain exactly what they were before this pass: dev-tooling-only
(the docs site, never shipped to consumers), advisory rather than
blocking in `ci.yml`, and already documented as such.

Net result: `npm audit` (full tree) went from 6 vulnerabilities to 3;
`npm audit --omit=dev --audit-level=high` (the CI-blocking gate, scoped
to what a consumer of the published package actually inherits) was
already at 0 and remains there.

**Re-checked while auditing this section for staleness — a new,
separate set has since appeared, same underlying pattern:** a fresh
`npm audit` now shows 22 vulnerabilities, not 3. The vitepress/vite ones
above account for only 2 of those (`vite`, `vitepress`, `@vue/theme`) —
the other 19 (`@npmcli/arborist`, `libnpmdiff`, `libnpmexec`,
`libnpmfund`, `libnpmpack`, `libnpmpublish`, `npm`, `pacote`, `sigstore`
and its `@sigstore/*` sub-packages, `tar`, `picomatch`,
`brace-expansion`, `ip-address`, `semantic-release`,
`@semantic-release/npm`) all trace back to one place: `@semantic-release/npm@12.0.2`
vendors its own copy of `npm@10.9.8`, which pulls in `node-gyp@11.5.0` →
`tinyglobby@0.2.15` → a vulnerable `picomatch@4.0.3` (traced with `npm ls
picomatch --all`, not assumed from the advisory name alone), among
others. `npm audit fix` (no `--force`) reports "fix available" for
`picomatch` specifically, but running it makes no actual change to
`package-lock.json` — confirmed by diffing the lockfile before and
after — because the vulnerable instance is nested inside
`@semantic-release/npm`'s own pinned `npm` copy, not something this
project's own dependency tree controls directly. `npm audit fix --force`
would resolve it by installing `@semantic-release/npm@13.1.5` — the
exact same breaking-change tradeoff already declined above for the
vitepress/vite advisories, and left un-forced here for the identical
reason: `@semantic-release/*` packages are entirely `devDependencies`
(confirmed directly, not assumed), used only for the release-automation
workflow, never shipped to consumers. `npm audit --omit=dev
--audit-level=high` — re-run just now, not assumed still clean from
before — remains at 0. Same shape of issue as the vitepress one above,
just a different vendored dependency tree; flagging it here rather than
as an unrelated new finding, since it's the identical tradeoff already
reasoned through.

### 29. The "Border radius" example looked broken — the library wasn't

Reported as "BorderRadius not working." Verified the library's own logic
first, empirically, before assuming the bug was there: a component test
mounting a `GridItem` with `useBorderRadius`/`borderRadiusPx` set, then
changing `borderRadiusPx` reactively, showed the rendered inline style
updating correctly both times (`border-radius: 16px` → `border-radius:
30px`) — the computed property `GridItem.vue` uses for this (added when
fixing this exact prop's "declared but had zero effect" bug, see finding
#23) works fine on its own.

The actual bug was one layer up, in the VitePress example itself
(`vitepress-docs/examples/components/14-example.vue`): its inner content
used the `.example-item` class shared by every example in the site, which
has its own **hardcoded** `border-radius: 10px`, filling 100% of the
`GridItem`'s box. Since the inner box completely covers the outer
element and never changes shape itself, changing the outer element's
actual border-radius via the demo's controls was — from a user's
perspective — completely invisible, indistinguishable from "not working
at all." Fixed by binding the inner content's own radius to the same
`useBorderRadius`/`borderRadiusPx` values the controls set, so the
example actually demonstrates what it's supposed to.

Also added a `step` prop to the shared `ExampleNumberField.vue` component
(defaulting to `1`, matching the native `<input type="number">` default
explicitly rather than leaving it implicit) — used by this example's
`borderRadiusPx` field and available to any other numeric example
control going forward.

**Follow-up**: `borderRadiusPx`'s own default (both `GridItem`'s and
`GridLayout`'s) was changed from `8` to `10`, matching the value
`.example-item`'s hardcoded radius had been using all along — so the
library's actual default now matches what every example already visually
looked like, rather than the two being coincidentally close but distinct
numbers.

### 30. "Drag, drop from grid to grid" example's native `drop` event never actually fired

Both "Multiple independent grids" (example 4) and "Drag, drop from grid
to grid" (example 12) already existed — asked "is it possible to
implement" these, the honest answer was to check what was already there
rather than assume nothing existed, which surfaced a real bug in example
12 on closer inspection.

`onDragOver` never called `event.preventDefault()`. Per the HTML5
drag-and-drop spec, a drop target must call `preventDefault()` during
`dragover` (and/or `dragenter`) for the browser to consider it a valid
drop zone at all — without it, the native `drop` event this example
registered a handler for should never fire. The example still worked
anyway, because the same handler (`onDrop`) was *also* registered for
`dragend`, which fires unconditionally whenever a drag operation ends,
successful or not — so all the actual cross-grid-move logic was running
through `dragend`, with the `drop` listener as unreachable dead code
that happened to cause no visible symptom. Fixed by adding the missing
`preventDefault()`, so `drop` behaves the way its name and registration
imply instead of silently never firing.

Also removed an unused `targetGridRef` template ref — bound in the
template, declared in the script, never actually read anywhere.

**Follow-up: replaced the native-HTML5-DnD approach entirely.** The fix
above made the existing technique correct, but it still required
`:is-draggable="false"` on source items (to avoid the library's own
interact.js-based dragging fighting the browser's native drag), meaning
the item lost the library's own smooth drag feedback the moment it left
its origin grid. Rewrote the example around interact.js's own
`dropzone()` action instead — a peer of the `drag`/`resize` actions the
library already registers internally (`@interactjs/actions/drag`,
`@interactjs/actions/resize` in `GridItem.vue`), just not one it turns on
by default, so the example registers `@interactjs/actions/drop` itself.
Source items stay fully draggable via the library's normal mechanism the
entire time; interact.js's global interaction tracking detects the
overlap against the target container regardless of which `.draggable()`
call started the drag, so no coordination with the library's internals
beyond that one extra plugin import is needed. `accept` is deliberately
scoped to a dedicated `.cross-grid-item` class (not the library's own
`.vue-grid-item`, which every item in *both* grids has) so dragging an
item within the target grid never accidentally triggers the dropzone's
own enter/drop logic against itself.

**Follow-up: verified (not just assumed) that static items can't
participate.** Added a static "locked" item to the source grid and
confirmed directly that this needs no special handling in the dropzone
logic at all — `isStatic` already disables a `GridItem`'s `.draggable()`
at the interact.js configuration level regardless of `isDraggable`
(`useGridItemDrag.ts`'s `tryMakeDraggable`), so a static item never
becomes an active drag interaction for `dropzone()` to consider in the
first place. Added a regression test for this specific interaction
(`isStatic: true` with `isDraggable: true` still disables the
interactable) in `tests/GridItem.spec.ts`, since it previously had no
direct test — only the `isDraggable: false` case was covered.

**Second follow-up: replaced the interact.js `dropzone()` approach
entirely — it didn't work, and couldn't be verified in this
environment.** Reported as "Drag/Drop from grid to grid is not working."
The `dropzone()`-based rewrite above was architecturally reasoned through
carefully (interact.js's `drop` action plugin's actual source was read
directly to confirm `collectDropzones` and the `interactions:*` lifecycle
hooks are genuinely global — not scoped to whichever `.draggable()` call
started a drag), but **never actually verified against a real browser**,
since none was available while writing it — a real, material gap in
confidence that a build succeeding doesn't close, and shouldn't have been
presented as more certain than it was.

Replaced it with an approach built entirely on primitives already
*proven* to work elsewhere in this exact codebase: `GridLayout` already
emits `dragstart`/`dragend` with the dragged item's `i` for every drag
(confirmed via `e2e/drag-and-resize.spec.ts`'s already-passing browser
test, which asserts on exactly this event log after a real mouse drag).
The rewritten example listens to those two events directly, tracks
pointer position via a single `mousemove` listener, and checks the
target container's `getBoundingClientRect()` at `dragend` — the same
plain-JS overlap check the *original* native-HTML5-DnD version of this
example already used successfully, just triggered by the library's own
drag lifecycle instead of native `dragover`/`drop`. No new interact.js
action plugin, no `data-*` attribute for identifying the dragged element
(the event payload already provides it), and no dependency on
matching-selector or global-interaction-tracking behavior this session
had no way to confirm firsthand.

**A genuinely unrelated bug was found while reading `GridLayout.vue`'s
`dragEvent()` for this** — see finding #32.

### 31. `showCloseButton` never actually inherited from `GridLayout` — every item showed a close button by default

Reported as "Close button still visible in all examples." Earlier work
in this document (see the "Remove Custom close button" request that
preceded this) had checked for *explicit* `showCloseButton`/
`show-close-button` usage across the VitePress examples and found only
three legitimate ones — but that check only looked for the prop being
set explicitly, not what the *default* actually resolved to, which is
exactly where the real bug was hiding.

`GridItem`'s `showCloseButton` prop is typed `boolean | null` —
the same `null`-means-"inherit from `GridLayout`" sentinel
`isDraggable`/`isResizable`/`isBounded` use. But its `withDefaults()`
value was `true`, not `null`, and — unlike those three siblings — there
was **no resolution logic anywhere** that ever read `GridLayout`'s own
`showCloseButton` default (which is correctly `false`) when the sentinel
was set. The type signature implied an inheritance mechanism that was
never actually built. The result: every `GridItem` showed a close button
by default regardless of `GridLayout`'s setting, in every example and
every consumer usage, unless something explicitly overrode it per item —
exactly matching the report.

**Fixed** by giving `showCloseButton` the same treatment as `isBounded`
(chosen as the template since it already has all four pieces): a
resolved `closeButtonEnabled` ref, a `watch(() => props.showCloseButton,
...)` for reacting to the item's own prop changing after mount, a
`setShowCloseButtonHandler` eventBus handler (registered/deregistered
like every other handler) for reacting to `GridLayout`'s default
changing after mount, and the `onMounted` resolution
(`props.showCloseButton === null ? thisLayout?.showCloseButton :
props.showCloseButton`) for the initial value. `GridLayout.vue` gained a
matching `watch(() => props.showCloseButton, (val) =>
eventBus.emit('setShowCloseButton', val))`, and both `IGridItemEventBus`/
`IGridLayoutEventBus` gained the new message.

**A related, pre-existing test ambiguity surfaced while writing the
regression tests for this**, not a new bug: `GridLayout`'s own internal
drag-placeholder (`v-show`-toggled, always present in the DOM even when
not dragging) is itself a `GridItem` instance that receives
`showCloseButton` directly from `GridLayout`'s own prop, independent of
any per-item override. A test asserting on a bare `button.btn-close`
selector can silently match the placeholder's button instead of the real
item's once their values differ — invisible before this fix (since the
old buggy default made both always agree), newly relevant now that they
can genuinely diverge. Fixed by scoping the relevant test to
`.vue-grid-item:not(.vue-grid-placeholder)`.

Six tests updated or added in `tests/GridItem.spec.ts`: the previous
"shows by default" test was inverted to assert the *correct* default
(hidden), plus new coverage for the explicit-item-override,
inherit-from-GridLayout, item-overrides-GridLayout, and both post-mount
reactivity paths (item prop change, GridLayout default change).

### 32. `GridLayout` emitted `DRAG_START` twice — once with a hardcoded, wrong id

Found while reading `dragEvent()` closely for finding #30's `GridLayout`
event rewrite (not something the new example itself would have hit,
since it doesn't use `verticalCompact: false` — found by reading the
surrounding code carefully, not by tracing a symptom back to it).

Whenever a drag started on a `GridLayout` with `verticalCompact: false`,
`dragEvent()` emitted `EGridLayoutEvent.DRAG_START` **twice** for the
same drag: once immediately with a hardcoded `1` (inside the
`restoreOnDrag`-supporting `positionsBeforeDrag` snapshot block — see
finding #16, which already touched this exact block for an unrelated
bug), and then again, correctly, via the `switch (eventName)` statement
directly below it using the real dragged item's `id`. Any consumer
reading the id off the *first* `DRAG_START` payload — or simply asserting
how many times the event fired — would have seen `1` regardless of which
item was actually being dragged, or an unexpected duplicate emission.

**Fixed** by deleting the erroneous hardcoded emit; the `switch`
statement's own `DRAG_START` handling already covers the exact same
condition (`eventName === 'dragstart'`) correctly, making the first one
pure redundant/wrong-value dead code. The existing test only checked that
`DRAG_START` fired at all (`toBeTruthy()`), so it didn't catch this —
added a new test asserting both the emission count (exactly one) and the
payload (the real id, deliberately chosen to not be `1` in the test data,
so a regression back to the hardcoded value would actually fail it).

### 33. Close button position didn't account for `borderRadiusPx`; a real feature request surfaced two more empty-layout throw sites beyond finding #9

The close button's `top`/`right` (or `left`, mirrored for RTL) position
was a hardcoded `4px` inset from the item's corner, regardless of
`borderRadiusPx`. At a large radius the corner's visible curve extends
well past 4px, so the button ended up sitting half over the curve
instead of clear of it. Fixed by computing the inset from the radius
(`4 + R × ~0.293`, the standard "distance from a square corner to a
radius-R arc along each edge" formula, capped at 24px) and exposing it as
a `--close-button-inset` CSS custom property on the item's root element,
which the existing `.btn-close` rules (including the RTL one, which uses
`!important`) now read instead of a literal `4px`. A custom property
rather than an inline `top`/`right` style is what lets this coexist with
the RTL rule's `!important` without a specificity fight.

Also investigated the "hover overlay should match the item's radius"
part of the same request: the hover state is a plain `border` on
`.vue-grid-item` itself — the same element `borderRadiusPx` already
applies to — so it already follows the rounded corners automatically via
ordinary CSS (a `border` always respects its own element's
`border-radius`); no separate overlay element exists. Considered adding
`overflow: hidden` when `useBorderRadius` is on, to also clip slotted
content to the same shape, but reverted it after checking the resize
handle's own CSS: it's positioned at `bottom: -3px; right: -3px`,
deliberately extending outside the item's own box, so `overflow: hidden`
here would have clipped it — a much worse regression than the cosmetic
gap it would have closed.

**A real use case for allowing empty layouts finally showed up.** Finding
#9 flagged `getAllStaticGridItems`/`getAllNonStaticGridItems` throwing on
an empty layout as "a product decision, not fixed" — no concrete need
had come up yet. Building cross-grid drag/drop (#34) did: the most
natural target for a cross-grid drop is a grid that starts *empty*, and
mounting one turned out to be broken in **three more places**, not just
the one #9 already named:

- `layoutValidator` — throws `INVALID_LAYOUT` unconditionally for `[]`,
  called from `GridLayout`'s `onMounted` before anything else runs, so
  this was the actual first wall hit, ahead of #9's function entirely.
- `getBottomYCoordinate` — throws for `undefined` *or* an empty array
  (used by `containerHeight()` whenever `autoSize` is on).
- `getAllCollisions` — throws for an empty array, inconsistent with its
  own sibling `getFirstCollision`, which already just returns `undefined`
  for the same input.

Fixed all four (the three above, plus #9's) consistently: an empty
layout is a normal state (a grid with no items yet), not an error, so
each now returns the trivially-correct empty result (`true`, `0`, `[]`)
instead of throwing. Kept the genuinely-different "the layout argument
itself is `undefined`" case throwing in `getBottomYCoordinate` — an
absent argument and a deliberately empty array aren't the same kind of
invalid. Six existing tests across `tests/grid-item-type-helpers.spec.ts`,
`tests/grid-layout-helper.spec.ts`, `tests/layoutValidator.spec.ts`,
`tests/collision-helper.spec.ts`, `tests/utils.spec.ts`, and
`tests/responsive-helper.spec.ts` asserted the old throwing behavior and
were updated to assert the new, correct one instead.

### 34. Cross-grid drag/drop promoted from example-level code to a real `GridLayout` feature

Examples 12 and 21 had already shown cross-grid movement and an edit-mode
toggle as hand-rolled, per-example logic. Asked to make "drag drop
between multiple grids" an actual prop-driven capability of the library
itself, with a way for a grid to opt out of *accepting* drops and a way
for consumers to find out when a drop was refused.

**New props**: `allowCrossGridDrag` (opts a grid into the feature at
all — both sending its own items out and receiving others' by default)
and `disableExternalDrop` (opts out of *receiving* only — a grid can
still send its own items elsewhere with this set, it just never accepts
incoming ones; has no effect if `allowCrossGridDrag` is off, since the
grid isn't registered as a cross-grid participant at all in that case).
`layoutId` (auto-generated via a module-level counter if not set)
identifies a grid in the new events' payloads.

**New events**, both fired on the *target* grid: `CROSS_GRID_ITEM_DROPPED`
(`{ item, sourceLayoutId }`) on success, `CROSS_GRID_DROP_REJECTED`
(`{ itemId, sourceLayoutId }`) when the target has `disableExternalDrop`.

**The discovery problem**: independent `GridLayout` instances usually
aren't in a Vue ancestor/descendant relationship with each other (often
siblings-of-siblings, or in separate component trees entirely), so
`provide`/`inject` — the mechanism `GridLayout` already uses for its own
`eventBus` with its *own* `GridItem` children — can't be how grids find
each other. `src/core/gridlayout/helpers/cross-grid-registry.ts` is a
plain module-level `Set`, not Vue state: every grid with
`allowCrossGridDrag` registers a small record of itself (`layoutId`, a
live `getRect()` getter, `acceptDrop`/`rejectDrop` callbacks, and a live
read of its own `disableExternalDrop`) on mount and deregisters on
unmount. `findCrossGridZoneAt(x, y, excludeLayoutId)` is the only lookup
either side needs.

**Mechanics, all inside `dragEvent()`** (`GridLayout.vue`) rather than a
new composable, since it needed the same `id`/`x`/`y` the existing
drag-completion logic already has: `dragstart` records which item is
being dragged (`allowCrossGridDrag` only); a single `mousemove` listener
(added/removed alongside registration) tracks pointer position; `dragend`
looks up `findCrossGridZoneAt` against the *tracked* pointer position,
excluding this grid's own `layoutId` so a grid never matches itself.

- No zone found → falls through to the existing intra-grid drag-end
  logic unchanged, exactly as if `allowCrossGridDrag` didn't exist.
- Zone found, target has `disableExternalDrop` → calls the target's
  `rejectDrop` (which emits `CROSS_GRID_DROP_REJECTED` *on the target*,
  not the source) and *also* falls through to the normal intra-grid
  logic — the item completes its drag within its own grid, as if the
  cross-grid attempt had never happened, rather than being left in a
  half-finished state.
- Zone found, accepted → calls the target's `acceptDrop` (which inserts
  the item into the target's own `layout` and emits
  `CROSS_GRID_ITEM_DROPPED` there) and removes the item from this grid's
  own `layout`, skipping the normal intra-grid move/compaction — the item
  no longer belongs here at all, so there's nothing left to move.

**A real mutation-style bug surfaced while wiring the removal/insertion
up**: this file's existing drag/resize/compaction code always mutates
`props.layout` *in place* (`compactLayout`/`moveElement` reassign
existing items' `x`/`y` directly, never replace the array) — the
`update:layout` emit is a notification for a real `v-model` consumer,
not the mechanism the component relies on internally. The first version
of `acceptDrop`/the source-side removal used `[...props.layout, item]`/
`.filter(...)` — both produce a *new* array, invisible to anything
already holding a reference to the original (including this component's
own reactive state, and — very concretely — the component tests
verifying it), the exact opposite of every other mutation in this file.
Fixed to `props.layout.push(...)`/`.splice(...)`, matching the
established convention.

**A second, unrelated bug of the exact same shape as finding #32 turned
up two lines below the one #32 already fixed**: `dragEvent()` also
`emit(EGridLayoutEvent.DRAG_END, 1)`'d unconditionally at the very end of
every `dragend`, *after* the switch statement earlier in the same
function had already correctly emitted `DRAG_END` with the real `id` —
a second, hardcoded-wrong-id duplicate, exactly like DRAG_START's.
Removed for the same reason; a new test asserts both the emission count
and the payload, the same pattern used for DRAG_START's fix.

**A subtle test-isolation trap, not a feature bug**: the registry being
a genuine module-level singleton (by design — see the discovery-problem
note above) means it persists across tests in the same file too. Early
versions of `tests/GridLayout.crossGrid.spec.ts` reused the same
`layoutId` and the same stubbed `getBoundingClientRect()` coordinates
across multiple `it()` blocks without unmounting previous grids between
them — a later test could silently find an *earlier* test's
still-registered zone (same rect, matching `layoutId`) instead of its
own, producing results that looked exactly like a feature bug (rejected
drops succeeding, or vice versa) but were purely an artifact of tests
polluting a shared singleton. Fixed by tracking every mounted wrapper and
unmounting all of them in `afterEach`, and giving each test's grids
distinct `layoutId`s besides.

**Follow-up: `allowCrossGridDrag` couldn't actually be toggled at
runtime** — registration only ever happened once, in `onMounted`.
Flipping the prop from `true` to `false` after mount left the grid fully
registered and still droppable (a "disabled" grid silently kept
accepting drops); flipping it from `false` to `true` did nothing at all
(a grid enabled after the fact could never be registered, since
`onMounted` had already run and nothing else ever called
`registerCrossGridZone`). This wasn't a hypothetical: asked to add live
enable/disable toggles to the vitepress examples, which is exactly this
scenario. Fixed by extracting the register/deregister logic into
`setCrossGridDragEnabled()`, called once from `onMounted` for the initial
value and again from a new `watch(() => props.allowCrossGridDrag, ...)`
for every value after that — two new tests cover toggling in each
direction.

**Example 12 rewritten to use the real prop instead of its original
hand-rolled `dragstart`/`dragend` + manual `mousemove` tracking**, now
that `allowCrossGridDrag` exists as an actual library feature and the
example's own approach would just be duplicating it. Also gained live
per-grid toggles (via the new watcher above) and an intentionally-empty
starting target grid, directly exercising finding #33's empty-layout
fix in a real, rendered example rather than only in unit tests. Example
22 ("Cross-grid drop restrictions") gained the same kind of per-grid
toggles for `allowCrossGridDrag`/`disableExternalDrop`, replacing what
were previously fixed, always-on boolean attributes.

### 35. Cross-grid drop wasn't working at all — items always reverted to their source grid

Reported plainly: "cross-grid drop is not working at all. When dropping
into a new grid the griditem revert back to the original grid." This is
exactly the symptom of `findCrossGridZoneAt` never finding a target zone
— the drop always falls through to the normal *intra-grid* drag-end
path, which is indistinguishable from "the item snapped back."

**Root cause**: pointer position was tracked via a `document`-level
`mousemove` listener (`onCrossGridMouseMove`, populating a
`crossGridMouse` variable read at `dragend`) — a mechanism entirely
separate from interact.js's own drag handling. Native `mousemove` isn't
guaranteed to fire reliably (or fire *at all*, on every browser/input
combination) while interact.js has an active pointer-based interaction
in progress — depending on the browser and input type, pointer capture
during a drag can redirect or suppress the compatibility mouse events a
plain `addEventListener('mousemove', ...)` depends on. This was never
verified against a real browser (no browser was available while
building the feature — see finding #30's cross-grid history for the
same caveat playing out once already with the *previous* drag/drop
example), and the component-level tests all drove the mechanism by
directly dispatching a synthetic `mousemove` on `document`, which
naturally couldn't catch a real-browser-only gap like this.

**Fixed by removing the parallel tracking mechanism entirely** and
reading pointer position straight off interact.js's own drag event
instead — the exact coordinates interact.js itself is already using for
the current drag, guaranteed current, with no separate listener to
possibly miss an event. `IEventsData` (the `eventBus` `dragEvent`
payload `GridItem` already sends to `GridLayout` on every drag
tick) gained optional `clientX`/`clientY` fields, populated in
`useGridItemDrag.ts`'s `handleDrag` directly from the interact.js event
object (`event.clientX`/`event.clientY` — already proven to exist there,
since `offsetXYFromParentOf` in the same function already reads them for
unrelated math). `GridLayout.vue`'s `dragEvent()` gained two more
parameters to receive them, and the cross-grid lookup in the `dragend`
branch reads these instead of the removed `crossGridMouse` object.
Missing/undefined coordinates fall back to `NaN`, which safely fails
every rect-overlap comparison rather than throwing or matching a zone by
accident (covered by a dedicated test).

All nine `tests/GridLayout.crossGrid.spec.ts` tests were updated to pass
`clientX`/`clientY` as direct arguments to `dragEvent()` calls instead of
dispatching a synthetic `mousemove` — both because the old mechanism no
longer exists to exercise, and because passing the coordinates directly
is a more faithful simulation of what interact.js's own event object
actually provides.

**Real-browser verification, closing the exact gap this finding
originally flagged as open.** The fix above was reasoned through and
covered by component tests, but explicitly never checked against an
actual browser — this same class of bug (a mechanism that looks correct
reading the code, but silently doesn't survive contact with a real
browser's event timing) is exactly what caused the original bug, so a
verification gap here wasn't a small thing to leave open. Reported again
later, twice, with different framing ("the griditem returns to its
original GridLayout" and separately "the griditem in the grid dragged
from is not removed") — investigated extensively via simulated
`dragEvent()` calls in component tests (multiple scenarios: basic
accept, `dragmove` steps crossing the boundary, sequential back-and-forth,
combined with `allowOutsideDrop` also active) without finding a defect,
which strongly suggested the *logic* was sound and either the report
described something environment-specific or the verification gap this
finding named was the actual missing piece.

Got real Playwright browser automation working specifically to close
that gap: the officially declared Chromium build isn't downloadable in
this environment (network egress blocks `cdn.playwright.dev`), but an
older Playwright-bundled Chromium happened to already exist on disk and
launches successfully via `chromium.launch({ executablePath: ... })`,
bypassing Playwright's own version-matching entirely. Used it to drive
the actual demo app (`ExternalDropView`, which combines
`allowCrossGridDrag` with `allowOutsideDrop` on both grids — the exact
configuration the reports were against) with real mouse events, not
simulated ones: `mouse.move`/`mouse.down`/repeated incremental
`mouse.move` steps/`mouse.up`, checked against both a full Chromium
build and the headless-shell variant. Four scenarios, all correct in
every run: a basic cross-grid drag, dragging onto an already-occupied
target grid, a fast single-step drag with no intermediate movement, and
four rounds of rapid back-and-forth dragging between both grids. No
duplication, no failure to remove from source, in any of them.

**Still not fully closed**: no Firefox or WebKit binaries are available
in this environment (only Chromium builds exist on disk), so a
browser-specific issue on either of those remains unruled-out. If this
resurfaces, the browser/version in use is now the most useful single
detail to narrow it down with.

### 36. `npm run dev` (the `sandbox/` test bench) had two typo'd imports; demo app expanded to actually cover every prop

Reported as: "the npm script dev... throws a vue error." `npm run dev`
runs plain `vite` against the *root* `vite.config.js` — which serves
`sandbox/App.vue` (a separate, older, single-page test bench,
distinct from the newer, view-based `demo/` app; both are documented in
`README.md`/`CONTRIBUTING.md`, but easy to conflate since "the demo app"
naturally reads as referring to `demo/`). `sandbox/App.vue` imported from
`../src/core/common/helpers/gridIemTypeHelpers` and
`../src/core/gridlayout/helpers/collissionHelper` — both typo'd
(`gridIem` for `gridItem`, `collission` for `collision`), neither path
resolving to a real file. Vite surfaces an unresolved import as a compile
error in the browser, which is exactly what "throws a vue error" looks
like from the outside. Fixed the two paths; also noticed
`borderRadiusPx` had a working input control that was never actually
bound to either `GridLayout` or `GridItem` in the template (dead, likely
because the prop itself had no effect at the time this file was written
— see finding #29's history of that specific bug) and wired it up now
that the prop actually does something.

**Separately, asked to update "the demo app" so every prop can be
toggled on/off for internal testing** — which does mean `demo/` here,
given the explicit mention of "different views" (the `sandbox/` app is a
single page). Two entirely new views were added, since the alternative
of cramming everything into the existing four would make each
unreadable:

- **`CrossGridView.vue`** — `allowCrossGridDrag`, `disableExternalDrop`,
  and `layoutId` had *zero* demo coverage anywhere before this; the
  cross-grid feature (finding #34) was verified entirely through unit
  tests and VitePress examples. Two grids, both independently
  toggleable, dragging between them, both new events logged live.
- **`ItemOverridesView.vue`** — every `GridItem`-level prop not already
  covered by `DragResizeView`'s existing playground: `isStatic`,
  `enableEditMode`, `preserveAspectRatio`, per-item border radius/close
  button, `minW`/`minH`/`maxW`/`maxH`, `dragIgnoreFrom`/
  `resizeIgnoreFrom`. `isDraggable`/`isResizable`/`isBounded` needed a
  three-way inherit/true/false selector rather than a checkbox, since
  `null` (inherit the grid's own default) is a real, distinct third
  state for these — a plain checkbox can't represent it.

`DragResizeView.vue` (the existing `GridLayout`-level playground) gained
the props it was still missing: `useBorderRadius`/`borderRadiusPx`,
`transformScale` (wrapped in a compensating CSS `transform: scale(...)`
so the prop's actual effect — keeping drag/resize math correct despite
external scaling — is genuinely visible, not just accepted and ignored),
and `maxRows`.

`ResponsiveView.vue` gained custom `cols` overrides and a "simulated
container width" slider — dragging it caps the grid's wrapping element's
`max-width`, triggering breakpoint changes without touching the real
browser window, since `GridLayout` measures its container via
`ResizeObserver` and there's no prop to fake that measurement directly.
**Deliberately defaulted the slider to a value wider than any realistic
viewport** (2000px) so it's a no-op until someone actually drags it —
the existing `e2e/responsive.spec.ts` resizes the *real* browser
viewport up to 1800px and depends on the container genuinely reaching
that width; a lower default would have silently capped it and broken
that coverage the moment this view loaded, not when the slider was
touched.

### 37. `npm install` printed `EBADENGINE` warnings for six packages requiring Node ≥22

The project's own `engines` field (`package.json`) declares support for
Node `^18.0.0 || ^20.0.0 || >=22.0.0`, but several `devDependencies` had
drifted ahead to major versions that silently narrowed their *own*
requirement to Node ≥22, contradicting what the project claims to
support: `semantic-release@25`, `@semantic-release/github@12`,
`@semantic-release/npm@13`, `conventional-changelog-angular@9`,
`rollup-plugin-visualizer@7`, and (reported in the warning list but not a
direct dependency at all) `@conventional-changelog/template@1.2.1` — a
transitive dependency pulled in *specifically* by
`conventional-changelog-angular@9.x` (confirmed via `npm view
conventional-changelog-angular@9.2.1 dependencies`; the `8.x` line
doesn't depend on it at all, using `compare-func` instead).

**Fixed by downgrading each to the newest version still declaring
Node ≥18 or ≥20 support**, verified individually via `npm view <pkg>@
<version> engines` before choosing: `semantic-release` → `^24.2.9`
(`>=20.8.1`), `@semantic-release/github` → `^11.0.6` (`>=20.8.1`),
`@semantic-release/npm` → `^12.0.2` (`>=20.8.1`),
`conventional-changelog-angular` → `^8.3.1` (`>=18`, and doesn't pull in
`@conventional-changelog/template` — fixes that warning as a side
effect), `rollup-plugin-visualizer` → `^6.0.11` (`>=18`; note `6.0.8`
specifically tightened to `>=22` again before `6.0.11` relaxed it back —
worth checking the exact patch version's own `engines`, not just
assuming a lower major is automatically safe). Cross-checked that
`@semantic-release/commit-analyzer`/`@semantic-release/release-notes-generator`
(left at their existing versions) already depend on
`conventional-changelog-angular@^8.0.0` internally — so this change
brings the direct dependency in line with what the rest of the toolchain
was already using, rather than introducing a new, different version
into the tree.

**A second, unrelated source of the same warning class turned up
while re-verifying with a clean `npm install`**: `@commitlint/load`
(and its siblings `@commitlint/types`/`execute-rule`/
`resolve-extends`/`config-validator`) resolved to `21.x`
(`>=22.12.0`), pulled in via `cz-conventional-changelog`'s own
dependency declaration — `"@commitlint/load": ">6.1.1"`, an unbounded
range with no upper limit, so npm resolves it to whatever the latest
published version happens to be at install time. Since
`cz-conventional-changelog`'s own declaration can't be edited directly,
fixed the same way the pre-existing `qs`/`esbuild` entries in this
project's `overrides` field already do it: pinned all five commitlint
packages to their last Node-≥18-compatible versions (`20.5.x`/`20.0.0`)
via `overrides`, verified each sibling's own `engines` field
individually rather than assuming version-number alignment implies
compatibility.

**Verified, not just assumed, that both downgrades actually still
work**: `npx semantic-release --dry-run --no-ci` successfully loads
every configured plugin (`@semantic-release/changelog`/`npm`/`github`/
`git`/`commit-analyzer`/`release-notes-generator`) and only fails at the
expected `ENOGITREPO` (this sandbox isn't a git checkout) — not at
plugin loading, which is what would have surfaced a real incompatibility.
`require('cz-conventional-changelog')` and `require('@commitlint/load')`
both load without error. `npm run analyze` (the only script that uses
`rollup-plugin-visualizer`) still builds correctly — its `visualizer()`
API (named export, `filename`/`gzipSize`/`brotliSize`/`template` options)
has been stable across the major version jump.

A full lockfile scan afterward (checking every package's own `engines`
field against Node 20.20.1, not just the ones the original warning
listed) confirmed zero packages left requiring Node ≥22 exclusively.

### 38. `interactObj.value.resizable is not a function` — a real crash in the demo app, across multiple views

Reported with a screenshot: repeated Vue warnings ("Unhandled error during
execution of watcher callback" / "...of component update") followed by
`Uncaught (in promise) TypeError: interactObj.value.resizable is not a
function`, at `tryMakeResizable (useGridItemResize.ts:362:25)`, from
`GridItem.vue:491:3` — across `BasicGridView`, `DragResizeView`, and
`DynamicItemsView` alike, none of which share any code specific to one
another, pointing at something structural rather than view-specific.

**Root cause**: `GridItem.vue` declares `const gridItem =
ref<HTMLElement>({} as HTMLElement)` — a placeholder cast, not a real
element, until the template actually mounts and Vue assigns the real DOM
node via `ref="gridItem"`. Both `tryMakeDraggable()` and
`tryMakeResizable()` start with `if (interactObj.value === undefined) {
interactObj.value = interact(gridItem.value); }`, with no check that
`gridItem.value` is an actual mounted element first. Both functions are
called from a long list of `watch()` callbacks throughout the file
(reacting to `cols`, `rowHeight`, `isDraggable`, `isStatic`, etc.) — if
one fires before (or right around) mount, `interact()` gets called with
the placeholder object instead of a real `Element`. interact.js doesn't
throw on this; it silently produces a degenerate `Interactable` missing
the normal action methods a real one has, and the actual crash only
surfaces *later*, the next time something tries to call `.resizable()`
or `.draggable()` on it — far from where the bad target was actually
passed in, which is why the stack trace points at a watcher callback
rather than anything obviously wrong.

This also explains why the existing test suite never caught it: every
component test mocks `@interactjs/interact` entirely (see `tests/setup.ts`),
and that mock accepts *any* value as a target — including `{}` — and
returns a fully-functional fake `Interactable` regardless. Real
interact.js's actual target-handling behavior for a non-Element object
can't be observed through that mock at all, the same category of gap
finding #35 (cross-grid drop) already ran into once.

**Fixed** with a guard at the top of both functions:
`if (!(gridItem.value instanceof HTMLElement)) { return; }` — skipping
the call entirely until the target is real. Whichever watcher fires once
mount actually completes picks the setup back up correctly.

**A second, related gap surfaced while checking whether that guard could
ever cause drag/resize to be silently skipped *forever*** (not just
delayed): `onMounted` never calls `tryMakeDraggable()`/`tryMakeResizable()`
directly — it only sets refs like `cols.value`/`draggable.value` and
relies on a `watch()` elsewhere noticing the value *changed* to trigger
either function as a side effect. If a resolved value happened to
already equal its own default, the watcher would never fire, and (before
this) nothing else would ever call either function at all — silently
starving drag/resize setup entirely, not just delaying it, since nothing
guarantees some *later*, unrelated change comes along by coincidence to
trigger it. Added explicit `tryMakeDraggable(); tryMakeResizable();`
calls at the end of `onMounted`, after every ref this component resolves
from `thisLayout` is set and once `gridItem.value` is guaranteed to be
the real mounted element. Both functions are already idempotent
(`dragEventSet`/`resizeEventSet` flags guard the one-time `.on()`
registration; `interactObj.value === undefined` guards Interactable
creation), so calling them here in addition to whatever a watcher
triggers is safe. A new test verifies `draggable()`/`resizable()` are
actually called on a plain mount with no reactive changes at all —
previously only implicitly relied upon via whichever watcher happened to
fire.

Given this same `interactObj` mechanism underlies dragging generally
(not just resizing), this plausibly explains reports of drag itself
being unreliable in some scenarios (see finding #35's follow-up below) —
a crashed or degenerate `Interactable` would prevent a real drag
interaction from ever starting at all, independent of anything about
cross-grid registry logic being correct.

### 39. Mirrored RTL didn't actually turn off when `isMirrored` was switched off

Reported as: "Mirrored RTL does not work when isMirrored is switched
off." `GridItem.vue`'s `renderRtl` computed was:

```js
return thisLayout?.isMirrored ? !rtl.value : rtl.value;
```

Two separate bugs compounding each other. First, `thisLayout?.isMirrored`
reads `GridLayout`'s `defineExpose({ ...props })` snapshot — frozen at
the moment `defineExpose` runs during setup (the exact same root cause
as finding #26's `margin` bug), so it never reflected `isMirrored`
changing after mount, only whatever value it happened to start at.
Second, independent of that, the condition itself made no sense: it used
the *layout's* mirrored state to decide whether to negate `rtl.value` —
but `rtl.value` already *is* the layout's mirrored state, correctly
live-cascaded via the `changeDirection` eventBus message. Negating a
value against a frozen copy of itself meant toggling `isMirrored` off
would frequently leave `renderRtl` stuck exactly where it started.

A second, independent bug in the same area: `rtl.value` was only ever
set by `changeDirectionHandler`, reacting to `GridLayout`'s
`watch(() => props.isMirrored, ...)` — a watcher that, without
`{ immediate: true }`, never fires for the prop's *starting* value, only
for changes after mount. A layout mounting with `isMirrored: true` from
the start (rather than toggling into it, like the VitePress "Mirrored
(RTL)" example does) left `rtl.value` stuck at its own hardcoded default
(`false`) until the first actual toggle.

**Fixed** by rewriting `renderRtl` to combine `rtl.value` (the live
cascaded layout state) with `props.isMirrored` — this item's *own* prop,
documented as "whether this item participates in the parent layout's RTL
mirroring" (default `true`), which the old code never actually
referenced at all:

```js
return props.isMirrored ? rtl.value : false;
```

An item opting out (`isMirrored: false`) simply never renders RTL,
matching "does not participate" — it doesn't invert to the opposite of
whatever the layout is doing. Also added an `onMounted` resolution
(`rtl.value = thisLayout?.isMirrored as boolean`) for the missing-initial-value
bug, using the same "safe to read the snapshot here specifically, since
it's still current at mount" reasoning `isDraggable`/`isResizable`/
`isBounded`/`showCloseButton` already rely on for their own onMounted
resolutions. Four new tests cover: the initial-mount case, the full
toggle round trip (on → off → on, checking the DOM class after each
step), and the per-item `isMirrored: false` opt-out.

### 40. VitePress example fixes from a manual pass

- **"Responsive breakpoints"**: all six items were `w: 2`, but the
  narrowest default breakpoint (`xxs`) only has 2 columns total — every
  item occupied an entire row by itself there, never actually
  demonstrating "more than one column" at the point where it matters
  most. Changed to eight `w: 1` items, so at least two fit per row even
  at `xxs`.
- **"Add or remove items"**: `addItem()` always pushed
  `{ x: 0, y: 0 }`, relying entirely on collision resolution to cascade
  the new item somewhere else — fragile, since the exact resting
  position was never something the function chose directly, only an
  incidental side effect of compaction order. Added a toggleable second
  strategy ("add to end of first row") alongside a corrected default
  ("add to a new row", now computed directly from the layout's actual
  bottom-most occupied row instead of relying on the collision cascade).
- **"Custom drag handle & close button"**: dragging from the handle
  triggered a resize instead of a move. Resizing activates based on
  pointer proximity to the item's own edges, not on any specific handle
  element — it has no awareness of what `dragAllowFrom` restricts
  dragging to. The handle in this example sits at `top: 8px; left: 8px`,
  well within interact.js's own edge-proximity margin for both the `top`
  and `left` resize edges, so grabbing it could be interpreted as
  starting a resize instead of the drag `dragAllowFrom` was supposed to
  scope things to. Fixed by also setting `resizeIgnoreFrom` to the same
  selector — the same category of CSS-selector restriction, just for
  resizing instead of dragging, which is what actually stops the two
  from contending over the same gesture.
- **"Show close button"**: only ever showed a hardcoded
  `show-close-button` on every item, with no way to toggle it. Rewritten
  to set `showCloseButton` on `GridLayout` instead, driven by a toggle —
  which doubles as a live demonstration of the inherit-from-`GridLayout`
  mechanism finding #31 fixed, since no item in the example sets its own
  override.

### 41. `dragend` committed a stale position — verified with real Playwright for the first time this whole engagement

This session got real browser access (Playwright, with a working Chromium
build already on disk — a version mismatch with the declared
`@playwright/test` initially blocked it; resolved by finding the exact
older `playwright` release matching the installed browser revision and
temporarily using it). Every fix up to this point in this document had
been reasoned through, unit-tested against a fully mocked `interact.js`,
or at best checked via `vue-tsc`/build success — never actually watched
run in a browser. This finding is what that gap had been hiding.

**Symptom**: dragging an item in the demo app frequently ended with the
item back near — sometimes exactly at — its starting position, despite
`dragstart`/`dragmove`/`dragend` all firing correctly and `dragmove`'s
own per-step deltas being individually correct throughout (confirmed by
instrumenting `handleDrag` directly and watching a 12-step, 220px mouse
move produce twelve consistent ~18px deltas).

**Root cause**: `dragend`'s position calculation was a near-duplicate of
`dragstart`'s — both read the dragged element's live
`getBoundingClientRect()`. That's correct for `dragstart` (nothing has
moved yet, so a fresh DOM measurement is trivially accurate) but wrong
for `dragend`: by then, many `dragmove` events have already run,
each synchronously updating `dragging.value` in JS. A fast mouse gesture
fires all of its move/up events back-to-back before the browser yields,
but Vue's own re-render — turning the updated `dragging.value` into an
actual CSS transform on the element — is queued asynchronously, not
immediate. Reading `getBoundingClientRect()` at `dragend` could therefore
capture whatever position the DOM last happened to actually paint, not
the latest one `dragging.value` already held — landing a fast or long
drag far short of where the pointer actually ended up.

**Fixed** by having `dragend` reuse `dragging.value` directly — the same
accumulator `dragmove` already maintains as the source of truth — instead
of a second, independent, potentially-stale DOM read. A new unit test
exploits `dispatchDragEvent`'s mocked target having a *fixed*
`getBoundingClientRect()` regardless of the event's `clientX`/`clientY`:
under the old code this made `dragend`'s emitted position always the
same value no matter how far a preceding `dragmove` had gone — exactly
the bug — so asserting `dragend`'s emitted position matches the
preceding `dragmove`'s catches a regression back to reading the DOM
directly. Reverting the fix and re-running confirmed the test fails
correctly (`expected 3, got 0`).

**A second, unrelated thing this real-browser access revealed**: the
existing `e2e/drag-and-resize.spec.ts` test dragged an item *diagonally*
in a layout where `verticalCompact` is on by default — and compaction
actively removes vertical gaps. Dragging an item down into space with
nothing below it to justify staying there is *supposed* to snap back up
once compaction runs after the drop; that's correct, intentional
behavior, not a bug. The test's vertical component was fighting its own
assertion. Verified directly: the identical diagonal drag, with
`verticalCompact` turned off first, moves the item correctly in both
axes and holds the new position. Fixed the test accordingly rather than
the (already-correct) library behavior.

**What's still open**: the full `e2e/drag-and-resize.spec.ts` suite,
run via `npx playwright test`, showed additional failures (e.g.
"disabling draggable prevents movement" reported a large, unexpected
position delta) that could **not** be reproduced via a standalone
Playwright script exercising the identical steps in isolation — those
same scenarios passed cleanly every time run alone. This points at a
test-sequencing or state-isolation issue specific to running the full
spec file back-to-back through the official test runner in this
environment, not a library bug — but it wasn't fully root-caused before
running out of investigation time this session, and deserves a closer
look before treating the rest of that spec file's current pass/fail
status as reliable signal.

### 42. No cursor affordance for dragging or resizing at all, and a silent-failure gotcha in cross-grid drag

Reported as two things together: "Cursor type is incorrect. Always show
arrow, not drag or resize cursor" and "Drag drop from to grid still not
working. Which props has to be set with which value? Or is this a bug."

**Cursor issue, confirmed directly** (`getComputedStyle(el).cursor` on a
live page): a draggable item's body reported `default` — the plain
arrow — regardless of whether it was draggable at all. `.vue-grid-item`'s
base rule sets `cursor: default` and nothing ever overrode it for the
`.vue-draggable` case. Separately, and more surprising: **there was no
resize handle element in the template at all.** CSS existed for
`.vue-resizable-handle`/`.vue-rtl-resizable-handle` with `icon-resize-se`
styling, but grepping the actual `<template>` block turns up no matching
element anywhere — that markup describes something that doesn't exist in
the current component, dead CSS left over from (per the SCSS's own
`icon-resize-se`-only naming) whenever resize was still bottom-right-only,
before the other seven directions were added (see finding #25's
"Resize All Edges" history). Since interact.js's resize activation is
edge-proximity based — not tied to any specific handle element (see
`useGridItemResize.ts`'s `edges: { bottom: true, left: true, right: true,
top: true }`) — resizing *worked* the whole time, from any of its eight
directions; there was simply no visual indication, cursor or otherwise,
that hovering near an edge would do something different from hovering
the middle.

**Fixed**: `.vue-draggable` now sets `cursor: move`. Eight new,
purely-cosmetic `<span aria-hidden="true">` hint elements — one per edge
and corner — render only when `resizableAndNotStatic`, absolutely
positioned in a 10px band along each edge/corner (matching interact.js's
own `resize.defaultMargin` for mouse input — 20px for touch/pointer
input, but a single value is a reasonable compromise for a purely visual
hint that doesn't need pixel-perfect accuracy against whichever input
type is actually in use), each with the correct directional CSS cursor
(`ns-resize`, `ew-resize`, `nesw-resize`, `nwse-resize`). Verified
directly that these don't interfere with actual drag/resize activation —
mousedown on a hint element still bubbles to the parent
`.vue-grid-item`, where interact.js's listeners are attached, exactly
like mousedown anywhere else on the item; dragging from the body and
resizing from a previously-cursor-less edge (e.g. the left edge, top
edge) were both re-tested end-to-end in a real browser after adding
these and work identically to before. Three new component tests cover
the hint elements rendering only when actually resizable and not static
— scoped to exclude `GridLayout`'s own internal drag-placeholder, which
independently resolves `resizable` and renders its own copy of these
hints too, the same category of test gotcha finding #31 ran into for the
close button.

**Cross-grid drag, re-verified end to end in a real browser with the
demo app's "Cross-grid drag/drop" view**: dragging an item from one grid
and dropping it in the other correctly removed it from the source and
added it to the target, confirmed by checking DOM parentage directly
(not just an event firing) — this now works. The `dragend`/`interactObj`
fixes from findings #38 and #41 plausibly explain why it previously
didn't, given both are on the exact code path any drag (cross-grid or
not) depends on.

**But the second half of the report — "which props has to be set with
which value" — pointed at a real, separate gotcha worth fixing on its
own**: tested what happens when only one of the two grids has
`allowCrossGridDrag` set. If the *source* lacks it, dragging just behaves
like a normal single-grid drag — unsurprising. If the *target* lacks
it — the more likely mistake, and the more confusing one — **the drop
fails completely silently**: no event, no rejection, the item simply
settles back within its own grid, indistinguishable from having dropped
on ordinary empty space. This is coherent given how the feature works (a
grid without `allowCrossGridDrag` was never added to the registry at
all, so there's no target `findCrossGridZoneAt` could have found to
reject *from*), but from the outside, "I set this prop and nothing
happens, not even an error" is exactly what a confusing bug looks like.
Not changed behaviorally — a grid that never opted into the cross-grid
system at all shouldn't need some kind of passive registration just to
correctly ignore drops from a page it doesn't know exists — but
documented explicitly: the props reference and the VitePress example's
own description both now say plainly that `allowCrossGridDrag` must be
set on *both* grids, and that a missing one fails silently rather than
erroring.

### 43. `allowOutsideDrop`: native drag-and-drop from outside, promoted from a hand-rolled example to a real prop

Following up on the demo app's new "drag from outside, multiple grids"
view (built the same way [Drag, drop from outside](/examples/11-example)
always had been — manually, via `GridItem`'s exposed `calcXY()` and
`GridLayout`'s exposed `dragEvent()`) — asked to "add props for this
scenario," matching how `allowCrossGridDrag` (finding #34) turned a
hand-rolled cross-grid example into a real library feature.

**Design, and specifically what *not* to call it**: `disableExternalDrop`
already exists, but means something entirely different — rejecting drops
*from other grids* under `allowCrossGridDrag`. Reusing "external"
terminology for "drag from a non-grid source" would have collided
with it in every consumer's mind, if not in code. Named this
`allowOutsideDrop` instead, matching the *example's* own long-standing
name ("Drag, drop from outside") rather than inventing new vocabulary the
docs didn't already use.

**Props**: `allowOutsideDrop` (default `false`), `outsideDropWidth`/
`outsideDropHeight` (default `2`/`2`) — the size of both the live preview
and whatever gets reported on drop. **Event**:
`EGridLayoutEvent.ITEM_DROPPED_FROM_OUTSIDE`, payload `{ x, y, w, h,
dataTransfer }`. Deliberately does **not** touch `layout` on its own —
unlike `allowCrossGridDrag`'s `acceptDrop` (which moves a real,
already-known `ILayoutItem` between two grids the library already
understands), a plain `draggable="true"` element could be anything; the
library has no way to know what it represents. `dataTransfer` — the
native `DataTransfer` object from the browser's own `drop` event — is
exactly the mechanism HTML5 drag-and-drop already provides for exactly
this: a source calls `dataTransfer.setData(...)` in `dragstart`, and the
`ITEM_DROPPED_FROM_OUTSIDE` handler calls `dataTransfer.getData(...)` to
decide what — if anything — actually gets pushed onto `layout`.

**Implementation reuses `GridLayout`'s own existing placeholder/
`isDragging` state** — the exact same one a normal in-grid drag already
drives — rather than introducing parallel preview machinery, so the
live preview looks and behaves identically regardless of which kind of
drag produced it. Listeners (`dragenter`/`dragover`/`dragleave`/`drop`)
attach directly to the grid's own root element via `addEventListener`,
gated by `allowOutsideDrop` and reactive to it changing after mount
(same register/deregister-on-toggle pattern as `allowCrossGridDrag`,
including the same bug class fixed in finding #34's follow-up if it had
been missed here — toggling the prop needed to actually take effect, not
just its initial value).

Two things worth calling out in the implementation itself:

- **`preventDefault()` in `dragover` is required**, not optional — per
  the HTML5 drag-and-drop spec, a drop target that never calls it during
  `dragover` is never considered valid, and the `drop` event simply never
  fires. This is the exact same gotcha already caught once, in an earlier
  (later replaced) cross-grid approach — see finding #30.
- **`dragenter`/`dragleave` fire on every child element a drag passes
  over, bubbling included** — a well-known HTML5 DnD quirk. Naively
  hiding the placeholder on any `dragleave` would make it flicker
  constantly as the pointer moves over `GridItem`s inside the grid
  (leaving the grid's own background, entering a child, leaving the
  child, re-entering the background...). Fixed with the standard
  enter-count workaround: increment on every `dragenter`, decrement on
  every `dragleave`, only actually hide the placeholder once the count
  returns to zero.

**Verified in a real browser** (not just jsdom) before writing anything
else — dropping into an initially-empty grid, dropping alongside an
existing item, releasing away from any grid, and sweeping a single
continuous drag from over one grid straight to another without ever
releasing over the first one (confirming the preview cleanup, not just
successful drops). The last of those caught the same test-authoring
mistake twice in one session: an initially-empty grid's container
height shrinks to near-nothing, so a fixed pixel offset from its
top-left corner can land *outside* its own bounding box — both the
manual e2e test script and the checked-in `e2e/external-drop.spec.ts`
had this bug at first, fixed by targeting the grid's actual measured
center instead.

**Demo, sandbox, and both VitePress examples updated to the new prop.**
The demo's `ExternalDropView.vue` (and `examples/23-example.vue`) had
been built the hand-rolled way in the same work that led to this feature
existing at all — rewritten to the declarative props once they existed,
dropping the manual `calcXY`/`dragEvent`/mouse-tracking/per-grid-hit-testing
entirely (a `findGridUnderMouse()`-style helper is only needed when *one*
piece of code has to arbitrate between several grids at once, which
`allowOutsideDrop` never does — each grid handles its own drops
independently). `examples/11-example.vue` (the original single-grid
version) was rewritten the same way, and the sandbox (`sandbox/App.vue`)
gained an `allowOutsideDrop` checkbox and a draggable widget chip,
consistent with its "exercise every prop" purpose.

### 44. Sandbox restyled to match the demo app, `mini.css` removed

The sandbox (`sandbox/App.vue`) had never been touched stylistically —
loaded `mini.css` from a CDN in `index.html` and relied heavily on its
utility classes (`row`, `col-sm-*`, `container`, `secondary`/`tertiary`/
`small` button variants) plus a handful of hardcoded, mismatched colors
(`.container { background: #646cff; }`, `.layout { background-color:
#58749f; }`, `.test { background-color: #a86666; }`) — visually
unrelated to the `demo/` app's clean, neutral design.

**Checked for functional dependencies before removing anything** — not
just cosmetic ones. `mini.css`'s `.hidden` utility class was actually
load-bearing: it was the only thing hiding the "Reset Layout" button
(`<div class="row hidden">`), which has no other visibility toggle
anywhere in the component. Removing `mini.css` without accounting for
this would have made a previously-invisible button suddenly appear —
a behavior change, not just a restyle. Preserved the exact same hidden
state via a new `.sandbox-hidden { display: none; }` class, applied to
both that button and the (separately, deliberately hidden)
`isDraggable`/`isResizable` checkboxes that previously used `mini.css`'s
unrelated `.hide` class for the same purpose.

**Restyled by importing `demo/style.css` directly** (`@import
'../demo/style.css';` inside the sandbox's own `<style scoped>` block)
rather than duplicating its CSS custom properties — one source of truth
for the shared color/spacing tokens, consistent with how `demo/`'s own
views all pull from the same file. Template classes were remapped from
`mini.css`'s grid/utility vocabulary onto `demo/style.css`'s existing
component classes (`.demo-controls` for the flex-wrapped control
groups, `.demo-grid-wrap` for the panel cards, `.demo-droppable` for the
outside-drop widget, `.demo-log` for the event log) — no `v-model`,
event handler, `ref`, or prop binding changed, only the surrounding
markup and its classes, to minimize the chance of a styling pass
quietly breaking behavior.

**Found and fixed one specificity conflict this surfaced**: the
library's own default `.vue-static` background
(`$grid-item-static-bg-color: #393d42`, a dark gray, unrelated to this
session's changes) was winning over the sandbox's own `.test` item
styling for static items, since both are single-class selectors on the
same element and `.vue-static`'s compiled CSS happened to load after
the sandbox's own — dark background, dark default text, unreadable
labels on static items specifically. Fixed by raising specificity
(`.vue-grid-item.test`) and adding an explicit `.vue-grid-item.test.vue-static`
override using the same light-gray treatment `demo/style.css`'s own
`.demo-item.is-static` already uses, rather than leaving it to
load-order luck.

**Verified interaction-by-interaction in a real browser** after the
restructure, not just visually — drag, resize (from a hint added in
finding #42, confirming those didn't get broken by the new surrounding
markup), and the new `allowOutsideDrop` toggle end-to-end (widget drag →
item appears in the grid). The first two resize/outside-drop attempts
appeared to fail and looked exactly like a regression — turned out to be
two different test-script mistakes, not real bugs: the first resize
attempt picked `testData`'s item `1`, which has a deliberate
`isResizable: false` per-item override baked into the sandbox's own
fixture data; the outside-drop attempts used Playwright's default
~720px-tall viewport, and the sandbox's now-taller page (more stacked
`.demo-controls` sections above the grid than before) pushed the grid
below the fold, so the drop's target coordinates landed outside the
browser's actual viewport. Neither was caused by the restyle itself —
confirmed by re-running both against a taller viewport and a
correctly-resizable item, both working exactly as before.

### 45. `license-checker` replaced — abandoned since 2019, dragging in five other deprecated packages

Reported as a wall of `npm warn deprecated` output during install:
`readdir-scoped-modules`, `osenv`, `inflight`, `debuglog`, `semver-diff`,
`read-package-json`, `whatwg-encoding`, `glob@7.2.3`, `read-installed`,
`glob@10.5.0` (twice).

Traced each one to its actual source via `npm ls <package>` rather than
guessing — six of the ten were a single chain:
`license-checker@25.0.1` → `read-installed@4.0.3` →
`readdir-scoped-modules`/`debuglog`/`read-package-json`, plus
`nopt@4.0.3` → `osenv`. `license-checker` (the original, davglass)
has been unmaintained since 2019 — confirmed directly, not assumed —
and its actively-maintained fork, `license-checker-rseidelsohn`, uses
`@npmcli/arborist` internally instead of the old `read-installed`
module.

**Swapped in `license-checker-rseidelsohn`** — same CLI flags
(`--production`, `--onlyAllow`, `--summary` all still supported
unchanged, confirmed against its README before assuming so), so
`check:licenses` only needed the command name updated, not its
arguments. The *latest* release (5.x) requires Node ≥24/npm ≥11 —
incompatible with this project's Node 18/20/22 CI matrix (see finding
#37's EBADENGINE history for the exact same category of mistake to
avoid repeating) — so used the newest version that still declares
Node ≥18 support instead (`^4.4.2`), the same "newest-compatible, not
just newest" approach #37 established.

**Result**: `readdir-scoped-modules`, `osenv`, and `debuglog` are gone
entirely. `read-package-json` is still pulled in — by `4.4.2`'s own
`read-installed-packages@2.0.1` dependency — but that's now a single
leaf package rather than a five-package chain, and there's nothing
newer to move to without crossing into the Node ≥24 requirement.

**What's left, and why each one isn't safely fixable the same way**:

- **`glob@7.2.3` → `inflight@1.0.6`**, via
  `cz-conventional-changelog@3.3.0` → `commitizen@4.3.2`. Checked:
  `cz-conventional-changelog@3.3.0` is already the latest version, and
  it depends on `commitizen@^4.0.3`, which already resolves to
  `commitizen`'s own latest (`4.3.2`) — there's no newer version of
  either package to move to. `commitizen` is a devDependency used only
  for interactive `git cz` commit authoring, never part of the actual
  build/test/CI pipeline, so this doesn't reach any shipped artifact.
- **`semver-diff@5.0.0`**, a direct dependency of `semantic-release@24.2.9`
  itself, not a transitive chain — nothing to substitute without
  semantic-release updating its own dependency.
- **`whatwg-encoding@3.1.1`**, a direct dependency of `jsdom@26.1.0`
  (already the version this project uses for the test environment) —
  same situation, upstream's call to make.
- **`glob@10.5.0`** (three separate sources: npm's own bundled tooling
  inside `@semantic-release/npm`, `@vitest/coverage-v8`'s `test-exclude`,
  and `@vue/test-utils`'s `js-beautify` dependency). Checked whether
  bumping any of these three packages resolves it: `@vue/test-utils`'s
  `^2.4.11` is already the latest 2.x release; `@vitest/coverage-v8`
  does have a newer major (4.x) that likely fixes this, but it needs to
  move in lockstep with a matching `vitest` major bump — a
  meaningfully bigger, riskier change than "fix a deprecation warning,"
  out of scope for this specific request. Deliberately did **not** use
  an npm `overrides` entry to force a newer `glob` globally here: glob's
  API changed across majors (v7's callback style vs. v9+'s promise-only
  API), and forcing a version jump on packages this project doesn't
  control, without verifying each one's actual runtime compatibility
  with the new API, risks silently breaking whichever of them still
  calls glob the old way — worse than the warning it would silence.

### 46. `package.json`'s `exports` map pointed to a CSS file that doesn't exist — found by finally testing the package the way a real consumer would

Asked what's needed for production readiness. Answering that honestly
required checking something no part of this entire engagement had ever
actually checked: **does the published package work when installed and
imported the normal way**, rather than via the source-alias imports
`demo/`, `sandbox/`, and every VitePress example use internally
(`@/` → `src/`, bypassing `package.json`'s `exports` field entirely).

Every one of those internal consumers had been exercised extensively —
303 tests, 16 e2e scenarios, a fully-built and manually-tested demo app
and sandbox, 23 working VitePress examples — and every one of them
would have kept working fine even with this bug in place, because none
of them ever go through `exports` at all.

**The bug**: `"./style.css": "./dist/style.css"` — but the actual build
output is `dist/vue-ts-responsive-grid-layout.css`, matching the
package's own name, not the generic `style.css` the exports entry
claimed. Confirmed directly, not by inspection alone: `npm pack`, then
`npm install` the resulting tarball into a genuinely separate scratch
project (no shared `node_modules`, no source aliasing), then
`require.resolve('vue-ts-responsive-grid-layout/style.css')` — which
failed before the fix and resolves correctly (to the real 8.5KB file)
after it. `guide/installation.md`'s own documented usage —
`import 'vue-ts-responsive-grid-layout/style.css';`, the exact line
every example and the demo app effectively assumes — would have thrown
a module-resolution error for every single consumer who followed it.

**Fixed** by pointing the exports entry at the file that actually
exists (`./dist/vue-ts-responsive-grid-layout.css`) rather than
renaming the build output — the smaller, more surgical of the two
options, since it only touches a declaration, not the build
configuration everything else already depends on. Re-verified the same
way: fresh `npm pack` → fresh scratch install → `require.resolve`
succeeds, and a full `import('vue-ts-responsive-grid-layout')` resolves
every documented named export (`GridLayout`, `GridItem`,
`CustomCloseButton`, `CustomDragElement`, `EGridItemEvent`,
`EGridLayoutEvent`) correctly too.

**The broader lesson this surfaces**: a test suite — however
comprehensive — that only ever exercises a library through source
aliases never actually proves the *published artifact* works. This is
worth turning into a standing check, not a one-time fix: a CI step that
packs the tarball, installs it into a scratch directory, and asserts
both the main entry and every `exports` subpath actually resolve, would
have caught this the moment it was introduced rather than leaving it
latent through an entire engagement's worth of otherwise-thorough
testing.

### 47. `borderRadiusPx`/`useBorderRadius` didn't cascade from `GridLayout` to items — reported as "borderradius is not working"

Same bug class as finding #31 (`showCloseButton`), one prop pair later.
`GridItem.vue`'s `borderRadiusPx`/`useBorderRadius` defaulted to concrete
values (`10`/`false`) instead of `null` — the "inherit from `GridLayout`"
sentinel `isDraggable`/`isResizable`/`isBounded`/`showCloseButton` all
use — so setting `borderRadiusPx`/`useBorderRadius` only on `GridLayout`
(a completely reasonable thing to try, matching how every other
cascading default works) had no visible effect on any item that didn't
*also* set its own copy of both props directly. Confirmed directly
before writing any fix: toggled the demo app's controls (which only
ever bound these two props on `GridLayout`) and watched a real item's
computed `border-radius` stay at `0px` regardless.

**Fixed** with the same mechanism #31 already established: local
resolved refs (`useBorderRadiusResolved`/`borderRadiusPxResolved`),
watchers on the item's own props, an eventBus round trip
(`setUseBorderRadius`/`setBorderRadiusPx`) so `GridLayout` can push a
changed default to items that haven't overridden it, and an `onMounted`
resolution reading `GridLayout`'s current value through `$parent` for
whichever prop starts `null`. `borderRadiusStyle` and the
`vue-use-radius` class now read the resolved refs instead of the raw
props. Verified the same way the bug was found: re-ran the exact demo
toggle sequence and watched the computed style actually change this
time (`0px` → `30px`). Nine new component tests cover both directions
of the cascade (inherit, per-item override, and reactive changes to
each afterward) plus the *not*-inheriting case (default stays off), the
same coverage shape #31's tests already had for `showCloseButton`.

### 48. Examples 12, 22, and 23 usability: a near-invisible drop target, and a `preventCollision` control that isn't always meaningful to add

Reported for example 12, tested directly rather than assumed, then
checked examples 22 and 23 for the same two gaps on request — found
example 22 had both, and example 23 had one of the two, with the
*other* turning out not to actually apply there once checked directly
rather than assumed to carry over unchanged.

- **An emptied-out (or never-populated) grid's height collapsed to
  ~10px** in all three examples — example 12's target and example 23's
  Grid 2 both start with an empty `layout` array; example 22's three
  grids all start with content, but any of them could end up empty
  mid-session once items get dragged out. Same effect either way,
  matching finding #33's fix for genuinely supporting an empty starting
  layout being correct on its own, but combined with no minimum height
  on any of the three examples' own wrappers, making whichever grid
  ends up empty "so small it's difficult to drop into," exactly as
  reported. Added a 140px `min-height` to every grid's wrapper in all
  three — a `min-height` still yields to `GridLayout`'s own computed
  height once real content grows past it, since CSS `min-height` only
  acts as a floor, not a fixed replacement for `height`. Verified
  directly in each: dragged/dropped until a grid was empty, confirmed
  the wrapper still measured 140px rather than collapsing.
- **No `preventCollision` control existed on examples 12 or 22** —
  added to both (default `false`, matching the prop's own default),
  verified to actually change behavior in both: with it on, dragging
  one item directly onto another leaves the second item's position
  completely unchanged instead of displacing it.
- **Added the same control to example 23 first, then checked whether it
  actually did anything there before leaving it in** — it didn't.
  Examples 12 and 22 both use `allowCrossGridDrag`, whose drop path runs
  through `moveElement`, the same collision-aware placement machinery a
  normal in-grid drag uses, so `preventCollision` genuinely changes its
  outcome. Example 23 uses `allowOutsideDrop`, whose resolved drop
  position (`outsideDropPositionFromEvent`) is a plain pointer-position
  → grid-unit conversion with bounds clamping only — grepping the
  function confirms it never reads `preventCollision` at all — and the
  landing item is added to `layout` by the consumer's own
  `item-dropped-from-outside` handler as a plain array push, not a
  `moveElement` call either. Confirmed empirically, not just by reading
  the source: dropped directly onto an existing item with the toggle on
  and again with it off — identical resulting layout both times. A
  control that doesn't change anything is worse than no control at all
  (it implies a guarantee that isn't there), so removed it from example
  23 rather than leaving something that looked like it worked.

The originally-reported "item moves down, then back up" sequence and an
"the layout says 2,2 but the grid's height doesn't match" observation
(both against example 12) were investigated directly (multiple
real-browser drag sequences, checking both the live layout data and the
grid's measured `getBoundingClientRect()` at each step) and traced to
standard, correct vertical-compaction behavior (an item sliding up to
fill a gap once another item leaves the grid) combined with the same
undersized-empty-grid effect the `min-height` fix above addresses — not
a separate bug found in that investigation.

### 49. Demo's multi-grid outside-drop view: an existing item dragged toward the other grid just stayed put

Reported as "dragged from grid 1 to grid 2, it is not being removed
from grid 1." Confirmed directly: `ExternalDropView.vue` (and its
VitePress counterpart, example 23) only ever set `allowOutsideDrop` on
either grid — never `allowCrossGridDrag`. Dragging an *existing*
`GridItem` toward the other grid is a completely different code path
from the outside-drop palette above it (interact.js's own pointer-based
drag, not a native HTML5 drag `allowOutsideDrop` listens for), and
without `allowCrossGridDrag` that drag is simply confined to its own
grid by default — correct, unremarkable behavior for a single grid, but
a reasonable thing to expect *not* to happen once there are visibly two
adjacent grids on screen and one of them already demonstrates
cross-grid movement elsewhere (finding #34/example 12).

**Fixed** by adding `allowCrossGridDrag` (plus a `layoutId` each) to
both grids in both places, alongside their existing `allowOutsideDrop` —
confirmed first that the two mechanisms are genuinely independent
(`allowCrossGridDrag` reacts to interact.js's own `dragEvent`/
`DRAG_END` handling; `allowOutsideDrop` listens for native
`dragenter`/`dragover`/`drop` DOM events entirely separately) before
assuming they could safely coexist on the same `GridLayout`, rather than
just trying it. Verified both directions still work correctly together
afterward: dragging an existing item between the two grids, and
dragging a new widget in from the outside-drop palette, in the same
session, on the same pair of grids. New e2e test covers the
previously-broken existing-item case directly. Descriptions and
`demo/README.md` updated to mention both mechanisms are demonstrated
together, since the VitePress example's own prose had been asserting
the two grids were "entirely independent drop targets" — true before
this fix, no longer true after it, so left as stale text would have
been actively misleading rather than just outdated.

### 55. The same undersized-empty-grid fix, applied once at the shared CSS level instead of three more times

(Numbered out of file order deliberately — this finding had accidentally
duplicated finding #50's number below, discovered while adding finding
#56; renumbered to this free slot since nothing else references it by
number, rather than cascading a renumber through every finding after it
and every cross-reference to them across the codebase.)

Asked to bring `sandbox/` up to date with recent fixes. Audited it
directly rather than assuming what needed changing:
`preventCollision`/`useBorderRadius`/`borderRadiusPx`/`allowOutsideDrop`
were already wired correctly (predating this session's example fixes),
and `borderRadiusPx`/`useBorderRadius` are bound explicitly on *both*
`GridLayout` and every `GridItem` with the same ref — meaning the
sandbox was never relying on the cross-component inherit fix from
finding #47 in the first place, so nothing there needed to change for
that. A full interaction sweep (toggling all 20 checkboxes, dragging an
item) produced zero console errors.

**What actually needed fixing**: the same undersized-empty-grid problem
findings #48 fixed per-example in VitePress turned out to also affect
two `demo/` views — `CrossGridView`'s right grid and
`ExternalDropView`'s right grid both start with an empty `layout` array
and collapse to the same ~10px. Both use the shared `.demo-grid-wrap`
class, which `sandbox/App.vue` also imports wholesale
(`@import '../demo/style.css'`, see finding #44) — meaning the fix
belongs at that one shared location rather than being copy-pasted into
each consumer separately, the way it had to be for the VitePress
examples (which don't share a common stylesheet the same way). Added
`min-height: 140px` to `.demo-grid-wrap .vue-grid-layout` once, fixing
both demo views immediately and extending the same floor to any current
or future sandbox configuration that ends up with a small/empty grid,
without needing a sandbox-specific override at all. Verified directly:
both previously-~10px empty grids now measure 140px, while an
already-tall view (`BasicGridView`, 370px) is unaffected — `min-height`
only raises a floor, it doesn't override real content that's already
taller.

### 50. The deferred kebab-case naming sweep across `core/**`, finally done

`docs/REFACTOR_STRATEGY.md`'s "Naming and file organization" section had
flagged this since early in the process: `core/**/helpers` mixed
camelCase (`gridLayoutHelper.ts`, `collisionHelper.ts`, ...) with
kebab-case (`layout-validator.ts`, `breakpoint-validator.ts`, ...) for
the same kind of file, in neighboring directories, with no discernible
reason for the split beyond accretion over time. Deliberately deferred
at the time — a repo-wide rename is exactly the kind of change a
reviewer should see as its own commit, not a side effect of whatever
else happened to be in progress.

**Scope**: 14 files — 12 helper/utility modules
(`calculateUtils.ts`, `draggableUtils.ts`, `responsiveUtils.ts`,
`gridItemTypeHelpers.ts`, `breakpointsHelper.ts`,
`gridItemCalculateHelper.ts`, `gridLayoutHelper.ts`,
`crossGridRegistry.ts`, `collisionHelper.ts`, `sortHelper.ts`,
`responsiveHelper.ts`, `moveHelper.ts`) plus 2 interface files
(`eventBus.interfaces.ts`, `transformStyle.interfaces.ts`) — all renamed
to kebab-case, matching the validators' existing convention.

**Deliberately excluded**: the enum/type declaration files
(`EGridLayoutEvents.ts`, `EDragEvent.ts`, `DOM.ts`, `ErrorMessages.ts`,
`EMovingDirections.ts`, `TMovingDirections.ts`) — these follow a
different, equally legitimate convention where the filename matches the
exported symbol's own PascalCase name exactly, common practice for a
file with one primary export. Renaming these would have meant renaming
the exports too (or introducing a filename/export mismatch), a much
larger and riskier change than this sweep was scoped for, and not the
inconsistency the strategy doc was actually pointing at. The
plural-vs-singular naming noted in the same section
(`EGridLayoutEvents.ts` vs. `EDragEvent.ts`) is a separate, smaller
inconsistency within that PascalCase group and wasn't part of this pass
either.

**Mechanics**: for each file, found every reference across `src/`,
`tests/`, `demo/`, and `sandbox/` (import statements, and — checked
separately, since a first pass targeting only quoted import-path
strings missed these — plain-text mentions in code comments), updated
every one, then renamed the file and its matching test file together.
Two categories of stale prose surfaced while doing the reference sweep,
both fixed:

- Documentation describing **current** state (the coverage report's
  file listing, an architecture explanation, a live GitHub link in a
  VitePress example) — updated to the new names, since these describe
  what exists now, not a moment in the past.
- Documentation describing **historical events** (this file, `CHANGELOG.md`,
  and `docs/REFACTOR_STRATEGY.md` itself, narrating the original typo
  fixes and the decision to defer this exact sweep) — left showing the
  *original* camelCase names where the sentence's whole point was
  illustrating what the inconsistency looked like, since rewriting a
  "here's the problem" illustration to already show the fix makes the
  illustration nonsensical. One genuine inconsistency found and fixed
  in this category: an earlier pass had already accidentally rendered
  part of one such illustration in kebab-case (a leftover from a rushed
  find-and-replace), quietly contradicting the same sentence's own claim
  that the sweep was still deferred — corrected back to the original
  camelCase name so the "before" picture stays accurate now that
  there's an actual "after" to contrast it with.

**Verified** the only way a rename-only change should be: clean
typecheck and the full 307-test suite immediately after, with zero
source or test logic touched — a failure at that point would have meant
a reference was missed, not that the rename itself was conceptually
wrong.

### 51. `isAndroid` crashed any server-side render — found during a rescan for enterprise readiness

Asked to rescan for enterprise-readiness gaps. `docs/FEATURE_RECOMMENDATIONS.md`
had already flagged this specific line as a *suspected* SSR risk (item
#3 there), but it had never actually been confirmed or fixed — this
pass did both.

`GridItem.vue`'s `isAndroid` computed read `navigator.userAgent`
unguarded, and is referenced from `classObj` (the `no-touch` class),
which is bound in the template — meaning it's evaluated on *every*
render, server-side included. `navigator` doesn't exist as a global in
Node.js before version 21 (an experimental Web-standard addition), and
this project's own `engines.node` field explicitly supports Node 18 and
earlier Node 20 patches, neither of which have it.

**Confirmed directly, not just reasoned about** — and it's a good thing
this wasn't left at "reasoned about," since the first attempt to
reproduce it *didn't* crash: this sandbox happens to run Node 22, which
does have the experimental `navigator` global (`navigator.userAgent`
reports `"Node.js/22"`), masking the bug entirely. Only after explicitly
deleting `globalThis.navigator` — simulating the Node 18/older-Node-20
environment this project actually claims to support — did a real
`@vue/server-renderer` `renderToString()` call against the *built*
`dist/` output (not raw source, to rule out a source-compilation
artifact) throw `navigator is not defined` and take down the entire
render, not just this component. Restored the fix, re-ran the identical
scenario, confirmed it renders correctly.

**Fixed** with a `typeof navigator === 'undefined'` guard, defaulting
to `false` server-side — the client re-hydrates and re-evaluates
correctly once real browser JS runs, so nothing is permanently lost by
not knowing the answer during SSR. New test deletes `globalThis.navigator`
directly (not `vi.stubGlobal` — that was tried first and turned out to
clear `tests/setup.ts`'s own `ResizeObserver` stub along with it,
breaking unrelated tests through `vi.unstubAllGlobals()`'s
broader-than-expected scope) and asserts mounting doesn't throw.
Verified the test actually catches the regression: reverted the fix
temporarily, confirmed the test fails with exactly the expected error,
restored it.

Checked the rest of `src/` for the same category of issue while at it:
`DOM.ts`'s `window.addEventListener` calls are only ever invoked from
`onMounted`/`onBeforeUnmount` (never during SSR); `draggable-utils.ts`'s
`document.body` reads are inside a function whose only parameter is a
real `MouseEvent`, which SSR never constructs. Neither is reachable
during a server render — confirmed by tracing every call site, not
assumed from the surrounding code looking client-only.

### 52. A standing pack-and-install smoke test, closing the gap finding #46 left open

Finding #46 fixed a real bug (`exports`'s `./style.css` pointing at a
nonexistent file) but left the actual verification gap open — every
test in this project exercises the library through source aliases,
never `package.json`'s `exports` field the way a real consumer does.
`docs/REFACTOR_STRATEGY.md` had already recommended the concrete fix
(pack the tarball, install it into a scratch directory, assert
`exports` resolves); this pass implemented it rather than leaving it as
a recommendation a second time.

`scripts/check-package-install.js`: packs the current source
(`npm pack`, filename computed deterministically from `name`/`version`
rather than parsed from `npm pack`'s own output, which turned out to
mix in `npm notice` verbosity and the `prepare` script's console output
in a way that broke naive text parsing — computing the expected
filename directly sidesteps that entirely), installs the tarball into a
fresh `mkdtemp` scratch directory (no shared `node_modules`, no source
aliasing), then for every entry in `package.json`'s `exports` map,
actually asks Node to `require.resolve` it — not just checks the target
file exists, but confirms Node's own module resolution accepts it, the
same distinction finding #46 turned on. Also imports the main entry and
confirms every documented named export (`GridLayout`, `GridItem`,
`CustomCloseButton`, `CustomDragElement`, `EGridItemEvent`,
`EGridLayoutEvent`) is actually present after a real import, not just
that the file loads.

Two implementation snags worth recording, since they're the kind of
thing that silently makes a smoke test lie about what it's checking:
`execSync` running the check script through a shell meant nested
`JSON.stringify`-quoted specifiers (`vue-ts-responsive-grid-layout/style.css`)
got their quotes stripped by shell interpretation before reaching
Node, silently turning a string literal into a bare (undefined)
identifier reference — switched to `execFileSync` with array arguments,
which never goes through a shell, to sidestep the whole class of
quoting issue rather than trying to escape around it.

**Verified the test actually catches what it's meant to**: reintroduced
finding #46's exact bug (pointed `./style.css` back at the nonexistent
`dist/style.css`) and confirmed the script fails with the precise
`Cannot find module` error a real consumer would have hit; restored the
correct mapping and confirmed it passes again. Wired into `ci.yml`
right after the existing bundle-size check, in the same "build once,
verify the artifact" phase of the pipeline.

### 53. RTL resize dragged the wrong edge fixed in place

Reported: dragging an item's left edge while mirrored (RTL) moved the
wrong anchor, and vice versa for the right edge.

In LTR, `horizontal` (the resize anchor) means `left`, and dragging the
*left* edge is what moves it — the opposite edge stays fixed, correctly.
The code hardcoded that same left-edge-moves-the-anchor logic regardless
of render direction. In RTL, `horizontal` means `right` instead, so it's
the *right* edge whose drag should move the anchor — the previous code
never updated the anchor for a right-edge drag in RTL at all, and always
updated it for a left-edge drag even though the right edge is what
should stay fixed in that direction. A second, related instance of the
identical hardcoded-LTR assumption sat in the final pixel-to-grid-unit
`x` conversion (`if (edges.left && ...)`, unconditional), which needed
the same render-direction-aware condition to actually reach the anchor
edge in RTL.

Fixed both, then verified two different ways: new unit tests for both
directions (confirmed each fails with the old code, restored, confirmed
passing again), and — since a directional/geometric fix like this is
exactly the kind of thing easy to get subtly backwards without seeing
it — a real browser drag test in both directions against the
[Mirrored (RTL)](/examples/06-example) VitePress example, checking the
actual screen-space bounding box before and after each drag. Confirmed
the non-dragged edge's screen position stayed pixel-identical in both
cases (925/1021 static right edge for a left-edge drag; 819 static left
edge for a right-edge drag) while the dragged edge and width moved
together — exactly the behavior "dragging one edge, the opposite edge
stays fixed" requires, regardless of which CSS property that fixed edge
happens to be anchored to internally.

Updated `docs/REFACTOR_STRATEGY.md`, `docs/FEATURE_RECOMMENDATIONS.md`,
`ROADMAP.md`, and the VitePress roadmap/props pages afterward, all of
which had described this as an open, best-effort limitation — leaving
that framing in place once the underlying bug was actually fixed would
have made the documentation actively wrong rather than merely outdated.

### 54. The four remaining code-level TODOs, each resolved differently — and one that reversed my own first conclusion

Asked to fix the TODO comments a repo-wide grep had turned up. Each
turned out to need a different kind of resolution — a type fix, two
real bugs, a misleading comment, and one genuine redundancy that a
first pass at investigating got backwards before empirical testing
corrected it.

**`useGridItemResize.ts`'s `// TODO strongly type event.edges`**: replaced
a blanket `@ts-ignore` with a proper local type,
`IResizeEvent = MouseEvent & { edges: IInteractEdges }`, rather than
importing `@interactjs/actions/resize/plugin`'s own exported
`ResizeEvent` type. Checked why that type wasn't just imported directly
before assuming it should be: its own `edges` field is typed as
`ActionProps['edges']` — `EdgeOptions | null | undefined`, allowing
`boolean | string | Element` per edge, accurate for the *config* passed
into `.resizable()` but looser than what an actual event's `edges`
contains at runtime, which interact.js's own source confirms is always
fully resolved to plain booleans by the time a resize listener sees it.
The project's own `IInteractEdges` already modeled that correctly; the
fix was reusing it, not replacing it with the package's less precise
one.

**RTL resize dragged the wrong edge fixed in place** — two related
`// TODO handle rtl properly` markers, both real functional bugs, not
just missing types. In LTR, `horizontal` (the resize anchor) means
`left`, and dragging the *left* edge is what moves it — the opposite
edge stays fixed, correctly. The code hardcoded that same
left-edge-moves-the-anchor logic regardless of render direction. In
RTL, `horizontal` means `right` instead, so it's the *right* edge whose
drag should move the anchor — the previous code never updated the
anchor for a right-edge drag in RTL at all, and always updated it for a
left-edge drag even though the right edge is what should stay fixed in
that direction. A second, related instance of the identical
hardcoded-LTR assumption sat in the final pixel-to-grid-unit `x`
conversion (`if (edges.left && ...)`, unconditional), which needed the
same render-direction-aware condition to actually reach the anchor edge
in RTL. Fixed both, then verified two different ways: new unit tests
for both directions (confirmed each fails with the old code, restored,
confirmed passing again), and — since a directional/geometric fix like
this is exactly the kind of thing easy to get subtly backwards without
seeing it — a real browser drag test in both directions against the
[Mirrored (RTL)](/examples/06-example) VitePress example, checking the
actual screen-space bounding box before and after each drag. Confirmed
the non-dragged edge's screen position stayed pixel-identical in both
cases (925/1021 static right edge for a left-edge drag; 819 static left
edge for a right-edge drag) while the dragged edge and width moved
together — exactly the behavior "dragging one edge, the opposite edge
stays fixed" requires, regardless of which CSS property that fixed edge
happens to be anchored to internally.

**`responsive-helper.ts`'s `// TODO obsolete code..`**: checked before
believing it — `findOrGenerateResponsiveLayout` is not obsolete, it's
the one function `useResponsiveLayout.ts` calls on every breakpoint
change, with its own three-test spec file covering clone/bounds-correct/
compact behavior, input immutability, and the undefined-layout edge
case. Comment removed, replaced with a note explaining why it was wrong
rather than just deleting it silently.

**`responsive-utils.ts`'s `// TODO experiment to get a layout where this
is the case ... this is not being triggered`**, dated 2023: the
"overflows left" branch this sat on turned out to be reachable, just
not from the angle originally tried. An existing test already covered
feeding an already-negative `x` straight in; what hadn't been tried was
letting `correctBounds`'s own *right*-overflow correction
(`l.x = bounds.cols - l.w`) produce a negative value as a side effect,
from a positive starting `x` — which happens for something entirely
ordinary: an item whose `w` exceeds the *new* breakpoint's own column
count (shrinking from a wide desktop breakpoint down to a narrow mobile
one, with the item's `w` never separately adjusted). New test
constructs exactly that layout and confirms the branch handles it
correctly; TODO removed and replaced with an explanation of both
reachability paths.

**`GridLayout.vue`'s `// TODO remove eventBus`** — the one where my own
first conclusion was wrong, corrected by testing rather than by
reasoning harder. Initial check: does `GridItem.vue`'s `setColNum`
handler do something real? Yes — `cols.value = colNum`, feeding
directly into every pixel-to-grid-unit calculation the resize composable
does, clearly not a no-op. Concluded the comment was mistaken, wrote a
regression test to lock in "the cascade works" — and the test passed
even with that specific emit deleted. Rather than accepting a
passing-for-unexamined-reasons test, traced *why* it still passed:
`responsiveGridLayout()` — called unconditionally by the very same
watcher, directly below the emit in question — always ends with its
own `eventBus.emit('setColNum', colsCompute)` in `useResponsiveLayout.ts`,
computed from that same just-updated `colNum`. Two emit sites reachable
from one prop change, the second entirely redundant with the first.
Confirmed by removing each independently: deleting the watcher's own
emit (this finding's fix) leaves the suite green; deleting
`responsiveGridLayout`'s emit instead makes the exact same regression
test fail with the precise stale-`colNum` value the removed emit would
have prevented. Removed the redundant one, kept the real one, and left
a comment explaining the actual call graph — including for the reviewer
who'd reasonably ask "didn't you just say this does something real?" —
rather than a comment that would need this same investigation repeated
by the next person who finds it confusing.

### 56. A first-party persistence helper, implemented

`docs/FEATURE_RECOMMENDATIONS.md` #2 weighed two designs — a composable
wiring up its own `watch`, or a pair of pure storage-agnostic functions —
without picking one, since the tradeoff was genuinely still open at the
time. Built both rather than picking: `serializeLayout(layout)`/
`deserializeLayout(json)` as the pure functions, and
`useLayoutStorage(key, layout, options?)` as a composable wrapping them
for the common case, so a consumer who wants a non-browser backend or no
Vue reactivity involved isn't forced through the composable to get
there.

**`deserializeLayout` reuses `layoutValidator`** — the same shape check
`GridLayout` itself runs at mount — rather than a separately-maintained
set of checks that could quietly drift from what the library actually
requires a valid layout to look like. Confirmed it handles the
already-established "empty layout is valid" case correctly (finding
#33) before relying on it: `layoutValidator([])` returns `true`, so a
serialized empty layout round-trips as `[]`, not `null`.

**Never throws**, deliberately, on either side: `serializeLayout` only
ever calls `JSON.stringify` on a plain array of plain objects (no
circular references or `BigInt` values a valid `TLayout` could contain),
and `deserializeLayout` treats malformed JSON, valid JSON that isn't an
array, and a validator failure all the same way — return `null`, don't
propagate a `SyntaxError` or validation exception. The primary use case
(reading back whatever was last written to `localStorage`, which could
be anything from an earlier app version, browser extension tampering,
or simply nothing) needs a "wasn't usable" case to check for, not an
error every caller must remember to catch.

**`useLayoutStorage`'s `autoSave` defaults to `false`, debounced when
on** — a grid actively being dragged mutates `layout` continuously
(every `dragmove`/`resizemove` frame), so an eager, undebounced auto-save
would write to storage far more often than useful. An explicit `save()`
call is the safer default; `autoSave: true` with a 500ms default
debounce is opt-in for consumers who've decided that tradeoff is worth
it for their case.

**SSR-safe**, following the same pattern established after finding #51:
every storage access goes through a `typeof window` guard, so calling
`useLayoutStorage` during a server render doesn't throw — `load()`
returns `false` and `save()`/`clear()` are no-ops until the client
re-hydrates. Verified directly by deleting `globalThis.window` in a test
and confirming the composable still behaves correctly, not just
reasoned about.

[v-model & save/load layout](/examples/19-example) — the example this
whole recommendation was written against — now uses `useLayoutStorage`
instead of the hand-rolled `localStorage.setItem`/`getItem` pattern it
demonstrated before.

### 57. Generic `ILayoutItem<TMeta>`, implemented

`docs/FEATURE_RECOMMENDATIONS.md` #1 sketched this almost exactly as
implemented: `ILayoutItem<TMeta = unknown>` gains an optional `data?:
TMeta` field, with `TLayout`/`TLayoutItem` threaded to match. Confirmed
purely additive before considering it done, not just assumed from the
default type parameter: a full `vue-tsc` run across the entire codebase
came back clean, meaning every existing non-generic usage of
`ILayoutItem`/`TLayout` genuinely still compiles unchanged.

**One real fix needed along the way, not zero**: `layout-validator.ts`'s
type-checking loop indexes its reference shape object
(`validRequiredLayout`/`validOptionalLayout`, spread into `validLayout`)
using `keyof ILayoutItem`, which now includes `data` — a key that
reference object was never going to declare, since there's no single
correct `typeof` for an arbitrary consumer payload. The *runtime*
behavior needed no change: the existing `validLayout[k] ? typeof l[k]
=== typeof validLayout[k] : true` fallback already treats any key
`validLayout` doesn't declare as automatically valid (no type check
performed), which is exactly the right behavior for `data` — it was a
type-annotation-only fix (indexing through a `Record<string, unknown>`
cast) to let TypeScript see what was already true at runtime, confirmed
with new tests covering a `data` payload of several different types
(object, string, number, array) rather than just the typecheck passing.

### 58. Configurable transition duration/easing, completed — an earlier pass had missed two of the three hardcoded values

An earlier pass implementing `transitionDurationMs`/`transitionTimingFunction`
(`docs/FEATURE_RECOMMENDATIONS.md` #7) found and fixed the item's main
`.vue-grid-item` transition and `GridLayout`'s own container-height
transition, and considered the feature done. Re-checking against that
same recommendation's own text surfaced what was missed: it explicitly
describes *three* separate hardcoded values, not the two the earlier
pass addressed — `.css-transforms` (the default positioning mode) had
its own independent `transition-duration: 400ms`, and
`.vue-grid-placeholder` had its own `100ms`, both overriding the base
rule's duration via CSS specificity (a class selector beats an element
selector) without the earlier pass's search having surfaced them.

**A real design problem, not just a missed grep**: naively giving each
of these its own `var(--grid-transition-duration, 400ms)` /
`var(--grid-transition-duration, 100ms)` fallback — intending to
preserve their historical values when the new props aren't touched —
doesn't actually work, because `GridLayout` always sets
`--grid-transition-duration` explicitly on its own root element (even
at the prop's own default of `200`), so the CSS var is never actually
*unset* for a `var(..., fallback)` expression to fall through to in
normal usage. Caught by checking the actual compiled output rather than
trusting the source read: built the library and grepped the resulting
CSS, which showed both fallbacks as syntactically present but
functionally dead code.

**Resolved by unifying all three under the same configurable value**,
treating the recommendation's own framing — "three separate hardcoded
values, not one" — as license to remove the inconsistency rather than
preserve it: `.css-transforms` and `.vue-grid-placeholder` now both
reference `var(--grid-transition-duration, 200ms)`, the same variable
and same fallback as the base rule. This is a real, if minor, default
*behavior* change (the CSS-transform-positioned item and the drag
placeholder previously animated at 400ms/100ms respectively, distinct
from the base rule's 200ms; all three are 200ms by default now) —
worth stating plainly rather than glossing over, since no existing test
asserted either specific value as a contract before this change
(confirmed by grep, not assumed), and the recommendation that prompted
this work treated the three-way split as an oversight to fix rather
than a deliberate ratio to keep.

Verified by rebuilding and grepping the compiled CSS again after the
fix — both rules now correctly reference the shared variable — rather
than trusting the source edit alone, the same standard applied to
catching the dead-fallback problem in the first place.

### 59. A `#placeholder` slot for custom drag-placeholder content, implemented

`docs/FEATURE_RECOMMENDATIONS.md` #8 as implemented: a named
`#placeholder` slot on `GridLayout`, rendered inside the placeholder
`GridItem`'s own default slot, exposing `placeholder` (`{ x, y, w, h }`)
and `isDragging` as scoped slot props.

**Checked before assuming**: does `v-show` (not `v-if`) governing the
placeholder's visibility mean slot content is present in the DOM
regardless of whether a drag is in progress? Confirmed yes — a test
rendering custom slot content and checking it's found in the DOM,
without simulating any drag interaction at all, passes correctly. This
also means content layers on top of the placeholder's own existing
background/sizing rather than replacing it, the same relationship a
regular item's own slot content already has with `.vue-grid-item`'s
background — consistent with the existing pattern rather than a new
one.

No type declaration changes needed: this file's `defineComponent` never
declared its slots explicitly (checked directly — no `defineSlots` or
`slots:` option exists anywhere in it), so adding a new named slot
needed no accompanying type-surface change.

### 60. Grid-unit-based alignment guides, implemented — two real bugs caught by tests, not shipped

`docs/FEATURE_RECOMMENDATIONS.md` #6: Figma-style guide lines when a
dragged/resized item's edge lines up with another item's edge. New
pure helper (`core/gridlayout/helpers/alignment-helper.ts`,
`findAlignmentGuides`) compares the active item's left/right/top/bottom
edges against every other item's, in grid units — not restricted to
same-side matches (a left edge lining up with another item's right
edge is just as valid), and deliberately not pixel-based, since an
alignment either exists or doesn't independent of the current
`colWidth`/`rowHeight`/`margin` (those only affect where the guide
*renders*). `showAlignmentGuides` (default `false`) gates the
computation itself, not just the rendering — confirmed directly:
`updateAlignmentGuides` returns immediately when the prop is off,
before calling `findAlignmentGuides` at all.

**First bug, caught by a test asserting the specific expected guide**:
the drag call site's first attempt fed `l.x`/`l.y` (mirroring what
`placeholder.value.x`/`.y` were already set to) into the alignment
check. That turned out to still be the item's *pre-drag* position at
that exact point in `dragEvent` — `moveElement()`, called later in the
same function, is what actually updates `l`. A test dragging item `1`
onto item `0`'s left edge and asserting `{ axis: 'x', position: 0 }`
specifically (not just "a guide appeared") failed with the item's old
position instead, immediately surfacing the problem. Fixed by using the
incoming `x`/`y` parameters directly — the live drag target — instead
of the placeholder-derived values. Checked whether the equivalent
resize call site had the same risk before assuming it was fine by
analogy: confirmed `l.w`/`l.h` are genuinely already updated by the
time resize's own placeholder assignment runs (traced the code between
`getLayoutItem` and that point directly), and added a dedicated resize
test rather than skipping verification there.

**Second bug, caught by the existing test suite breaking almost
entirely**: the pixel-conversion computed
(`alignmentGuideStyles`) called `calcColWidth` unconditionally at the
top of its function body — including on every render with zero active
guides (the overwhelming majority of renders, for any consumer, since
guides only exist mid-drag) and every render before the container's
first real width measurement. `calcColWidth` throws on a
containerWidth under 1, which is exactly what `width.value` starts as.
Since this computed is read directly in the template
(`v-for="... in alignmentGuideStyles"`), evaluating it happens on every
render regardless of `showAlignmentGuides`'s value, breaking 163 tests
across this file that had nothing to do with alignment guides at all.
Fixed by short-circuiting to an empty array before the `calcColWidth`
call whenever there are no guides to convert or the container isn't
measured yet.

### 61. Visual regression coverage expanded from 4 to all 7 demo views

`docs/VISUAL_REGRESSION.md` had been flagging this gap in its own text
since it was first written: `e2e/visual-regression.spec.ts` covered the
original four `demo/` views, but three more (cross-grid drag/drop,
per-item overrides, drag from outside/multi-grid) were added to `demo/`
later and never got matching visual regression tests.

**The two multi-grid views needed a small source addition, not just a
new test**: `CrossGridView.vue` and `ExternalDropView.vue` each render
two `GridLayout` instances side by side — neither has a single element
representing "the whole view" the way the other five views do (one
grid each). Rather than switching those two views to two screenshots
apiece (breaking the one-screenshot-per-view shape every other test in
this file already uses), added a `data-testid` to the existing shared
wrapper `<div>` both views already had around their two grids
(`.demo-cross-grids`, a class both views happened to already share),
keeping the same shape for all seven tests.

Confirmed the new test code and the `data-testid` additions actually
compile before considering this done: `vue-tsc` across the whole
project, a plain `tsc --noEmit` against the spec file itself (Playwright
spec files sit outside the main project tsconfig), and a demo build,
all clean. **Not verified against a real baseline** — no real Playwright
browser was available in this environment to actually run
`--update-snapshots` and generate one (the same limitation
`docs/VISUAL_REGRESSION.md` already documented for the original four
tests; this pass closes the *coverage* gap, not the *baseline-generation*
one, which remains exactly as open as before). Updated
`docs/VISUAL_REGRESSION.md`, `docs/REFACTOR_STRATEGY.md`, and the
VitePress roadmap page, all of which still said "four views" in various
places.

### 62. Mutation testing scope had a real gap: the persistence helper's public composable was never covered

Found while re-checking `docs/STRYKER.md`'s file/mutant counts for
staleness during a broader documentation audit. `stryker.conf.json`'s
`mutate` patterns (`src/core/**/*.ts`, `src/components/Grid/composables/*.ts`,
`src/hooks/*.ts`) matched 39 files, not the 33 the doc claimed — expected
drift from new files added since (the alignment-helper, for one, lives
under `src/core/**` and was already covered). But `src/composables/useLayoutStorage.ts`
— the public composable half of the persistence helper — sits in a
directory none of the three patterns reach at all, confirmed directly by
checking which glob would need to match `src/composables/*.ts`
specifically. Its own pure-function counterpart
(`core/helpers/layout-storage.ts`) *is* covered, so the gap was
specifically the thin composable wrapper, not the logic it wraps.

Added `"src/composables/*.ts"` to the mutate array, bringing the scope
to 40 files. Did not re-run the full mutation suite to get a fresh
mutant count — a single run takes well over 20 minutes in this
environment, which isn't a reasonable cost to pay just to refresh a
headline number in a doc, especially since the finding itself (a
missing directory in the scope) doesn't need that confirmation to be
valid. Updated `docs/STRYKER.md`'s file/mutant-count mentions to state
plainly that the count has grown and hasn't been re-measured, rather
than either leaving the old, now-inaccurate number unqualified or
inventing a new one without actually running the suite to back it up.

### 63. Grid lines were hardcoded to 6 columns/70px rows, and to black — regardless of the actual grid or theme

Reported by a user actually using the examples (something no amount of
static reading or the unit test suite catches, since visual rendering
correctness isn't what either of those verify). Two independent bugs in
`.grid::before`'s CSS:

- `background-size: calc(calc(100% - 10px) / 6) 70px` was hardcoded to
  6 columns and 70px rows, regardless of the grid's actual
  `colNum`/`rowHeight`. Grid lines only ever lined up with the real
  layout by coincidence, for that one specific configuration. A
  commented-out earlier attempt at a dynamic version
  (`v-bind(colNum)) v-bind(rowHeightPx)`) sat directly above the live
  rule — `rowHeightPx` was never actually a defined ref anywhere in the
  file, so even un-commented this wouldn't have compiled correctly, and
  `v-bind()`'s reactivity semantics under this component's
  `defineComponent`+`setup()` pattern (not `<script setup>`) weren't
  verified before it was apparently abandoned.
- `$grid-line-color: #000` was hardcoded opaque black — invisible or
  near-invisible on a dark background, which is exactly the "support
  dark/light mode" part of the report.

Fixed by computing pixel sizes the same way `alignmentGuideStyles`
already does (`calcColWidth` + the grid's own `margin`/`rowHeight`),
exposed as `--grid-line-column-size`/`--grid-line-row-size` CSS custom
properties on the root element, with the same "no unmeasured-width
crash" guard `alignmentGuideStyles` needed for the same underlying
reason (`calcColWidth` throws on a zero/unmeasured container width, and
this computed is read directly in the template on every render). Color
changed to a semi-transparent neutral gray (`rgb(128 128 128 / 30%)`,
via `var(--grid-line-color, ...)` so it's still overridable) — visible
against both light and dark backgrounds without needing to detect which
theme is active, rather than trying to read an ambient dark-mode signal
that doesn't reliably exist outside a specific host application's own
convention. Removed the dead commented-out block and the now-unused
`$grid-line-color` SCSS variable. Verified with new tests asserting the
exact computed pixel values for a specific `colNum`/`rowHeight`/`margin`
combination, that they update reactively when those props change after
mount, and that the safe-fallback guard doesn't throw before the
container is measured.

### 64. A drag handle positioned inside interact.js's own resize-edge margin gets resize instead of drag

Reported: "GridItem is resizing instead of dragging" against the custom
drag-handle example. Both `CustomDragElement.vue`'s own internal
`.vue-draggable-handle` (positioned `top: 0; left: 0`) and the example
using it (`.drag-handle-slot`, positioned `top: 8px; left: 8px`) sit
inside interact.js's own default ~10px resize-edge margin for mouse
input. `resizeIgnoreFrom` excludes a matching element by DOM target,
but doesn't shrink interact.js's own margin-based edge-proximity zone
around that element — the two mechanisms don't compose the way the
props alone suggest they would. A handle placed inside that margin
lands in a zone where resize's edge detection and the handle's own
drag-allow region both consider themselves the active interaction for
the same pointer-down.

Not fully root-caused at the interact.js precedence level (would need
real browser testing to observe which interaction interact.js actually
starts when both are simultaneously "eligible," which wasn't available
in this environment) — fixed instead by moving both the exported
component's own handle and the example's handle to 14px, safely outside
the ~10px margin, which sidesteps the overlap regardless of whatever
interact.js's exact internal precedence turns out to be. More reliable
than depending on `ignoreFrom` to win a precedence fight it isn't
guaranteed to win.

### 65. `defineExpose({ ...props })` went stale after any prop reassignment, not just `layout` — found investigating a persistence-helper bug report

Reported: "Load saved data does not work if GridItems are moved after
save/load is clicked" — investigated by writing a targeted reproduction
(mount with real `v-model:layout` reactivity, save, simulate a drag via
`dragEvent`, then call `load()`) rather than guessing from reading
alone, since the report describes a specific sequence that's easy to
get subtly wrong by reasoning about in the abstract.

The reproduction showed the *actual* data was already correct after
`load()` — both the consuming component's own `layout` state and the
real DOM's rendered `transform` position updated correctly (confirmed
by checking the computed style, not just the underlying array) — so
`useLayoutStorage`/`serializeLayout`/`deserializeLayout` themselves are
not the bug, and this example (which doesn't use a template ref to
`GridLayout` anywhere) wasn't hitting it. But the reproduction did
surface a real, separate, wider-reaching bug: `wrapper.vm.layout`
(`GridLayout`'s own exposed `layout`, via `defineExpose({ ...props })`)
stayed on the *pre-drag* value even after `load()` correctly replaced
the array — while the component's actual internal state and rendering
were both already correct.

Root cause: spreading a reactive `props` object (`{ ...props }`) reads
each property's value once, at the moment the spread runs — for a
prop holding an array/object reference, that captures whatever
reference `props.layout` pointed to at that moment, forever. In-place
mutations to that same array (a drag, which is how `moveElement`/
`compactLayout` already work) stay visible, since they mutate the
object the stale reference still points to. But a wholesale
*reassignment* — exactly what `v-model:layout` receiving a brand new
array does, whether from `useLayoutStorage`'s `load()` or any other
consumer code doing `layout.value = something` — does not, since
nothing re-runs the spread when props change later. This affects every
prop exposed this way, not just `layout` — any consumer reading
`gridRef.value.<anyProp>` after a reassignment (rather than relying on
the rendered template, which reads props directly and was never
affected) would see the same staleness.

Fixed with `...toRefs(props)` instead of `...props` — `toRefs` keeps
each exposed prop backed by a live ref connected to the original
reactive source, which Vue's template-ref access auto-unwraps
transparently, so `gridRef.value.layout` (and every other prop) now
stays live after either kind of change. Verified by reverting the fix
temporarily and confirming a new regression test fails exactly the way
predicted (stale post-reassignment value) before restoring it and
confirming the test passes — not just written and assumed to catch the
right thing.

### 66. Real browser automation is possible in this environment after all — a workaround, not a fix

Every prior mention of browser-dependent verification in this document
(and in `docs/VISUAL_REGRESSION.md`, `docs/REFACTOR_STRATEGY.md`) says
some version of "no browser was available." That's still true for the
*official* path — `npx playwright install` fails outright, since
network egress in this environment blocks `cdn.playwright.dev` (a 403
with an explicit "Host not in allowlist" message, not a timeout or
generic failure). That part hasn't changed and isn't fixed here.

What changed: an older Playwright-bundled Chromium build
(`chromium_headless_shell-1194`/`chromium-1194`) turned out to already
exist on disk — leftover from a previous environment setup, unrelated to
the currently-installed `playwright-core@1.61.1`, which expects
`chromium-1228` and refuses to use anything else through its own normal
launch path. Pointing `chromium.launch()` at the older build's
executable directly (`{ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' }`,
or the equivalent full-Chromium path) bypasses Playwright's own
version-matching entirely and launches successfully — confirmed with a
trivial `data:` URL page load before trusting it for anything real, then
used it to drive the actual demo app with real mouse events for finding
#35's re-verification above.

**Why this isn't wired into `playwright.config.ts`, `package.json`, or
any committed script**: the exact path is specific to *this* sandbox's
current filesystem layout, not something portable to CI or another
contributor's machine — hardcoding it would silently break the moment
this environment's disk contents change, and would be actively
misleading committed anywhere a reader might assume it's a general
solution. This is a manual, ad-hoc technique for getting unblocked
during a single investigation in this specific environment, recorded
here so a future session in the same environment doesn't have to
rediscover it from scratch — not a replacement for a real Playwright
install anywhere else.

**Known gaps even with this workaround**: only Chromium is available
this way (no Firefox/WebKit binaries exist on disk under any version),
and it should not be used for generating committed visual-regression
baselines specifically (see the updated note in
`docs/VISUAL_REGRESSION.md`) — baseline screenshots are sensitive to the
exact rendering engine version, and a baseline produced against a
different, older Chromium than whatever the *declared* Playwright
version would actually render with risks being subtly wrong.

### 67. `scrollToItem`/`focusItem` and finishing `autoScroll`, implemented

Two items from `docs/FEATURE_RECOMMENDATIONS.md` (#9 and the top-of-file
auto-scroll finding), picked as the recommended low-risk starting pair
there.

**`scrollToItem(id)`/`focusItem(id)`**: needed a way to map an id to a
DOM element that didn't previously exist — added `data-grid-item-id` to
`GridItem`'s own root element, matching its `i` prop. Deliberately
scoped the lookup to the calling `GridLayout`'s own container
(`refsLayout.value.querySelectorAll(...)`) rather than a global
`document.querySelector`, since two grids on the same page could
plausibly reuse an id (an `allowCrossGridDrag` page, for one) — verified
this distinction actually matters with a test mounting two grids sharing
an id and confirming only the intended one's element receives focus,
not just that *a* matching element does. Also confirmed a genuinely
portable implementation: building the lookup as an interpolated
`[data-grid-item-id="${id}"]` selector would need `CSS.escape()` for an
id containing characters invalid in an unescaped attribute selector
(quotes, for one), but `CSS.escape` isn't universally available — this
project's own test environment (jsdom) doesn't provide it, caught by the
first test run rather than assumed fine. Used a fixed, non-interpolated
selector plus a plain JS attribute comparison instead, avoiding the
dependency entirely.

**`autoScroll`**: `@interactjs/auto-scroll` was already imported
(registering the plugin, contributing to bundle size) but never
configured anywhere. Confirmed before building anything new that
`dragOption`/`resizeOption` — typed against and merged into interact.js's
own option types — already reach `autoScroll` as a raw option; this prop
is a one-line convenience default (`{ enabled: true }`) for the common
case, not a new mechanism. Spread in before `dragOption`/`resizeOption`
in both `useGridItemDrag.ts` and `useGridItemResize.ts` (not after), so
a consumer's own more specific `autoScroll` configuration inside either
still wins if both are set.

### 68. `GridLayout.vue`'s cross-grid drag and outside-drop logic, extracted into their own composables

The last genuinely open item from the Structural section below —
`allowCrossGridDrag` and `allowOutsideDrop` were the two largest pieces
of `GridLayout.vue` still implemented directly in the component,
unlike `GridItem.vue`'s already-completed drag/resize/keyboard split.
That section's own assessment called the extraction "more involved"
than `GridItem`'s, since both features emit public component events and
touch state (`isDragging`, `placeholder`, `originalLayout`) shared with
the rest of the component, not just their own internal refs — treated
that as a reason to be careful, not a reason to skip it.

**`useCrossGridDrag.ts`**: takes `props`, `emit`, `eventBus`,
`refsLayout`, `isDragging`, `originalLayout`, and `updateHeight` as
context (a `IUseCrossGridDragContext`, matching the dependency-injection
pattern `useResponsiveLayout.ts` already established). Exposes
`handleDragStart(id)` and `handleDragEnd(id, clientX, clientY,
currentItem)` — the latter returns `true` when another grid accepted
the drop (every side effect the accept path needs, including the
`nextTick(() => isDragging.value = false)` the original inline code
had, already ran inside the function by that point) and `false`
otherwise, which `GridLayout.vue`'s own `dragEvent()` uses as a signal
to `return` immediately rather than also running its own normal
end-of-drag handling. `setCrossGridDragEnabled`/`teardown` handle
registry registration exactly as before.

**`useOutsideDrop.ts`**: simpler to extract, since it never touches
`props.layout` directly (only emits `ITEM_DROPPED_FROM_OUTSIDE` with a
resolved position, leaving the actual layout mutation to the consumer's
own handler) — takes `props`, `emit`, `refsLayout`, `width`,
`placeholder`, `isDragging` as context and exposes just
`setOutsideDropEnabled`.

**Two real type errors surfaced during the extraction, not just
mechanical copy-paste friction**: both composables' context interfaces
type `props` as the plain `IGridLayoutProps` (matching
`useResponsiveLayout.ts`'s own existing convention), which doesn't
carry the narrowing Vue's `withDefaults()` gives `GridLayout.vue`'s own
local `props` variable for fields with runtime defaults —
`props.verticalCompact`/`props.margin` type as possibly-`undefined`
inside the composables even though they're never actually undefined at
runtime by the time either function runs. Resolved with the same `!`
non-null-assertion `useResponsiveLayout.ts` already uses for its own
equivalent case (`props.breakpoints!`), rather than inventing a new
pattern.

**Verified incrementally, not just at the end** — the higher-risk
extraction first: after `useCrossGridDrag.ts` alone, ran the dedicated
9-test `tests/GridLayout.crossGrid.spec.ts` suite specifically (all 9
passing) before running the full suite (393/393) and moving on to
`useOutsideDrop.ts`. Repeated the same sequence for the second
extraction. Coverage moved from 98.64% to 98.67% across the two changes
— confirmed, not just assumed unaffected, that pulling code into a
separate file didn't leave any branch newly unreachable by the existing
tests. Both `crossGrid.spec.ts` and the `allowOutsideDrop` describe
block inside `GridLayout.spec.ts` needed zero changes — they test
through `GridLayout`'s own public interface (props, exposed methods,
emitted events), which didn't change at all, only where the
implementation behind it lives.

### 69. Closing a coverage gap `scrollToItem`/`focusItem` left behind, and demo/sandbox catching up to recent additions

Re-checked coverage after finding #67/#68's work rather than assuming it
was still exactly where it had last been measured. `findItemElement`'s
`refsLayout.value instanceof HTMLElement` guard (added for
`scrollToItem`/`focusItem`) had an uncovered branch — every existing
test reaches it well after mount, when `refsLayout.value` is always a
real element, so the "not a valid element" side had never actually been
exercised. Added a test setting `wrapper.vm.refsLayout` directly to
simulate it. **First attempt used `null` and caused a real, if
unrelated, problem**: the component's own pending `ResizeObserver`
callback (scheduled asynchronously, unrelated to this test) also reads
`refsLayout.value` without the same guard, and threw a `TypeError` once
it fired — after this test's own assertions had already passed,
surfacing as an unhandled rejection attributed to whatever test
happened to be running when the callback fired. Switched to an empty
object instead of `null`: still fails `instanceof HTMLElement` the same
way, but doesn't throw when an unrelated pending callback reads a
property off it. Coverage: 98.67% → 98.74%.

**`sandbox/App.vue`** (the all-props-in-one contributor test bench) had
no way to exercise `autoScroll`, `scrollToItem`, or `focusItem` at all —
confirmed by grep, not assumed missing. Added an `autoScroll` checkbox
(wired to every rendered `GridItem`, matching the existing convention
for every other per-item toggle already there) and a text input plus
two buttons calling `refLayout.scrollToItem(id)`/`focusItem(id)`
directly, matching the existing pattern of exposing `GridLayout`'s own
methods through `refLayout` (already used for `dragEvent`). Verified by
starting the sandbox's own dev server and fetching the compiled
output directly, confirming the new refs and template bindings compiled
and wired correctly, rather than only reading the source and assuming
it would.

**`demo/views/DynamicItemsView.vue`** ("Add / remove items") now calls
`scrollToItem`/`focusItem` after adding a new item — the exact "jump to
the widget you just added" use case `docs/FEATURE_RECOMMENDATIONS.md`
#9 was written against, and a more natural fit than inventing a new
demo view for the feature. Added a scrollable wrapper (`max-height` +
`overflow-y: auto`) so the scroll behavior is actually visible once
there are enough items — previously the view had no scrollable
container at all, so scrolling had nothing to do. Checked
`docs/VISUAL_REGRESSION.md`'s own description of this view
("Captured before clicking 'Add item'") before making this change:
still accurate afterward, since `scrollToItem`/`focusItem` only run
*after* that click, so the view's pre-interaction screenshot (once a
baseline eventually exists) is unaffected by this change.

### 70. Closing the remaining coverage gaps — a real bug found along the way, dead code removed, two test mistakes caught and fixed

Asked directly to close every remaining coverage gap across
`GridLayout.vue` and the `Grid/composables` directory. Went through each
file's uncovered lines individually rather than writing generic tests
and hoping — checking context first, then the most direct test that
would exercise it, then verifying against the actual coverage report
rather than assuming a test passing meant the gap closed.

**A genuine, previously-unnoticed bug, not just a coverage gap.** The
static-item collision check in `GridLayout.vue`'s `dragEvent()`
(deciding whether to set `isDragging` false when a drag target
overlaps a static item) used `placeholder.value.x`/`.y` — which still
mirror the item's *pre-drag* position at that point, since
`moveElement()` (later in the same function) is what actually updates
it. A position an item already validly occupies can never collide with
anything by definition, so the check silently always took the
no-collision branch regardless of where the drag target actually was —
this had an *existing* test with the exact right name ("should mark the
placeholder as not dragging when the target collides with a static
item") that only asserted `not.toThrow()`, which passed either way and
never caught it. Found by writing a debug script checking `isDragging`
directly, confirming it stayed `true` when it should have gone `false`,
before touching any source. Fixed the same way an earlier, analogous
bug in `updateAlignmentGuides` was (finding #60) — read the incoming
`x`/`y` drag-target parameters directly, not the stale placeholder
mirror.

**Dead code removed, not worked around.** `dragEventHandler`'s
`data?: IEventsData` optional parameter and its `!data` branch existed
only because it was written to mirror `resizeEventHandler`'s equivalent
guard, which genuinely needs it — `onWindowResize` calls
`eventBus.emit('resizeEvent')` with no payload on every window resize.
Confirmed by grep across every `dragEvent` emitter
(`useGridItemDrag.ts`, `useGridItemKeyboard.ts`) that nothing anywhere
emits it without a payload, unlike `resizeEvent`. Removed the branch
and made the type require the payload, rather than adding a test to
"cover" a path nothing could ever reach.

**Two of my own new tests turned out to have real bugs, caught by
running them, not assumed correct because they were newly written:**
- A `refsLayout`/`erd` interference test used `null` to simulate an
  invalid ref, which triggered an unrelated pending `ResizeObserver`
  callback (also reading the same ref, without the same guard) to throw
  as an unhandled rejection later — surfaced by Vitest's own error
  summary, not by the test's own assertions, which had already run and
  passed. Switched to an empty object, which fails the same
  `instanceof HTMLElement` check without the side effect, in every case
  this came up (`GridLayout.vue` and, separately,
  `useCrossGridDrag.ts`'s `getRect()`).
- A resize-clamp assertion checked the wrong argument index in
  `emit(EGridItemEvent.RESIZE, props.i, pos.h, pos.w, newSize.height,
  newSize.width)` — args 3/4 (`newSize.height`/`width`, the raw
  unclamped pixel-derived values) instead of args 1/2 (`pos.h`/`pos.w`,
  the actually-clamped values) — producing a real assertion failure
  (a large negative number) that looked like the clamp itself had
  failed. It hadn't; the test was checking the wrong thing. Fixed by
  reading the emit call's own argument order directly rather than
  guessing from the variable names alone.
- Two tests asserting on `GridItem`'s own emitted events
  (`EGridItemEvent.MOVE`/`RESIZE`) checked `wrapper.emitted(...)`
  instead of `wrapper.findComponent({ name: 'GridItem' }).emitted(...)`
  — `wrapper` here is the mounted `GridLayout`, whose own emitted
  events are a different, unrelated set. Both tests passed regardless
  of whether the guard they were meant to verify actually worked,
  since neither wrapper would ever show the event either way — caught
  by cross-referencing against an existing, correct test using the same
  assertion, not by the tests failing on their own.

**A test technique worth keeping**: `autoSize()`'s clamping logic was
unreachable in every existing test, since the exposed `slots.default()`
call inside it returns fresh VNodes disconnected from whatever the
renderer actually mounted when invoked outside `GridItem`'s own render
pass (see finding #12) — `.elm` is normally `undefined`, so `autoSize()`
no-ops before ever reaching the clamps. Overriding the component
instance's own `$.slots.default` to inject a real `.elm` with a
controllable `getBoundingClientRect()` made the clamps reachable
without touching the source. Also surfaced a real asymmetry while using
it: `calcWH`'s `autoSizeFlag` height conversion uses `Math.ceil`, which
rounds any non-negative height up to at least 1 grid unit on its own —
the separate, unconditional "floor of 1" check underneath it for height
specifically is effectively unreachable for any realistic
`getBoundingClientRect()` output (never negative), unlike the width
side (`Math.round`, which can round down to 0). Left as a documented,
understood gap rather than forced.

**Two genuinely hard-to-cover guards, left open and documented rather
than papered over**: `tryMakeDraggable()`/`tryMakeResizable()`'s
`gridItem.value instanceof HTMLElement` checks (docs/REFACTORING.md
#38) guard a narrow mount-timing window that isn't reachable through
any normal test flow — `gridItem` isn't exposed via `defineExpose`, and
exposing an internal DOM ref solely to manufacture coverage for an
already-fixed bug would be adding public API surface for the wrong
reason. `useGridItemKeyboard.ts`'s `resizeBy` also has a small
branch-coverage gap (lines 62-63, both sides of two `??` operators)
that direct statement-level coverage confirms *does* execute — both the
min and max clamp sides are separately tested and pass with correct
behavior — that looks like a coverage-tool quirk with nested nullish
coalescing inside chained `Math.max`/`Math.min` calls rather than an
actual missing test, though this wasn't fully root-caused.

**Result**: `GridLayout.vue`, `useCrossGridDrag.ts`, and
`useOutsideDrop.ts` all reached 100% (statements, branches, functions,
lines). `useGridItemDrag.ts` and `useGridItemResize.ts` are at
98.83%/98.12% respectively, with only the documented hard-to-reach
guards remaining. Went from 394 to 414 tests, and overall coverage from
98.74% to 99.71% lines / 98.95% branches, with zero regressions
verified at every step along the way, not just at the end.

### 71. A large feature batch, implemented one at a time with tests and verification at each step

Asked to implement everything remaining on `ROADMAP.md`'s
lower-priority list in one pass: `rearrange()`/`compactNow()`,
`duplicateItem(id)`, named layout presets, a blocked-move feedback
hook, per-item auto-height, actual snap-to-grid, a grid-to-image export
utility, configurable resize-hint appearance, a typed-payload
convention for `allowOutsideDrop`, `outsideDropAccept`, and shared
design tokens between `demo/`/`sandbox/`. Worked through each
individually — implement, typecheck, test, run the full suite — rather
than batching all the source changes together and testing once at the
end, on the theory that a regression introduced by item 3 is far easier
to isolate immediately than after items 4 through 11 have also landed.

**`compactNow()`/`rearrange()`**: thin public wrappers around the exact
sequence `dragEvent`'s own accept path already runs internally
(`compactLayout`, the `compact` eventBus emit, `updateHeight`, both
layout events) — `rearrange()` is a plain alias, not a second
implementation, per the two names this item was requested under in
`ROADMAP.md` itself.

**`duplicateItem(id)`**: generates a collision-safe id by suffixing
(`${id}-copy`, `${id}-copy-2`, ...) rather than a timestamp — more
readable in devtools/emitted events, and just as collision-safe against
the current layout. Copies every field except `i` (the new id) and
`moved` (compaction's own transient bookkeeping flag, not part of the
item's actual configuration — see `ILayoutItem`'s own doc comment for
why this same field gets stripped before persistence too). Places the
copy directly below the source and lets the next compaction pass
resolve any overlap, rather than computing a collision-free spot
up front.

**`MOVE_BLOCKED_BY_COLLISION`**: added to both the drag and resize
paths, but detecting "blocked" required different logic for each,
since the two features actually behave differently when
`preventCollision` is in effect — drag: `moveElement()` (in
`move-helper.ts`) resets the item back to its exact pre-move `x`/`y`
when `preventCollision && collisions.length`, so detection is just
capturing the pre-move position and comparing after the call, only
emitting when a move was actually attempted (`x !== preMoveX || y !==
preMoveY`), not on every drag tick where the pointer happens to pause
over the item's own current cell. Resize: the existing
`hasCollisions`-clamped-size logic in `GridLayout.vue`'s `resizeEvent()`
already computes exactly the "was this constrained" signal needed —
emits whenever `preventCollision` clamped the requested size at all,
not only when growth was fully rejected, since a resize (unlike drag)
can still partially succeed.

**`autoHeight`, a real reliability problem found and fixed, not just a
new prop wired up**: the natural first implementation — a
`ResizeObserver` on `slots.default()[0]?.elm`, set up from `GridItem`'s
own `onMounted` — didn't actually work. Verified this directly with a
debug test before concluding it (not assumed from reading finding #12
alone): even called from within the component's own mount lifecycle,
Vue's "Slot 'default' invoked outside of the render function" warning
still fires, and `.elm` still doesn't reliably tie back to real,
already-rendered DOM — the previously-documented limitation (calling
`slots.default()` externally to `autoSize()`'s own invocation) turned
out to apply to *any* call outside Vue's own render-function call
context, not specifically external invocation as originally framed.
Fixed with the template-ref-based rewrite finding #12 had flagged as
the real fix needed: a `<div v-if="autoHeight" ref="autoHeightWrapper">`
wrapping the slot (only rendered when `autoHeight` is on, so the
default, unwrapped case is completely unaffected), observed directly.
`autoSize()` itself was updated to prefer this ref over the old
`slots.default()` lookup when available, falling back to the old
lookup only for a manually-invoked `autoSize()` call without
`autoHeight` set (where no wrapper ref exists). The test for this also
needed a real fix along the way: capturing only the *last*
`ResizeObserver` constructor call missed that `GridLayout` mounts its
own, separate `ResizeObserver` for container-width tracking — fixed by
capturing every constructed instance and picking out the one observing
this specific wrapper element by reference equality, not assuming only
one call would ever happen.

**`snapToGrid`/`snapThreshold`**: a new `findSnapAdjustment` helper
alongside `findAlignmentGuides` in `alignment-helper.ts` — a separate
function, not a threshold=0 parameterization of the existing one, since
the two have different return shapes for different purposes (every
alignment found, for rendering guide lines, vs. a single best x/y
adjustment, for actually moving the item). Wired into `GridLayout.vue`'s
`dragEvent()` by reassigning the incoming drag-target `x`/`y`
parameters directly, before anything else reads them — so the live
placeholder during `dragmove` and the actual committed position on
`dragend` see the same, already-snapped value, rather than two
separate adjustment points that could drift out of sync. Several test
assertions needed correcting after a first attempt: `placeholder.x`
turned out to still reflect the item's stale pre-drag position (the
same `l.x` staleness documented elsewhere in this file for the
collision check and alignment guides), not the live drag target, so
snapping doesn't show up there at all — the committed position after
`dragend` is what actually reflects it. A test scenario also needed
correcting where a supposedly-out-of-threshold item's *right* edge
turned out to be a closer match than the *left* edge the test was
written against, which the algorithm correctly found and the test's
own expectation hadn't accounted for.

**`showResizeHandles`/`resizeHandleColor`**: reuses the exact
CSS-custom-property inheritance mechanism `transitionDurationMs`/
`transitionTimingFunction` already established (a computed setting
`--resize-handle-color` on `GridLayout`'s own root, inherited by every
`GridItem` through the DOM, no eventBus cascade needed) rather than
inventing a second mechanism — `showResizeHandles` itself doesn't need
to be its own CSS variable, since the color is simply not emitted at
all when it's off, and `.vue-resize-hint`'s own CSS already defaults to
`transparent` when the variable is unset.

**`outsideDropAccept`/`readOutsideDropPayload`**: the predicate is
checked in `dragenter`, `dragover`, and `drop` independently (not just
once at `dragenter`) — statelessly re-evaluating each time, since
`dataTransfer.types` is available throughout a drag and there's no need
to remember a decision across events the way, say, the enter-count
workaround for `dragenter`/`dragleave` bubbling does.
`readOutsideDropPayload` mirrors `deserializeLayout`'s own "nothing
usable was there returns null, never throws" convention.

**`useLayoutPresets`**: stores every named preset for a given key
together as one `{ [name]: serializedLayoutJson }` object under a
single storage key, rather than one storage key per preset — one
`Storage` read/write per operation instead of needing a separate index
to know what's been saved.

**`exportLayoutAsSvg`**: deliberately the dependency-free option
weighed in `docs/FEATURE_RECOMMENDATIONS.md` #12, not a
`html2canvas`-style DOM screenshot wrapper — draws each item as a
labeled rectangle from layout data alone, which needs an explicit
`containerWidth` option (there's no DOM element for a standalone
function to measure, unlike `GridLayout` itself, which measures its own
container via `ResizeObserver`).

**Shared design tokens, a real gap found, not just a cleanup**:
checking `sandbox/App.vue`'s own CSS before extracting anything showed
it already referenced `var(--color-primary)`, `var(--color-surface)`,
etc. (in the outside-drop widget styling) — but `sandbox/` had no
stylesheet importing anything that defined them, anywhere. Those
variables were genuinely undefined, silently falling back to browser
initial values, not just duplicated from `demo/`. Extracted the actual
token declarations (not layout-specific styles like nav/panel
positioning, which differ meaningfully between the two apps) to
`dev-shared/tokens.css`, imported by both — verified by starting the
sandbox dev server and fetching the compiled stylesheet directly,
confirming the tokens actually resolve now, not just that the import
statement was added.

**Bundle size**: grew from ~41.2 KB to ~44.6 KB gzip across this batch.
The budget (`scripts/check-bundle-size.js`) was bumped from 45 KB to
55 KB deliberately, with the reasoning in the script's own comment
updated alongside it (following the same "bump with a documented
reason, not raise silently" convention the script already established)
— not raised reactively after a failing build, but sized with headroom
for continued incremental growth, matching the same ~20% margin the
original 45 KB budget gave over its own baseline.

### 72. Localizable UI/ARIA strings, and a doc-comment displacement mistake caught mid-edit

`ROADMAP.md`'s "Localizable UI/ARIA strings" item, implemented as a
single `ariaLabels` prop (`IGridAriaLabels`: `closeButton`,
`itemRoleDescription`, `moveInstruction`, `resizeInstruction`) on both
`GridLayout` and `GridItem`, rather than four separate props each
needing their own inherit-from-parent plumbing. A `resolveAriaLabels()`
helper merges three layers — built-in English defaults <- `GridLayout`'s
grid-wide override <- this specific `GridItem`'s own override — so a
consumer only supplies the specific keys they actually want changed,
not every key each time.

Deliberately not routed through the `eventBus`-cascade pattern
`showCloseButton`/`isDraggable`/etc use: those are booleans a consumer
might plausibly toggle reactively after mount; these are static
localization text, so `thisLayout?.ariaLabels` read directly inside a
`computed` (still reactive to it, just without a dedicated
`setAriaLabels` event/handler pair) is a simpler match for what this
actually needs, without adding boilerplate the reactivity requirement
doesn't call for.

**A mistake made and caught mid-edit, not after the fact**: the first
`str_replace` adding `ariaLabels`'s doc comment to
`grid-layout-props.interface.ts` used `allowCrossGridDrag?: boolean;`
(the bare prop, no comment) as the anchor for `old_str`, on the
assumption the line above it was blank context rather than
`allowCrossGridDrag`'s own doc comment. It wasn't — the replace
succeeded, but left that doc comment orphaned above the newly-inserted
`ariaLabels` prop instead, with `allowCrossGridDrag` now undocumented.
Caught by re-viewing the file immediately after the edit rather than
trusting the tool's success message alone, and fixed with an immediate
follow-up edit restoring the comment to its rightful prop. Worth noting
as a category of mistake to watch for specifically when inserting a new
prop next to an existing one that has its own multi-line doc comment —
the anchor needs to include enough of the surrounding comment to be
unambiguous about which line the insertion point actually sits between.

Existing tests were unaffected (467/467 still passed) after wiring the
new strings into `GridItem.vue`'s template — confirming, rather than
assuming, that nothing in the existing suite had been silently asserting
against the literal hardcoded English text.

### 73. Extending e2e coverage for edge cases — a real bug found, and project-wide flakiness root-caused, not just new tests bolted on

Asked whether the Playwright suite could be extended to cover edge
cases, and to implement them if so. Added `e2e/keyboard-accessibility.spec.ts`
(arrow-key move, shift+arrow resize, boundary clamping, minW clamping,
non-interactive-item keyboard ignoring) and `e2e/advanced-features.spec.ts`
(the newer `AdvancedFeaturesView` — blocked-move feedback, `compactNow`,
`duplicateItem`, `snapToGrid`, named presets), both previously with zero
e2e coverage. Verified using the same workaround Chromium build finding
#66 documents (network egress still blocks the official
`npx playwright install` in this environment) via a local,
not-committed `playwright.config.local-verify.ts` pointing
`launchOptions.executablePath` at it.

**A real bug found while writing these, not a test-writing mistake**:
`compactNow()`/`rearrange()` passed `props.verticalCompact` straight
through to `compactLayout()`, making it a no-op whenever
`verticalCompact` was `false` — precisely the scenario a manual
"tidy up" button exists for (a layout that doesn't auto-compact during
normal drag/resize). Caught by writing an e2e test for exactly that
scenario and finding the click did nothing, not by reading the source
and spotting it. Fixed by always forcing vertical compaction in
`compactNow()` regardless of the ambient prop — that prop governs
*automatic* compaction during interaction, not what a deliberate manual
trigger should do. A matching unit test regression-locks this
(`tests/GridLayout.spec.ts`, "Should still pull items upward... when
verticalCompact is false").

**Several genuine test-writing mistakes made and corrected in the same
session, each verified rather than assumed fixed**:
- Interpreted a large, unexplained position jump after a
  `Shift+ArrowRight` keyboard resize as a possible collision-cascade
  bug at first. Traced it with targeted, temporary `console.log`
  statements (removed before finishing, confirmed absent via a
  grep afterward) through `resizeBy()` → `GridLayout.vue`'s
  `resizeEvent()` → `compactLayout()`, and found the underlying layout
  data was correct throughout — the discrepancy was between a
  `boundingBox()` read taken before the container-width measurement had
  finished settling and one taken after, not a logic bug at all.
- A `compactNow()` test failed with the item seemingly refusing to
  move down at all — traced to the item's actual position (y:6 grid
  units, deliberately left with a gap above it in this demo) being far
  enough below the fold that the drag's own mouse coordinates were
  simply off-screen; fixed with a taller viewport for that specific
  test, not a code change.
- A `snapToGrid` test's drag-target math didn't account for the drag
  being grabbed at the item's own center rather than its left edge,
  so the mouse needed to move to `target + itemWidth/2`, not `target`
  directly, to land the item's edge where intended.
- The same `snapToGrid` test was then genuinely flaky (not just wrong)
  even after that fix — confirmed by running it repeatedly, not
  assumed from one pass. Root cause: a *static* item's own measured
  position varied between runs despite it never moving, meaning the
  container-width settling could take longer than two consecutive
  stable reads. Fixed by extracting a shared `stableBoundingBox()`
  helper (`e2e/helpers.ts`) requiring three consecutive identical
  reads plus an initial settling delay, then confirming via
  `--repeat-each` that the flakiness was actually gone, not just less
  frequent.

**This last fix turned out to be project-wide, not new-test-specific**:
running the full existing suite (not just the two new files) surfaced
the identical race in `drag-and-resize.spec.ts`'s own,
previously-considered-solid tests — three of its five tests failed
intermittently for the exact same reason once run enough times.
Applying the same `stableBoundingBox()` helper there fixed all three,
confirmed via three repeated full runs with zero failures. Left
`dynamic-items.spec.ts`'s and `external-drop.spec.ts`'s pre-existing,
unrelated timeout flakiness alone — that one traces to the workaround
Chromium build's own instability under sustained use (finding #41's
still-open "e2e test-runner instability... never root-caused"), not
something this session's changes touched or could reasonably fix.

### 74. Custom resize-handle rendering, a layout-level `enableEditMode`, and multi-select + group move/resize — a deliberately scoped-down design, not the fully collision-aware version originally discussed

`COMPETITIVE_ROADMAP.md` had flagged multi-select as needing "a design
document before any code," given the real architectural risk of a
fully collision-aware group transform. Implemented it anyway, in the
same session as the other two items, but with a deliberately reduced
scope rather than attempting the larger version — documented here so
the trade-off is explicit, not silently smaller than what was
originally discussed.

**Custom resize-handle rendering** (`#resize-handle` slot): a genuine
finding made this cheap rather than merely assumed cheap —
`interact(gridItem.value)`'s own `resizable()` setup targets edge
proximity to the item's *root element*, not the individual
`.vue-resize-hint--*` spans at all (confirmed by reading
`useGridItemResize.ts`'s `tryMakeResizable()` directly, not inferred).
The spans are purely visual/cursor-affordance overlays with zero
functional connection to interact.js's own resize detection — meaning
slot content could be added inside them with no risk to the actual
resize mechanism, only to whatever renders inside a fixed-position,
fixed-size hit area.

**Layout-level `enableEditMode`**: the inherit-pattern rewrite (default
changed from `true` to `null`) surfaced three places reading
`props.enableEditMode` directly rather than through the template's
already-fixed reference — `useGridItemDrag.ts`, `useGridItemResize.ts`,
and `useGridItemKeyboard.ts` each had their own drag/resize/keyboard
gating guard reading the raw prop. Since `null` is falsy, all three
would have silently disabled every interaction by default the moment
the prop's default changed, had they not been updated to read the
resolved `editModeEnabled` value (threaded through
`IGridItemComposableContext`) instead. Caught by grepping for every
`props.enableEditMode` reference across the composables before
considering the change complete, not just updating the one call site
in the template that was the obvious one.

**Multi-select + group move/resize** (`multiSelect`): the actual
scope built —

- Click selects only that item (replacing prior selection);
  Shift/Ctrl/Cmd+click adds additively; clicking empty grid background
  clears it. Selection state lives in `GridLayout` as a `Set` (O(1)
  `.has()` lookups, since every `GridItem` reads it every render via
  `thisLayout` to decide its own `vue-grid-item-selected` class).
- Click detection needed to distinguish a genuine click from the
  trailing `click` event a browser still dispatches immediately after
  a drag/resize gesture ends — a native `click` fires on `mouseup`
  regardless of pointer movement distance in between, unlike starting
  a drag, which interact.js already gates on a minimum movement
  threshold. Solved with a `suppressNextClick` flag armed by watching
  `isDragging`/`isResizing` for a true-to-false transition, cleared via
  `setTimeout(0)` rather than `nextTick()` — `nextTick` is a microtask
  that can resolve before the browser's own macrotask-scheduled
  trailing `click` actually fires, which would have defeated the
  suppression silently rather than throwing an error to reveal it.
- Group move/resize: a snapshot-then-apply-delta approach — every
  selected item's starting `x`/`y` (drag) or `w`/`h` (resize) is
  captured once at gesture start, and each subsequent move/end event
  recomputes the anchor's own delta from that snapshot and applies the
  same delta to every other selected item directly. Deliberately *not*
  incremental frame-to-frame deltas (which would accumulate rounding
  drift) and deliberately *not* collision-aware for passenger items
  (only the anchor item goes through the existing
  `preventCollision`/bounds logic) — a real, stated scope reduction
  from what a fully general group-transform feature would need,
  called out explicitly in `ROADMAP.md`/`COMPETITIVE_ROADMAP.md` rather
  than left as an undocumented limitation someone discovers later.
- All 11 new unit tests (click/selection state, additive/toggle
  selection, background-click-clears, the exposed API directly, the
  CSS class, group move, group resize, and the "only one item selected
  → no group effect" negative case) passed on the first run — a signal
  the design held together as planned, not evidence it's
  bug-free by itself; see `MANUAL_TEST_CHECKLIST.md` and the e2e suite
  for the parts a unit test alone can't cover (real click-vs-drag
  timing in an actual browser, for one).

### 75. A requested audit of multi-select found three real bugs, not just missing tests — plus a genuine keyboard-accessibility gap

Asked to analyze the solution for missing edge-case tests and missing
features. Rather than only reading coverage percentages, checked
*interactions* between `multiSelect` (finding #74) and everything else
— the class of bug 100% line coverage can't catch, since each line can
individually be "correct" while the combination is still wrong.

**Three real bugs found and fixed, not just untested behavior:**

1. **Group resize ignored a passenger's own `minW`/`maxW`/`minH`/`maxH`.**
   The delta was applied with only a hard floor of `1` —
   `passenger.w = Math.max(startSize.w + dw, 1)` — never checking the
   passenger's own constraints at all. A passenger with `minW: 3` could
   be shrunk to `1` right along with the anchor. Fixed to clamp to the
   passenger's own `minW ?? 1`/`maxW ?? Infinity` (and the `H`
   equivalents), the same defaults `resizeBy`'s own keyboard path
   already uses elsewhere in this codebase.
2. **Group move/resize could move or resize a *static* passenger**, or
   one with `isDraggable`/`isResizable` explicitly `false` — violating
   the one guarantee a static item is supposed to have (it never moves,
   full stop, including as a passive bystander to a group gesture).
   `getLayoutItem()`'s result was applied unconditionally; fixed with an
   explicit `!passenger.isStatic && passenger.isDraggable !== false`
   guard (and the resize equivalent).
3. **A selected item's id lingered in `selectedItemIds` after being
   removed from the layout** (closed via the close button, or removed
   by the consumer's own code) — a dangling reference to something that
   no longer exists, visible in the exposed `selectedItems`. Fixed with
   a `pruneSelection()` function wired to the same
   `watch(() => props.layout.length, ...)` that already reacts to
   add/remove, filtering `selectedItemIds` down to ids still actually
   present and only emitting `SELECTION_CHANGED` when something was
   actually pruned.

**A genuine feature gap, not a bug in existing code:**
`useGridItemKeyboard.ts`'s `moveBy`/`resizeBy` had zero references to
`selectedItemIds`/`multiSelect` — arrow-key-driven movement only ever
moved the single focused item, never the rest of a selection, while a
mouse/touch drag already did. This meant a keyboard-only user could
select multiple items but never move them as a group, undermining the
accessibility story for the whole feature. Fixed not by duplicating
`GridLayout`'s group-move logic into the keyboard composable, but by
having `moveBy`/`resizeBy` emit a synthetic `dragstart`/`resizestart`
message immediately before the `dragend`/`resizeend` one they already
sent — reusing the exact same snapshot-on-start,
apply-delta-on-end mechanism the mouse-driven path already goes
through, rather than a second, parallel implementation that could
drift out of sync with it. Side effect considered and accepted: a
keyboard move now also fires a public `dragstart` event where before
only `dragend` did — treating each keypress as a complete
start-to-end gesture, consistent with how a mouse drag already
behaves, rather than a new asymmetry between input methods.

**Missing tests found via coverage, closed:**
- Changing `enableEditMode` reactively *after mount* — on `GridLayout`
  or a specific `GridItem` — was completely untested, despite being
  exactly the class of regression finding #31 already fixed once for
  `showCloseButton` (a prop that used to not cascade to
  already-rendered items). The same watcher/eventBus mechanism now
  exists for `enableEditMode`, but nothing previously confirmed it
  actually cascades rather than only resolving correctly at mount.
- `clearSelection()`/`deselectItem()`'s own no-op branches (calling
  either when there's nothing to do) were never exercised.
- `useLayoutPresets`: two failure paths were untested — invalid JSON
  in the whole presets blob, and a single preset's own stored value
  being a malformed layout (`deserializeLayout` returning `null`) —
  plus the ordinary default-`window.localStorage` path itself, since
  every existing test happened to pass an explicit custom `storage`
  option.
- `GridItem`'s own `ITEM_CLICKED` emission and its drag/resize
  trailing-click suppression had zero *unit*-level coverage — only
  exercised indirectly through `GridLayout`'s higher-level
  `multiSelect` tests and e2e. Added dedicated unit tests using the
  existing `dispatchDragEvent`/`dispatchResizeEvent` mock-interact.js
  helpers already established elsewhere in `tests/GridItem.spec.ts`,
  including one confirming suppression actually lifts again once the
  underlying `setTimeout(0)` fires, not just that it engages.
- Group move interacting with `snapToGrid` (the passenger's delta
  should be computed from the anchor's already-snapped position, not
  the pre-snap target) and with `preventCollision` (the anchor still
  gets blocked normally; passengers still move regardless, per the
  documented scope) were both plausible-but-unverified before this
  pass.

**Still open, named rather than silently deferred:** rubber-band/
marquee (drag-to-select) selection, and Escape-to-deselect/Ctrl+A
select-all shortcuts — neither implemented; the current mechanism is
click/Shift-click only. Also untested: `multiSelect` combined with
cross-grid drag specifically (a selected item dragged to a different
`GridLayout` instance while other selected items remain behind in the
original one) — plausible but genuinely unverified either way.

### 76. `interact.js` removed entirely — a native Pointer Events engine, and a critical resize bug found only by testing in a real browser

Asked to implement all phases of a previously-scoped-out plan to
replace `interact.js` with a native, dependency-free drag/resize
engine. Built `src/core/helpers/native-interaction.ts`:
`createNativeDraggable` (pointer-driven drag on the item's own root,
with an activation-distance threshold so a plain click isn't
misread as a zero-distance drag), `createNativeResizable` (pointer
listeners on each of the 8 resize-hint spans individually, rather than
interact.js's own margin-based edge-proximity detection on the root),
and `createNativeAutoScroll` (a `requestAnimationFrame` loop). Both
`handleDrag` and `handleResize` — the actual position/size math,
RTL handling, and clamping — turned out to already be interact.js-
agnostic: they only ever read `event.type`/`.target`/`.clientX`/
`.clientY` (plus `.edges` for resize), so almost none of that logic
needed to change at all. `preserveAspectRatio` was reimplemented
directly (deriving whichever dimension isn't driven by the active
edge(s) from the one that is, using the ratio captured at
`resizestart`) rather than via a separate modifier object.

**Measured effect**: the ES bundle dropped from 44.66 KB to 20.52 KB
gzip — a 54% reduction — confirming the earlier scoping estimate that
interact.js's actual footprint here was large relative to this
library's own code. `dragOption`/`resizeOption` (and the
`DraggableOptions`/`ResizableOptions` re-exported types backing them)
were removed as a breaking change (`2.0.0`) rather than kept as dead,
silently-ignored props — see `MIGRATION.md`.

**A critical bug found only by testing in a real browser, not jsdom**:
the 8 resize-hint spans are `v-if`-gated on the resolved `resizable`
prop, which the same `onMounted` that first calls `tryMakeResizable()`
sets *synchronously* — but Vue's own DOM update from that change is
asynchronous (batched to the next tick). The very first call to
`tryMakeResizable()` could run before the spans existed in the DOM
yet, find zero handle elements, and — since finding *any* handle used
to unconditionally "lock in" the attach-once guard (the same pattern
`tryMakeDraggable()` uses, correctly, since dragging doesn't depend on
conditionally-rendered elements) — permanently leave resize wired up
to nothing for that GridItem's entire lifetime. Every unit test passed
throughout, since `tests/GridItem.spec.ts`'s helpers call the resolved
handler directly rather than simulating a real pointerdown/move/up
sequence on the actual DOM handles. Only e2e tests against a real
Chromium build — specifically, ones using `page.mouse` gestures on the
actual resize-hint spans rather than the composable's own exposed
handler — surfaced it, as a resize gesture that silently did nothing.
Fixed two ways: (1) `tryMakeResizable()` now only commits the guard
once at least one handle was actually found, letting the same
`watch(resizable, ...)` that already calls it reactively retry once
the DOM catches up; (2) that watcher itself was changed to
`{ flush: 'post' }` (not the default `'pre'`), so it runs *after* Vue
has updated the DOM, not before. A second, smaller bug surfaced in the
same e2e pass: the resize engine's `event.stopPropagation()` was
originally called only after an `enabled` check passed, meaning a
resize handle's pointerdown on a *disabled* resize would fall through
and bubble up to the drag engine on the root instead of being a clean
no-op — moved to unconditional, before any early return.

**Also found via e2e, unrelated to the interact.js removal itself**:
this demo's 10px item margin means two adjacent items' 10px-wide
corner resize handles can genuinely overlap by several pixels —
`document.elementFromPoint` at one item's own corner-handle coordinate
returned the *neighboring* item's handle instead. Not a bug in the
native engine (interact.js's own margin-based proximity detection
would have had the same ambiguity) — the e2e tests were adjusted to
use the much larger edge handles (`.vue-resize-hint--s`/`--w`, ~290px
and full-height respectively) instead of the 10x10px corner ones,
and to use Playwright's own `.hover()` rather than a coordinate
computed from an earlier `boundingBox()` snapshot, since this item's
own `:hover` CSS rule adds a 1px border that can shift a corner
handle's position by just enough to miss it on a manually-computed
coordinate.

**New test file**: `tests/native-interaction.spec.ts` — the native
engine's own generic pointer-handling logic (activation threshold,
`allowFrom`/`ignoreFrom`, edge mapping, autoScroll's edge-proximity
math) tested in isolation, with no Vue component or jsdom-mocking
involved, using `vi.useFakeTimers()` for deterministic control over
the `requestAnimationFrame`-driven autoScroll loop specifically.

### 77. A fresh audit of the native engine found a real multi-pointer bug in both drag and resize

Asked to re-analyze the whole solution, find missing edge-case unit/
component tests, and deep-scan for bugs. Coverage itself was already
close to complete (98.89% statements) — the two genuinely missing
branches were `createNativeAutoScroll`'s bottom-right proximity case
(only top-left had a test) and a code path that turned out to guard a
real bug, not just be undertested.

**The bug**: neither `createNativeDraggable`'s nor `createNativeResizable`'s
`onPointerDown` checked whether a gesture was already being tracked
before starting a new one. A second pointer pressing down on the same
element (or, for resize, any handle) while one was already active —
two fingers on the same item, or an accidental palm touch mid-drag on
a touchscreen — would unconditionally overwrite `pointerId`/`startX`/
`startY` (drag) or `pointerId`/`activeEdges`/`activeHandle` (resize),
silently abandoning the first pointer's own gesture. Its eventual
`pointerup` would then never match the now-different tracked
`pointerId`, so `dragend`/`resizeend` would never fire for it.

For resize specifically, this was worse than a UX glitch: the
abandoned gesture's own `resizeend` never firing left `isResizing`
stuck `true` in `useGridItemResize.ts` indefinitely — which also
blocks `handleDrag` from ever running again for that item, since it
checks `isResizing.value` before proceeding. A single accidental
second touch could permanently disable both drag and resize for an
item until the page was reloaded.

Fixed with an explicit `if (pointerId !== null) { return; }` guard at
the top of both `onPointerDown` handlers — the same "one gesture at a
time per element" invariant interact.js's own `Interactable` had,
which the native engine's rewrite hadn't carried over explicitly since
neither the original design nor any test exercised a second concurrent
pointer. New tests for both, plus the `autoScroll` proximity gap,
added to `tests/native-interaction.spec.ts`.

### 78. A public, framework-agnostic `/core` entry point — Phase 1 of closing a named parity gap

Asked to implement Phase 1 of a strategy for closing parity gaps found
against `react-grid-layout` v2 (which exports framework-agnostic core
utilities from its own `/core` subpath, with tree-shakeable, separate
entry points) — the lowest-risk, most mechanical of the gaps found,
and a prerequisite for a later, harder one (a pluggable compaction
interface is easier to design once compaction is already isolated as
a public, standalone function).

**A real risk found before writing any new code, not after**: auditing
every import in `src/core/` for anything reaching into
`@/components` — the main Vue component barrel — rather than the
type-only file that actually defines a shared type. Found 8 files
doing exactly that (`collision-helper.ts`, `move-helper.ts`,
`sort-helper.ts`, `alignment-helper.ts`, `responsive-helper.ts`,
`grid-item-type-helpers.ts`, `grid-layout-helper.ts`, and two
interface files), all importing `ILayoutItem`/`TLayout`/
`TResponsiveLayout` via `'@/components'` instead of
`'@/components/Grid/layout-definition'` directly. Harmless while
everything shipped as one bundle — TypeScript types are erased at
compile time regardless of which path they're imported from — but
exactly the import shape that risks a bundler including the entire Vue
component tree in what's supposed to be a Vue-free entry point, if its
own tree-shaking analysis of type-only imports ever proved less
thorough than assumed. All 9 redirected to the direct file before
`src/core/index.ts` (the new barrel) was written at all.

**What's exposed**: collision detection, movement/collision-avoidance,
compaction, grid-unit/pixel conversion, ordering, alignment guides,
breakpoint resolution, serialization, SVG export, the outside-drop
payload helper, and every validator — the complete list of what was
already Vue-free internally, now with a public door into it. Not new
logic; a new export surface over logic that already existed and was
already shared this way.

**Build**: a separate `vite.core.config.js`, not a second entry in the
main `vite.config.js` — Vite's own library mode doesn't support
multiple entry points when any output format includes `umd`/`iife`,
and the main library needs to keep shipping a UMD build for script-
tag/CDN consumers (confirmed by trying the single-config approach
first and reading the actual error, not assumed). `/core` ships
`es`+`cjs` only, which don't have that restriction. DTS generation for
`/core` needed its own, narrower tsconfig
(`tsconfig.build-types-core.json`) too — reusing the main build's own
`tsconfig.build-types.json` (which `include`s all of `src/**/*`) made
`vite-plugin-dts` walk and emit declaration files for unrelated Vue
component files during the core build, wastefully (if harmlessly,
since the output was identical to what the main build already wrote)
regenerating them.

**Verification**: `scripts/check-package-install.js` (the pack-install
smoke test — installs the actual built tarball into a genuinely
separate scratch directory, no source aliasing) already generically
resolves every `exports` subpath, so `./core` was covered by that loop
without any change; extended it to also confirm `/core`'s own expected
named exports import successfully post-install, matching the existing
check for the main entry. Bundle size (the main entry, checked by
`scripts/check-bundle-size.js`) is unaffected — `/core` is a
completely separate build artifact, not something the main bundle now
includes more of.

### 79. A pluggable `compactor` prop — Phase 2 of closing the same parity gap

Phase 2 of the strategy from finding #78: a `Compactor`-equivalent
interface, closing the gap found against `react-grid-layout` v2's own
pluggable compaction. Checked its actual interface shape first (not
assumed from the earlier surface-level research) — `type`,
`allowOverlap`, `preventCollision`, `compact(layout, cols): Layout` —
before designing this project's own version, rather than guessing at
what "pluggable" should mean here.

**A deliberate, small divergence from `react-grid-layout`'s own
design**: their `Compactor` bakes `verticalCompact`-equivalent behavior
into *which* compactor object you pick (`verticalCompactor` vs
`noCompactor` vs a custom one), removing the `verticalCompact` prop
entirely as a v2 breaking change. This project's own `verticalCompact`
was already an existing, widely-used, well-tested prop before this
interface existed — removing or replacing it to match another
library's design more exactly wasn't worth the breaking change.
Instead: `ICompactor.compact(layout, cols, context)` takes a third
`context` argument (`{ verticalCompact, minPositions? }`) carrying the
same information the built-in logic already used, and the new
`compactor` prop defaults to `null` — meaning "use the exact built-in
behavior this project always had," not a new default. A custom
compactor is a purely additive override; `verticalCompact` keeps
working completely unchanged whether or not one is set.

**Call-site audit, not a single change point**: `compactLayout()` was
called directly from 6 separate places in `GridLayout.vue` — drag end
(two branches, depending on `restoreOnDrag`), resize end, mount, a
breakpoint/column-count change, and `compactNow()`/`rearrange()`'s own
forced-`true` override (see finding #73 for why that one's forced).
All 6 now route through a single `runCompaction()` helper that checks
`props.compactor` first, falling back to the identical `compactLayout()`
call each site used before — confirmed via all 536 pre-existing tests
still passing unchanged, not just the new ones added for this feature.

**Built-ins**: `verticalCompactor`/`noCompactor`, thin wrappers around
the existing `compactLayout(layout, true/false, minPositions)` calls —
not new algorithms, just the existing ones given a name and a public
interface. Exported from both the main entry and `/core` (matching
`react-grid-layout`'s own pattern of shipping built-in compactors from
its `/core`), so a custom compactor can delegate back to one of these
for part of a layout rather than reimplementing standard compaction
from scratch.

**A real bug found writing the demo, not a pre-existing one**: the
`AdvancedFeaturesView` demo's own custom "downward" compactor initially
checked a moving item for collision against *itself* one row down
(`collides(moved, { ...moved, y: moved.y + 1 })`) — which is always
true for any item taller than 1 row (a height-2 item at `y:0` occupies
rows 0–1; shifted to `y:1` it occupies rows 1–2; they share row 1).
The loop therefore never advanced at all. Fixed by only checking
collision against already-placed *other* items, never the item being
moved against a hypothetical version of itself — worth calling out
since it's exactly the kind of off-by-one a real custom-compactor
author would hit first too, not something specific to this being a
demo.

**Coverage housekeeping**: the new `ICompactor`/built-ins file was
initially placed in `src/core/gridlayout/interfaces/`, alongside this
project's other type-only files — but unlike those, it has real
runtime code (`verticalCompactor`/`noCompactor`'s own function bodies).
That whole directory is excluded from the coverage gate
(`vitest.config.js`'s own comment: "Pure type declarations: no JS is
emitted for these"), which was correct for every existing file there
but would have silently exempted this one's real logic from the
coverage threshold too. Moved to `src/core/gridlayout/helpers/` (the
directory's own existing convention for runtime code) before writing
any tests against it — confirmed via the coverage report showing
100% for the file at its new location, where a stale exclusion rule
would have shown nothing for it at all.

### 80. `enableUndoRedo`/`undo()`/`redo()` — Phase 3 of the same strategy, plus a genuine design bug found before it shipped

Phase 3: undo/redo, closing the gap found against `@marsio/vue-grid-layout`'s
own Pinia-backed history stack. Scoped deliberately before any code —
this item's own `ROADMAP.md` entry already flagged the risk of a naive
per-drag-frame snapshot stack getting memory-heavy, so the design
started from "snapshot at committed-change granularity, opt-in, capped"
rather than "auto-snapshot everything."

**A real design bug found while implementing, not a pre-existing one,
and worth a full account since it's the kind of mistake a first pass
at this exact feature naturally makes**: the first version called a
single `pushUndoPoint()` function at `dragstart`/`resizestart`, which
checked "has the layout changed since the last snapshot?" before
deciding whether to push. But at `dragstart` specifically, *nothing
has changed yet* — the actual position update happens later, at
`dragend`. A guard checking for change *before* the change exists can
only ever conclude nothing changed, so the guard always skipped the
push, and `undo()` would silently have nothing to undo after any
completed drag at all. Caught by manually tracing through the
"restores pre-drag position" test scenario before ever running it —
not from an observed test failure. Worth calling out precisely because
it's the kind of bug that would have looked identical across
essentially every gesture-based test rather than isolating to one, if
it had shipped and only been caught after the fact.

Fixed by splitting capture from commit: `dragstart`/`resizestart` only
*capture* a local snapshot (`dragStartSnapshot`/`resizeStartSnapshot`,
plain closure variables, not refs); `commitUndoPoint(before)` is called
at `dragend`/`resizeend` instead, *after* the position update and
compaction have already run, passing that captured snapshot in
explicitly as the `before` argument — comparing it against the
now-current, post-gesture `props.layout` actually reflects what the
gesture did. `compactNow()` needed the same fix, moving its own commit
call to *after* `runCompaction()` ran rather than before it, for the
identical reason. The length watcher (item add/remove) didn't have
this problem at all: since it can only ever fire *after* a length
change already happened, the shared `lastSnapshot` variable (updated
only by a successful commit, never by the mutation itself) was already
the correct "before" value by the time it fires — no separate capture
step needed for that one path.

**Deliberately not tracked separately, no extra guard needed**: whether
`undo()`/`redo()` themselves would incorrectly re-trigger the length
watcher's own commit call while applying a snapshot that changes
length. They don't need a special-case flag — both already update the
shared `lastSnapshot` to match the newly-applied layout *synchronously*,
before Vue's own (queued, not synchronous) watcher can fire, so by the
time the length watcher's callback actually runs, `commitUndoPoint`'s
own "skip if nothing changed" check already sees no real change since
that update and no-ops on its own.

**Scope not built in this same pass, deliberately**: `@marsio/vue-grid-layout`'s
own command layer (align/distribute/lock/sections) built on top of its
own history stack — see `ROADMAP.md` item 23 for the corrected scoping
(an earlier, too-quick pass through `COMPARISON_ALTERNATIVES.md` had
assumed `snapToGrid`/`distributeEvenly` already covered "align"/
"distribute"; they don't, once checked more carefully — those are
drag-time/bounds-correction mechanisms, not on-demand commands over a
`multiSelect` group). Left open rather than rushed alongside undo/redo
in the same pass.

### 81. A real, user-reported bug: `resizestart` silently corrupted an item's own size in `props.layout`, breaking `multiSelect`'s group resize specifically

Reported as "group resize changes both height and width even when only
resizing one dimension" — verified directly against the actual "s"
(height-only) resize handle before assuming the report's own framing
was the right diagnosis, since the group-resize delta math
(`dw`/`dh`, independently computed and applied) looked correct on a
read.

**Confirmed the report first**: dragging only the `s` handle on a
selected item did visibly grow another selected item's width, not
just its height — a real bug, not a misreading of the demo.

**Traced to its actual source, not the first plausible cause**: the
group-resize snapshot (`groupResizeStartSizes`, captured at
`resizestart`) read the resizing item's own `h`/`w` as `{1, 1}` —
nowhere near its real size. Not a `selectedItemIds`/`getLayoutItem`
lookup bug (the obvious first suspect) — `props.layout` itself already
held `{h: 1, w: 1}` for that item by the time the snapshot read it.
Traced further back: `handleResize`'s own switch statement has a
`default: {}` case and no `return` in `resizestart`'s own case, so
control falls through to code shared by all three event types —
`pos = calcWH(newSize.height, newSize.width)`. `newSize` is only ever
populated by the resizemove/resizeend cases; for resizestart it's
still its initial `{ height: 0, width: 0 }`. `calcWH(0, 0)` produces a
near-zero size, clamped up to the library's own 1×1 floor a few lines
later — silently overwriting resizestart's own, already-correct `pos`
with `{h: 1, w: 1}`, which then flowed through the eventBus payload
into `GridLayout`'s `l.w`/`l.h` assignment, corrupting the item's real
size in `props.layout` on every single `resizestart`, before the user
had moved anything at all.

**Why this was invisible for years for a single-item resize**: the verb
"corrupted" undersells how narrow the actual window was —
resizemove/resizeend immediately overwrite `l.w`/`l.h` with the real,
correct computed size on the very next event, and the *rendered* size
stays correct throughout (driven by CSS reflecting the size from the
previous render, not the transient bad value). It only surfaced once
something else read `props.layout` exactly during that corrupted
instant — `multiSelect`'s own group-resize snapshot does exactly that.

**Fix, and a second bug found while fixing the first**: rather than
guarding the shared fall-through code against running for `resizestart`
(risking missing some other implicit dependency on it), `resizestart`
now emits its own, already-correct eventBus message directly and
returns early — the single source of truth for what it emits, with no
shared code able to touch it afterward. That return uncovered a real,
second issue: `lastW`/`lastH` (which `resizemove`'s own delta
calculation depends on) were *also* only ever initialized by that same
shared fall-through code — returning early skipped that too, breaking
every first `resizemove` after a `resizestart`, caught by 11 failing
unit tests immediately after making the change (not reasoned around in
advance). Fixed by setting `lastW`/`lastH` explicitly in `resizestart`'s
own case too, at the same point the shared code used to.

**A pre-existing test with a marginal, not wrong, drag distance
surfaced once the real bug was fixed**: an existing group-resize e2e
test (using the `se` corner handle) started failing after this fix —
not a new regression, but the corrupted `{1,1}` starting size the bug
had been producing was coincidentally making that test's own 40px drag
distance cross a grid-row boundary that it doesn't reliably cross from
the item's real, correct starting size. Increased to 100px, a
comfortably-past-the-threshold distance regardless of exact
pixel-to-grid-unit rounding, rather than tied to a value that happened
to work only because of the bug being fixed.

New regression test in `tests/GridLayout.spec.ts` (`resizestart data
integrity`) asserts `props.layout` is untouched immediately after a
bare `resizestart`, independent of `multiSelect` — the general bug
being distinct from the specific `multiSelect` scenario it happened to
surface through.

### 82. Another real, user-reported bug: `dragAllowFrom` silently lost to the default `dragIgnoreFrom` whenever the handle was a `<button>` — breaking the library's own exported `CustomDragElement`

Reported as "the custom drag handle example doesn't work." Confirmed
directly first, in the reliable demo app (not the reported VitePress
example itself, whose own dev server proved too unreliable in this
environment — kept dying between tool calls; switched to a static
`vitepress build` served over a plain HTTP server instead, which held
up for the rest of the investigation): a real `<button>` set as the
sole allowed drag handle via `dragAllowFrom` genuinely didn't drag at
all.

**Traced precisely, not assumed**: added temporary logging at every
decision point in the native engine's `onPointerDown`, rebuilding and
re-testing after each change (losing significant time to the flaky
dev server before switching to the static-build approach). Found:
`GridItem`'s own default `dragIgnoreFrom` is `"a, button"` — a
sensible default meant to stop an accidental drag starting on a plain
link/button somewhere in an item's regular content when there's no
dedicated handle. But `passesDragFilters` checked `ignoreFrom`
*before* `allowFrom`, unconditionally — so a consumer explicitly
restricting dragging to one handle via `dragAllowFrom` still got
silently blocked if that handle happened to be, or contain, a
`<button>`/`<a>`. The library's own exported `CustomDragElement`
(pointed at by the VitePress example the report referenced) uses a
`<button>` internally, so it hit this exact case out of the box, with
no error or warning anywhere.

**Fix**: `allowFrom`, when set, is now the sole authority —
`ignoreFrom` is skipped entirely rather than checked first. This
matches what `dragAllowFrom`'s own purpose actually is: once dragging
is restricted to one specific handle, `ignoreFrom`'s job (excluding
elements from an otherwise-unrestricted "drag from anywhere" surface)
no longer applies — that handle should work regardless of what element
type it happens to be.

New regression tests: a unit test in `tests/native-interaction.spec.ts`
(a `<button>` handle with `allowFrom` and the default `ignoreFrom` both
set), and an e2e test in `e2e/item-overrides.spec.ts` against a real
`<button>` in a real browser — added a `dragAllowFrom` input to the
`ItemOverridesView` demo (alongside its existing `dragIgnoreFrom`/
`resizeIgnoreFrom` ones) to make this testable there at all.

### 83. A third real, user-reported bug: cross-grid transfer committed on the first `dragmove` that crossed into another grid's rect, not on the actual drop

Reported as "drag an item back onto a locked item in the source grid,
it doesn't land there — it snaps back to its previous position
instead." Confirmed directly first (a real, reproducible snap-back, in
both the reported `preventCollision` case and the default), before
assuming the report's own framing (a collision-resolution bug) was
the right diagnosis.

**Traced past the first plausible cause**: the group-resize snapshot
angle from finding #81 didn't apply here — this was a plain, single-
item cross-grid drag, no `multiSelect` involved. Read
`GridLayout.vue`'s own `dragEvent()` and found `handleCrossGridDragStart`/
`handleCrossGridDragEnd` called unconditionally, on every single
invocation — including every `dragmove`, not gated to the actual drop
(`dragend`) at all. `handleCrossGridDragEnd` reads `clientX`/`clientY`
directly off whatever event triggered the call, and
`useGridItemDrag.ts`'s own event payload populates those for every
event type, not only dragend.

**What that meant in practice**: the moment the pointer first crossed
into another grid's own rect *during* the drag — often early in the
gesture, long before the user released the mouse or reached their
actual intended drop point — the transfer committed right then, via
`acceptDrop`'s own fixed `{x: 0, y: 999}` placement + compaction, using
that mid-drag position rather than wherever the pointer ended up. The
item was already gone from the source grid's own layout for the rest
of that same gesture at that point, which is what produced the
reported snap-back: dragging back toward the locked item's position
crossed back into the source grid's rect early in the path, committing
a transfer there and then, well before the pointer reached anywhere
near the locked item itself.

**Fix**: `handleCrossGridDragStart` stays gated to `dragstart`
specifically (matching its own doc comment's original intent —
arming `crossGridDraggedId` once per gesture); `handleCrossGridDragEnd`
is now gated to `dragend` specifically, rather than both running on
every event type. A new unit test (`GridLayout.crossGrid.spec.ts`)
asserts a `dragmove` landing over another grid's rect does *not*
transfer the item, while the exact same `dragend` does — the general
bug being distinct from the specific locked-item scenario it happened
to surface through.

### 84. Root cause found for #7's z-index fix breaking `multiSelect`'s group move: reactively changing z-index on an element mid-gesture silently cancels the browser's own pointer capture

Reported: "when dragging item A over the static item B it should have
a higher z-index so it's visible." Confirmed the underlying claim
directly — no CSS rule existed for `.vue-draggable-dragging` at all,
so a dragged item had no z-index boost, and a later-in-DOM-order
sibling (including a static item) would visually paint on top of it
during a drag.

**First attempt, and the regression it caused**: added
`&.vue-draggable-dragging { z-index: 3; }` (matching `.resizing`'s own
existing boost). Unit suite and an isolated e2e check both passed, but
a full e2e run surfaced a real regression: `multiSelect`'s own "group
move" test failed — the anchor item stopped moving at all, partway
through a real mouse gesture in an actual browser (not reproduced via
`wrapper.vm.dragEvent(...)` at the unit level).

**Root cause, found this session by tracing rather than guessing**:
added temporary logging directly in `useGridItemDrag.ts`'s own event
handler, printing every `dragstart`/`dragmove`/`dragend` call with its
coordinates. Without the z-index rule: a clean run of ~12 `dragmove`
events with smoothly incrementing coordinates, ending in a `dragend` at
the final position — normal. With the z-index rule: exactly *one*
`dragmove`, then immediately a `dragend` at wildly different, unrelated
coordinates (large negative values, nothing like the drag's actual
path). That's the signature of the browser silently releasing
`setPointerCapture` mid-gesture and the native engine's own
`pointercancel`/early-termination path firing as if it were a real
drop — not a logic bug in this library's own code at all.

The mechanism: `setPointerCapture` is established at `pointerdown`
(`native-interaction.ts`), well before `dragstart`/`isDragging` ever
fires (that only happens once the pointer crosses the activation
threshold, inside the same captured gesture). Toggling `z-index`
reactively, tied to `isDragging`, mutates a stacking-related CSS
property on the very element that already holds active pointer
capture, mid-gesture — which some browsers treat as invalidating that
capture, silently ending the gesture from their own point of view.
Tried a second implementation (the same z-index applied via a reactive
inline style rather than a CSS class toggle) specifically to rule out
a class-toggle-specific cascade explanation — the regression persisted
identically, confirming the mechanism was the property mutation itself
mid-capture, not how it was authored.

**Actual fix**: rather than changing anything on the dragged item
during its own gesture, give **static** items a permanently lower
z-index (`-1`) instead — set once, unconditionally, never toggled.
`isStatic` never changes mid-gesture (a static item is never the one
being dragged, and its own state doesn't change while something else
is), so this achieves the identical visual result — a dragged item
stays visible above a static one — without ever mutating a
stacking-related property on the element actually holding pointer
capture. Verified directly: the same event-trace method now shows a
normal, full run of `dragmove`s ending in a correct `dragend`, and
`multiSelect`'s group move test passes again.

New regression test in `e2e/drag-and-resize.spec.ts` asserts static
items resolve to a negative z-index and that a dragged item's own
(unset, `auto`) z-index still paints above it.

### 85. A real, reported bug: neither `addItem` implementation actually bin-packed — a new item never reused a gap opened by a removed one

Reported as "bin-packing placement algorithm" (missing one). Both the
`Add or remove items` VitePress example and the demo app's equivalent
view placed every new item using a "past the bottom" strategy — the
example computed the layout's own max `y + h` and placed the new item
just past it; the demo used `x: 0, y: Infinity` and relied on
compaction to settle it. Neither actually searches for an open gap:
plain vertical compaction only ever moves an item straight up within
its *own* x range, it doesn't search other columns for a better fit,
and the "max y" approach doesn't consider gaps at all, only the
bottom-most edge.

**Confirmed directly, in both places, before assuming they shared one
bug**: removed an item from the middle of a row (opening a gap at that
column), then added a new one — in both the example and the demo, the
new item landed in a fresh row at the very bottom, ignoring the gap
directly above it. The demo's own `x: 0` was hardcoded regardless of
where a gap actually was, so even when compaction *did* run afterward,
there was nothing for it to pull the new item sideways into.

**Fix**: added `findFirstFitSlot` as a new, exported core helper
(`vue-ts-responsive-grid-layout/core`) — a real first-fit bin-pack:
scans row by row from the top, column by column from the left within
each row, and returns the first `(x, y)` where the candidate rect fits
without colliding with anything already in the layout. Row-major scan
order matches how a person visually scans a grid for open space, and
matches this library's own default top-to-bottom, left-to-right
compaction order. Both the VitePress example and the demo app's
`addItem` were rewritten to use it instead of their own ad hoc
placement, removing two independent, duplicated (and both wrong)
implementations in favor of one tested, shared one.

New unit tests (`tests/bin-pack-helper.spec.ts`) cover the empty-layout
case, filling a gap from a removed item specifically, scanning past a
completely full first row, respecting `colNum`, and accounting for an
item's own height (not just its top edge) when checking for a
collision. A new e2e test (`e2e/dynamic-items.spec.ts`) exercises the
exact reported scenario end-to-end: remove an item from the middle,
add a new one, assert it lands in that gap rather than below.

While investigating this, ran into the flakiness affecting one of
`e2e/dynamic-items.spec.ts`'s *existing* tests ("adding an item
increases the grid item count") that had already been noted as a
known, pre-existing issue in earlier sessions — confirmed it's
unrelated to this fix (reproduces with or without any of this
session's changes, and passes reliably across repeated runs when it
does run), not something this work introduced or needs to resolve.

### 86. A real, reported bug: two examples rendered a fully-working, clickable close button that silently did nothing

Reported as "edit mode toggle — delete button test." The `Edit mode
toggle` VitePress example toggles `enableEditMode`/`showCloseButton`
together and renders the close button correctly once both are on —
but never had an `@remove-grid-item` listener bound on `GridItem` at
all. The demo app's `DragResizeView` (which exposes its own working
`showCloseButton` test toggle) had the identical gap.

**Confirmed precisely, not assumed**: added temporary logging directly
in `GridItem.vue`'s own `closeClicked` handler. It fired every single
time, correctly gated on `editModeEnabled` being true (including after
toggling edit mode off and back on — that sync path itself works
fine). The item count simply never changed afterward, because nothing
was listening for the `REMOVE_ITEM` emit it produces — a wiring gap in
the consumer, not a bug in `GridItem`'s own click-handling or
edit-mode-sync logic.

**Fix**: added `@remove-grid-item="removeItem"` (filtering the item out
of `layout`) to both the VitePress example and the demo view. New e2e
regression test in `e2e/drag-and-resize.spec.ts` covers the demo view
specifically — toggles the close button on, toggles edit mode off and
back on (the exact sequence from the original report), then asserts
clicking the button actually removes the item.

### 87. Missing feature, not a bug: the outside-drop examples had no way to demonstrate/test the interaction with `verticalCompact`

Reported as "drag/drop from outside — h/v compact toggle." Neither the
`Drag, drop from outside` VitePress example nor the demo app's
equivalent (multi-grid) view exposed any control for `verticalCompact`
at all — there was nothing to toggle, so the interaction between an
outside-dropped item's position and compaction was never visible or
testable there.

**Verified the underlying behavior first, before assuming a UI gap was
the whole story**: added a unit test exercising the actual mechanism —
`useOutsideDrop.ts` only resolves a pixel position and emits it; the
consumer's own handler decides whether/how to add it to `layout`, at
which point it goes through the exact same compaction path as any
other layout change. Confirmed directly: dropping into a real gap
below existing items settles flush against them with `verticalCompact`
on, and stays exactly where dropped with it off — already correct,
not broken.

**Fix**: added a `verticalCompact` toggle to both the example and the
demo view, bound directly to the grid(s), so the interaction is
actually demonstrable. New e2e test in `e2e/external-drop.spec.ts`
covers both states directly: drop into a real gap below an existing
item, and assert the resulting position differs by whether
`verticalCompact` is on or off.

### 88. Missing feature, not a bug: the transition duration/easing example had no way back to a consistent starting layout

Reported as "transition duration/easing — needs reload button." The
`Configurable transition duration & easing` example asks the reader to
drag or resize an item to feel a given duration/easing, then compare
it against a different one — but had no reset control at all, so after
the first drag the layout drifted away from its tidy starting
arrangement, and reloading the whole page was the only way back to a
consistent baseline for comparing settings.

**Fix**: added a "Reset layout" button, restoring a cloned copy of a
dedicated `INITIAL_LAYOUT` constant (not read back out of the live
`layout` ref itself, so a reset always returns the exact original
positions, not whatever the layout happened to compact into after some
interaction). Verified directly against a static build of the docs
site: dragged item "0", confirmed its position changed, clicked Reset,
confirmed it landed back at its exact original coordinates.

### 89. A real, reported bug: `scrollToItem`/`focusItem` silently did nothing when called the way their own documented use case calls them

Reported as "scrollToItem/focusItem — not actually scrolling/
focusing." Confirmed directly in a real browser first: clicking "Add
item" in the demo app never actually moved focus to the newly-added
item — `document.activeElement` stayed on the button that was clicked.

**Root cause**: both methods searched for the target element
synchronously, at the moment they were called. But their own
documented intended use — "jump to the widget you just added" — is
calling them immediately after pushing a new item into `layout`, in
the very same handler. Vue's own reactivity batches the resulting DOM
update asynchronously (a microtask, not synchronous within the same
call stack), so the new item's element genuinely didn't exist in the
DOM yet at that point. Both methods have their own "no-op, not a
throw, if the id doesn't match a rendered item" contract, so this
failed *silently* — no error, just nothing happening — in exactly the
scenario they exist for. Both the VitePress example and the demo app's
own `addItem` had an explicit (and, it turned out, incorrect) comment
claiming this timing wasn't an issue — Vue 3's reactivity does not, in
fact, flush the DOM synchronously within the same handler.

**Fix**: `scrollToItem`/`focusItem` now `await nextTick()` internally
before searching for the element, so the exact call pattern shown in
both examples — no `await` needed at the call site — now works
correctly. Fixed at the library level rather than pushing an `await
nextTick()` requirement onto every consumer; both examples' own
misleading comments were corrected to reflect the actual, now-true
reason this works.

**Test-writing note**: the existing `mountGrid` unit-test helper
closures over the original array argument passed to it at mount time
— it doesn't reactively re-render from `props.layout`, so neither
direct mutation nor `wrapper.setProps()` makes a genuinely new item's
DOM element appear under it (same limitation `mountGridWithReactiveItem`
already existed to work around, just not for this multi-item case). The
new regression test for this fix uses its own `reactive()`-array mount
directly, matching that same pattern, rather than extending `mountGrid`
itself.

### 90. A real, reported bug: `autoHeight` never actually grew an item, no matter how much its content grew

Reported as "Per-item autoHeight — container height." Confirmed
directly first, before assuming a cause: added many lines to an
`autoHeight` item's content in both the VitePress example and the
demo app, and its own rendered box stayed exactly the same size every
time, even as the actual content grew to several times that height and
visibly overflowed.

**Root cause**: `.vue-grid-item-auto-height-wrapper` — the element
`autoSize()` measures, and the same element the `ResizeObserver`
watches for a size change — had `height: 100%` in its own CSS,
constraining it to exactly its parent `GridItem`'s current (fixed)
height. That meant it could never actually grow past that regardless
of how much content was inside it: its own bounding rect was always
the parent's existing size, never the content's real size, and the
`ResizeObserver` watching it for a change therefore never fired for
growing content either, since a fixed percentage of a fixed parent
height doesn't change on its own. Both the automatic,
`ResizeObserver`-driven resize and any manually invoked `autoSize()`
call were reading the same wrong, unchanging number.

**Fix**: changed the wrapper's height to `auto` (keeping `width: 100%`
unchanged — width still needs to track the parent, autoHeight is a
height-only feature), letting it size itself to its actual content
instead.

**A second, correct behavior this fix revealed**: an existing
`multiSelect` group-resize test asserted the demo's own `autoHeight`
item ("growable") grew taller when resized as part of a group — that
assertion only ever passed because `autoHeight` was silently
non-functional; nothing was ever available to correct the height back
down. With the real fix in place, growable's height correctly stays
matched to its own content regardless of what group-resize tries to
set it to — the same override behavior `autoHeight` is supposed to
have against any other externally-set height. Updated the test's own
expectation to reflect this: width still grows (group-resize's own
delta is still applied and reflected, since width isn't overridden by
autoHeight), height correctly does not.

New e2e regression test in `e2e/advanced-features.spec.ts` covers the
core, reported scenario directly: add many lines to the growable
item's content and assert its rendered height actually increases.

### 91. Missing feature, not a bug: the snap-to-grid example/demo had no way to visualize the grid's own column/row boundaries

Reported as "snap to grid — show gridlines." `showGridLines` is an
already-working library feature (confirmed via existing usage
elsewhere, e.g. example 16 and the demo's own `DragResizeView`) — the
`Snap to grid` VitePress example and the demo app's equivalent
(`AdvancedFeaturesView`, which has `snapToGrid`) simply never exposed
a toggle for it, so there was no way to make the grid's own boundaries
visible while testing snap behavior against them.

**Fix**: added a `showGridLines` toggle to both, bound directly to the
grid. Confirmed the underlying CSS itself renders correctly (the
relevant rule targets `.grid::before`, a pseudo-element — an initial
verification attempt checking the element's own `backgroundImage`
directly returned `none` and looked like a bug at first, until
checking `getComputedStyle(el, '::before')` instead confirmed it was
a test-target mistake, not an actual problem).

New e2e test in `e2e/advanced-features.spec.ts` covers the addition
directly: toggle on, assert the `::before` pseudo-element's background
gradient actually appears.

### 92. Missing feature, not a bug: the localizable ARIA strings example had no visible way to see its own effect

Reported as "Localizable ARIA strings — unclear demo purpose." Every
string this example demonstrates — the close button's label, the
item's `aria-roledescription`, and the keyboard move/resize
instructions — is deliberately visually hidden (screen-reader-only) in
normal use. That's the correct, intended behavior for those strings in
general — but it meant toggling the language control in this specific
example produced no visible change at all; the example's own
description asked the reader to "inspect the accessibility tree, or
turn on a screen reader" to see anything happen, a real barrier for
someone just skimming the docs in a browser.

**Fix**: added a visible readout panel that reads these same values
back out of the real, rendered DOM (not a separate, duplicated copy of
the `ariaLabels` resolution logic) and displays them in an ordinary,
visible table — so the actual effect of switching languages, and of a
per-item override taking precedence over the grid-wide default, is
immediately visible without either of those. Verified directly against
a static build of the docs site: toggled Spanish on, confirmed the
table updates to the Spanish strings for the grid-wide item while the
per-item French override on the second item correctly stays "Fermer,"
demonstrating override precedence as well as localization itself.

### 93. A real, reported bug: `useCssTransforms` never propagated to already-mounted items when toggled after mount

Reported as part of "Layout bounds & rendering — description clarity,
useCssTransforms." Confirmed directly first, via a unit test setting
`useCssTransforms` to `false` after mount and checking the item's own
rendered class/style: the `.css-transforms` class and the actual
positioning mechanism (`transform: translate3d(...)` vs `top`/`left`)
both stayed exactly as they were at mount, completely unaffected by
the prop change.

**Root cause**: every other similarly grid-wide-inherited prop —
`isDraggable`, `isResizable`, `isBounded`, `showCloseButton`,
`enableEditMode`, `useBorderRadius`, `borderRadiusPx`, `colNum`,
`maxRows`, `rowHeight`, `margin`, `transformScale`, even
`isMirrored`/`rtl` — has a `watch()` on `GridLayout`'s own prop pushing
the change to already-mounted items via the eventBus.
`useCssTransforms` never did; it was only ever read once, at mount,
with no reactive path to keep it in sync afterward. The example (and
the demo would have the same issue, had it exposed the toggle)
correctly re-rendered its own checkbox state, giving the appearance
that toggling did something, while the actual item never changed at
all.

**Fix**: added the missing `watch(() => props.useCssTransforms, val =>
eventBus.emit('setUseCssTransforms', val))` in `GridLayout.vue`,
matching every other prop's own pattern, and the corresponding
`setUseCssTransformsHandler` in `GridItem.vue` — calling `createStyle()`
afterward (mirroring `setMarginHandler`'s own pattern), since
`useCssTransforms` decides which of `setTransform`/`setTopLeft`
`createStyle()` actually applies; the CSS class alone updating on its
own wouldn't have been enough to also fix the item's real inline
positioning style. Added `setUseCssTransforms: boolean` to both
eventBus event-type definitions (`grid-item.interfaces.ts` and
`layout-data.interface.ts`) to typecheck the new `emit`/`on` pair.

**Also addressed the "description clarity" half of the report**: this
example packed five unrelated options into one description without
saying what to actually look for with each. Rewrote it to call out a
concrete, observable effect per option, and — since `useCssTransforms`
switches between two mechanisms that render visually identically, so
there was no way to see the toggle do anything without devtools even
once the reactivity bug was fixed — added a live readout showing the
item's actual current inline style, the same "read the real value back
out of the rendered DOM" pattern used for finding #92's ARIA strings
fix.

New unit test in `tests/GridItem.spec.ts` covers the reactive fix
directly: toggles `useCssTransforms` both ways on an already-mounted
item and asserts both the CSS class and the actual positioning style
switch correctly each time, not just once at mount.

### 93. Requested refactor: unified `verticalCompact`/compaction direction into a single `compactType` enum, modeled on `react-grid-layout` v2's five built-in compactors

Requested directly: "the 2 compaction options horizontal and vertical
compact are separate props... changed to one prop with enum values,"
explicitly asking for `react-grid-layout`'s own "5 different compactor
types" to be included.

**Researched the actual prior art first, not assumed it**: fetched
`react-grid-layout`'s own v2 RFC (`rfcs/0001-v2-typescript-rewrite.md`)
directly rather than relying on possibly-stale training knowledge of
an actively-developed library. Confirmed its exported built-in
compactor set is exactly five: `verticalCompactor`, `horizontalCompactor`,
`noCompactor`, `verticalOverlapCompactor`, `horizontalOverlapCompactor`
— plus a `getCompactor(type, allowOverlap, preventCollision)` factory.
This project's own pre-existing `verticalCompactor`/`noCompactor`
(from finding #79) already matched two of the five by coincidence, but
`verticalCompact` itself was still a separate boolean, and neither
horizontal compaction nor either overlap variant existed at all.

**New `ECompactType` enum** (`src/core/gridlayout/enums/ECompactType.ts`):
`VERTICAL` (the new default, matching the old `verticalCompact: true`),
`HORIZONTAL`, `NONE` (matching old `verticalCompact: false`),
`VERTICAL_OVERLAP`, `HORIZONTAL_OVERLAP`. Replaces the
`verticalCompact: boolean` prop entirely — a breaking change,
documented in `CHANGELOG.md`'s new `### Changed` section and
`MIGRATION.md` with the exact mapping.

**Two genuinely new algorithms implemented, not just renamed**:
`compactItemHorizontal`/`compactLayoutHorizontal` (mirrors
`compactItem`/`compactLayout` exactly, transposed to the x axis, via a
new `sortLayoutItemsByColRow` — the column-major counterpart to the
existing row-major sort) for `HORIZONTAL`; and
`compactLayoutOverlapVertical`/`compactLayoutOverlapHorizontal` (every
non-static item moves straight to `0` on that axis, unconditionally,
no collision checking at all — matching `react-grid-layout`'s own
`allowOverlap` semantics applied to compaction specifically) for the
two `*_OVERLAP` variants. All four are new, exported functions, not
adaptations of existing ones with a flag flipped.

**Every internal call site updated, not just the prop declaration**:
`GridLayout.vue`'s own `runCompaction()` (now resolves the built-in
compactor via a new `getCompactor(compactType)` factory instead of
calling `compactLayout()` directly), `compactNow()`'s own
force-a-real-compaction-through override (now forces `VERTICAL`
specifically only when `compactType` is `NONE` — respecting whichever
direction was already chosen otherwise, rather than always forcing
`VERTICAL` regardless), the `restoreOnDrag` capture condition (now
`compactType !== VERTICAL`, matching the boolean's old `!verticalCompact`),
cross-grid drag's own two post-drop recompaction call sites, and
`findOrGenerateResponsiveLayout` (changed from a `verticalCompact:
boolean` parameter to `compactType: ECompactType`, so a horizontally-
or overlap-compacting grid stays that way across a responsive
breakpoint change too, not silently reverting to vertical/none — its
own dedicated test suite gained a new case covering exactly this).

**A real Vue compiler limitation hit and worked around**: `defineProps<IGridLayoutProps>()`
type-only declarations ask Vue's SFC compiler to infer runtime prop
validators from the TypeScript types themselves. For this project's
first-ever enum-typed prop, the compiler misinferred it as `Number`
(`[Vue warn]: Invalid prop: type check failed for prop "compactType".
Expected Number...`) — confirmed via Vue's own GitHub issues that
cross-file enum resolution for this purpose is a known, imperfect
area, not something this project's code did wrong. Fixed by widening
the interface field to `ECompactType | `${ECompactType}`` — a template
literal type resolving to the identical string-literal union Vue's
compiler already handles correctly for prop inference — then casting
back to the nominal `ECompactType` (which TypeScript's string enums
don't structurally accept a plain string literal into without one) at
the handful of internal call sites that need the narrower type.

**Test bench (demo app) updated**: `DragResizeView` and the dev
sandbox each gained a full `<select>` exposing all five `ECompactType`
values (`select-compact-type` test id). `ExternalDropView` (the #3 fix)
kept its existing checkbox UX and test id, mapped internally via a
computed property to `VERTICAL`/`NONE` — deliberately not switched to
a five-option dropdown, since that example's own point is specifically
the vertical-vs-none comparison for outside-dropped items, which a
two-state toggle frames more directly than a broader selector would.
`AdvancedFeaturesView`'s own hardcoded `verticalCompact="false"`
updated to `compact-type="ECompactType.NONE"`.

**Verified thoroughly**: `getCompactor`'s switch statement checked
against 100% branch coverage on `compactor.ts`; 19 dedicated unit tests
in `compactor.spec.ts` covering all five compactors' `type` identifiers
and behavior individually, plus `getCompactor`'s own mapping; a
side-by-side scratch test (run once for verification, then deleted)
invoking all five on the identical scattered input and confirming each
produces the mathematically correct, genuinely distinct result: full
594-test unit suite green, full e2e suite green (bar the one
pre-existing, unrelated flaky test), including a new e2e test dragging
an item and watching horizontal compaction pull it leftward in a real
browser — not just asserted via the pure algorithm.

### 94. Documentation gap: `horizontalShift` and `compactType: HORIZONTAL` look related but don't overlap, and nothing said so

Raised directly: "is not horizontalShift doing the same as one of the
new compactor functions." Investigated rather than assumed — traced
both code paths and ran a direct, three-way comparison test (drag a
collision with `horizontalShift` off, with it on, then run
`HORIZONTAL` compaction on the "off" result) before answering.

**Confirmed they're genuinely different, not redundant**:
`horizontalShift` only affects a single, live collision-resolution
decision inside `moveElementAwayFromCollision` — mid-drag, does the
*other* item get bumped down (the always-on default) or sideways.
`compactType: HORIZONTAL` is an after-the-fact, full-layout settling
pass that only ever adjusts `x`, never `y` — confirmed directly:
running it on a layout where a collision already pushed an item down
(`horizontalShift` off) left that item at its pushed-down `y`
unchanged; horizontal compaction has no mechanism to reach across axes
and undo a vertical displacement.

**The gap this surfaced**: neither prop's own documentation said any
of this. Someone reaching for `compactType: ECompactType.HORIZONTAL`
expecting a fully horizontal-flowing grid would get inconsistent
behavior — horizontal once things settle, but still vertical mid-drag
— unless they also separately discovered and enabled `horizontalShift`.
Added a cross-reference note to both props' own doc comments,
`grid-layout-props.md`, and the two examples each one is demonstrated
in (`15-example`, `42-example`), recommending both be set together for
consistently-horizontal behavior in both respects.

### 95. Missing feature, not a bug: `AdvancedFeaturesView`'s controls were one giant flat list, with no way to tell which control belonged to which feature

Requested directly as part of "npm run dev/demo test-bench improvements."
`AdvancedFeaturesView` ("Layout tools & feedback" in the nav) packs in
10+ genuinely unrelated toggles/buttons — compaction, visual aids,
accessibility, multi-select, undo/redo, presets — all in one flat
`<div class="demo-controls">`, with a single wall-of-text paragraph up
top trying to explain all of it at once.

**Fix**: split into six `<fieldset>`/`<legend>` groups by what each
actually affects (Compaction & collision, Visual aids, Accessibility &
editing, Multi-select & history, Item actions, Layout presets).

**A real regression caught and fixed along the way**: the first version
of this split simply stacked the six fieldsets vertically, each with
its own border/padding/margin — this pushed the demo grid itself far
enough down the page (item `y` positions past 770px) that it fell below
Playwright's default 720px-tall viewport fold, breaking 3 existing e2e
tests that use raw `page.mouse` coordinates (which don't auto-scroll,
unlike locator-based `.click()`). Confirmed directly — not assumed —
by writing a throwaway debug test that logged the actual bounding boxes
and drag result before and after, showing the dragged item never
actually moved at all (mouse events landing below the rendered
viewport). Fixed by wrapping the fieldsets in a `flex-wrap` container so
they lay out side by side instead of one-per-row, keeping the overall
page height close to the original. All 18 `advanced-features.spec.ts`
tests pass, confirmed via a full re-run plus a screenshot of the
restructured view.

### 96. New example and new e2e coverage: grid dimensions (rowHeight/colNum/margin) and margin's actual pixel effect

Requested directly as the remaining "new example" and "new e2e test"
items.

**New example** (`44-example`, "Grid dimensions"): no existing example
demonstrated `rowHeight`/`colNum`/`margin` as live, adjustable controls
— each only ever appeared as a fixed, hardcoded prop value in other
examples' own code. Added sliders for all three (marginH/marginV
independently), with a live readout via the existing
`LayoutJsonViewer`. Also fixed a stale sidebar label along the way
(`42-example`'s own nav entry still said "Pluggable compaction
(compactor)" after that example's title changed to include
`compactType` — a leftover from finding #93 that hadn't been caught).

**New e2e tests** (`drag-and-resize.spec.ts`): two tests using
`DragResizeView`'s existing `input-margin-h`/`input-margin-v` controls
— one confirms `marginH` sets the actual pixel gap between two
horizontally-adjacent items directly (not just "some spacing exists"),
the other confirms `marginV` is independent of `marginH` by checking
its effect on the grid container's own height formula
(`bottomY * (rowHeight + marginV) + marginV`). Caught my own arithmetic
mistake writing the second one — first draft expected `bottomY * delta`
(70px for a 35px marginV delta), the actual, correct result was 105px;
rechecking `updateHeight()`'s own formula directly showed the
standalone `+ marginV` term outside the multiplication also scales
with the delta, so the true effect is `delta * (bottomY + 1)`. Fixed
the test's own expected value and comment to match, rather than
loosening the assertion to make the wrong number pass.

### 97. `sandbox/App.vue` (the `npm run dev` test bench) got the same clarity pass as the demo app — and a real, pre-existing CSS bug surfaced along the way

Requested directly — the `demo/` app's own "Layout tools & feedback"
view (finding #95) had already been restructured into grouped
`fieldset`s; `sandbox/App.vue` (a separate, denser single-page bench,
859 lines / 47 controls, all in one flat block) hadn't been touched the
same way, only mechanically updated for the `compactType` rename.

**Fix**: same treatment — ten `<fieldset>`/`<legend>` groups by what
each actually affects (Item actions & lookup, Grid geometry, Panel
visibility, Compaction & collision, Drag & resize behavior, Visual
aids, Editing/accessibility/close button, Multi-select & auto-height,
Outside drop, Event log filter), wrapped in the same
`.demo-controls-groups` flex-wrap container from finding #95 (reused
directly, since this file already `@import`s `demo/style.css` — no
duplicate CSS needed).

**A real, pre-existing bug caught while verifying, not introduced by
this change**: `isDraggable`/`isResizable`'s own `.sandbox-hidden`
class (`display: none`, deliberately hiding two controls per finding
#44) turned out to not actually be hiding them anymore — confirmed
directly via a screenshot showing both checkboxes visible and checked.
Root cause: `.demo-controls label` (two classes) has higher CSS
specificity than `.sandbox-hidden` (one class) and wins regardless of
source order, once these two labels ended up nested inside a
`.demo-controls`-classed container (true both before and after this
restructuring — not a regression this change caused, just newly
noticed while re-verifying the page). Fixed with a deliberate, narrow
`!important` on `.sandbox-hidden` specifically — the legitimate case
for it: a utility class whose entire job is "hide this no matter what
else applies" needs to beat any context it's nested inside, rather
than trying to out-specify every possible container.

Verified via `npm run dev` directly (not just a build check) — full
page screenshot confirms clean, grouped layout and the two
`sandbox-hidden` controls genuinely gone from view; typecheck and the
full unit suite (594 tests) confirmed unaffected, as expected for a
template/CSS-only change with no script-side logic touched.

### 98. The "known flaky" responsive breakpoint e2e test was never actually investigated — a real race condition, not test flakiness

Reported directly with the exact failure: `expect(narrowIndex).toBeGreaterThan(wideIndex)` — `Expected: > 4, Received: 1`. This test had been waved off as "one known, pre-existing, unrelated flaky test" throughout this entire session's own verification passes, every time it happened not to fail on a given run — never actually root-caused. That characterization was wrong, and repeating it without checking was a mistake: it's a real, reproducible race condition, not environmental flakiness.

**Confirmed directly, not assumed**: wrote a throwaway debug test reading `current-breakpoint` immediately after `page.setViewportSize()`, then again after an explicit wait. The immediate read consistently showed the *previous* breakpoint — `setViewportSize` triggers the browser's own resize event and the library's `ResizeObserver` callback, both of which fire asynchronously, not synchronously within the same call. The original test read `.textContent()` with no wait at all between resizing and reading, so it was reliably capturing one resize behind: `wide`'s read could still reflect the breakpoint from *before* that resize, and `narrow`'s read could reflect `wide`'s own resize instead of `narrow`'s — exactly producing the reported "narrower viewport resolved to a larger-seeming breakpoint" symptom.

**Fix**: replaced the raw `.textContent()` reads with `expect(locator).not.toHaveText(previousValue)` between each resize — Playwright's own auto-retrying assertion, which waits for the text to actually change rather than reading whatever it happens to be at that instant. No arbitrary timeout — the library itself has no artificial debounce on `ResizeObserver` (confirmed by reading `GridLayout.vue`'s own setup directly), so there was no fixed delay to hardcode in the first place.

**Verified thoroughly, given how long this went uninvestigated**: ran the fixed test 8 consecutive times in isolation (all passed) plus the full e2e suite once more (57/57, this test included) — not just relying on a single passing run the way earlier sessions' summaries did.

### 99. New example: switching between layouts and forcing a remount — and a wrong assumption caught before it shipped

Requested directly: an example showing how to switch between two
layouts and force the grid to re-render.

**Initial design was wrong, caught by testing rather than shipped
untested**: my first draft used `multiSelect`'s own selection as the
"stale state that only clears on a forced remount" demonstration.
Verified this directly before finalizing — it doesn't hold. Selection
is already automatically pruned (a `watch(() => props.layout.length,
...)` calls `pruneSelection()`, removing any selected id no longer
present) whenever the layout's length changes, so switching to an
unrelated layout already clears it correctly on its own, with no
forced remount needed. Confirmed via a throwaway test showing selection
reading "none" immediately after a reactive (non-remounted) switch.

**The real, correct demonstration**: `enableUndoRedo`'s own history has
no equivalent pruning — it's a stack of full layout snapshots, and
`canUndo` genuinely stays `true` after switching to a layout the
history has nothing to do with, only resetting to `false` once a
forced remount (changing the `GridLayout`'s own `:key`) actually
destroys and recreates the component instance. Confirmed directly,
multiple times, with a real drag committing an undo point before each
switch.

**A second thing caught while verifying**: the two example layouts
initially had different item counts (3 vs 4) — which meant *switching
itself* changed `props.layout.length` and triggered that same
length-change watcher's own `commitUndoPoint()` call, making `canUndo`
turn `true` on every switch regardless of whether anything was ever
dragged, confounding the whole demonstration. Fixed by giving both
example layouts the same item count.

New example added as `45-example` ("Switching layouts & forcing a
remount"); verified end-to-end against a static build of the docs site,
run repeatedly for consistency, before finalizing.

### 100. Example 10's "append to end of first row" toggle placed a new item on top of an existing one after a mid-row removal, confirmed via exact repro steps

Reported with a precise repro: clear all, add 6 items (filling a
12-column first row exactly), remove the 3rd item from the left,
add one more — expected it to land in the gap left behind, got it
landing at the last column of the *next* row instead.

**Confirmed directly** by scripting the exact steps against the built
docs site, not just reading the code: with the "Add to end of first
row" toggle on, the new item landed at `x:10, y:2` — precisely
matching the reported symptom.

**Root cause**: the toggle's own placement logic computed `usedWidth`
as the *sum* of every first-row item's width, then used that sum
directly as the new item's `x`. That only equals "the first free
column" when the row is packed with no gaps. After removing an item
from the *middle* of a full row, the sum of the remaining widths is
unchanged from before the removal — so the new item was placed at the
row's old rightmost edge, landing squarely on the item already sitting
there. The library's own collision-avoidance then pushed it down into
the next row — not a library bug, a placement-math bug in the
example's own code.

**Fix**: replaced the summed-width calculation with the actual
rightmost occupied edge (`max(x + w)` across first-row items), which
is correct whether or not there's a gap. With the fix, the same repro
steps place the new item in the gap as expected; a separate check
confirmed the ordinary no-gap append case (three sequential adds with
nothing removed) still appends left-to-right correctly, unaffected by
the fix.

### 101. A static item could render fully invisible if the grid container had its own background — a real stacking-context bug, not just a docs-site styling quirk

Reported directly, with a screenshot: example 17's static "locked" item
wasn't rendering at all — just the VitePress docs theme's own hatched
placeholder background showing through where it should have been.

**Root cause, confirmed by inspecting computed styles directly, not
assumed**: static items are deliberately given `z-index: -1` (see this
same file's earlier finding on why — so a dragged item passing over a
static one stays visible above it). That only works correctly if
`.vue-grid-layout` itself establishes a stacking context. It didn't:
`position: relative` alone, with no `z-index` of its own, does not
create one — so a `-1` child's paint order escaped to compete with the
*entire page's* stacking order instead of just this element's own
background. A background painted directly on `.vue-grid-layout` (a
reasonable, common thing to do — VitePress's own example docs do
exactly this) always paints in front of a static item regardless.

**Fix**: added `isolation: isolate` to `.vue-grid-layout`'s own CSS —
establishes a stacking context without any of `z-index`'s own side
effects (no risk of this element being reordered relative to outside
siblings that set a competing z-index). Verified via
`elementFromPoint` at the static item's own center (the real question —
what actually paints there — rather than trusting a computed z-index
value that stayed correct throughout the whole bug). New permanent
e2e test added (`drag-and-resize.spec.ts`) confirming a static item
stays paintable even when the grid container has its own background;
confirmed the test actually fails without the fix by reverting it
temporarily, not just added and assumed correct.

### 102. Cross-grid drop landed a dropped item below a static item instead of in a gap above it — the same "push to y:999, then compact" anti-pattern `findFirstFitSlot` already exists to replace

Reported directly, with a screenshot: dragging an item out of a grid
and back in, where a static item sat in the same column below an
actual gap, landed the dropped item pushed down against the static
item's own bottom edge instead of in the gap above it.

**Root cause**: `useCrossGridDrag.ts`'s own `acceptDrop` placed the
dropped item at a hardcoded `{ x: 0, y: 999 }` and relied on the
subsequent vertical-compact call to settle it — precisely the anti-
pattern `findFirstFitSlot`'s own doc comment (added for example 10's
fix, finding #100 above) calls out as broken: plain vertical
compaction only ever moves an item straight up *within its own
column*, and can't jump over a static obstacle in that column to
reach a gap further up.

**Fix**: replaced the hardcoded placement with a real
`findFirstFitSlot` bin-pack search, same as example 10's own fix.
Confirmed via the exact reported repro (drag an item out, then back,
with a static item in the same column below a gap) — lands in the gap
now, not pushed past the static item. New permanent e2e test added
covering this directly (not just the throwaway repro), and confirmed
the test genuinely fails without the fix by reverting it temporarily
first.

### 103. Example 30's own description promised "a brief flash" that never actually existed — a real mismatch between what an example claims to demonstrate and what it does

Reported directly: example 30 ("Blocked-move feedback") wasn't
illustrating what it claimed to. Investigated by checking the
mechanism itself first (confirmed working correctly — dragging item
"a" onto the static "wall" was reliably blocked, and the
`@move-blocked-by-collision` counter updated correctly) before
concluding the actual gap: the example's own description says
"Listening for `@move-blocked-by-collision` makes that moment visible
(a brief flash below)", but the implementation only ever updated
plain text — no flash, no animation, nothing visible happening at the
moment of the block itself. The markdown page's own displayed code
snippet compounded this: a placeholder comment
(`// add a shake, flash, or toast`) that never matched the real
component's actual implementation at all.

**Fix**: implemented the actual flash the description promises — a
CSS class toggled on briefly via `requestAnimationFrame` (so
re-triggering mid-flash, e.g. dragging into the wall repeatedly,
restarts the effect cleanly rather than getting stuck partway through
a stale timer) with a `transition` back to the resting state. Updated
the markdown's own displayed code snippet to match the real
implementation instead of the stale placeholder comment. Verified
directly: the flash's own background color is the danger color
mid-drag, and confirmed it fades back to fully transparent after
settling — not just that a CSS class toggled, but that the actual
computed style changed and reverted as expected.

### 104. Example 34's grid had no min-height, collapsing to ~10px when empty and making it an easy-to-miss drop target — not a drop-mechanism bug

Reported directly: the compatible widget "wasn't added to the grid
when dropped." Checked the drop mechanism itself first, not assumed
broken — confirmed `outsideDropAccept`/`readOutsideDropPayload` work
correctly when the drop actually lands inside the grid's own bounds.

**Root cause, confirmed by measuring directly**: this example's grid
starts completely empty and had no `min-height` of its own — an empty
`GridLayout`'s real rendered height collapses to almost nothing
(measured directly: ~10px). A drop aimed at where the grid visually
*looks* like it should be can easily land outside that collapsed
strip entirely, especially right after page load before the exact
boundary is obvious. Reproduced directly: a drop 60px below the
grid's own top edge missed its collapsed 10px bounds and silently
added nothing; the identical drop succeeded once the grid had its
intended height.

**Not a novel problem** — examples 12 and 23 already document and
solve this exact issue for their own empty target grids ("given a
minimum height here so there's still a reasonable drop target to aim
for, since an actually-empty grid's own height would otherwise
collapse to almost nothing"). This example was simply missing the
same `min-height: 140px` those two already have.

**Fix**: added the identical `min-height` rule. Verified directly:
the same drop coordinate that previously missed the collapsed target
now lands inside the properly-sized one and adds the widget correctly.

### 101. Example 42's "Tidy up" button silently did nothing — a missing `ref`, not a compaction bug

Reported directly: "vertical compactType is not working."

**Confirmed the library itself was innocent first, not assumed**: wrote
an isolated unit test calling `compactLayout` directly on the exact
reported layout (an item at `y:0`, another at `y:5`, same column,
`compactType: VERTICAL`) — it correctly moved the gapped item to `y:2`,
both with plain objects and with Vue's own `reactive()` wrapping. The
project's existing test suite already had this precise scenario
covered too (`GridLayout.spec.ts`'s "Should compact a layout with a gap
when compactNow is called"), passing the whole time. Every layer of
the actual compaction logic was correct.

**Root cause, found by then checking the example's own template
line by line**: `<GridLayout>` declared and used `gridRef` in its
script (`const gridRef = ref<InstanceType<typeof GridLayout>>()`,
`@click="gridRef?.compactNow()"`) but the template's own `<GridLayout>`
tag was never actually given `ref="gridRef"` — so `gridRef.value` was
always `undefined`, and the optional-chained `?.compactNow()` call
silently no-op'd on every click, with no error to reveal it. Vertical
compaction on drag-end worked the whole time (confirmed: dragging an
item still auto-compacted correctly) — only the explicit "Tidy up"
button, which needed the ref, did nothing.

**Fix**: added the missing `ref="gridRef"` to the `<GridLayout>` tag.
Verified via the exact reported scenario end-to-end: drag an item to
open a gap, switch back to Vertical, click Tidy up — the gap now
closes correctly, checked twice in a row for good measure.

### 105. A real page freeze — `y: Infinity` (a common, widely-used placement convention) caused an infinite loop in compaction, plus two related undo/redo snapshot-corruption bugs found while verifying the fix

Reported directly: example 43 (the undo/redo example) froze the page
entirely when clicking its own "Add item" button.

**Bug 1 — the freeze itself, confirmed reproducible**: `addItem` uses
`y: Infinity` — a common, widely-used convention (`react-grid-layout`'s
own docs use it too) meaning "place this item past everything else,
then let compaction settle it." `compactItem`'s own decrement loop
(`while (layoutItem.y > 0 ...) { layoutItem.y--; }`) never terminates
when `y` starts as `Infinity`: `Infinity - 1 === Infinity` in
JavaScript, so the value never actually decreases when nothing
collides with it yet (the ordinary case for a freshly-added item).
Confirmed directly — not assumed — by scripting the exact repro and
watching Playwright's own click action time out mid-click. Fixed by
clamping any non-finite starting `y` to one row past everything
already in the comparison layout before the loop runs.
`compactItemHorizontal` had the identical vulnerability on `x` (a less
common case, but the same fix); fixed identically.

**Bug 2, found while verifying the first fix, not assumed away**:
repeated add/undo cycles stopped fully reverting after a couple of
rounds — an undo would silently do nothing instead of restoring the
layout. Traced with temporary logging (removed once identified, not
left in) directly to the cause: the `props.layout.length` watcher
called `commitUndoPoint()` — which clones the current layout into
`lastSnapshot` — *before* `layoutUpdate()`, the function that actually
runs compaction. For an item still carrying its raw `y: Infinity`, the
clone captured that raw value, and `cloneLayout`'s JSON round-trip
silently turns `Infinity` into `null` (JSON has no representation for
it) — permanently corrupting that item in every future undo/redo
snapshot referencing it. Fixed by running `layoutUpdate()` before
`commitUndoPoint()` in that watcher.

**Bug 3, a third instance of the identical ordering mistake, caught
by a regression test rather than shipped and assumed fixed**: even
after fixing bug 2, a dedicated two-add-two-undo regression test
still failed — `canUndo` stayed `true` after what should have been a
full revert. `undo()`/`redo()` themselves had the same
capture-before-compaction ordering bug: each set `lastSnapshot` right
after restoring the previous layout, but *before* calling
`runCompaction()` — so if compaction then changed anything (the
restored layout not already being perfectly compacted is the normal
case, not an edge case), the length watcher's own later
`commitUndoPoint` call saw `props.layout` no longer matching that
stale `lastSnapshot` and pushed a spurious extra undo point. Fixed by
moving the `lastSnapshot` capture in both `undo()` and `redo()` to
after `runCompaction()` runs.

**Verification**: 4 new permanent regression tests added —
`compactItem`/`compactItemHorizontal` unit tests confirming a
non-finite starting coordinate resolves correctly rather than hanging
(vitest's own default timeout is the safety net if this regresses),
and a `GridLayout.spec.ts` test performing two `y: Infinity` additions
followed by two undos, confirming a full revert with `canUndo`
correctly `false` afterward — this last test is what caught bug 3.
Also re-ran the exact originally reported scenario end-to-end (5 adds,
5 undos) against the built docs site: no freeze, full revert, `canUndo`
correctly disabled. Full suite confirmed clean throughout: 598/598
unit tests (up from 594, the 4 new ones), all 59 e2e tests, typecheck.

### 106. A fresh code review found real, actionable issues — 4 `@ts-ignore`s replaced with precise casts, and `undo`/`redo` extracted into their own composable

Requested directly as a code review, not a bug report — a systematic
pass over test coverage, type-safety escapes, lint suppressions, and
file/function size, with fresh eyes rather than re-summarizing prior
findings.

**`breakpoints-helper.ts`'s 4 `@ts-ignore` comments** (`sortBreakpoints`,
`getBreakpointFromWidth`, `getColsFromBreakpoint`) all existed for the
same reason: `TBreakpoint` is a plain `string`, not a literal union, so
indexing `TBreakpoints`/`IColumns` (both specific-keyed objects) with
a `TBreakpoint`-typed value can't be narrowed without an explicit cast.
Replaced each with `breakpoints[key as keyof TBreakpoints]` (plus a
non-null assertion where the invariant that the key actually exists is
genuinely guaranteed — e.g. `a`/`b` in `sortBreakpoints`'s own
comparator come from `Object.keys(breakpoints)` itself, so a defined
value is certain even though TypeScript can't prove it structurally)
— restores real type-checking for everything else on each line,
rather than suppressing the whole line.

**4 composable context interfaces' own `emit: (...args: any[]) =>
void`** — tried narrowing to `(event: EGridLayoutEvent, ...args:
unknown[]) => void`, then to `(event: string, ...args: unknown[]) =>
void`; both broke real assignment at every actual call site
(`GridLayout.vue`/`GridItem.vue` passing their own real `emit` in),
since Vue's own `defineEmits`-generated type is a *union of call
signatures* (one per declared event, each with its own specific
payload types) — not a single, nameable function shape either
alternative could actually describe. Reverted to `any` as a
deliberate, now-documented exception (`useCrossGridDrag.ts`'s own
`IUseCrossGridDragContext.emit` carries the full explanation; the
other 3 point to it rather than repeating it) instead of an
unexplained one. Net effect on the project's own `npm run lint`
output: 48 problems → 44 (the 4 genuine `no-explicit-any` errors
resolved; the `@ts-ignore` fixes didn't change the count, since
`ban-ts-comment` was only a warning, not an error, on those 4 lines).

**Extracted `useUndoRedo.ts`** from `GridLayout.vue` — the review's own
finding on that file's size (1823 lines) named this block (~105 lines:
`undoStack`/`redoStack`/`canUndo`/`canRedo`/`commitUndoPoint`/`undo`/
`redo`) as a clean, self-contained candidate, alongside multi-select
(left inline for now — see `docs/ARCHITECTURE.md`'s new section for
the full account of what made this extraction non-trivial despite
looking simple at a glance: three pieces of plain internal state
(`lastSnapshot`/`dragStartSnapshot`/`resizeStartSnapshot`) that
`dragEvent`/`resizeEvent`/the length watcher/`onMounted` all needed to
touch, resolved by exposing named, purpose-specific methods
(`captureDragStart`/`commitDragEnd`, etc.) rather than the raw
variables, so the coupling gets encapsulated instead of just moved.
`GridLayout.vue` is now 1730 lines. Public API (`undo`/`redo`/
`canUndo`/`canRedo` via `defineExpose`) unchanged — verified via the
full existing undo/redo test coverage in `GridLayout.spec.ts` (no
changes needed to any of it) plus the full e2e suite, both passing
unchanged after the extraction.

### 106. Code review follow-through: `@ts-ignore`/`any` cleanup, `useUndoRedo` extraction, and closing two genuine coverage gaps

Requested directly, in order, following a code review pass.

**`@ts-ignore` → precise `keyof` casts**: `breakpoints-helper.ts` had 4
blanket `@ts-ignore` suppressions indexing `TBreakpoints`/`IColumns`
with a plain `string`-typed `TBreakpoint`. Replaced each with a
targeted `as keyof TBreakpoints`/`as keyof IColumns` cast — type
checking still applies to everything else on each line, only the one
genuine, unavoidable narrowing gap (a `string` used as a specific
object's key) is bypassed, not the whole expression.

**`any[]` emit types — attempted a real fix, then honestly reverted
it**: 4 composable context interfaces typed `emit` as
`(...args: any[]) => void`. Tried narrowing to
`(event: EGridLayoutEvent, ...args: unknown[]) => void`, then to the
broader `(event: string, ...args: unknown[]) => void` — both broke
real assignment at every actual call site in `GridLayout.vue`/
`GridItem.vue`, confirmed by typechecking, not assumed. Root cause:
Vue's own `defineEmits`-generated type is a union of call signatures
(one per event, each with its own specific payload), not a single
nameable function shape — no single parameter type is both narrow
enough to be useful and broad enough to accept every real overload.
Reverted to `any`, but as a documented, checked exception (an
explanatory comment plus `eslint-disable-next-line`) rather than a
silent one — net project-wide lint problems still dropped (48 → 43),
since the 4 real `no-explicit-any` errors these caused are gone,
replaced with a justified, visible exception instead.

**`useUndoRedo` composable extraction**: pulled `undoStack`/
`redoStack`/`canUndo`/`canRedo`/`commitUndoPoint`/`undo`/`redo` out of
`GridLayout.vue` into their own file, matching the precedent already
set by `useCrossGridDrag`/`useOutsideDrop`. The real complexity here
wasn't the extraction itself but the shared, mutable
`lastSnapshot`/`dragStartSnapshot`/`resizeStartSnapshot` state used
from *outside* the block being extracted (`dragEvent`/`resizeEvent`/
the length watcher/`onMounted`) — rather than exposing that raw state
directly, the composable exposes named, purpose-specific methods
(`captureDragStart`/`commitDragEnd`/`captureResizeStart`/
`commitResizeEnd`/`initLastSnapshot`/`commitFromLastSnapshot`) for
each external call site, keeping the internal state genuinely private.
Verified with the full unit suite, the dedicated undo/redo unit tests,
and live e2e runs of both the drag/resize suite and the undo/redo
e2e scenario specifically — not just a typecheck pass.

**Coverage**: investigated the lowest-coverage files directly rather
than guessing. Found and closed two genuine, previously-open gaps:

- `sort-helper.ts` had **zero direct unit tests** for
  `sortLayoutItemsByColRow` (the horizontal-compaction counterpart to
  `sortLayoutItemsByRowCol`, which did have its own) — only exercised
  indirectly via `compactLayoutHorizontal`. Added a full mirroring
  test suite, including its own tie-case branch. 91.66%→100%
  statements, 82.35%→100% branches.
- `alignment-helper.ts`'s 70% function coverage was 3 of 8 small
  inline `toX`/`toY` edge-combination callbacks inside
  `findSnapAdjustment` never being invoked (existing tests only hit
  left-to-left/right-to-left/top-to-top). Added tests for the
  remaining 5 combinations — caught and fixed 2 of my own test cases
  along the way where the test data accidentally made a *different*
  edge combination the closest match instead of the one intended,
  confirmed by actually running the tests rather than assuming the
  math was right. 70%→100% functions.
- A new test also closes a real, previously-untested behavior in
  `useGridItemKeyboard.ts`: keyboard-driven resize growth stopping at
  the grid's own `colNum`/`maxRows` boundary, distinct from a
  `minW`/`maxW` prop constraint — a third competing term in the same
  clamp expression that only two of three paths had a test for. One
  narrower branch in that same expression remains open, not fully
  isolated to a single clear cause — documented honestly as still
  open in `vitepress-docs/guide/coverage.md` rather than claimed fixed.

Project-wide: 98.55%/97.33%/98.7%/98.55% → 98.6%/97.59%/100%/98.6%
(statements/branches/functions/lines), 598 → 604 tests. Documented in
`vitepress-docs/guide/coverage.md`, updated with the current numbers
and an honest account of what's still open and why, not just what
changed.

### 107. Three small, contained lint fixes from a follow-up quality pass

Requested directly as items 1-3 of a broader list, in order.

- **`DOM.ts`'s `addWindowEventListener`/`removeWindowEventListener`**
  typed their callback parameter as `callback: () => any`. Checked
  every real call site first (both usages come from `GridLayout.vue`'s
  `onWindowResize`, itself typed `(): void`, and neither
  `window.addEventListener` nor the "no window" fallback path ever
  reads a return value) before changing to `callback: () => void` — a
  genuine type-safety fix, not a judgment call the way the emit-type
  `any` exception documented above is.
- **`vue/no-required-prop-with-default`**: `CustomCloseButton`'s `i`
  prop and `CustomDragElement`'s `text` prop were both typed as
  required (no `?` in their own `interface`) while also being given a
  `withDefaults` default — contradictory, since a prop a consumer must
  always supply shouldn't need a fallback value. Marked both `?` in
  their interfaces to match the sensible defaults they already had.
- **`no-prototype-builtins`** (5 instances, all in
  `keys-validator.ts`'s `isLayoutCorrectSize`): called
  `.hasOwnProperty()` directly on the object being validated, rather
  than the safer `Object.hasOwn()` this codebase already uses
  elsewhere (`breakpoints-helper.ts`'s `isBreakPointDefined`). Replaced
  all 5 to match.

Verified: typecheck clean, full unit suite (604/604) and every
directly-relevant test file re-run individually
(`DOM.spec.ts`, `CustomCloseButton.spec.ts`, `CustomDragElement.spec.ts`,
`keyValidator.spec.ts`) rather than only trusting the full-suite run.
Project-wide lint problems: 43 → 34 (all three targeted rule
categories now at zero instances, confirmed directly).

### 108. Code review follow-through, items 4-7: naming-convention renames, explicit return types, prefer-destructuring, and the `useMultiSelect` extraction

Requested directly, continuing the ordered list from finding #107.

**Naming-convention renames (4 errors)**: `IGridLayoutEventBus`,
`IGridItemEventBus`, and `IResizeEvent` were `type` aliases named with
the `I`-prefix (interface) convention instead of this project's own
`T`-prefix convention for types; renamed to `TGridLayoutEventBus`/
`TGridItemEventBus`/`TResizeEvent` across every file that imported
them (13 files total). The `ErrorMsg` enum didn't match the expected
`E[A-Z]` pattern either (the second character, `r`, is lowercase);
renamed to `EErrorMessage` across all 17 referencing files. Checked
first that neither was part of the public API (`components/index.ts`/
`core/index.ts`) — both are internal-only, so this wasn't a breaking
change for consumers. Confirmed no export or docs reference needed
updating beyond historical, already-past-tense mentions in
`docs/REFACTORING.md` itself.

**15 missing `explicit-function-return-type` errors**: 7 composables
(`useCrossGridDrag`, `useGridItemDrag`, `useGridItemKeyboard`,
`useGridItemResize`, `useOutsideDrop`, `useResponsiveLayout`,
`useUndoRedo`) each gained an explicit `IUse*Return` interface for
their own return shape, rather than leaving it inferred; 8 small
inline `toX`/`toY` callbacks in `alignment-helper.ts`'s
`findSnapAdjustment` (already found during the earlier coverage pass)
each gained a `: number` annotation.

**6 `prefer-destructuring` warnings**: fixed 4 of 6 (destructuring
assignment instead of individual property reads) in
`breakpoints-helper.ts`, `useGridItemResize.ts`, and
`native-interaction.ts` (2 instances). Left the remaining 2, in
`GridLayout.vue`'s `snapToGrid` adjustment (`x = adjustment.x;`/
`y = adjustment.y;`), deliberately as-is — each is a *conditional*
reassignment (only if the adjustment on that axis is actually
defined), not the unconditional case destructuring assignment
suits; forcing it here would read less clearly, not more, and these
two lines are already an accepted `no-param-reassign` exception for
the same underlying reason.

**`useMultiSelect` extraction**: pulled `selectedItemIds`/
`selectedItems`/`selectItem`/`deselectItem`/`toggleItemSelection`/
`clearSelection`/`pruneSelection`/`itemClickedHandler`/
`backgroundClickHandler` out of `GridLayout.vue`, mirroring the
`useUndoRedo` extraction's own precedent. The one real design
difference: `dragEvent`/`resizeEvent`'s own group-move/group-resize
logic reads `selectedItemIds` directly (`.has(id)`, iterating via
`Array.from(...)`) to apply a delta to every other selected item —
that logic stays in `GridLayout.vue` itself (it's part of the
drag/resize handlers, not selection management per se), so unlike
`useUndoRedo`'s fully-private internal state, this composable exposes
the raw `selectedItemIds` ref itself alongside the higher-level
methods, not everything wrapped behind named methods.

**Verification**: typecheck clean after every individual change (not
batched then checked once), full unit suite (604/604) after each
composable/rename group, and live e2e runs — the full
`drag-and-resize`/`touch-input`/`keyboard-accessibility` suites after
touching `native-interaction.ts` (19 tests), and the full
`advanced-features` suite (18 tests, covering every multi-select
scenario: click-select, Shift-click-additive, background-click-clear,
group move, group resize, a static passenger correctly not moving,
and keyboard-driven group move) after the `useMultiSelect` extraction
— not just a typecheck-and-assume pass.

**Net effect**: project-wide lint problems 43 → 13 (only
`no-param-reassign`/`vue/no-mutating-props` — both deliberate,
by-design patterns given this project's `v-model:layout` mutation
approach — plus 2 accepted `prefer-destructuring` exceptions and 1
pre-existing `no-unused-vars`/`ban-ts-comment` each remain).
`GridLayout.vue`: 1823 → 1631 lines across the `useUndoRedo` and
`useMultiSelect` extractions combined.

### 109. Two remaining small lint items — one revealed genuinely dead code

- **`layout-storage.ts`'s `no-unused-vars`**: `_moved` was flagged
  despite the underscore-prefix convention, since this project's
  `eslint.config.js` doesn't configure an `argsIgnorePattern`/
  `varsIgnorePattern` exempting it. Rather than changing that rule
  project-wide for one call site, added a targeted, justified
  `eslint-disable-next-line` — the variable is unused *by design*
  (destructuring specifically to exclude a field), not a mistake.
- **`move-helper.ts`'s `ban-ts-comment`**: swapped `@ts-ignore` for the
  suggested `@ts-expect-error` — which immediately failed typecheck
  with "Unused `@ts-expect-error` directive." This confirmed the
  original suppression was genuine dead code: the line it guarded
  never actually produced a type error in the first place, so the
  `@ts-ignore` was silently suppressing nothing. Removed the
  suppression comment entirely rather than keeping any form of it.
  Verified: typecheck clean with no comment at all, and
  `move-helper.spec.ts`'s own 14 tests confirm no behavior changed.

Project-wide lint problems: 13 → 11.

### 110. `dragEvent`/`resizeEvent` split into named helper functions — the last, highest-risk item from the code review

Explicitly flagged in the original review as higher-risk than the
`useUndoRedo`/`useMultiSelect` composable extractions, since splitting
an event-branching function carries more regression risk than pulling
out already-cohesive state. Approached accordingly: extracted one
cohesive sub-step at a time, as named **local helper functions within
`GridLayout.vue`'s own `<script setup>`** (not moved to a separate
file/composable) — deliberately, since both functions read and mutate
a large number of closure variables (`props`, `emit`, `placeholder`,
`isDragging`, `selectedItemIds`, `groupMoveStartPositions`/
`groupResizeStartSizes`, `eventBus`, `width`, `runCompaction`,
`updateHeight`, `commitDragEnd`/`commitResizeEnd`, `originalLayout`,
`clearAlignmentGuides`, `updateAlignmentGuides`, the cross-grid
handlers) — threading all of that through a composable's own context
object would have been a much larger, riskier change for the same
readability benefit. Verified after every single extraction (not
batched then checked once): typecheck, then the full unit suite.

**`dragEvent` (3 extractions, ~290 → ~209 lines)**:
- `applySnapToGridAdjustment` — the `snapToGrid` magnetic-snap
  adjustment, now a small pure-ish function returning the adjusted
  `{ x, y }` rather than reassigning them inline.
- `applyGroupMove` — `multiSelect`'s group-move delta application.
- `updateDragPlaceholderAndState` — placeholder/alignment-guide
  updates and the `isDragging` collision check.

**`resizeEvent` (3 extractions, ~150 → ~68 lines), mirroring the drag side**:
- `applyResizeSizeAndCollisionClamp` — the `preventCollision`-aware
  size clamp.
- `applyGroupResize` — `multiSelect`'s group-resize delta application.
- `updateResizePlaceholderAndState` — the resize counterpart to
  `updateDragPlaceholderAndState`.

**Verification**: typecheck and the full unit suite (604/604) after
each of the 6 individual extractions — not once at the end. As final,
comprehensive confirmation given this was the highest-risk item on the
list, ran the **complete** e2e suite (all 59 tests across every spec
file, not just the ones touching drag/resize directly) — all passed,
confirming the refactor is behaviorally identical to the original
despite the substantial structural change.

**Net effect**: `GridLayout.vue`'s two largest functions meaningfully
shrunk (dragEvent ~28%, resizeEvent ~55%), each now reads as a
sequence of named steps rather than one long interleaved block. Minor,
expected lint-count artifact: the same already-accepted
`no-param-reassign` pattern on `dragEvent`'s own `x`/`y` parameters now
shows at two points (inside `applySnapToGridAdjustment` and at its
call site) instead of one — not a new kind of issue, the same accepted
pattern appearing twice instead of once. Project-wide lint problems:
11 → 13 for exactly this reason.

### 111. Dev dependency upgrade pass — 3 dead dependencies removed, 2 hard blockers found and correctly held back, everything else upgraded and verified

Requested directly: "fix dev dependency versions," working through `npm
outdated`'s full list methodically, one package (or tightly-coupled
group) at a time, verifying fully — typecheck, full unit suite, and
for the higher-risk changes, the complete e2e suite — before moving to
the next, rather than bumping everything at once and debugging
whatever broke.

**3 genuinely dead devDependencies removed**, confirmed unreferenced
anywhere in the project (source, config, or npm scripts) before
removing, not assumed:
- `ttypescript`, `sass-loader` — leftover from an earlier, non-Vite
  build setup; `npm outdated` even showed `ttypescript` as a
  "downgrade" to 1.5.15, itself a sign of an abandoned/confused
  package.
- `@babel/types` — a direct devDependency with zero references
  anywhere; this project's Vite/esbuild toolchain never needed Babel.
- `eslint-plugin-import` (found while upgrading ESLint, not part of
  the original `npm outdated` list) — registered as a plugin, but
  every single `import/*` rule was explicitly set to `'off'`,
  confirmed via `grep` before removing.
- `eslint-plugin-import-quotes` (found the same way) — a
  single-version-ever (`0.0.1`), unmaintained package using
  `context.getSourceCode()`, an API ESLint 10 removed entirely
  (confirmed by the exact runtime crash). Also functionally redundant:
  `.prettierrc` already has `"singleQuote": true`, already enforced on
  imports too via `eslint-plugin-prettier`.

**Two hard blockers, correctly identified and held back rather than
forced past**:
- **TypeScript 7** breaks `vue-tsc` outright — confirmed directly:
  `vue-tsc` tries to import `typescript/lib/tsc`, a path TypeScript 7
  no longer exports at all (`ERR_PACKAGE_PATH_NOT_EXPORTED`). Landed
  on TypeScript 6.0.3 instead — a real, verified one-major upgrade
  from 5.9.3, and confirmed `vue-tsc@latest` (3.3.7) works fine
  against 6.0.3 specifically (the 7.x failure was TypeScript's own
  restructuring, not a `vue-tsc` version problem — re-tested this
  distinction directly rather than assuming both were blocked
  together).
- **`vite-plugin-dts@5.x`** (now a thin wrapper around a separate
  `unplugin-dts` package) silently ignores its own configured
  `outDir: 'dist/types'` and writes declaration files mirroring the
  source tree directly under `dist/` instead — confirmed by actually
  inspecting the build output, not assumed from a changelog. This
  would have broken `package.json`'s own `"types"`/`"exports"` fields
  pointing at `dist/types/...`, and so every TypeScript consumer's
  ability to resolve this package's types at all. Caught before
  publishing anything: `npm run check:package-install` (a real pack →
  install-into-scratch-dir → import smoke test) failed after the
  upgrade and passed again once reverted to `vite-plugin-dts@4.5.4` —
  confirmed with the actual verification script this project already
  has, not just a visual inspection of `dist/`.

**A genuine Vitest 4 breaking change, fixed rather than worked
around**: `vi.fn().mockImplementation(...)` used to work as a
stand-in constructor for `ResizeObserver` in 3 test call-sites across
`GridLayout.spec.ts`/`GridItem.spec.ts` (a mock function returning an
object, called via `new`, is valid plain JS — `new` uses the returned
object instead of `this`). Vitest 4's `vi.fn()` is no longer
constructable at all ("... is not a constructor"). Replaced all 3 with
real classes, matching the pattern `tests/setup.ts`'s own
`ResizeObserverMock` already used.

**A pre-existing style inconsistency, caught by the ESLint 10
upgrade**: `compactor.ts`'s `switch (compactType)` had a space after
`switch` — this project's own established convention (`if(`, `for(`
throughout) has none. Fixed to match.

**A genuine new Stylelint finding**: the newer `stylelint-config-*-scss`
packages added `property-no-deprecated`, which flagged real use of the
deprecated CSS `clip` property in `GridItem.vue`'s own
`.visually-hidden` (screen-reader-only) pattern. Replaced with the
modern, non-deprecated `clip-path: inset(50%)` — the standard
equivalent for this exact pattern — and re-verified via the
`keyboard-accessibility` e2e suite that the visually-hidden behavior
itself is unaffected. Also removed one now-dead Stylelint rule
reference (`scss/at-import-partial-extension`, renamed/removed
upstream in favor of the `-allowed-list`/`-disallowed-list` variants
this project's own config already had one of).

**Net effect**: `npm outdated`'s full list closed out except the two
documented, correctly-held-back blockers above. `npm audit` (including
dev dependencies) dropped from 22 to 3 vulnerabilities — a real fix,
not incidental — the semantic-release upgrade resolved a transitive
`tar` CVE. The remaining 3 are `vitepress`'s own bundled `vite`, which
even `vitepress`'s latest *stable* release still carries — fixable
only by adopting an unstable `vitepress@2.0.0-alpha`, deliberately not
done. Verified throughout: typecheck, full unit suite (604/604) after
every individual package group, the complete e2e suite (59/59) after
both Vite and the Vitest `ResizeObserver` fix specifically, a full
library + `/core` + docs build, and `npm run check:package-install`
(the project's own pack-and-install smoke test) as the final,
strongest confirmation the published package itself still resolves
correctly.

### 112. Reported issues across 4 examples: a real z-index regression, a genuinely uninteresting example layout, and one investigated-but-not-reproduced resize claim

Reported directly, as a batch of 5 numbered issues against specific
examples.

**Issue 1 (example 1, resize direction)**: reported as "resizing left/
left-top/left-bottom moves the right side, which it shouldn't."
Reproduced directly rather than assumed — traced the actual pixel
math end to end (`edges.left` handling in `useGridItemResize.ts`,
`pixelsToGridX`, the live `resizing.value` reflected during
`createStyle()`) with temporary debug logging, then via the committed
grid-unit values in the actual rendered example. Confirmed the
resize-direction math itself is correct: a left-edge or left-top
corner resize on an item with room to grow correctly moves the left
edge while the right edge's own grid-unit position (`x + w`) stays
exactly unchanged. The first two reproduction attempts looked buggy
but were test-methodology errors on my own part, not real bugs — the
leftmost item in the example is already at grid `x:0` and has nowhere
to go left, so `pixelsToGridX`'s own clamp (correctly) holds it there
while width still grows, which *looks* like "growing rightward" but
is boundary-clamping behavior, not the reported direction bug. Not
reproduced with a properly-positioned item and realistic drag
distances.

**Issue 2 (example 7, responsive breakpoints)**: reported as needing
a full recreation with "12 columns 3 rows." The original layout was 8
uniform 1×2 squares in a single row — not wrong, just uninteresting,
and it never demonstrated the library's own default breakpoint/column
behavior meaningfully. Replaced with a proper 3-row dashboard layout
(a full-width header band, three equal cards, two asymmetric wider
cards) at the 12-column level. Also found and fixed a real problem
while verifying this: this example's own container (bounded by the
docs theme's own layout, not the browser viewport) never exceeds
~650px wide, meaning the library's own *default* breakpoints
(`lg`/`xl`/`xxl` all requiring 1200px+) were completely unreachable
within it — every example screenshot taken before this fix, at any
viewport size, showed "xs", never anything higher. Added an explicit,
smaller `breakpoints`/`cols` pair scaled to this example's own actual
container range, confirmed by measuring it directly (not guessed),
so the full range including 12 columns is now genuinely reachable and
demonstrated — re-verified visually at three different sizes, showing
`xxl` (12 cols), `sm` (6 cols), with correct reflow between them.

**Issues 3-4 (examples 12 and 22, cross-grid drag z-index) — a real,
confirmed regression from an earlier fix**: reported as "the dragged
item is located under the target grid, not on top." Reproduced
directly with a mid-drag screenshot: the dragged item genuinely
rendered behind the target grid's own background. Root cause: the
`isolation: isolate` fix on `.vue-grid-layout` (finding #101, a real
fix for a real static-item paint-order bug) had an untested side
effect — every grid became its own stacking context, so two sibling
grids with no z-index of their own now stack purely by DOM order. A
cross-grid-dragged item stays a DOM child of its own *source* grid the
entire drag, so once the pointer moved over a *target* grid rendered
later in the DOM (the standard side-by-side layout every cross-grid
example uses), the dragged item lost that stacking comparison and
painted behind it. Fixed by bumping the *source* grid's own z-index,
via a new CSS class bound to `isDragging` (already tracked for the
placeholder), only while a drag is actually in progress within it —
raising that one grid's stacking context above its siblings carries
the dragged item up with it, with zero effect once the drag ends and
the class is removed. Confirmed the fix both resolves the bug (visual
re-verification) and that a regression test actually catches it:
temporarily reverted the class binding and confirmed the new permanent
e2e test (`drag-and-resize.spec.ts`, using `elementFromPoint` at the
dragged item's own center — the real question of what actually paints
there, same technique as the existing static-item paint-order test)
fails without the fix and passes with it restored.

**Issue 5 (example 44, gridlines)**: requested directly — the library
already has a `showGridLines` prop (a single boolean, rendering the
underlying column/row structure via a `::before` pseudo-element
background), just never wired into this example. Added as a new
toggle control (defaulting to on, since this example is specifically
about visualizing grid geometry), and mentioned in the description.
Verified directly, not assumed: the faint gridline pattern is only
visible in the small uncovered strip where opaque items don't fully
occupy the container (the `margin: 5px`/`calc(100% - 5px)` inset the
pseudo-element already has) — confirmed present there via a cropped,
zoomed screenshot, rather than concluding "not visible in a screenshot"
meant broken.

Verified throughout: typecheck, full unit suite (620/620), and the
complete e2e suite (59/59, run against the real dev server) after the
z-index fix specifically, since it touches drag/stacking broadly, not
just the two examples that surfaced it.

### 113. A full prop-coverage audit found one genuine gap: `undoHistoryLimit` had no live example

Requested directly: "does all props have an example in vitepress?"
Answered by cross-referencing every prop in both `IGridLayoutProps`
(42 props) and `IGridItemProps` (27 props) against actual attribute
bindings in the 45 example `.vue` component files — not prose mentions,
which a first pass showed give false positives (e.g. a naive text
search for "responsive" matched all 45 files, since every example's
own import path, `vue-ts-responsive-grid-layout`, contains that
substring). Confirmed the corrected, attribute-binding-only
methodology against a spot check (`margin` showing exactly 1 file,
verified directly to be example 44, the one this project's own recent
work added it to).

**One genuine gap found**: `undoHistoryLimit` was mentioned in example
43's own description ("keeps up to `undoHistoryLimit` cloned layout
snapshots") but never actually bound on the `<GridLayout>` tag —
relying silently on the library's own default (50), with no
interactive control demonstrating a custom, smaller value.

**Fix**: added an `ExampleNumberField` control, defaulting to `3` (well
below the library's own default of 50) specifically so the cap itself
is easy to observe without needing many clicks. Verified behaviorally,
not just visually: added 5 items, then undid repeatedly — confirmed
`canUndo` becomes `false` after exactly 3 undos (matching the limit),
leaving 5 items rather than reverting to the original 3, since the
oldest 2 undo snapshots had already been dropped to stay under the cap.

Updated alongside the example itself: the markdown's own displayed
code snippet (previously showing the pre-fix version, without the new
control, which would have been the same "displayed code doesn't match
the real implementation" mismatch caught and fixed for example 30
earlier — checked for it directly this time rather than assuming),
its own prose bullet describing `undoHistoryLimit`, and
`vitepress-docs/features/index.md`'s own undo/redo feature bullet.
`FEATURES.md` (root) and `vitepress-docs/api/interfaces-props.md`
already correctly documented `undoHistoryLimit` and needed no changes.

### 114. Two follow-ups from the "what's next" review: a stale roadmap page, and the RTL + in-progress-resize test gap

**The `vitepress-docs/guide/roadmap.md` sync.** This page had drifted
significantly from `ROADMAP.md` (the source of truth) — it still
listed ~7 items as "suggested" that were already shipped and marked
done there: the layout-level `enableEditMode` toggle,
`rearrange()`/`compactNow()`, per-item `autoHeight`, `duplicateItem`,
undo/redo, named layout presets, and the blocked-move feedback hook.
Beyond those, its own "Recently completed" list was missing many newer
shipped items entirely (multi-select, snap-to-grid/alignment guides,
`ariaLabels`, the custom resize-handle slot, `scrollToItem`/
`focusItem`, SVG export, `ILayoutItem<TMeta>`, and more). Rewrote both
sections from `ROADMAP.md`'s own current state rather than patching
individual bullets, and corrected a stale "98%+ coverage" claim to
match the actual current figure. The one genuinely-dropped suggestion
found during this pass ("fixed-width/fixed-aspect items beyond
`preserveAspectRatio`") isn't in `ROADMAP.md`'s own current list at
all — left out here too rather than reintroduced, since it's most
likely already superseded by that prop rather than silently lost.

**The RTL + in-progress-resize e2e gap.** Flagged during the coverage
session as the single most significant remaining test gap: zero
end-to-end tests exercised RTL (`isMirrored`) combined with an actual
pointer-driven resize *in progress*, only RTL's static positioning and
LTR's resize direction separately, never both together, and never
mid-drag specifically (only the post-`resizeend` committed position).
Added a real pointer-driven resize test with `isMirrored` on,
asserting the live visual *during* the drag (not after `mouse.up()`)
— confirmed the mirrored anchor edge (the screen-right edge in RTL,
the reverse of LTR) moves correctly while the other edge stays fixed.
Confirmed the test is genuinely meaningful, not just passing
coincidentally: temporarily forced the LTR code path regardless of
`renderRtl.value` and confirmed the test fails (wrong edge, off by the
full drag distance) before restoring the correct logic and confirming
it passes again.

Verified throughout: typecheck, full unit suite (620/620), and the
complete e2e suite (61/61, run against the real dev server).

## Structural: both `GridItem.vue` and `GridLayout.vue` were doing too much — done

**`GridItem.vue`** — checked directly rather than assumed. This section
originally suggested extracting drag geometry, resize geometry, and
interact.js wiring out of `GridItem.vue` into their own composables.
All three have happened since: `useGridItemDrag.ts`, `useGridItemResize.ts`,
and `useGridItemKeyboard.ts` now own that logic, and `GridItem.vue`
itself has zero direct `interact(...)` calls left — every one lives in
the composables, confirmed with a direct grep rather than assumed from
the file structure. `GridItem.vue` is 1,143 lines today (grown from the
1,345 this section originally cited, despite the extraction, since
substantial new functionality — cross-grid drag, outside-drop
awareness, keyboard accessibility, the border-radius cascade — has been
added in the same file since); the composable split kept that growth
from being worse than it would have been in one undivided file, even if
it doesn't show up as a smaller absolute line count.

**`GridLayout.vue`** — the item this section had left as "still
genuinely open": `allowCrossGridDrag`'s registry/handoff logic and
`allowOutsideDrop`'s native-drag-event listeners were still implemented
directly in the component, unlike `GridItem.vue`'s already-completed
split. Extracted into `composables/useCrossGridDrag.ts` and
`composables/useOutsideDrop.ts` respectively — see finding #68 for the
full account, including the real type-narrowing issues the extraction
surfaced and the risk-mitigation approach taken (re-running the full
test suite, and the dedicated 9-test cross-grid spec specifically,
after each of the two extractions rather than only at the end). No
regressions: 393/393 tests passing both before and after, coverage
essentially unchanged (98.64% → 98.67%). `GridLayout.vue` is 1,175 lines
now (down from 1,151 at the point this was flagged open, despite two
new features — `scrollToItem`/`focusItem` and grid line dynamic
sizing — landing in the same file during the same work; without the
extraction it would be considerably larger).

## Type safety

**Done** — checked directly rather than assumed stale. The nine `any`
usages across `GridItem.vue`, `useInstance.ts`, `core/helpers/utils.ts`,
and `validators/keys-validator.ts` this section originally flagged are
gone: `grep`-ing all four files for `: any` or `as any` now returns zero
matches. `dragOption`/`resizeOption` are typed
`Partial<DraggableOptions>`/`Partial<ResizableOptions>` (see finding #54
for when the last of this — `event.edges`'s typing specifically — was
closed), and `styleObj` is `Record<string, string | number>`, not `any`.

## Naming

**Done** — the `gridIemTypeHelpers.ts` typo this section flagged no
longer exists under that name at all; it was fixed (to
`gridItemTypeHelpers.ts`) and later renamed again to kebab-case
(`grid-item-type-helpers.ts`) as part of the broader naming sweep — see
finding #50.

## What's already good (don't touch)

- The validator modules (`layout-validator.ts`, `keys-validator.ts`,
  `margin-validator.ts`, `breakpoint-validator.ts`) are small, pure, and each
  have a matching spec file — good shape, worth using as the template for
  the composables suggested above.
- `collision-helper.ts`, `move-helper.ts`, `sort-helper.ts` are already cleanly
  separated pure functions independent of the component tree. The
  `GridItem.vue` split above should aim for this same shape.
