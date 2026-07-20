# Refactor Strategy: Toward a Standardized, Enterprise-Ready Library

This is the master roadmap. `BUNDLE_ANALYSIS.md`, `REFACTORING.md`, and
`TESTING.md` each go deep on one slice (bundle size, source-level bugs, test
infrastructure); this document is about everything *around* the code —
tooling, process, and structure — plus how the pieces fit into a phased plan.

## Where things stand today

A quick, honest inventory before proposing changes:

| Area | State |
|---|---|
| Unit/component test coverage | 93% lines, 90% branches, 100% functions on `src/` (was ~0% on components before this work) |
| E2E coverage | Playwright suite exists against a real demo app |
| `npm run typecheck` | Clean |
| `npm run lint` | **Broken** — ESLint 9 is installed but only legacy `.eslintrc.*` configs exist; there is no `eslint.config.js`, so lint doesn't run at all, locally or (if it existed) in CI |
| Pre-commit hooks | **Non-functional** — `husky@9` is installed, but there's no `.husky/` directory and no `prepare` script; the `"husky": { "hooks": {...} } }` block in `package.json` is a husky v4-style config that v9 no longer reads. `lint-staged` is configured but nothing ever invokes it |
| CI/CD | **None** — `.github/` has only community-health files (`CODE_OF_CONDUCT.md`, `ISSUE_TEMPLATE.md`, etc.), no `workflows/` directory at all |
| Formatting config | Two conflicting Prettier configs present (`.prettierrc` vs `.prettierrc.js`, disagreeing on tabs vs spaces) — only `.prettierrc` is actually used, `.prettierrc.js` is silently dead |
| Ignore files | `.eslintignore` (deprecated by ESLint 9) references `cypress.config.ts`, `/cypress`, and `pnpm-lock.yaml` — none of which exist in this project; `.stylelintignore` has a typo (`/cyprus/*`) — both look like uncleaned copy-paste from a template |
| Bundle size | 45 KB gzip, ~79% of which is two dependencies (see `BUNDLE_ANALYSIS.md`) |
| Source bugs found | 14 concrete issues, several crash-level, found and fixed while writing tests (see `REFACTORING.md`) |

*(This table reflects the state this plan was originally written against —
kept as-is deliberately, since it's the "before" snapshot the rest of this
document explains fixing. For where things actually stand now: 307 tests,
98.4% statement / 95.6% branch coverage, `npm run lint` runs and reports
1,005 pre-existing problems — advisory, not blocking (see Phase 1) —
`npm run lint:style` is clean at 0 issues and *is* a blocking gate, CI/CD
is live across three workflows, and bundle size sits around 42.6 KB of the
55 KB gzip budget (bumped from the original 45 KB after a large feature
batch — see `docs/BUNDLE_ANALYSIS.md`). **All four phases below are complete.** Substantial
further feature work (cross-grid drag/drop, drag-and-drop from outside the
grid system, keyboard accessibility, a full VitePress documentation site)
has happened since this plan was finished — tracked in `CHANGELOG.md` and
`docs/REFACTORING.md` rather than re-litigated here, since this document
is specifically about process and tooling, not a running feature log.)*

The honest summary: **the code is now well-tested, but nothing currently
verifies that automatically, and the code-quality tooling that's already
installed and paid for (ESLint, Prettier, husky, lint-staged) isn't actually
running.** That combination — good tests, no enforcement — is the single
biggest gap on the way to "enterprise ready," and it's also the cheapest to
close, so it's where this plan starts.

## Phase 0 — Make the existing tooling actually run (days, not weeks)

**Status: done.** Everything below was fixing tools that were already
installed and configured but silently inert — no new tooling, no rule
redesign, pure "turn the lights on." What changed:

