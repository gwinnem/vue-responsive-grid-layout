# Contributing to vue-ts-responsive-grid-layout

Thanks for considering a contribution. This document covers the practical
mechanics — for the bigger picture of how the codebase is organized, see
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); for the current state of
known gaps and in-progress work, see
[`docs/REFACTOR_STRATEGY.md`](./docs/REFACTOR_STRATEGY.md) and
[`docs/REFACTORING.md`](./docs/REFACTORING.md).

## Getting set up

```sh
git clone https://github.com/gwinnem/vue-responsive-grid-layout.git
cd vue-responsive-grid-layout
npm install
```

Node `^18.0.0 || ^20.0.0 || >=22.0.0` (see `engines` in `package.json`).

Useful commands while working:

```sh
npm run dev             # Vite dev server for the sandbox
npm run demo            # the demo app (what e2e tests run against)
npm run docs:dev        # the VitePress documentation site
npm run test            # Vitest, watch mode
npm run typecheck       # vue-tsc, no emit
```

## Before opening a PR

Run the same checks CI runs:

```sh
npm run typecheck
npm run lint:style       # must be clean — this one's a hard gate
npm run lint             # advisory for now; see the note below
npm run test:coverage    # must stay at or above 90% on all four metrics
npm run build:only
npm run demo:build
npm run docs:build
```

See [`docs/TESTING.md`](./docs/TESTING.md) for how the test suite itself
is organized (unit, component, e2e) and what's mocked and why.

### About the ESLint gate

`npm run lint` currently reports a few hundred pre-existing issues that
predate this project having a working ESLint config at all (see
`docs/REFACTORING.md` #6) — it's advisory in CI (`continue-on-error:
true`), not blocking, specifically so it doesn't fail your PR over debt
you didn't introduce. Please don't add *new* lint issues, but you're not
expected to fix unrelated pre-existing ones in an unrelated PR.

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/),
enforced informally via [Commitizen](https://commitizen-tools.github.io/commitizen/):

```sh
npm run commit
```

walks you through generating a properly-formatted commit message. This
matters beyond style — `semantic-release` (see
[`.releaserc.json`](./.releaserc.json) and
`.github/workflows/release.yml`) parses commit messages to decide the next
version number and generate `CHANGELOG.md` automatically on every merge to
`main`. A `fix:` commit triggers a patch release, `feat:` a minor release,
and `feat!:`/a `BREAKING CHANGE:` footer a major release — get the type
wrong and you'll get the wrong kind of release.

## Tests are not optional

This project has a specific, documented history of bugs that survived
because tests didn't actually assert what they looked like they asserted
(`docs/REFACTORING.md` #8), and multiple real bugs found specifically
*because* someone was writing a test (`docs/REFACTORING.md` #16, #25, #26).
A PR that changes behavior without a test covering that behavior will be
asked for one — not as a formality, but because that's literally how this
codebase has found its worst bugs.

If you're touching `GridItem.vue`/`GridLayout.vue` or their composables,
`docs/TESTING.md`'s "Component testing approach" section explains the
mocking setup (`ResizeObserver`, `@interactjs/interact`) you'll need to
work with.

## How releases happen

Nothing manual: merging to `main` triggers
`.github/workflows/release.yml`, which runs `semantic-release` — it
determines the version bump from commit messages since the last release,
updates `CHANGELOG.md`, publishes to npm, and creates a GitHub release.
See [`docs/REFACTOR_STRATEGY.md`](./docs/REFACTOR_STRATEGY.md)'s Phase 1
section for the full CI/CD picture, including what still requires a
maintainer's one-time setup (an `NPM_TOKEN` secret, branch protection).

### Generating (and, manually, publishing) the package locally

`npm run package` runs every quality gate this project has —
typecheck, `lint:style`, the dependency license allowlist, the full
test suite, the build, the bundle-size budget check, and the
pack-and-install smoke test — then produces the exact tarball
`npm publish` would push (`vue-ts-responsive-grid-layout-<version>.tgz`
in the repo root). Useful for inspecting exactly what a release would
contain before merging, or for a manual publish outside the normal
`semantic-release` flow.

```sh
npm run package                    # full pipeline, stops before publish
npm run package -- --skip-tests    # faster local dry run only — do not
                                    # use a tarball built this way for an
                                    # actual release
```

This stops short of actually publishing on its own — that needs your
own authenticated npm session (`npm login`), not something the script
can do for you. Once the tarball is built:

```sh
npm login                                          # if not already
npm publish vue-ts-responsive-grid-layout-<version>.tgz
```

Or, if you're already logged in and want the script to also run
`npm publish` itself once everything above passes (it still checks
you're authenticated first, and still asks for one explicit
confirmation before the actual publish, since that's the one step here
that can't be undone the way every earlier step can be re-run):

```sh
npm run package -- --publish
```

## Reporting bugs / requesting features

Open an issue on
[GitHub](https://github.com/gwinnem/vue-responsive-grid-layout/issues).
For a bug report, a minimal reproduction (a fork of one of the
[examples](https://github.com/gwinnem/vue-responsive-grid-layout/tree/main/vitepress-docs/examples)
is a good starting point) makes it much faster to confirm and fix.

## Reporting security issues

Please don't open a public issue for a security vulnerability — see
[`SECURITY.md`](./SECURITY.md) for the disclosure process.
