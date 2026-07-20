# Enabling mutation testing (Stryker)

This is Phase 3 from `docs/REFACTOR_STRATEGY.md`: coverage tells you which
lines *ran*, not whether the assertions around them would actually catch a
bug. [`docs/REFACTORING.md`](./REFACTORING.md) finding #8 is the concrete
example that motivated this — two existing tests called
`expect(() => x.toBe(y))` instead of `expect(x).toBe(y)`, which never
invokes `x` at all, so they passed regardless of what the code under test
did. They showed up as 100% covered. [Stryker](https://stryker-mutator.io/)
is the systematic version of catching that: it makes small deliberate
changes to the source (a "mutant" — e.g. flipping `>` to `>=`, or `&&` to
`||`) and re-runs the tests. If a mutant survives (the suite still passes),
that's a line whose behavior isn't actually pinned down by a test, coverage
number notwithstanding.

## Status: configured, not run on every PR

Stryker is already installed (`@stryker-mutator/core`,
`@stryker-mutator/vitest-runner`) and configured (`stryker.conf.json`) —
there's nothing to "enable" in the sense of adding new dependencies. What
this doc covers is *how to run it*, since it's deliberately **not** wired
into the main `ci.yml` PR gate.

## Why it isn't a per-PR check

Mutation testing re-runs the test suite once per mutant. The scope at
the time this was last actually run end-to-end generated **~1,365
mutants** across 33 files. The scope has grown since (currently 40
files — `src/composables/*.ts` was added to cover the persistence
helper's public composable, which had been an unintentional gap; see
below), so the current exact mutant count is higher than 1,365, but
hasn't been re-measured by actually running the full suite in this
environment (each run takes well over 20 minutes, impractical to spend
just to get an updated headline number). The reasoning in this document
about *why* it isn't a per-PR check holds regardless of the exact
current count. Even with per-mutant
optimizations Stryker already does (only re-running tests that actually
cover the mutated line, via `coverageAnalysis: "perTest"`), that's still
enough test-runner invocations to take a long time — on a single-core
machine, comfortably over 20 minutes; expect it to be faster on a
multi-core CI runner (Stryker uses however many cores are available by
default), but still nowhere near "fast enough to block a PR on."

That's why `.github/workflows/mutation-testing.yml` runs it **on a weekly
schedule** (Monday 03:00 UTC) plus on-demand via
`workflow_dispatch`, uploading the HTML report as a build artifact —
exactly the "periodic, not per-PR" shape `docs/REFACTOR_STRATEGY.md`
called for.

## Running it locally

```sh
npm run test:mutation
```

This runs `stryker run` using `stryker.conf.json`. Expect it to take a
while (see above) — it prints live progress (`Mutation testing 12%
(elapsed: 3m, remaining: ~22m) ...`) so you can see it's working, not
hung.

When it finishes, open the HTML report:

```sh
open reports/mutation/index.html   # macOS
xdg-open reports/mutation/index.html  # Linux
```

It highlights every mutated line with a killed/survived/timeout badge —
survived mutants are the actionable output: each one is a specific,
concrete gap ("this line's behavior isn't pinned down by any assertion")
rather than a vague "coverage is low" signal.

### Running against a smaller scope while iterating

Editing `stryker.conf.json`'s `mutate` array to a single file (or a small
directory) makes local iteration much faster while you're actively
closing gaps it finds, e.g.:

```json
"mutate": ["src/core/validators/margin-validator.ts"]
```

Revert to the full scope before committing — see [What's in scope](#whats-in-scope-and-why)
below for the actual configured value.

## What's in scope, and why

```json
"mutate": [
  "src/core/**/*.ts",
  "src/components/Grid/composables/*.ts",
  "src/hooks/*.ts",
  "!src/**/*.d.ts"
]
```

**`.vue` files are deliberately excluded.** Stryker's mutant placement
for Vue SFCs isn't first-class the way it is for plain `.ts`/`.js` — and
after the Phase 2 composable extraction (see
[`docs/ARCHITECTURE.md`](./ARCHITECTURE.md)), the bulk of the intricate,
worth-mutation-testing logic (drag/resize math, responsive breakpoint
resolution, collision handling) already lives in `.ts` composables and
`core/**` helpers, not in the `.vue` files' `<script setup>` blocks
themselves (which are now mostly wiring: props, watchers, calling into
the composables). This scoping was a deliberate trade-off, not an
oversight — extending it to `.vue` files is possible in principle if
Stryker's Vue support matures, but wasn't attempted here.

Pure type-only files (interfaces, enums with no runtime logic) aren't
explicitly excluded but contribute no mutants anyway — there's nothing in
them for Stryker to mutate.

## Verifying it actually works (what was checked before committing this)

Configuration was validated by actually running it, not just written and
assumed correct:

- A minimal single-file scope (`margin-validator.ts`) ran end-to-end in
  ~26 seconds and found real survived mutants despite that file already
  being at 100% line/branch coverage — direct confirmation that this adds
  signal beyond what `npm run test:coverage` already provides.
- The full configured scope (33 files, 1,365 mutants, at the time this
  was verified — see the note above about the scope growing since) was
  confirmed to instrument correctly and begin executing mutants with
  real kill/survive results, rather than run to completion in one sitting (see the timing
  discussion above for why).
- One real configuration pitfall was hit and is worth knowing about if you
  change `ignorePatterns`: **don't add `tests` to it.** Stryker's `vitest`
  runner locates related tests via Vitest's own dependency-graph analysis,
  which needs the test files themselves visible in the sandboxed project
  copy Stryker builds — excluding the `tests/` directory produces `No
  tests were executed. Stryker will exit prematurely`, which looks like a
  test-runner integration failure but is actually just this.

## Interpreting results going forward

Not every survived mutant is worth chasing — some represent genuinely
equivalent code (a mutant that changes behavior in a way no reasonable
input could distinguish) or low-value edge cases. Treat the report as a
prioritized list of *candidates* for a new test, the same way
`docs/REFACTORING.md`'s coverage-driven findings were: read the surviving
mutant, decide whether the untested behavior it represents matters, and
either add an assertion for it or note why not.
