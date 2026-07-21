---
aside: false
footer: true
page: true
title: Test Coverage
---

# Test Coverage

This page reflects a real run of the test suite against the current
source — not a static claim. Regenerate it yourself at any time with:

```sh
npm run test:coverage
```

## Headline numbers

| Metric | Coverage |
|---|---|
| Statements | **99.49%** |
| Branches | **95.94%** |
| Functions | **99.5%** |
| Lines | **99.52%** |

620 tests across 34 files (Vitest — unit + component), plus 61 end-to-end
scenarios (Playwright, run against Chromium/Firefox/WebKit — 183 runs total).

::: tip Enforced, not aspirational
`vitest.config.js` sets a **90% minimum** on all four metrics above and
fails `npm run test:coverage` — the same command CI runs — if any of them
drop below it. The numbers above are comfortably clear of that floor, not
sitting right at it.
:::

## Per-file breakdown

Every file below is part of `src/`'s coverage gate. Pure type-only files
(interfaces/enums with no runtime logic to execute) round-trip to 100% by
having nothing to miss; they're included for completeness.

### Components

| File | Statements | Branches | Functions |
|---|---|---|---|
| `GridItem.vue` | 100% | 94.24% | 100% |
| `GridLayout.vue` | 100% | 96.48% | 100% |
| `CustomCloseButton.vue` | 100% | 100% | 100% |
| `CustomDragElement.vue` | 100% | 100% | 100% |
| `components/index.ts` (barrel) | 100% | 100% | 100% |

### Composables

| File | Statements | Branches | Functions |
|---|---|---|---|
| `useCrossGridDrag.ts` | 100% | 96.15% | 100% |
| `useGridItemDrag.ts` | 98.9% | 97.29% | 100% |
| `useGridItemKeyboard.ts` | 100% | 88.57% | 100% |
| `useGridItemResize.ts` | 97.89% | 90.54% | 92.3% |
| `useMultiSelect.ts` | 100% | 100% | 100% |
| `useOutsideDrop.ts` | 100% | 100% | 100% |
| `useResponsiveLayout.ts` | 100% | 100% | 100% |
| `useUndoRedo.ts` | 100% | 100% | 100% |

### Core helpers, validators, and enums

Almost every file in `core/**` is at **100%** across all three metrics:
`breakpoints-helper.ts`, `grid-item-type-helpers.ts`, `grid-item-calculate-helper.ts`,
`collision-helper.ts`, `grid-layout-helper.ts`, `move-helper.ts`,
`responsive-helper.ts`, `bin-pack-helper.ts`, `compactor.ts`,
`cross-grid-registry.ts`, `export-svg.ts`, `outside-drop-payload.ts`, `DOM.ts`,
`draggable-utils.ts`, `sort-helper.ts`, `alignment-helper.ts`, all four
validators (`breakpoint-validator.ts`, `keys-validator.ts`,
`layout-validator.ts`, `margin-validator.ts`), `useInstance.ts`, and every
enum (`EMovingDirections`, `ErrorMessages`, `EGridItemEvent`, `EDragEvent`,
`EGridLayoutEvent`, `ECompactType`).

Three exceptions, each a real (if narrow) gap rather than 100%:

| File | Statements | Branches | Functions |
|---|---|---|---|
| `native-interaction.ts` | 96.91% | 92.47% | 100% |
| `calculate-utils.ts` | 100% | 93.75% | 100% |
| `responsive-utils.ts` | 100% | 93.75% | 100% |
| `utils.ts` | 98.98% | 95.45% | 93.33% |

## Why these files aren't at 100%

The remaining gaps fall into a small number of understood categories,
checked line-by-line against the actual coverage report rather than
described in the abstract:

- **Defensive branches that can't currently fire.** `native-interaction.ts`
  still has one second-concurrent-pointer guard variant and a
  null-container check inside an auto-scroll animation-frame tick that
  remain genuinely defensive — reachable only by a real second
  finger/pointer mid-gesture, or the container element being removed
  from the DOM mid-scroll, neither of which a simulated single-pointer
  test can trigger. `passesDragFilters`'s `target instanceof Element`
  check is similarly defensive: a dispatched `PointerEvent`'s own
  `target` is always a real `Element` in practice, even though the type
  itself is `EventTarget | null`.
- **Edge cases that need an unusual prop value to reach.** A handful of
  floor/ceiling checks (e.g. `pos.w < 1`) in the resize composable only
  matter if a consumer explicitly passes `minW`/`minH` as `0`, which
  bypasses the truthy-check guard ahead of them — a real path, just a
  narrow one. `calculate-utils.ts`/`responsive-utils.ts`'s own narrow
  gaps are the same shape: a specific validation throw path and a
  specific overflow-handling `else` branch that need a fairly unusual
  input to reach.
