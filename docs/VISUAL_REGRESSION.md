# Enabling visual regression testing

The other half of Phase 3 from `docs/REFACTOR_STRATEGY.md`, alongside
mutation testing (see [`docs/STRYKER.md`](./STRYKER.md)). Functional e2e
tests verify *behavior* — an item moved, a class was applied, a bounding
box changed by the right amount. None of them would catch a misapplied
CSS transform, a broken border-radius, a resize handle that silently lost
its cursor styling, or any other purely visual regression, since the DOM
structure and computed positions can be entirely correct while the grid
looks wrong. Screenshot comparison is the test layer that catches that
class of bug.

## Status: written, not yet active

`e2e/visual-regression.spec.ts` exists and covers all seven `demo/` views
(basic grid, drag & resize, add/remove items, responsive breakpoints,
cross-grid drag/drop, per-item overrides, drag from outside/multi-grid —
extended from the original four once the demo grew three more views; see
`docs/REFACTORING.md` for when each view was added), but **is excluded
from the default `npm run test:e2e` run** — Playwright's
`toHaveScreenshot()` needs a baseline image to compare against, and there
isn't one committed yet. Running it as-is would just fail every time
rather than provide signal, so `playwright.config.ts` ignores this file
unless `RUN_VISUAL_REGRESSION=1` is set.

## One-time setup: generating baselines

This has to happen in an environment with real Playwright browsers
installed. The official path (`npx playwright install`) is still blocked
in the environment this doc was last touched in — network egress
doesn't allow `cdn.playwright.dev`. A workaround was found and used
successfully for a different purpose (an ad-hoc bug investigation, not
baseline generation): an older Playwright-bundled Chromium build already
present on disk turned out to still be launchable via
`chromium.launch({ executablePath: '...' })`, letting real mouse-driven
browser automation run despite the official install failing. That's
useful for one-off manual investigation, but **not** a substitute for
proper baseline generation here — screenshot baselines are sensitive to
the exact rendering engine version (see the cross-platform-determinism
note below), so baselines produced against a different, older Chromium
than whatever CI/consumers would actually render with risk being subtly
wrong in a way that's hard to notice until they start failing for
everyone else. Whoever picks this up next should use the *declared*
Playwright version's own browser, not this workaround, specifically for
generating the committed baselines:

```sh
npx playwright install        # first time only, downloads browsers
npm run test:e2e:visual:update
```

This runs the visual regression spec with `--update-snapshots`, which
*creates* the baseline PNGs instead of failing on a missing one — they'll
land in `e2e/visual-regression.spec.ts-snapshots/`. Review them (open the
PNGs, confirm each view actually looks right), then commit that directory.

## Running it after baselines exist

```sh
npm run test:e2e:visual
```

Compares the current render against the committed baselines and fails
with a pixel diff for anything that doesn't match. Once this is reliable,
add it as its own step in `.github/workflows/ci.yml`'s `e2e` job (kept
separate from the main functional e2e run deliberately — see below).

## Updating baselines after an intentional visual change

```sh
npm run test:e2e:visual:update
```

Same command as initial generation — review the new PNGs before
committing, exactly like reviewing any other diff. A visual regression
test's baseline update is a real content change to review, not a
mechanical "make CI green again" step.

## Why this isn't wired into CI yet

Two reasons, both fixable once someone has a real browser environment to
work in:

1. **No baselines exist.** Turning this on in CI before baselines are
   generated and reviewed would just make the `e2e` job permanently red.
2. **Cross-platform/cross-renderer determinism.** Screenshot comparison is
   sensitive to the exact rendering engine version, font availability, and
   OS-level anti-aliasing — baselines generated on one machine don't
   always match pixel-for-pixel on another (this is standard Playwright
   visual-testing friction, not specific to this project). Options once
   this is picked up: run only against `chromium` for visual tests (drop
   firefox/webkit from this specific suite), pin to Playwright's official
   Docker image in CI (recommended in Playwright's own docs for exactly
   this reason), or accept a small `maxDiffPixelRatio` threshold. Pick one
   deliberately rather than fighting flakiness after the fact.

## What's covered, and why each is screenshotted in a static state

Every test navigates to a view and screenshots it **before any user
interaction** (not mid-drag, not after adding an item), and sets a fixed
`1280×900` viewport in `beforeEach`. Both choices are about determinism:
anything that introduces real variability between runs (an
in-progress drag position, a timestamp in the event log, a
viewport-dependent breakpoint) would make the test flaky, which defeats
the point of a regression check — a flaky test that's ignored on principle
provides zero signal, same as no test at all.

| View | Screenshot target | Fixed via |
|---|---|---|
| Basic grid | `[data-testid=basic-grid-wrap]` | Static layout, no interaction needed |
| Drag & resize | `[data-testid=drag-resize-grid]` | Captured before any drag/resize |
| Add / remove items | `[data-testid=dynamic-grid]` | Captured before clicking "Add item" |
| Responsive breakpoints | `[data-testid=responsive-grid]` | Fixed 1280px viewport resolves to the `lg` breakpoint; asserted explicitly before capturing so a future default-breakpoint change fails loudly instead of producing a confusing diff |
| Cross-grid drag/drop | `[data-testid=cross-grid-view-wrap]` | Captured before any drag between the two grids |
| Per-item overrides | `[data-testid=item-overrides-grid]` | Static layout, no interaction needed |
| Drag from outside (multi-grid) | `[data-testid=external-drop-view-wrap]` | Captured before any drag from the palette or between grids |

Each screenshots the grid element itself, not the full page — this keeps
the images focused on what this test actually cares about and avoids
unrelated page chrome (nav, headings) contributing to false-positive diffs
if that surrounding UI changes independently of the grid. The two
multi-grid views (cross-grid, external-drop) each render two `GridLayout`
instances side by side rather than one — screenshotting either grid
alone wouldn't represent "the view," so a `data-testid` was added to the
shared wrapper `<div>` around both (`CrossGridView.vue`/
`ExternalDropView.vue`), keeping the same one-screenshot-per-view shape
the other five tests already use rather than switching to two images for
those two views specifically.
