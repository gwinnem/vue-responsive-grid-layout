# Feature Recommendations

Forward-looking recommendations, not a task list — unlike
`docs/REFACTOR_STRATEGY.md` (process/quality) and `docs/REFACTORING.md`
(bugs found in existing behavior), everything here is *new capability*
nobody has committed to building yet. Grounded in what actually exists in
the codebase today, not just brainstormed in the abstract — several items
below were confirmed by reading the relevant source before being listed.

See [`ROADMAP.md`](../ROADMAP.md) at the project root for a shorter,
more discoverable summary of these same suggestions plus a few newer
ones — this file is the fuller version, with the code sketches and
source-code references that don't fit there.

## Found while researching this list: a "free" feature hiding in plain sight — done

**Auto-scroll while dragging near a container edge.** `GridItem.vue`
imports `@interactjs/auto-scroll` — registering the plugin with
interact.js — but never actually configured it (no `autoScroll: {...}`
option passed to either `.draggable()` or `.resizable()` in
`useGridItemDrag.ts`/`useGridItemResize.ts`). Finished it rather than
removed the import, since the capability was already fully loaded and
just needed configuring: an `autoScroll` prop on `GridItem` (default
`false`) sets a convenience `{ enabled: true }` default on both. Spread
in *before* `dragOption`/`resizeOption` (not after), so a consumer's own,
more specific `autoScroll` configuration inside either of those — which
was already reachable this whole time, since both are typed against and
merged into interact.js's own option types, just never documented as
covering this specific plugin — still wins if both are set.

## High-value, moderate effort

### 1. Generic `ILayoutItem<TMeta>` — done

`ILayoutItem` (`src/components/Grid/layout-definition.ts`) was a fixed
shape — `i`, `x`, `y`, `w`, `h`, plus the interactivity overrides. A
consumer wanting to attach a widget type, title, or config object to
each layout item (an extremely common real-world need for anything
resembling a dashboard builder) had to fight the type system to do it —
either an unsafe cast, or maintaining a separate parallel array keyed by
`i`. Implemented exactly the sketch this section proposed:

```ts
export interface ILayoutItem<TMeta = unknown> extends ILayoutItemRequired {
  isDraggable?: boolean;
  isResizable?: boolean;
  isStatic?: boolean;
  maxH?: number;
  maxW?: number;
  minH?: number;
  minW?: number;
  moved?: boolean;
  data?: TMeta;
}
```

Purely additive, confirmed rather than assumed: existing
untyped/unparameterized usage keeps working exactly as before (`TMeta`
defaults to `unknown`, and a full typecheck across the entire codebase
came back clean after the change) — `TLayout`/`TLayoutItem` were made
generic too, threading the parameter through, matching the "would need"
note this section originally flagged. One real fix needed along the way:
`layout-validator.ts`'s type-checking loop indexed its reference shape
object with `keyof ILayoutItem`, which now includes `data` — a key that
object never declared, since there's no single correct `typeof` for an
arbitrary payload. The runtime behavior needed no change at all (the
existing `validLayout[k] ? ... : true` fallback already correctly skips
type-checking any key the reference shape doesn't declare, `data`
included), just a type annotation fix to let TypeScript see that.

### 2. A first-party persistence helper — done

[v-model & save/load layout](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/19-example.md)
used to show only the DIY pattern
(`localStorage.setItem(key, JSON.stringify(layout.value))`), with every
consumer re-implementing the same few lines, including remembering to
strip the internal `moved` field (set by the compaction/collision
helpers, not meant to round-trip through storage — see `ILayoutItem`'s
doc comment) and handling a malformed/missing stored value gracefully.

