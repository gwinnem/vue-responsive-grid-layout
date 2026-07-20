# Bundle Analysis

Reproduce with `npm run analyze`, which writes a treemap to
`dist-analyze/stats.html` and prints exact sizes.

## Headline numbers

**Current** (re-measured directly against a fresh build):

| File | Size | Gzip |
|---|---|---|
| `vue-ts-responsive-grid-layout.es.js` | 79.48 KB | 21.84 KB |
| `vue-ts-responsive-grid-layout.umd.js` | 56.54 KB | 18.30 KB |
| `vue-ts-responsive-grid-layout.css` | 7.11 KB | 1.55 KB |

**The single biggest change in this project's history**: `interact.js`
was removed entirely, replaced with a native, Pointer Events-based
drag/resize engine (`src/core/helpers/native-interaction.ts`) with zero
third-party runtime dependency for it. The ES bundle dropped from
44.66 KB to 20.52 KB gzip — a **54% reduction** — in one change (that
20.52 KB figure is the measurement taken at the time of that specific
change, not the current headline number above — the small difference
since then is later feature work, e.g. `useUndoRedo`, not a regression
in the removal itself). See
`docs/REFACTORING.md` for the full account of what was reimplemented
and why it was tractable (the actual interact.js surface this project
used turned out to be narrow: start/move/end callbacks,
`allowFrom`/`ignoreFrom` filtering, per-edge resize targets, and
aspect-ratio preservation — most of the hard part, the grid math
itself, was always this library's own code, not interact.js's). This
one change is a bigger lever than every other bundle-size finding in
this document's history combined, and is preserved below in an
"Archive" section rather than deleted, since the earlier findings are
still accurate for the period they describe.

Every dependency listed under `package.json`'s own `dependencies` is
now just `mitt` (a ~200-byte event emitter). Production dependencies
report **zero known vulnerabilities** (`npm audit --omit=dev
--audit-level=high`), and — unlike interact.js's own "minimally
maintained" status this document used to have to weigh — there's no
third-party drag/resize dependency left to monitor for that at all.

The bundle-size budget (`scripts/check-bundle-size.js`) stays at 55 KB
gzip rather than being dropped to match the new, much smaller number —
headroom for future features (35.04 KB of it right now) is more useful
than a tight budget that would need raising again almost immediately.

## Where the bytes actually come from now

With `interact.js` gone, this library's own code
(`src/components`, `src/core`, `src/composables`, `src/hooks`) *is*
essentially the entire bundle — there's no third-party runtime
dependency of any real size left to break out separately. Run
`npm run analyze` for the current per-module treemap if a finer
breakdown is ever needed again; with a single ~20 KB gzip total spread
across ~50 first-party modules, no individual module dominates the way
`@interactjs/*` combined used to (peaking at roughly 59-63% of the
total bundle across this document's history, per the archived
measurements below).

## Specific, fixable issues

### 1. Package metadata bugs that affect resolution, not just size — fixed

This section originally flagged two `package.json` field bugs found
while inspecting the built output:

```json
"module": "vue-ts-responsive-grid-layout.es.js",   // was missing "dist/" prefix
"typeings": "./dist/types/components/index.d.ts",  // was a typo — should be "types"
```

**Both are already fixed in this repository's current `package.json`**
(verified directly, not assumed): `module` now reads
`"dist/vue-ts-responsive-grid-layout.es.js"` with the correct prefix,
and the `typeings` typo field is gone entirely — type resolution now
goes through the modern `exports["."].types` field instead
(`"./dist/types/components/index.d.ts"`), which is what tooling
actually reads today rather than depending on the legacy field at all.
Left in this document as a record of what was found and fixed, not as
an open item — see `PRODUCTION_READINESS.md` for what's genuinely still
open (publishing itself, not this).

## Suggested priority order

With `interact.js` removed and the metadata bugs already fixed, there's
no outstanding bundle-size item left to prioritize from this document's
own history. Anything further would be marginal (the remaining ~20 KB
gzip is almost entirely this library's own feature code, not a
third-party dependency ripe for removal) — see `ROADMAP.md`/
`COMPETITIVE_ROADMAP.md` for what's actually still open, which by this
point is feature scope, not bundle composition.

---

## Archive: history prior to the `interact.js` removal

Kept for the record, not as current guidance — every number and
finding below predates the native-engine rewrite above, and describes
a dependency (`interact.js`) that no longer exists in this project at
all.

