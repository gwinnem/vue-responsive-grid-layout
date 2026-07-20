# Testing

This project has two independent test layers.

## Unit & component tests — Vitest

Pure-function tests for the grid math, validators, and helpers
(`tests/*.spec.ts`), plus component tests for every Vue component
(`GridLayout.vue`, `GridItem.vue`, `CustomCloseButton.vue`,
`CustomDragElement.vue`) using `@vue/test-utils`, all run against jsdom.

```bash
npm run test           # watch mode
npm run test:ui         # Vitest UI
npm run test:coverage   # single run with coverage
```

### Coverage gate

`vitest.config.js` enforces a **90% minimum** (lines, statements, functions,
branches) over `src/**/*.{ts,vue}`, excluding pure type-declaration files
(interfaces/types have no emitted JS to cover) and the `demo/` app. A run
that drops below 90% on any of those four metrics fails
(`npm run test:coverage`), the same as CI would.

### Component testing approach

`GridLayout` and `GridItem` are tested together, mounted through
`tests/helpers/mountGrid.ts`, which renders a real `GridLayout` with real
`GridItem` children in its default slot — the same shape actual usage takes
(compare `demo/views/*.vue`). This means `$parent`/`provide`-`inject`
(the eventBus) and `defineExpose`d properties all behave exactly as they do
in production, rather than relying on a hand-rolled fake parent.

Three things needed mocking, all set up globally in `tests/setup.ts` (the
first two) or scoped to a single file (the third, since it needs different
mocked behavior than every other test):

- **`ResizeObserver`** — jsdom doesn't implement it at all (a real gap,
  not a workaround for anything specific to this library; see
  `docs/BUNDLE_ANALYSIS.md` #3 for why `GridLayout` uses it instead of
  `element-resize-detector`). Replaced with a no-op stub; the initial
  width read (`offsetWidth`) happens independently and is covered by
  `tests/helpers/mountGrid.ts`'s `stubOffsetWidth()`.
- **`@interactjs/interact`** — drag/resize are driven by real, trusted
  pointer events and native layout that jsdom can't produce. Replaced with
  a mock `Interactable` that records every `.on(eventTypes, handler)` call,
  so tests can retrieve and invoke a specific handler directly
  (`tests/GridItem.spec.ts`'s `dispatchDragEvent`/`dispatchResizeEvent`
  helpers) — this exercises the component's actual `handleDrag`/
  `handleResize` logic, just triggered manually instead of by a real mouse.
- **`vue`'s `useSlots()`** — scoped to `tests/GridItem.autoSize.spec.ts`
  only, via a file-local `vi.mock('vue', ...)` that spreads the real
  module and overrides just `useSlots`. `GridItem.autoSize()`'s "happy
  path" (a slot with an actually-measurable mounted element) can't be
  reached through real Vue slot rendering in a test — calling the exposed
  `slots.default()` imperatively returns fresh, disconnected VNodes no
  matter what (see `docs/REFACTORING.md` #12) — so this is the only way
  to exercise the clamping/emit logic that runs *after* a measurable
  element is found, as opposed to the VNode-timing limitation that isn't
  within this library's control to fix from inside `autoSize()` itself.

`wrapper.setProps()` only works on the *root* mounted component in Vue Test
Utils, which rules it out for testing a GridItem's own prop watchers (it's
rendered through GridLayout's slot, not as the root). For those,
`tests/helpers/mountGrid.ts`'s `mountGridWithReactiveItem()` mounts with the
item's props on a `reactive()` object instead — mutating that object
re-renders GridItem with new props exactly like a real `v-for` over reactive
state would.

## End-to-end tests — Playwright

Browser tests that drive real drag/resize/responsive interactions against
the demo app (`demo/`). The demo imports the library directly from `src/`
via the same `@` alias the library itself uses, so e2e tests always exercise
current source, not a stale build.

```bash
npx playwright install   # first time only — downloads browser binaries
npm run test:e2e          # headless, all three browser engines
npm run test:e2e:ui       # interactive UI mode, good for writing new tests
npm run test:e2e:report   # open the HTML report from the last run
```

`playwright.config.ts` starts the demo dev server automatically
(`npm run demo`) before tests run and tears it down after — no separate
terminal needed.

### What's covered

| File | Covers |
|---|---|
| `e2e/basic-grid.spec.ts` | Static layout renders at the right positions; default draggable/resizable classes are applied |
| `e2e/drag-and-resize.spec.ts` | Dragging moves an item and fires `dragend`; disabling `isDraggable` blocks movement; resizing from the bottom-right edge grows an item; event log clears |
| `e2e/keyboard-accessibility.spec.ts` | Arrow-key move and shift+arrow resize; boundary clamping at x:0; minW clamping on shrink; a non-interactive item ignores keyboard input entirely |
| `e2e/dynamic-items.spec.ts` | Adding a layout entry renders a new item; the close button removes one |
| `e2e/responsive.spec.ts` | Shrinking the viewport moves the layout to a narrower breakpoint |
| `e2e/external-drop.spec.ts` | Dragging a native (non-`GridItem`) element from outside into one of two grids lands it in whichever grid it was released over, alongside any existing items; releasing away from both grids drops nothing; a single continuous drag swept from one grid to the other leaves exactly one preview, not one stranded in each; an existing item already placed in one grid can also be dragged into the other (`allowCrossGridDrag`, independent of the outside-drop mechanism above) |
| `e2e/advanced-features.spec.ts` | The `AdvancedFeaturesView` demo view — blocked-move feedback (`preventCollision` + a static item), `compactNow()` re-packing a scattered layout, `duplicateItem`, `snapToGrid` magnetic alignment, saving/loading a named layout preset |

### Notes on interaction tests

Drag and resize are implemented via `interactjs`, which listens for real
pointer events rather than exposing a testable JS API. The tests drive
`page.mouse` (down → move in steps → up) rather than clicking a locator,
since interact.js needs a sequence of native pointer events to recognize a
drag/resize gesture — a single `click()` won't trigger it.

Resize specifically is edge-triggered (grabbing near the item's own border,
not a separate handle element — see `REFACTORING.md` for why the
`.vue-resizable-handle` CSS exists but has no matching markup), so the resize
test grabs a point a couple of pixels inside the item's bottom-right corner
rather than clicking a dedicated handle.

### Adding a new e2e test

Add a `data-testid` to whatever you need to assert on in the relevant
`demo/views/*.vue` file (props fall through to the root element by default,
so `data-testid="foo"` on a `<GridItem>` usage lands on the rendered
`.vue-grid-item` div), then add a spec under `e2e/`.

Use `stableBoundingBox()` from `e2e/helpers.ts` for a "before" baseline
position rather than a plain `boundingBox()` call — the container-width
measurement `colWidth` (and so every item's actual pixel position)
depends on can settle across more than one render pass after mount or a
view switch, and reading `boundingBox()` too early can catch it
mid-settle. Waiting for an item's `vue-draggable` class confirms
interact.js's own setup has run; it does not confirm the container's own
width measurement has also finished. This was found to affect existing,
previously-considered-solid tests too, not just newly-added ones — see
`docs/REFACTORING.md` #73.

## Manual testing

Neither Vitest nor the e2e suite above covers everything — see
[`MANUAL_TEST_CHECKLIST.md`](../MANUAL_TEST_CHECKLIST.md) for
cross-browser (Firefox/Safari have zero automated coverage in this
project's current environment), touch/mobile, and screen-reader
scenarios that need a human in a real browser. Run it before a release
touching drag/resize/collision logic, or quarterly otherwise.