**Built both options this section weighed** rather than picking one:
`serializeLayout(layout)`/`deserializeLayout(json)` as the pure,
storage-agnostic functions (works with any backend, not just
`localStorage`, and reuses the same `layoutValidator` `GridLayout`
itself uses at mount for shape-checking on load, rather than a
separately-maintained set of checks), and `useLayoutStorage(key, layout,
options?)` as a composable wrapping them for the common case — auto-load
on creation by default, opt-in debounced auto-save via `autoSave: true`,
any `Storage`-compatible backend via the `storage` option. The example
above now uses the composable instead of the manual pattern. See
`docs/REFACTORING.md` for implementation notes, including the SSR-safety
guard applied consistently with the rest of the library (see #51 in that
same file) and the debounce design decision to avoid write-amplification
during an actively-dragged item. `useLayoutPresets` (`ROADMAP.md`'s
"Named layout presets" item) builds directly on
`serializeLayout`/`deserializeLayout` for the several-named-arrangements
case, rather than duplicating the serialization logic.

### 3. A Nuxt module

Already flagged as "open" in the
[roadmap](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/guide/roadmap.md).
Given SSR is a real gap, a proper `@nuxt/module` wrapper should come
paired with an actual SSR audit, not just a thin Nuxt-specific wrapper
around internals nobody's checked. One concrete instance this
recommendation flagged **has since been found and fixed** (see
`docs/REFACTORING.md` #51, confirmed with a real
`@vue/server-renderer` render against the built package, not just
reasoned about): `GridItem.vue`'s `isAndroid` was a plain
`computed(() => navigator.userAgent...)`, read directly in `classObj`,
bound via `:class` in the template — Vue's SSR renderer evaluates every
binding needed to produce the initial HTML, including computeds
feeding into `:class`, so this threw `navigator is not defined` in any
Node.js SSR context (Node < 21 specifically — this sandbox's own Node
22 has an experimental `navigator` global that masked the bug on first
attempt to reproduce it). Now guarded the same way
`core/helpers/DOM.ts`'s `addWindowEventListener` already was via
`hasWindow()`. This was one specific instance, found by checking a
specific tip — **not** the exhaustive audit this recommendation is
actually about; a real SSR audit for a Nuxt module would still need to
systematically check every other `window`/`document`/`navigator`
access in the codebase, not just this one already-flagged spot.
Meaningfully widens the addressable audience for a library like this,
since dashboard-style apps are exactly where Nuxt/Vue overlap heavily.

## Interesting, higher effort

### 4. Swap-on-drag collision mode