### Headline numbers, historical

| Point in history | ES bundle (gzip) |
|---|---|
| Original baseline | 45.19 KB |
| After `@interactjs/dev-tools` removed from production | — |
| After `element-resize-detector` → native `ResizeObserver` | 37.47 KB |
| After a large feature batch (multi-select, custom resize handles, etc.) | 44.79 KB |
| **After `interact.js` removed entirely (current)** | **20.52 KB** |

Both rounds of growth between the second and fourth rows reflected
real, shipped feature surface — cross-grid drag/drop, drag-and-drop
from outside the grid, keyboard accessibility, a persistence helper,
configurable transitions, a custom drag-placeholder slot, alignment
guides, multi-select, custom resize handles, and more — not unexplained
bloat; see `CHANGELOG.md` for the full feature list each round
corresponds to.

### Where the bytes came from, historical (pre-removal)

Re-measured at the time using two independent methods:

**Method 1 — per-module rendered (pre-minify, pre-gzip) size**, via
the Rollup treemap, `renderedLength` inspected per module:

| Source | Bytes | % of bundle |
|---|---:|---:|
| This library's own code (`src/components`, `src/core`, `src/composables`, `src/hooks`) | 103,908 | 37.1% |
| `@interactjs/core` | 75,107 | 26.8% |
| `@interactjs/modifiers` | 36,117 | 12.9% |
| `@interactjs/utils` | 23,874 | 8.5% |
| `@interactjs/auto-start` | 16,031 | 5.7% |
| `@interactjs/actions` | 15,591 | 5.6% |
| `@interactjs/auto-scroll` | 6,284 | 2.2% |
| `@interactjs/snappers` | 2,639 | 0.9% |
| `@interactjs/interact` | 405 | 0.1% |
| `mitt` | 312 | 0.1% |

`@interactjs/*` combined: 176,048 bytes, 62.9% of that pre-minify total.

**Method 2 — direct, independent measurement**: a standalone build
containing *only* the exact `@interactjs/*` imports this library used
at the time, run through the identical Vite/Rollup/esbuild pipeline as
the real library build:

```
interactjs alone:  98.73 KB raw / 26.45 KB gzip
Full library:     163.49 KB raw / 44.79 KB gzip
```

interactjs's share of that gzipped bundle: **26.45 / 44.79 ≈ 59%**.

### Maintenance status, historical — the reasoning that eventually led to removal

- The most recent `interactjs` npm release (`1.10.27`) was roughly two
  years old at the time, with a visible GitHub issue backlog and no
  clear resolution pattern.
- Drupal.org's own library listing classified it as **"Minimally
  maintained... Considered feature-complete by its maintainers... This
  project is not covered by the security advisory policy."**
- Against that: `npm audit` reported **zero** known vulnerabilities for
  it at the time, too — "minimally maintained" and "no known CVEs" were
  both true simultaneously, which is why this document's own historical
  conclusion was *not* to swap it out solely for being a bit old, given
  the scale of the undertaking. That undertaking was eventually done
  anyway (see the top of this document) once its actual scope was
  mapped out precisely and found to be more tractable than "rewrite the
  entire drag/resize system" made it sound.

### `@interactjs/dev-tools` shipping in production, historical — fixed

`@interactjs/dev-tools` was a `devDependencies` entry that had leaked
into the production import graph. Fixed by moving the import behind a
dev-only conditional, before being made entirely moot by the full
removal above.

### The full `@interactjs/modifiers` barrel, historical — fixed, then moot

Only interact.js's `aspectRatio` modifier was ever used, but the full
barrel import pulled in every modifier. Fixed with a direct,
non-barrel import at the time; made entirely moot once `preserveAspectRatio`
was reimplemented natively (see the top of this document).

### `element-resize-detector`, historical — fixed in an earlier phase

`GridLayout.vue` used `element-resize-detector` purely to observe the
grid container's width — exactly what the native `ResizeObserver` API
does, with no polyfill needed for this project's browserslist target.
Migrated to `ResizeObserver` directly; `element-resize-detector` and its
`@types` package were removed from `package.json` entirely. Measured
effect at the time: the ES bundle dropped from 165.92 KB / 45.19 KB
gzip to 139.07 KB / 37.47 KB gzip — a 17% reduction in gzipped size
from that one change alone (the second-largest single lever in this
project's history, after the `interact.js` removal above).
