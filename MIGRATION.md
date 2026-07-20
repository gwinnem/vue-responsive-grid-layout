# Migration Guide

## Unreleased: `verticalCompact` replaced by `compactType`

**One breaking change**: the `verticalCompact: boolean` prop
(`GridLayout`) has been replaced by `compactType: ECompactType` — a
single enum-valued prop selecting one of five built-in compaction
strategies, rather than a single boolean covering only two of them.
Modeled on `react-grid-layout` v2's own built-in compactor set.

**Exact mapping:**

```ts
// Before
verticalCompact: true   // (the default)
verticalCompact: false

// After
compactType: ECompactType.VERTICAL  // (the new default — same value)
compactType: ECompactType.NONE
```

`ECompactType` is exported from the package root (and from
`vue-ts-responsive-grid-layout/core`):

```ts
import { ECompactType } from 'vue-ts-responsive-grid-layout';

enum ECompactType {
  VERTICAL,           // items float up (the default) — was `verticalCompact: true`
  HORIZONTAL,         // items float left — new, no equivalent existed before
  NONE,               // items stay exactly where placed — was `verticalCompact: false`
  VERTICAL_OVERLAP,   // every item moves straight to y:0, ignoring collisions — new
  HORIZONTAL_OVERLAP, // every item moves straight to x:0, ignoring collisions — new
}
```

**What's unaffected**: `horizontalShift` (a separate, still-supported
prop controlling which direction a *colliding* item gets shifted
during an active drag — not a compaction strategy, and not touched by
this change) keeps working exactly as before. The `compactor` prop
(pluggable custom compaction) is unaffected in shape — its context
object's own `verticalCompact: boolean` field is now `compactType:
ECompactType` instead, matching the same rename. `scrollToItem`/
`focusItem` are now `async` (see `CHANGELOG.md`'s Fixed section) —
existing fire-and-forget calls are unaffected, but code awaiting or
relying on a synchronous `void` return should account for the new
`Promise<void>` return type.

If you were only ever setting `verticalCompact: true` (the default) or
not setting it at all, **no code changes are required** beyond
removing any explicit `verticalCompact: true` (harmless if left in
place — the prop is simply unused now, TypeScript will flag it as an
unknown prop if strictly typed). If you were setting
`verticalCompact: false`, replace it with
`compactType: ECompactType.NONE`.

## Upgrading from 1.x to 2.0.0

**One breaking change**: `interact.js` was removed entirely, replaced
with a native, Pointer Events-based drag/resize engine
(`src/core/helpers/native-interaction.ts`) with zero third-party
runtime dependency for it. See `docs/REFACTORING.md` for the full
rationale and `docs/BUNDLE_ANALYSIS.md` for the measured effect (a 54%
gzip size reduction).

**What's actually removed:**

- **`dragOption`/`resizeOption` props** (`GridItem`) — these merged
  extra options directly into interact.js's own `.draggable()`/
  `.resizable()` calls. With interact.js gone, there's no equivalent
  mechanism to merge into, so these props are gone too. If you used
  them for anything beyond `autoScroll` (which has its own dedicated,
  still-supported prop), that specific interact.js option (inertia,
  a custom modifier, etc.) has no direct replacement — the native
  engine implements the fixed set of behaviors this library itself
  needs (drag, resize from any edge/corner, aspect-ratio locking,
  auto-scroll), not an open-ended options surface.
- **`DraggableOptions`/`ResizableOptions` exported types** — re-exports
  of interact.js's own config types, now meaningless since those props
  are gone. Remove any `import type { DraggableOptions, ResizableOptions
  } from 'vue-ts-responsive-grid-layout'`.

**What's unaffected — every other prop, event, method, and default
behaves identically:** `autoScroll` (now natively implemented, same
prop, same default), `preserveAspectRatio`, `dragAllowFrom`/
`dragIgnoreFrom`/`resizeIgnoreFrom`, every drag/resize/collision/
compaction behavior, every other exported type. If you weren't using
`dragOption`/`resizeOption`, **no code changes are required** — bump
the version and go.

Beyond that one change, every prop, method, event, exported type, and
default value that existed in `1.2.10` still exists, with the same
name, signature, and default behavior. See [`CHANGELOG.md`](./CHANGELOG.md)
for why `2.0.0` was still the right number for this release even
setting the `interact.js` removal aside — briefly, it's the version
number reflecting the first release cut of this project's
ground-up TypeScript rewrite, not solely a semver statement about
the one breaking change above.

### The one behavior change worth knowing about

**`compactNow()`/`rearrange()` now actually compacts even when
`verticalCompact` is `false`.** Previously, calling either method while
`verticalCompact` was off did nothing at all — a bug, not intended
behavior (see `CHANGELOG.md`'s Fixed section and
`docs/REFACTORING.md` #73 for the full account). If your code calls
`compactNow()`/`rearrange()` with `verticalCompact: false` and somehow
depended on it being a no-op, that specific case now behaves
differently. This is extremely unlikely to affect anyone in practice —
the whole point of calling either method is to trigger compaction — but
it's the one item in this release that isn't purely additive, so it's
named here rather than folded silently into "no breaking changes."

### What's new (optional to adopt)

Everything else in this release is additive — new props, methods, and
exports with defaults that preserve `1.2.10`'s existing behavior when
left unset. None of it needs to be adopted to keep using the library
exactly as before. See [`FEATURES.md`](./FEATURES.md) for the full
current feature set, or [`CHANGELOG.md`](./CHANGELOG.md) for exactly
what's new in this release specifically. Headline additions, if you're
deciding what (if anything) to start using:

- `compactNow()`/`rearrange()`, `duplicateItem(id)` — layout tools
  callable from a template ref
- `MOVE_BLOCKED_BY_COLLISION` — an event for `preventCollision`
  feedback
- `autoHeight` — per-item auto-height to slot content
- `snapToGrid`/`snapThreshold` — magnetic snapping during drag
- `showResizeHandles`/`resizeHandleColor` — configurable resize-handle
  appearance
- `outsideDropAccept`, `readOutsideDropPayload` — for `allowOutsideDrop`
- `useLayoutPresets` — named, switchable saved layouts
- `exportLayoutAsSvg` — dependency-free grid-to-SVG export
- `ariaLabels` — localizable close-button/ARIA/keyboard-instruction text

### Upgrade steps

```sh
npm install vue-ts-responsive-grid-layout@2.0.0
```

That's the entire migration. No prop renames, no removed exports, no
changed defaults to account for (aside from the `compactNow()` fix
above), and nothing to update in your own templates or scripts.

### If you're upgrading from further back (pre-1.2.x)

See [`CHANGELOG.md`](./CHANGELOG.md) for the full, dated history —
`1.2.x` and earlier releases each have their own entries there. This
guide covers the `1.x` → `2.0.0` jump specifically, since that's the
one with a major-version-number change that might otherwise raise a
false alarm.