An alternative to the current push-down/push-aside compaction —
dragging item A onto item B swaps their positions instead of shoving B
out of the way. Common in tile-based dashboard UIs (most "customizable
widget grid" consumer products default to this, not push-compaction).
Would sit alongside `preventCollision`/`horizontalShift` as a third
collision-handling mode on `GridLayout`, likely a
`collisionMode: 'compact' | 'prevent' | 'swap'` prop rather than another
standalone boolean, given the existing two are already somewhat
overlapping/interacting props (see `docs/REFACTORING.md`'s notes on
`preventCollision` combined with other modes for related caveats worth
re-reading before designing this).

### 5. Multi-select + group move/resize

Shift-click or a drag-select rectangle to select several items, then move
or resize them as a unit. This is the single biggest interaction-model
addition on this list — it doesn't fit cleanly into the current
per-`GridItem`-owns-its-own-drag architecture (see
`docs/ARCHITECTURE.md`), where each item independently drives its own
interact.js instance and reports progress up via the eventBus. A
selection concept fundamentally has to live on `GridLayout` (which items
are selected is layout-level state, not item-level), and a *group* drag
needs to coordinate multiple items' composables moving in lockstep rather
than each firing its own independent `dragEvent`. Real design work, not a
bolt-on — recommend a design doc / RFC before implementation given the
architectural surface area this touches.

### 6. Alignment/snap guides during drag — done

Figma-style lines when a dragged/resized item's edge aligns with
another item's edge. Implemented as grid-unit-based (not pixel-based)
comparison — an alignment exists whenever the active item's left,
right, top, or bottom edge lands on the same grid coordinate as
another item's edge, independent of `colWidth`/`rowHeight`/`margin`
(which only affect where the guide line *renders*), and not restricted
to same-side matches (left-to-right counts, not just left-to-left).
`showAlignmentGuides` (default `false`) gates the feature entirely —
confirmed the computation is skipped, not just the rendering, when it's
off, so there's no cost for consumers who don't enable it.

**A real bug caught before it shipped, not assumed away**: the first
implementation attempt fed the drag call site's placeholder-mirrored
`x`/`y` (`l.x`/`l.y`) into the alignment check, which turned out to
still hold the item's *pre-drag* position at that point in the
function — `moveElement()`, further down, is what actually updates
`l`. A test asserting the *specific* expected guide (not just "some
guide appeared") caught this immediately; fixed by using the incoming
`x`/`y` parameters directly instead. The equivalent resize call site
was checked against the same risk and confirmed already correct
(`l.w`/`l.h` are genuinely updated before that placeholder assignment),
with its own test rather than assumed safe by analogy.

A second bug from the same implementation pass, caught by the existing
test suite rather than a new test written for this feature specifically:
the pixel-conversion computed called `calcColWidth` unconditionally on
every render (including the vast majority with zero active guides, and
every render before the container's first real measurement), and
`calcColWidth` throws on an unmeasured/zero width — breaking most of
this file's *other* tests as a side effect. Fixed by short-circuiting
before that call whenever there's nothing to render or the container
isn't measured yet.

See [Alignment guides while dragging](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/26-example.md).

## Smaller, lower-risk polish

### 7. Configurable transition duration/easing — done

Was hardcoded in three separate places, not one — `GridItem.vue`'s scoped
styles set `transition: all 200ms ease` on the base rule, plus its own
independent `transition-duration: 400ms` for the `.css-transforms`
variant and `100ms` for the drag placeholder, none of them overridable.
Added `transitionDurationMs`/`transitionTimingFunction` props on
`GridLayout`, applied via CSS custom properties
(`--grid-transition-duration`/`--grid-transition-timing`) inherited
naturally by every `GridItem` — no eventBus cascade needed, unlike most
other layout-level defaults, since CSS custom properties already
inherit through the DOM. All three previously-independent values now
reference the same pair of variables, unifying what this section's own
framing already treated as an inconsistency rather than a deliberate
ratio worth preserving — see `docs/REFACTORING.md` #58 for the full
account, including a real default-behavior change worth knowing about
(the CSS-transform-positioned item and the drag placeholder previously
animated at 400ms/100ms respectively; both are 200ms by default now)
and a design problem the first implementation attempt didn't get right
initially (a naive per-rule fallback silently never took effect, since
`GridLayout` always sets the CSS variable explicitly). See
[Configurable transition duration & easing](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/24-example.md).

### 8. A slot for custom drag-placeholder content — done

The drag placeholder (`.vue-grid-placeholder`, the hidden `GridItem`
`GridLayout` shows while `isDragging` is true — see
[Styling → GridLayout](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/components/css-grid-layout.md))
was always a plain colored box. Added a named `#placeholder` slot,
rendered inside the placeholder `GridItem`'s own default slot — content
layers on top of the placeholder's existing background/sizing, the same
way a regular item's own slot content sits inside its background rather
than replacing it. Exposes two scoped slot props: `placeholder` (the
current `{ x, y, w, h }`, updating live during a drag) and `isDragging`.
`v-show`, not `v-if`, still governs visibility — a consumer's slot
content is present in the DOM regardless of whether a drag is actually
in progress, matching how the element itself already worked, so a test
checking the slot renders doesn't need to simulate an actual drag first.
See [Custom drag-placeholder content](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/25-example.md).

### 9. `GridLayout.scrollToItem(id)` / `focusItem(id)` — done

Pairs naturally with the keyboard support in `useGridItemKeyboard.ts`
(see `docs/ACCESSIBILITY.md`) — useful for "jump to/announce the
newly-added widget" UX after a programmatic `addItem()`-style flow (see
[Add or remove items](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/10-example.md)),
and for restoring focus sensibly after a keyboard-driven action that
removes or relocates the currently-focused item.

Located via a `data-grid-item-id` attribute added to `GridItem`'s own
root element (matching its `i` prop) — needed since `GridLayout` had no
existing way to map an id to a DOM element. Scoped to the calling grid's
own container (`refsLayout.value.querySelectorAll(...)`, not a global
`document.querySelector`), so two grids on the same page reusing an id
(a plausible `allowCrossGridDrag` scenario) don't cross-match each
other's elements — verified with a test mounting two grids sharing an
id and confirming only the intended one receives focus. Both are no-ops
(not throws) when the id doesn't match any currently rendered item,
covering the exact "called right after adding/removing that same item"
sequence this was built for.

See [scrollToItem & focusItem](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/27-example.md).

### 10. Localizable UI/ARIA strings

Found while scanning for anything not yet listed here, not something
already on anyone's radar. Every piece of user-facing text is currently
a hardcoded English literal: the close button's visually-hidden label
and `aria-label` (`"Close"`, in both `GridItem.vue`'s built-in button and
`CustomCloseButton.vue`), and the keyboard-instructions text
(`"Press arrow keys to move."` / `"Press shift plus arrow keys to
resize."` in `GridItem.vue`). A screen-reader user on a non-English
locale hears English regardless of the consuming application's own
language — every other piece of this library respects the consumer's
configuration, but this text doesn't.

Full i18n infrastructure would be overkill for a grid layout library —
consuming applications almost always already have their own i18n
solution (vue-i18n or otherwise) and just need a way to *provide*
translated strings, not a new translation system bundled in. The
lower-risk shape: expose these as props with the current English
copy as the default (`closeButtonLabel`, `moveInstructionsText`,
`resizeInstructionsText`, or similar), so a consumer wires them through
their own i18n call (`:close-button-label="t('grid.closeButton')"`)
without this library needing to know anything about *how* translation
happens.

### 11. Actual snap-to-grid during drag, distinct from `showAlignmentGuides` — done

Implemented as `snapToGrid`/`snapThreshold` (not `snapToAlignmentGuides`,
the name this section originally floated — `snapToGrid` reads more
clearly against `showAlignmentGuides`'s own naming once both actually
existed side by side). A new `findSnapAdjustment` helper in
`alignment-helper.ts`, alongside `findAlignmentGuides` rather than a
parameterized version of it — the two have different return shapes for
different purposes (every alignment found, for rendering guide lines,
vs. a single best x/y adjustment, for actually moving the item) that
would otherwise need awkward overloads to express. Reassigns the
incoming drag-target x/y directly inside `dragEvent()`, before anything
else reads them, so both the live placeholder during `dragmove` and the
actual committed position on `dragend` see the same, already-snapped
value.

### 12. A grid-to-image export utility — done

Implemented as `exportLayoutAsSvg()` — the dependency-free SVG option
this section weighed, not the `html2canvas`-style wrapper, since the
former adds zero bundle-size cost and needs no new runtime dependency,
at the cost of drawing each item as a labeled rectangle from layout
data rather than a true screenshot of arbitrary custom slot content.
Takes the same `colNum`/`rowHeight`/`margin` a real grid would, plus an
explicit `containerWidth` (there's no DOM element for a standalone
function to measure, unlike `GridLayout` itself). See
[Export layout as SVG](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/28-example.md).

## Suggested next step

Everything on this list is done now except the three genuinely large or
open-ended items: multi-select (#5) — the item most likely to reshape
the architecture if attempted, worth a design discussion before code,
not a first PR — a Nuxt module (#3), needing an actual SSR audit rather
than just a module wrapper, and swap-on-drag (#4). Localizable UI/ARIA
strings (#10, in `ROADMAP.md`) is the smallest remaining item if a
low-risk starting point is wanted again.