1. **ESLint migrated to flat config** (`eslint.config.js`, replacing the
   near-duplicate `.eslintrc.cjs`/`.eslintrc.js`, both deleted). The rule
   set is a faithful port of the old config, with two adjustments forced by
   tooling that moved on since it was written:
   - Three `@typescript-eslint` rules (`func-call-spacing`,
     `member-delimiter-style`, `space-before-function-paren`) were removed
     from the plugin entirely in v8 (migrated to a separate `@stylistic`
     package this project doesn't have) — dropped rather than chasing a new
     dependency in a "just fix what's broken" pass.
   - `vue/component-tags-order` was renamed to `vue/block-order` in
     `eslint-plugin-vue` v10 — renamed in the new config.
   - One real bug fixed along the way: the old config referenced
     `import/default`, `import/export`, `import/named`, and
     `import/namespace` rules but never listed `import` in its `plugins`
     array, so those four rules were silently inert even when the legacy
     config could still run. The plugin is now actually registered — but
     the four rules are left `off` rather than `on`, because turning them
     on surfaces a false positive on `mitt`'s type-only `Emitter` export
     that needs `eslint-import-resolver-typescript` (not installed) to
     resolve correctly. Wiring that up is a Phase 2 item, not a Phase 0 one
     — enabling a previously-inert rule and immediately suppressing its
     first false positive isn't "restoring" anything.
   - `npm run lint` reports **1,005 real problems** (948
     auto-fixable) across `src/` as of the latest check — this number
     drifts as code changes (it was 1,185/1,131 when Phase 0 first made
     lint runnable; re-run `npm run lint` for the current count rather
     than trusting either number as fixed). The underlying cause is the
     same either way: accumulated style drift from the linter having
     been non-functional for a while, not new debt introduced by any one
     change — it's `eslint --fix`-away, but actually running that fix
     (touching most files in `src/` with whitespace-only changes) is a
     deliberate, separate decision this pass didn't make unilaterally.
     See "What's next" below.
2. **husky v9 wired up for real.** Added `"prepare": "husky"` to
   `package.json` and a real `.husky/pre-commit` running `npx lint-staged`.
   Deleted the dead `"husky": { "hooks": {...} } }` block — that was a
   husky v4-style config `package.json`; v9 has never read that format, so
   the hook has not run on a single commit since the dependency was bumped
   to v9.
3. **Prettier config conflict resolved.** Deleted `.prettierrc.js` — it
   disagreed with `.prettierrc` on tabs vs. spaces (and even
   contradicted itself, with `bracketSpacing` defined twice with different
   values), but `prettier --find-config-path` confirmed only `.prettierrc`
   was ever actually read. It's also the one consistent with ESLint's own
   2-space indent rules, so this wasn't a coin flip.
4. **`.stylelintrc` fixed too** (found while verifying `npm run lint:style`
   — not explicitly called out in the original Phase 0 scope, but the same
   category of problem). Five rules (`at-rule-name-case`,
   `media-feature-name-case`, `no-extra-semicolons`, `number-leading-zero`,
   `string-quotes`) were removed from Stylelint core in v16; the installed
   version is 16.26, so `npm run lint:style` was erroring out completely,
   the same way ESLint was. Removed the dead rules and renamed one
   deprecated `stylelint-scss` rule
   (`at-import-partial-extension-blacklist` →
   `at-import-partial-extension-disallowed-list`). It now runs and reports
   **7 real, pre-existing issues** (6 auto-fixable).
5. **Ignore files cleaned.** `.eslintignore` deleted (ESLint 9 doesn't read
   it anyway; its patterns are now `eslint.config.js`'s `ignores` array,
   including `src/vite-env.d.ts`, which the old file explicitly excluded
   and which the new config now excludes too). Removed the
   Cypress/pnpm-lock references from `.stylelintignore` — this project has
   neither.
6. **`engines.node` corrected** from `>= 14.18.0` to
   `^18.0.0 || ^20.0.0 || >=22.0.0`, matching what Vite 6 and Vitest 3
   actually require (checked directly against their own `package.json`
   `engines` fields, not guessed).

**Verification performed**: `npm run lint`, `npm run lint:style`,
`npm run typecheck`, `npm run test:coverage` (225 tests, coverage
thresholds still met), `npm run build:only`, and `npm run demo:build` were
all run after these changes — typecheck, tests, and both builds are clean;
lint and lint:style now run and report real (not configuration-error)
output, quantified above.

**What's next (not done in this pass, deliberately):**

- **`npm run lint:fix` / `prettier --write`** across `src/` would clear
  most of the ~950 auto-fixable ESLint issues (see the current count
  above — Stylelint is already at zero, see Phase 1) and whatever
  Prettier's `--check` currently flags. This is a large,
  mechanically-safe, whitespace-only diff — safe to run, but
  deliberately not bundled into "fix the tooling," since a repo-wide
  reformat is the kind of change a reviewer should see as its own commit,
  not a side effect of a config fix. Recommended as the very next PR.
- **`eslint-import-resolver-typescript`** to properly enable the four
  `import/*` rules now sitting at `off` (see point 1 above).
- Both are small, well-scoped enough to be Phase 0.5 rather than waiting
  for the full Phase 2 structural work.



## Phase 1 — CI/CD (the actual enterprise-readiness gate)

**Status: done.** `.github/workflows/ci.yml`, `.github/workflows/release.yml`,
and `.github/dependabot.yml` now exist — see "What was actually built"
below for what's live versus what still needs a repository secret to
activate.

There is currently no automated verification of anything — a PR could
delete `src/` entirely and nothing would fail before a human noticed. This
is the highest-leverage single addition available.

**Minimum viable pipeline** (GitHub Actions, since `.github/` already exists):

```yaml
# .github/workflows/ci.yml — sketch, not final
on: [pull_request, push]
jobs:
  verify:
    steps:
      - checkout, setup-node (use the corrected engines version), npm ci
      - npm run typecheck
      - npm run lint            # meaningful once Phase 0 lands
      - npm run test:coverage   # fails the build below 90%, per vitest.config.js
      - npm run build:only      # library build
      - npm run demo:build      # demo build
  e2e:
    steps:
      - checkout, setup-node, npm ci
      - npx playwright install --with-deps
      - npm run test:e2e
```

Two jobs (fast unit/lint/build feedback vs. slower browser e2e) so PRs get
signal quickly. Add branch protection requiring both to pass before merge —
without that, a CI pipeline is just a suggestion.

## What was actually built

**`.github/workflows/ci.yml`** — runs on every push to `main` and every PR:

- `verify` job, matrixed across Node 18/20/22 (the full `engines` range):
  typecheck, `lint:style` (blocking — see below), `lint` (advisory,
  `continue-on-error: true`), `test:coverage` (fails below the 90%
  threshold `vitest.config.js` already enforces), library build, bundle
  size check, demo build, docs build.
- `e2e` job: installs all three Playwright browsers and runs the e2e suite,
  uploading the HTML report as an artifact on any outcome.
- `audit` job: `npm audit --omit=dev --audit-level=high` as a **blocking**
  gate (currently clean, verified directly — 0 vulnerabilities in
  production dependencies), plus a full-tree audit (including
  devDependencies) as advisory only, since it currently flags ~22
  issues, all confirmed dev-only and none reachable by a published
  consumer: `vitepress`'s own vendored (older-major) `vite`, and
  `npm`'s own bundled tooling inside `@semantic-release/npm`. Re-checked
  when the count changes rather than assumed stable — `npm audit` was
  re-run directly as part of confirming this, not carried forward from
  an earlier pass.

**ESLint is deliberately advisory, not blocking**, for one specific
reason: `npm run lint` currently reports ~800 pre-existing issues (see
docs/REFACTORING.md #6) predating this project having a working ESLint
config at all. Making it a hard gate today would mean every PR is red
regardless of what it changes — worse than no gate at all, since it
trains people to ignore CI failures. `lint:style` **is** blocking, because
it was brought to zero issues first (docs/REFACTORING.md #24) —
specifically so at least one lint gate is real from day one, and the
ESLint one can flip to blocking once the equivalent cleanup happens.

**`scripts/check-bundle-size.js`** — fails the build if the ES bundle's
gzipped size exceeds a 55 KB budget (bumped from an original 45 KB after
a large feature batch; current measured size: ~42.6 KB, see
docs/BUNDLE_ANALYSIS.md), with the reasoning and bump procedure documented
in the script itself.

**`.github/dependabot.yml`** — weekly npm + GitHub Actions update PRs,
devDependency patch/minor bumps grouped into one PR. Nothing auto-merges;
these still go through the same CI gate as any other PR.

**`.github/workflows/release.yml`** + **`.releaserc.json`** —
`semantic-release`, wired to the project's existing conventional-commit
convention (commitizen / `cz-conventional-changelog`), configured to bump
`package.json`, regenerate `CHANGELOG.md`, publish to npm, and create a
GitHub release, all from a push to `main`. **Requires an `NPM_TOKEN`
repository secret to actually publish** — without it, the workflow's
release step fails cleanly (not partially or destructively) rather than
silently no-op'ing. `GITHUB_TOKEN` needs no setup (provided automatically).
Config validity was checked locally (`npm run release:dry-run`; plugins
load correctly, it fails only on "not a git repository," as expected
outside of CI) — it hasn't been exercised against a real npm registry or
GitHub repository, since that requires the live secret and a real PR
history to react to.

## Still not done

- **Branch protection** requiring `verify`, `e2e`, and `audit` to pass
  before merge isn't something a workflow file can configure — it's a
  repository setting. Turn it on once these workflows have a few green
  runs to build confidence in.
- **The ESLint gate flipping from advisory to blocking**, pending the
  `lint:fix` cleanup PR mentioned in Phase 2's "Naming and file
  organization" section above.
- **`NPM_TOKEN`** isn't something this pass can create — it's a real npm
  automation token that has to be generated and added as a repository
  secret by someone with publish rights to the package.
- **`engines.node` includes Node 18, which reached end-of-life in April
  2025** — found during a later re-review of the CI matrix added in this
  phase (`ci.yml` tests against 18/20/22 specifically because `engines`
  says all three are supported). Not changed here, since dropping support
  for an actively-installed Node version is a real breaking change for
  whoever's still on it, not a mechanical fix — it's a maintainer decision
  (bump the minimum to 20, in a major/minor release with a clear note)
  rather than something to change silently as a side effect of an
  unrelated pass.

## Phase 2 — Structural standardization

**Status: done**, with one deliberate exception noted below (the broader
kebab-case file-naming sweep) and one item that turned out impractical on
investigation (sub-importing a single interact.js modifier).

With the safety net in place (Phase 1), larger structural changes become
low-risk instead of "hope nothing broke."

### Naming and file organization

The codebase used to mix conventions inconsistently:

- `gridItemCalculateHelper.ts`, `gridIemTypeHelpers.ts` (camelCase, and the
  latter has a typo — flagged in `REFACTORING.md`) vs.
  `breakpoint-validator.ts`, `layout-validator.ts` (kebab-case) in
  neighboring directories under the same `core/` tree.
- `EGridLayoutEvents.ts` vs. `EDragEvent.ts` (plural vs. singular filename
  for the same enum-file pattern) — this one wasn't in scope for the
  kebab-case sweep below (see "Left alone, deliberately").

**Done.** Two outright typos — `gridIemTypeHelpers.ts` and
`collissionHelper.ts` — were fixed to their correctly-spelled camelCase
names (`gridItemTypeHelpers.ts`, `collisionHelper.ts`, plus the matching
test files) in an earlier pass, since those were unambiguous bugs rather
than a style choice. The broader camelCase-vs-kebab-case inconsistency
across the rest of `core/**/helpers` was, at that time, a real style
decision deliberately deferred to its own dedicated PR rather than
folded into an unrelated bug fix — that PR has now happened: every
camelCase file under `core/**` (helpers and interfaces alike, 14 files
total, including the two typo-fixed ones above) was renamed to
kebab-case in one mechanical pass, with every import reference across
`src/`, `tests/`, `demo/`, and `sandbox/` updated alongside each rename
rather than left to break. Verified the same way any rename-only change
should be: typecheck and the full test suite (307 tests) both ran clean
immediately after, with zero source or test logic changed — if either
had failed, it would have meant a reference was missed, not that the
rename itself was wrong.

Left alone, deliberately: the enum/type declaration files
(`EGridLayoutEvents.ts`, `EDragEvent.ts`, `DOM.ts`, `ErrorMessages.ts`,
etc.) — these follow a different, equally legitimate convention where
the filename matches the exported symbol's own PascalCase name exactly,
common practice for a file with one primary export. That's not the same
inconsistency this section is about, which was specifically about
multi-word *helper/utility* files (`gridLayoutHelper.ts` alongside
`layout-validator.ts` in a neighboring directory) picking one casing
convention or the other with no apparent reason. The plural-vs-singular
naming (`EGridLayoutEvents.ts` vs. `EDragEvent.ts`) noted above is a
separate, smaller inconsistency within that PascalCase group and wasn't
part of this pass either — worth its own small follow-up if it's ever
worth the churn.
left for a dedicated rename-only PR rather than folded into Phase 2's other
changes — pick one convention (kebab-case matches the validator files
already) and apply it project-wide in a single, mechanical, easy-to-verify
commit.

### Component decomposition — done

`GridItem.vue` shrank from 1,345 to 828 lines; the extracted logic now lives
in `src/components/Grid/composables/useGridItemDrag.ts` (~240 lines) and
`useGridItemResize.ts` (~340 lines), each independently importable and
unit-testable without mounting the full component. `GridLayout.vue`'s
responsive-breakpoint logic (`responsiveGridLayout`, `initResponsiveFeatures`,
the per-breakpoint layout cache) moved to `useResponsiveLayout.ts` the same
way. All three composables take an explicit context object rather than
reading component internals implicitly — see `docs/ARCHITECTURE.md` for the
shape of that context and why it's as wide as it is (the underlying state
coupling between drag/resize/rendering is real; the goal was giving each
concern its own file and name, not pretending the coupling doesn't exist).

The full existing test suite (225 tests, component tests included) passed
unchanged through this extraction with no test modifications required —
which is exactly the point of having behavior-level tests in place before a
structural refactor: they don't care how the internals are organized.

### Dependency hygiene — mostly done, one item turned out impractical

- `@interactjs/dev-tools` import — removed (done earlier).
- `element-resize-detector` → native `ResizeObserver` — **done**. Measured
  effect: ES bundle gzip dropped 17% (45.2 KB → 37.5 KB). See
  `BUNDLE_ANALYSIS.md` for the before/after.
- Importing only the specific interact.js modifier used, instead of the
  full `@interactjs/modifiers` barrel — **investigated, not achievable**.
  The package's `interact.modifiers.*` namespace is populated by a single
  monolithic `install()` call with no smaller public registration surface;
  see `BUNDLE_ANALYSIS.md` #2 for the source-level detail. Not pursued.
- Re-evaluating interact.js's overall footprint remains the biggest
  open lever and is still a longer-term item, not something to take on
  as a drive-by.
- `license-checker` (a devDependency used by the license-scan CI gate,
  Phase 4) → `license-checker-rseidelsohn` — **done**, since. The
  original has been unmaintained since 2019, and its old `read-installed`
  dependency chain accounted for six separate `npm warn deprecated`
  messages on every install. Used the newest release still declaring
  Node ≥18 support (`^4.4.2`) rather than the latest (5.x requires
  Node ≥24) — see `docs/REFACTORING.md` #45 for the full chain and why
  each remaining deprecation warning (all in other devDependencies)
  isn't safely fixable the same way.

### Type safety — done, and it found a real bug

`dragOption`/`resizeOption` props are now typed against interact.js's own
`DraggableOptions`/`ResizableOptions` (via `@interactjs/actions/drag/plugin`
and `.../resize/plugin`, already a dependency) instead of
`{ [key: string]: any }`. `styleObj`, `useCurrentInstance()`'s return type,
the validator functions in `keys-validator.ts`, and `compactItem`/
`compactLayout`'s `minPositions` parameter are all typed now too.

That last one is the interesting one: replacing `minPositions?: any` with
a real type surfaced a genuine, previously-invisible bug — see
`REFACTORING.md` #16. `restoreOnDrag` combined with `verticalCompact: false`
had been silently non-functional because the producer and consumer of
`positionsBeforeDrag` disagreed on its shape, and `any` hid the mismatch
from the compiler on both ends. This is the concrete case for "eliminate
`any`" beyond style: a real type doesn't just read better, it actively
checks that the two sides of a contract agree.

### Documentation — done

Added `docs/ARCHITECTURE.md` explaining the pieces a new contributor needs
before touching `GridItem.vue`/`GridLayout.vue`: the `provide`/`inject`
eventBus contract between them (this is not obvious from either file in
isolation — GridLayout provides `eventBus`, GridItem injects it, and the
list of event names each side emits/listens for is the closest thing this
project has to a public internal API), how `$parent` access replaces a
formal prop-drilling contract, why interact.js is wired the way it is, and
the shape of the new composable split.

## Phase 3 — Testability, beyond the coverage number

**Status: both items implemented, with one honestly-scoped limitation** —
see "What was actually built" below.

90% coverage is a floor, not a ceiling. Phase 2's composable extraction
already made each composable independently unit-testable without the
interact.js/ResizeObserver mocking overhead component tests need — see
the [Test Coverage](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/guide/coverage.md)
docs page for where that landed (98%+).

Two additions worth considering once the basics are solid:

- **Mutation testing** (Stryker) as a periodic (not per-PR — too slow) check
  that the test suite actually catches regressions, not just executes lines.
  Given `REFACTORING.md` finding #8 (tests that ran code but asserted
  nothing), this project specifically has a history of tests that look
  more thorough than they are — mutation testing is the systematic version
  of manually finding that.
- **Visual regression testing** via Playwright screenshots for the demo
  app's views. Layout/CSS regressions (a misapplied transform, a
  broken resize handle) are exactly the class of bug that passes functional
  tests (the DOM structure is right) while looking wrong, and this project
  is fundamentally about visual layout.

## What was actually built

**Mutation testing** — fully working, verified by actually running it
(not just configured and assumed correct). `stryker.conf.json` scopes
mutation to `.ts` files (`core/**`, the composables, `hooks/`) — `.vue`
files are deliberately excluded, since Stryker's mutant placement for Vue
SFCs isn't first-class, and the bulk of intricate logic already lives in
`.ts` files post-Phase-2. `.github/workflows/mutation-testing.yml` runs it
weekly (plus on-demand), not per-PR, given the runtime (~1,365 mutants;
comfortably over 20 minutes on a single core, faster on a real multi-core
runner but still far too slow to gate a PR on). Full detail, including a
real configuration pitfall that was hit and fixed along the way, in
[`docs/STRYKER.md`](./STRYKER.md).

**Visual regression testing** — the test file
(`e2e/visual-regression.spec.ts`) covers all seven `demo/` views (four
originally, extended to the three added later — cross-grid, per-item
overrides, outside-drop — once that gap was noticed), each captured in a
static, interaction-free state at a fixed viewport for determinism. The
two multi-grid views needed a small source addition to make this
possible: neither renders a single element representing "the whole
view" (each shows two `GridLayout` instances side by side), so a
`data-testid` was added to the shared wrapper `<div>` around both in
`CrossGridView.vue`/`ExternalDropView.vue`, keeping one screenshot per
view rather than switching to two images for those two specifically.
**Still honestly incomplete on the original axis, not a new one**: it's
excluded from the default `npm run test:e2e` run and not wired into CI,
because generating the baseline screenshots it compares against requires
the *officially declared* Playwright browser version, and `npx
playwright install` still fails in every environment this has been
worked in (network egress blocks the download). A manual workaround for
ad-hoc browser automation was found later (an older, already-present
Chromium build launchable via an explicit `executablePath`) and used
successfully for a different purpose — see `docs/REFACTORING.md` #66 —
but it's deliberately not treated as solving this specific gap, since a
baseline generated against a different Chromium version than what CI
would actually use risks being subtly wrong. This is
one-time/incremental setup work, not a design gap — see
[`docs/VISUAL_REGRESSION.md`](./VISUAL_REGRESSION.md) for exactly what the
next person needs to run (`npm run test:e2e:visual:update`) to finish
turning this on, and the cross-platform-determinism tradeoffs to decide on
before wiring it into CI.

**A gap found, now closed**: every test in this project — unit,
component, e2e, mutation, visual — exercises the library through source
aliases (`@/` → `src/`), including the demo app, sandbox, and every
VitePress example. None of them go through `package.json`'s `exports`
field the way an actual `npm install`'d consumer would. This let a
real, published-package-breaking bug (`exports`'s `./style.css` entry
pointing at a file that doesn't exist — see `docs/REFACTORING.md` #46)
sit undetected through 98%+ source coverage and every other test in
this document, because "coverage of `src/`" and "the published artifact
actually resolves" are different claims, and only the first one was
being checked. **Fixed**: `scripts/check-package-install.js`, wired
into `ci.yml` right after the bundle-size check — packs the tarball,
installs it into a genuinely separate scratch directory (no shared
`node_modules`, no source aliasing), and asserts the main entry and
every `exports` subpath actually resolve (`require.resolve(...)` for
each) plus that every documented named export imports successfully.
Verified it actually catches the regression it's meant to: reintroduced
#46's exact bug and confirmed the script fails with the precise error a
real consumer would hit, restored the fix, confirmed it passes again.
See `docs/REFACTORING.md` #52.

## Phase 4 — Enterprise-process readiness

**Status: done.** All five items below were implemented, not just planned
— see "What was actually built" for specifics, including one real,
previously-undiscovered bug found while implementing the accessibility
item.

Once the above is in place, the remaining gaps are process/governance
rather than code:

- **`CONTRIBUTING.md`** — how to run the test suite (link to
  `TESTING.md`), the branch/PR/commit-message conventions (conventional
  commits are already used informally; document the standard), and how
  releases happen once semantic-release is in place.
- **`SECURITY.md`** — a disclosure process. There isn't one currently; for
  a library embedded in other people's applications, this matters more than
  it might seem.
- **`CODEOWNERS`** — even a single-maintainer project benefits from this
  once CI-gated PRs are the norm, since it's what enables auto-requesting
  review.
- **Accessibility audit** — grid items are draggable/resizable interactive
  elements with no ARIA roles, keyboard-drag alternative, or focus
  management currently visible in `GridItem.vue`'s template. For "enterprise
  ready," this is likely to come up in a procurement/compliance review
  before almost anything else on this list.
- **License/compliance scan** — a `license-checker-rseidelsohn` CI step flagging any
  transitive dependency under a copyleft license, standard for anything
  procurement will evaluate.

## What was actually built

- **`CONTRIBUTING.md`** — setup, the pre-PR checklist (mirroring
  `ci.yml`'s actual steps), the ESLint-is-advisory caveat explained so
  contributors don't waste time fixing unrelated pre-existing issues,
  commit conventions tied to how `semantic-release` actually consumes
  them, and a pointer to `SECURITY.md` for vulnerabilities specifically.
- **`SECURITY.md`** — private reporting via GitHub's built-in vulnerability
  reporting flow (not a public issue), an explicit scope section (layout
  data / prop input as the main attack surface; the docs site and internal
  demo/sandbox apps explicitly out of scope), and an honest
  no-SLA-but-will-prioritize expectation-setting section rather than an
  invented response-time promise.
- **`.github/CODEOWNERS`** — a single `* @gwinnem` entry. Doesn't do
  anything on its own until branch protection requires review from a code
  owner (a manual repo-settings step, same category as the `NPM_TOKEN`/
  branch-protection items still open from Phase 1).
- **Accessibility**: real keyboard support, not just ARIA labels bolted onto
  a mouse-only widget. A new `useGridItemKeyboard.ts` composable makes
  every non-static, editable `GridItem` keyboard-focusable
  (`tabindex="0"`, `role="group"`) and operable — arrow keys move it,
  Shift+arrow keys resize it — reusing the *exact* same `MOVE`/`MOVED`/
  `RESIZE`/`RESIZED` events and eventBus messages the mouse-driven
  composables already emit, so `GridLayout`'s compaction/collision
  handling applies identically regardless of input method. Deliberately
  scoped to single-unit-step move/resize rather than a full WAI-ARIA grid
  widget pattern (this isn't a traditional data grid) — see
  `docs/ACCESSIBILITY.md` for the full scope, what's still not covered,
  and a genuinely unrelated bug found while implementing this:
  `.visually-hidden` (already used by the close button's screen-reader
  label) was referenced but **never actually defined anywhere** in the
  library's CSS — it had been rendering as plain visible text the whole
  time. Fixed alongside the keyboard work.
- **License scan**: `npm run check:licenses` (`license-checker-rseidelsohn`, scoped to
  production dependencies, allowlisting the common permissive licenses),
  wired into `ci.yml`'s `audit` job as a blocking check. Currently clean —
  verified before adding it as a gate, same practice as the `npm audit`
  gate in Phase 1.

## Suggested sequencing

Phases are ordered by dependency, not just priority — Phase 1 (CI) is much
lower-risk and higher-value *after* Phase 0 (fixing the tools CI would run),
and Phase 2's structural changes are much safer with Phase 1's safety net
already catching regressions automatically rather than relying on manual
review. Phase 3 and 4 can run in parallel with each other and with the
tail end of Phase 2 — they don't block on each other.

| Phase | Effort | Blocks |
|---|---|---|
| 0 — Fix existing tooling | Done | Everything else |
| 1 — CI/CD | Done (branch protection + NPM_TOKEN are manual repo-settings steps) | Safe execution of Phase 2 |
| 2 — Structural standardization | Done (naming sweep also complete — see `docs/REFACTORING.md` #50) | Phase 3's composable-level tests |
| 3 — Testability depth | Done (visual regression needs a one-time baseline-generation step — see docs/VISUAL_REGRESSION.md; the pack-and-install smoke test gap found afterward is also closed — see #52) | — |
| 4 — Process/governance | Done (branch protection requiring CODEOWNERS review is a manual repo-settings step) | — |

The through-line across all four phases: this project already did the hard
part (a real, comprehensive test suite that found 50+ genuine bugs, several
crash-level — see `docs/REFACTORING.md`, still growing as work continues).
The
remaining work is almost entirely about making sure that quality bar is
*enforced going forward* rather than something that has to be manually
re-verified — which is really what "enterprise ready" means in practice.
