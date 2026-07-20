# Third-Party Notices

This project is MIT licensed (see [`LICENSE`](./LICENSE)). It bundles or
depends on the third-party software listed below, each under its own
license. This file exists for enterprise legal/procurement review; MIT
itself doesn't require a notices file, but many organizations expect one
regardless before approving a dependency.

## Runtime dependencies bundled into the shipped package

These are the packages actually declared under `dependencies` in
`package.json`, and whose code is bundled into `dist/` — see
[`docs/BUNDLE_ANALYSIS.md`](./docs/BUNDLE_ANALYSIS.md) for exactly how
much of the shipped bundle each one accounts for.

| Package | License | Homepage |
|---|---|---|
| `mitt` | MIT | <https://github.com/developit/mitt> |

Until this library's own native drag/resize engine replaced it
entirely (`src/core/helpers/native-interaction.ts` — see
`docs/REFACTORING.md`), `@interactjs/*` and its transitive dependencies
were bundled here too, all MIT-licensed under `taye/interact.js`. That
dependency is gone from `package.json` as of this writing — `mitt` is
the only runtime dependency left.

## Peer dependency

`vue` (`^3.0.0`) is a **peer dependency**, not bundled — the consuming
application supplies its own copy. See
[Vue's own license](https://github.com/vuejs/core/blob/main/LICENSE)
(MIT).

## Full production dependency tree (for completeness)

Running `npm run check:licenses`
(`license-checker-rseidelsohn --production`) resolves every package in
the *full* dependency graph reachable from `dependencies` — including
several transitive build-time packages (`typescript`, `postcss`,
`magic-string`, `nanoid`, and similar Vue/Rollup-internal tooling) that
license-checker reports because they're technically reachable, but
which are **not** bundled into the shipped `dist/` output (they're
compiler/tooling internals, not runtime code this library executes).
The table above is the accurate list of what's actually bundled;
this section is here only so a from-scratch license audit
(`npm run check:licenses`) doesn't appear to contradict this file.

All packages currently resolved by that command are one of: MIT,
BSD-2-Clause, BSD-3-Clause, ISC, or Apache-2.0 — the same allowlist
`scripts/check-package-install.js`'s sibling license-check CI gate
enforces (see `.github/workflows/ci.yml`). None are copyleft
(GPL/LGPL/AGPL) or otherwise restrictive.

## Keeping this file current

This file is not automatically regenerated. If a new runtime dependency
is added to `package.json`'s `dependencies` (not `devDependencies`),
update the bundled-dependencies table above in the same change —
`npm run check:licenses` will catch a *disallowed* license automatically,
but it won't catch this file simply being out of date about which
packages exist.