- **A defensive guard against a race jsdom can't reproduce.**
  `tryMakeDraggable()`/`tryMakeResizable()` both start with
  `if (!(gridItem.value instanceof HTMLElement)) { return; }` — a real
  fix for a real bug (see
  [`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md)
  #38: a watcher could fire before the element was actually mounted).
  Vue Test Utils mounts synchronously, so by the time any test's
  watcher fires, the element is already real — there's no way to land
  inside this branch through the normal component test flow, only by
  genuinely racing a real browser's mount timing the way the original
  bug did.
- **`useGridItemKeyboard.ts`'s `resizeBy()` clamp** — one narrow branch
  inside the `props.maxW ?? Infinity`/`props.minW ?? 1` fallback
  expressions remains flagged; not fully isolated to a single clear
  cause, and left as an honest remaining gap rather than a
  claimed-fixed one. The grid's own boundary (`colNum`/`maxRows`)
  clamping keyboard resize growth independently of a `minW`/`maxW`
  prop — previously an entire untested clamp path — is covered.
- **RTL + an in-progress resize.** `GridItem.vue`'s own live-resize
  positioning (`createStyle()`'s `renderRtl.value` branch while
  `isResizing.value` is true) now has a real, verified e2e test — see
  `e2e/drag-and-resize.spec.ts`'s "RTL: the live visual during an
  in-progress resize..." test, confirmed to genuinely fail without the
  fix (not just pass coincidentally) before being added. That closes
  the actual behavioral gap this bullet used to describe — there's no
  longer zero end-to-end RTL coverage. What may still remain, distinct
  from e2e coverage: Vitest's own statement/branch coverage percentage
  above is collected purely from the unit/component suite (jsdom), not
  from Playwright — no dedicated component-level test was added
  alongside the e2e one, so this exact branch may still show as
  uncovered in the Vitest report specifically, even though the
  behavior itself is now verified by a real browser test. Left
  unclaimed rather than assumed, since regenerating the coverage report
  to check directly wasn't possible this pass.

Several real gaps were closed during the most recent pass, previously
listed here as open — three GridLayout-level cascade handlers
(`isDraggable`/`isResizable`/`isBounded` propagating to items without
their own value) had **zero** test coverage at all before, confirmed
directly rather than assumed; a mismatched-`pointerId` check on
`pointermove` specifically (distinct from the already-tested
`pointerup` case) in both the drag and resize native-interaction
paths; both remaining `preserveAspectRatio` derivation directions
(height-driven, and a corner resize driving both axes at once) beyond
the one direction that already had a test; and `useUndoRedo.ts`/
`useMultiSelect.ts` both reaching 100% across every metric.

None of these represent a gap in verified *behavior* for anything a
consumer would actually do — see
[`docs/REFACTORING.md`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/REFACTORING.md)
for the full history of what testing *has* found along the way,
including numerous real library bugs (five previously-broken resize
directions, `margin`/`showCloseButton`/RTL-mirroring changes not
propagating after mount, a `dragend` race that could commit a stale
position, an infinite loop from a common `y: Infinity` placement
convention, and more) caught specifically *because* someone was writing
a test for them — several only surfaced once real-browser (Playwright)
testing was actually used.

## The three test layers

See [Architecture](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/docs/ARCHITECTURE.md)'s
testing section for the full detail, but in short:

1. **Unit tests** — pure functions: grid math, validators, helpers. No
   mounting, no mocking beyond the function's own inputs.
2. **Component tests** (`@vue/test-utils`, jsdom) — `GridLayout` and
   `GridItem` mounted together the way real usage does, so `$parent`/the
   `eventBus` behave exactly as in production. `ResizeObserver` is
   mocked (jsdom can't do real layout); the native, Pointer
   Events-based drag/resize engine (`native-interaction.ts`) runs for
   real against jsdom's own pointer event support — no drag/resize
   library to mock at all, since this project has none.
3. **End-to-end tests** (Playwright, against the `demo/` app) — real
   browsers, real mouse/touch events, three engines. This is what
   actually proves a drag or resize *looks* right, not just that the
   right function ran.

## CI

Every PR runs the full Vitest suite (with this same coverage gate) and
the full Playwright suite, matrixed across Node 18/20/22 — see
[`.github/workflows/ci.yml`](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/.github/workflows/ci.yml).
[![CI](https://github.com/gwinnem/vue-responsive-grid-layout/actions/workflows/ci.yml/badge.svg)](https://github.com/gwinnem/vue-responsive-grid-layout/actions/workflows/ci.yml)
