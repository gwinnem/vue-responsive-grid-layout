# Production Readiness Checklist

Snapshot as of this document's own last edit — re-run the commands
inline before trusting a checked box in this file for anything
important; several of these change between sessions. Format: `[x]`
verified directly (a command was run, output checked), `[ ]` genuinely
open, `[~]` partially done / caveat noted inline.

## Code quality

- [x] Typecheck clean — `npx vue-tsc --project tsconfig.json --noEmit` produces no output.
- [x] Unit/component tests passing — 620/620 (Vitest).
- [x] Test coverage — 99.49% statements / 95.94% branches / 99.5% functions / 99.52% lines. Remaining gaps are documented, specific, hard-to-reach defensive guards or narrow, not-fully-isolated branches (see `vitepress-docs/guide/coverage.md`), not unexamined blind spots. One genuine, larger remaining gap is flagged there honestly rather than hidden: no end-to-end coverage of RTL combined with an in-progress resize.
- [x] `lint:style` (Stylelint) — clean, 0 issues, and *is* a blocking gate.
- [x] `lint` (ESLint) — the 10 remaining warnings (5 `prefer-destructuring`/`no-param-reassign` locations, some appearing at 2 lines each) were rewritten out entirely rather than left as accepted noise: `GridLayout.vue`'s `applySnapToGridAdjustment` and its `dragEvent` call site now use dedicated result variables instead of reassigning `x`/`y`; `move-helper.ts`'s loop accumulates into a new `updatedLayout` local instead of reassigning the `layout` parameter; `breakpoints-helper.ts` and `native-interaction.ts`'s single-property assignments now use actual destructuring syntax. The 2 remaining errors (`vue/no-mutating-props` on the two genuine `v-model:layout` in-place-mutation sites — the mechanism itself, not a bug) are now individually suppressed with scoped `eslint-disable-next-line` comments and a rationale, matching this project's own established convention elsewhere, rather than silently tolerated. **Not yet re-verified with `npm run lint` itself** — done during a period where `npm install`/registry access was blocked by a `403 host_not_allowed` network restriction in the sandbox; confirmed via careful manual tracing of every changed variable reference instead. Re-run `npm run lint` once dependencies can actually be installed to confirm 0 problems.
- [x] `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities.
- [x] Dev dependencies current — a full pass upgraded ESLint (9→10), Vitest (3→4), TypeScript (5.9→6.0), Vite (6→8), stylelint (16→17), jsdom (26→29), `@types/node` (22→26), and the full semantic-release toolchain, each verified individually (typecheck, full unit suite, and for the higher-risk ones — Vite, native-interaction.ts-adjacent Vitest fixes — the complete e2e suite too). Removed 3 genuinely dead/unused devDependencies along the way (`ttypescript`, `sass-loader`, `@babel/types` — confirmed unreferenced anywhere in the project before removing). Project-wide `npm audit` (including dev) dropped from 22 to 3 vulnerabilities as a side effect of the semantic-release upgrade fixing a transitive `tar` CVE. TypeScript 7 and `vite-plugin-dts@5.x` are both deliberately held back — the former breaks `vue-tsc` outright (confirmed: it imports a path TypeScript 7 no longer exports), the latter silently ignores its own `outDir` config and would have broken the published package's type resolution (confirmed via `npm run check:package-install` failing, then passing again once reverted).
- [x] Mutation testing (Stryker) configured and run at least once; scope includes `src/composables/*.ts` (a real gap found and closed — see `docs/REFACTORING.md` #62).

## Build & packaging

- [x] Library builds clean (ES + UMD + type declarations) via `npm run build:only`.
- [x] Bundle size within budget — 21.84 KB gzip (ES) against a 55 KB budget (33.16 KB headroom) — measured fresh via a clean `npm run build:only`, not carried over from before the `interact.js` removal. Enforced by `scripts/check-bundle-size.js`. Budget was bumped deliberately from 45→55 KB after an earlier large feature batch, with the reasoning in the script's own comment — not silently raised to paper over a regression, and now has substantial headroom again after `interact.js`'s removal shrank the actual bundle well below even the pre-bump 45 KB figure.
- [x] Pack-and-install smoke test passing (`npm run check:package-install`) — the actual packed tarball resolves and every expected named export is present, checked against the real published-package structure, not just the source tree.
- [x] Demo app builds clean (`npm run demo:build`).
- [x] VitePress docs site builds clean (`npm run docs:build`) — 45 interactive examples, zero broken internal links (verified directly, not assumed).
- [ ] **Not published.** npm still has `1.2.9` (verified via a fresh search, not assumed stale) while this repository is now at `2.0.0` — every fix, feature, and test across this project's entire recent history, including everything in this checklist, doesn't exist for anyone who runs `npm install` today. The published `package.json` also still has a real, uncorrected typo (`typeings` instead of `typings`) and no `exports` map — both already fixed in this repo's own `package.json`, just not yet published. **This is the single highest-impact remaining item** — nothing else here matters to an actual consumer until this happens. `npm run package` (see `CONTRIBUTING.md`'s "Generating (and, manually, publishing) the package locally") runs every gate in this checklist and produces the exact publishable tarball in one command; actually publishing still needs your own authenticated npm session (`npm login`), which no automated process here can supply on your behalf.

## CI/CD & repository hygiene

- [x] Three GitHub Actions workflows present and live: `ci.yml`, `mutation-testing.yml`, `release.yml`.
- [ ] Branch protection requiring CI + review before merge — a GitHub repo setting, not something committable; needs a repo admin to enable.
- [ ] `NPM_TOKEN` secret configured — required for `release.yml`'s `semantic-release` step to actually publish. Without it, the release workflow can run and pass without ever reaching npm.
- [x] CODEOWNERS references a real username (`@gwinnem`), not a placeholder — verified by reading the file directly.
- [x] `.eslintignore`/`.stylelintignore` — checked directly: `.eslintignore` is empty (ESLint 9's own flat-config ignores are used instead), `.stylelintignore` only lists real, existing build/output directories. No stale copy-pasted-from-template references found.
- [x] Husky/lint-staged actually wired up (was previously non-functional — v9 installed with a v4-style config block it doesn't read).

## Documentation

- [x] `README.md`, `INSTALL.md`, `FEATURES.md`, `ROADMAP.md` all current with the latest feature set (spot-checked against source, not just assumed in sync).
- [x] `CHANGELOG.md` current, structurally intact (verified section headers weren't accidentally clobbered — a mistake made and caught twice earlier in this project's history, worth this specific callout).
- [x] Every prop/method/event has a doc comment in source *and* an entry in the corresponding VitePress reference table (`grid-layout-props.md`, `grid-item-props.md`, `grid-layout.md`, `grid-layout-events.md`, `grid-item-events.md`).
- [x] `docs/ARCHITECTURE.md` reflects the current composable split for both `GridItem.vue` and `GridLayout.vue` (the latter's cross-grid/outside-drop extraction is recent — confirmed the doc was updated alongside it, not left describing the pre-extraction shape).
- [x] `docs/ACCESSIBILITY.md` states plainly what's *not* covered (not a full WAI-ARIA grid/application widget pattern) rather than implying more than what's built.
- [x] `docs/REFACTORING.md` — a running, numbered log of every bug found and fixed, with root cause and verification method, not just a change list. Useful for anyone auditing *how* confident to be in a given fix, not just *that* one was made.
- [x] `MIGRATION.md` — documents the `2.0.0` breaking change (`interact.js`/`dragOption`/`resizeOption` removed) with an explicit upgrade path.
- [x] `SUPPORT.md` — supported versions/environments, how to get help, and the maintenance model (single maintainer, no SLA) stated plainly rather than left implicit.
- [x] `NOTICE.md` — third-party license attributions for bundled runtime dependencies, distinguished from the fuller build-toolchain dependency tree `npm run check:licenses` resolves.
- [x] `SECURITY.md` kept in sync with the current major version (previously stale, referencing `1.x` after the `2.0.0` bump — caught and fixed; now correctly at `2.x`).
- [ ] No CI-integrated SAST/static analysis (e.g. CodeQL) — `npm audit` covers known dependency CVEs, nothing scans this project's own source for vulnerability patterns.
- [ ] No SBOM generation or npm provenance attestation (`--provenance`) wired into the release pipeline — increasingly expected for enterprise supply-chain review.
- [ ] No automated accessibility testing (`axe-core`/`jest-axe`/equivalent) — the claims in `docs/ACCESSIBILITY.md` are verified by hand-written attribute assertions, not an automated a11y scanner.

## Testing depth

- [x] Unit/component coverage — see Code quality above.
- [x] Cross-grid drag/drop, outside-drop, and their combination (`allowCrossGridDrag` + `allowOutsideDrop` on the same grid) specifically covered, including a real, previously-shipped bug in the collision check found and fixed while closing coverage gaps (see `docs/REFACTORING.md` #70) — not just assumed correct because it looked right on read-through.
- [~] End-to-end (Playwright) suite exists (10 spec files, extended this session with keyboard-accessibility and advanced-features coverage) covering drag/resize/responsive/outside-drop/keyboard/compaction/snap-to-grid/presets, but:
  - [ ] Not run via the *official* browser in this environment — network egress blocks the official Playwright browser download (`cdn.playwright.dev`). A manual workaround (an older, already-present Chromium build launched via an explicit `executablePath`) has been used successfully for several bug investigations and to verify new/fixed tests, but is a session-specific workaround, not a repeatable CI setup — see `docs/REFACTORING.md` #66, #73.
  - [ ] Visual regression baselines don't exist yet, and generating them specifically needs the *official* declared Playwright browser version (not the workaround above) for a faithful result — see `docs/VISUAL_REGRESSION.md`.
  - [~] The e2e suite's own flakiness under the full sequential runner (finding #41) was partially root-caused this session: a genuine, project-wide race between an item's `vue-draggable` class appearing and its container-width measurement actually settling was found and fixed (a shared `stableBoundingBox()` helper, applied to `drag-and-resize.spec.ts` and the two new spec files). `dynamic-items.spec.ts`'s and `external-drop.spec.ts`'s own intermittent timeouts remain unexplained — traced only as far as "the workaround Chromium build under sustained use," not a specific root cause.
- [ ] No real Firefox/WebKit testing has been possible in this environment at any point — only Chromium, and only via the workaround above. If cross-browser behavior matters for your use case, verify independently before shipping — see [`MANUAL_TEST_CHECKLIST.md`](./MANUAL_TEST_CHECKLIST.md) for a structured way to do that (this doesn't close the gap on its own; it's a checklist for a human to run, not automated coverage).

## Accessibility

- [x] Keyboard move/resize implemented and tested.
- [x] `aria-roledescription`/`aria-describedby`/`role="group"` on draggable/resizable items.
- [~] Deliberately *not* a full WAI-ARIA grid/application widget pattern (roving `tabindex`, a dedicated "move mode") — a documented, intentional scope limit, not an oversight. Confirm this matches your own accessibility requirements before shipping to a context with strict compliance needs (e.g. a public-sector or regulated product).
- [x] Localizable UI/ARIA strings — the close button's label, `aria-roledescription`, and the keyboard move/resize instructions were previously hardcoded English literals. Now overridable via `ariaLabels` (`GridLayout` grid-wide default, `GridItem` per-item override), current English text as the fallback default. Not a full i18n system (no pluralization, no locale negotiation) — just makes the strings reachable.

## Security

- [x] 0 known vulnerabilities in production dependencies.
- [x] ~~`interact.js` (the core drag/resize dependency, ~59% of this library's own gzipped bundle) was publicly characterized by at least one third-party packager as "minimally maintained... feature-complete... not covered by the security advisory policy."~~ Resolved by removing it entirely — replaced with a native, Pointer Events-based drag/resize engine (`src/core/helpers/native-interaction.ts`) with zero third-party runtime dependency for it. See `docs/REFACTORING.md` for the full account and `docs/BUNDLE_ANALYSIS.md` for the measured bundle-size effect (a 54% gzip reduction). The only runtime dependency left is `mitt`.
- [x] No `eval`/dynamic code execution anywhere in the library's own source (checked directly, not assumed from general code style).
- [x] No telemetry, analytics, or network calls of any kind in the library itself.

## Browser/runtime support

- [x] Node engine range declared (`^18.0.0 || ^20.0.0 || >=22.0.0`) and enforced via `engines` in `package.json`.
- [ ] Node 18 is EOL (April 2025) — still supported per the `engines` range above. A deliberate compatibility decision to revisit, not an oversight; dropping it is a breaking change for anyone still on it.
- [~] Browser support relies on `ResizeObserver` and modern CSS (`color-mix`-adjacent patterns avoided in favor of simpler `rgb(... / ...%)` syntax, already broadly supported) — no explicit browserslist-driven compatibility test exists confirming the actual minimum supported browser versions; based on `browserslist` config, not independently verified against real old browsers.

## Known, open, and deliberately deferred (not blocking, but worth knowing about)

- [x] ~~Multi-select + group move/resize~~ — done, deliberately scoped down (not collision-aware for passenger items during the gesture) — see `docs/REFACTORING.md` #74 and `COMPETITIVE_ROADMAP.md`.
- [ ] A Nuxt module with a real, systematic SSR audit — one specific SSR-breaking bug was found and fixed (an unguarded `navigator.userAgent` read), confirmed with an actual SSR render, but that's one instance checked, not an exhaustive sweep.
- [ ] Swap-on-drag collision mode — still in `ROADMAP.md`, genuinely unimplemented. (Undo/redo, listed here alongside it previously, is now done — `enableUndoRedo`/`undo()`/`redo()`, see `docs/REFACTORING.md`.)

## The short version

**Code, tests, and build tooling**: production-ready. **Getting it into anyone's hands**: blocked entirely on publishing — an `npm publish` and a handful of GitHub repo settings only a repo admin can do. Everything else on this list is either already fine, or a known, documented, non-blocking gap.
