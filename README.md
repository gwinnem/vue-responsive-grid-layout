<div style="text-align: center">

[![CI](https://github.com/gwinnem/vue-responsive-grid-layout/actions/workflows/ci.yml/badge.svg)](https://github.com/gwinnem/vue-responsive-grid-layout/actions/workflows/ci.yml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat)](https://github.com/prettier/prettier)
[![npm bundle size](https://img.shields.io/bundlephobia/min/vue-ts-responsive-grid-layout)](https://bundlephobia.com/result?p=vue-ts-responsive-grid-layout)
[![npm](https://img.shields.io/npm/v/vue-ts-responsive-grid-layout)](https://www.npmjs.com/package/vue-ts-responsive-grid-layout)
[![NPM](https://img.shields.io/npm/l/vue-ts-responsive-grid-layout)](https://github.com/gwinnem/vue-ts-responsive-grid-layout/blob/master/LICENSE)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/gwinnem/vue-responsive-grid-layout/main/docs/Data%20Grid.svg" height="200" alt="logo">
</p>

<h1 align="center">vue-ts-responsive-grid-layout</h1>

<h2 align="center">
  <a href="https://vue-ts-responsive-grid-layout.winnem.tech" target="_blank">Documentation Website — 45 interactive examples</a>
</h2>

## What this actually is

A Vue 3, TypeScript-native library for building **draggable, resizable,
responsive dashboard layouts** — the kind of thing you'd use to let a
user rearrange widgets, charts, or panels on a screen, with drag,
resize, responsive breakpoints, and collision handling built in.

It is **not** a data table/grid. If you're looking for sorting,
filtering, paging, or spreadsheet-style rows and columns, this isn't
that (see [`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md)
for exactly that distinction, spelled out against Kendo/AG-Grid-style
products). This is closer in spirit to `react-grid-layout` or
`gridstack.js` — but for Vue 3, written in TypeScript from the ground
up rather than ported from an older codebase.

## Why this exists

The most popular Vue option in this space,
[`vue-grid-layout`](https://github.com/jbaysolutions/vue-grid-layout)
(~7.4k stars), **still has no official Vue 3 release** — its own GitHub
issues show people asking for a Vue 3 alternative as far back as 2022.
What filled that gap instead is a handful of independently-maintained
community forks (`vue-grid-layout-v3`, `vue3-grid-layout-next`, at
least one explicitly marked "no longer supported"), with no obvious
default among them.

`vue-ts-responsive-grid-layout` is a ground-up TypeScript rewrite built
specifically to be the option in that gap with the most complete
feature set and the most rigorously tested codebase — not a patch on
top of the original Vue 2 source. See
[`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md) for the
full, search-grounded comparison, including where this library is
genuinely ahead of every alternative checked (magnetic snap-to-grid,
visual alignment guides, named layout presets, SVG export, localizable
ARIA strings) and where it's genuinely behind (ecosystem age, no
multi-select yet, Vue-only by design).

## Quick start

```sh
npm install vue-ts-responsive-grid-layout
```

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { GridLayout, GridItem, type TLayout } from 'vue-ts-responsive-grid-layout';
import 'vue-ts-responsive-grid-layout/style.css';

const layout = ref<TLayout>([
  { h: 2, i: '0', w: 2, x: 0, y: 0 },
  { h: 2, i: '1', w: 2, x: 2, y: 0 },
  { h: 4, i: '2', w: 2, x: 4, y: 0 },
]);
</script>

<template>
  <GridLayout v-model:layout="layout" :col-num="12" :row-height="30">
    <GridItem v-for="item in layout" :key="item.i" :h="item.h" :i="item.i" :w="item.w" :x="item.x" :y="item.y">
      {{ item.i }}
    </GridItem>
  </GridLayout>
</template>
```

That's a fully draggable, resizable, auto-compacting grid — no other
setup required. `vue` (`^3.0.0`) is a peer dependency. See
[`INSTALL.md`](./INSTALL.md) for Options API usage, and the
[documentation site](https://vue-ts-responsive-grid-layout.winnem.tech)
for every prop, event, and the full example catalog.

A focused demo app lives in [`demo/`](./demo) (`npm run demo`) — see
[`demo/README.md`](./demo/README.md). The `sandbox/` app is a separate,
larger test bench used for manually exercising every prop during
development.

**Using just the grid math, without Vue?** `vue-ts-responsive-grid-layout/core`
exports the same collision detection, compaction, movement, and
alignment functions the components above are built on — zero Vue
dependency, no live DOM required, plain data in and out:

```ts
import { collides, compactLayout, moveElement } from 'vue-ts-responsive-grid-layout/core';
```

Useful for validating a layout server-side, or building an entirely
different UI on the same algorithms. See `src/core/index.ts` for the
complete export list.

<br/>

## Donate

If you enjoyed this project — or just feeling generous, consider buying me a 🍺. Cheers!

<br/>

<a href="https://paypal.me/gwinnem/">
    <img src="https://raw.githubusercontent.com/gwinnem/vue-responsive-grid-layout/dev/docs/paypal-images/blue.svg" height="40" alt="paypal">
</a>

<br/>

## Features

Full reference, organized by category with live example links, in
[`FEATURES.md`](./FEATURES.md). The headline items — several with no
equivalent in any alternative checked in
[`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md):

* **Core layout** — grid-unit positioning with automatic pixel
  conversion, `v-model:layout`, auto-sizing container (grid-level and
  per-item `autoHeight`), visible grid lines, visual alignment guides
  *and* magnetic `snapToGrid` (a real distinction — one shows where
  edges line up, the other actually moves the item), CSS transform
  positioning, a generic `ILayoutItem<TMeta>` for attaching typed
  consumer data to each item.
* **Drag and resize** — drag from anywhere on an item by default;
  resize from all eight edges/corners with cursor affordance and
  optional visible handles (`showResizeHandles`/`resizeHandleColor`);
  drag-handle/ignore selectors; bounded dragging; aspect-ratio locking;
  per-item size constraints; keyboard move/resize (arrow keys / shift+
  arrow); a blocked-move feedback event
  (`MOVE_BLOCKED_BY_COLLISION`) for shake/flash/toast UI without
  reimplementing collision detection yourself.
* **Collision and compaction** — vertical compaction, `preventCollision`,
  horizontal shift, static items excluded from cascades, on-demand
  `compactNow()`/`rearrange()`, collision-safe `duplicateItem(id)`, a
  pluggable `compactor` prop for replacing the compaction algorithm
  entirely.
* **Responsive layouts** — predefined layouts per breakpoint, with
  auto-generation for breakpoints without one.
* **Multi-grid and drag-and-drop** — drag items between independent
  `GridLayout` instances (`allowCrossGridDrag`), and from outside the
  grid system entirely via native HTML5 drag-and-drop
  (`allowOutsideDrop`, `outsideDropAccept` to reject incompatible
  drags, a typed-payload helper for the drop event).
* **Editing and lifecycle** — a close button, edit-mode toggle,
  add/remove items without rebuilding the grid, opt-in undo/redo
  (`enableUndoRedo`) at committed-change granularity.
* **Styling and customization** — border radius, configurable
  transition duration/easing, a slot for custom drag-placeholder
  content, automatic RTL support (including resize from every edge,
  verified in both directions).
* **Persistence** — `useLayoutStorage`/`serializeLayout`/`deserializeLayout`
  for a single saved layout, plus `useLayoutPresets` for saving and
  switching between several named arrangements of the same items.
* **Export** — `exportLayoutAsSvg()`, a dependency-free grid-to-image
  export for a report, thumbnail, or "share my dashboard" feature.
* **Accessibility** — keyboard move/resize, `aria-roledescription`/
  `role="group"` on interactive items, and localizable UI/ARIA strings
  (`ariaLabels`) — not a full WAI-ARIA grid/application pattern by
  design; see [`docs/ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md) for
  the explicit scope.

## Built to a higher testing bar than most projects in this space

* 99%+ statement/branch coverage, enforced, not aspirational
* Mutation testing (Stryker) on the core composables, not just line
  coverage
* Unit/component tests via [Vitest](https://vitest.dev/) +
  [@vue/test-utils](https://test-utils.vuejs.org/), with a
  [Vitest UI](https://vitest.dev/guide/ui.html#vitest-ui) test console
* e2e tests via [Playwright](https://playwright.dev/) — see
  [`docs/TESTING.md`](./docs/TESTING.md)
* A pack-and-install smoke test that verifies the actual published
  tarball resolves and exports correctly — not just that the source
  tree looks right
* Every finding — bug fixes, design decisions, things tried and
  rejected — logged with root cause and verification method in
  [`docs/REFACTORING.md`](./docs/REFACTORING.md), not just a changelog
  line

## Reports & documentation

* [`INSTALL.md`](./INSTALL.md) — installation guide for consumers of the package, with usage examples
* [`MIGRATION.md`](./MIGRATION.md) — upgrading between major versions; states plainly whether a release has breaking changes rather than leaving that implicit in the changelog
* [`SUPPORT.md`](./SUPPORT.md) — how to get help, supported versions/environments, and the maintenance model stated plainly (including bus-factor)
* [`NOTICE.md`](./NOTICE.md) — third-party license attributions for bundled dependencies
* [`FEATURES.md`](./FEATURES.md) — comprehensive reference of every feature currently implemented, organized by category
* [`ROADMAP.md`](./ROADMAP.md) — suggested next features, not a task list nobody's committed to
* [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) — checked, not assumed: what's actually verified, what's a known gap, and what's blocking real-world use
* [`MANUAL_TEST_CHECKLIST.md`](./MANUAL_TEST_CHECKLIST.md) — a step-by-step, prop-by-prop checklist (107 items) covering every documented prop/event/exposed method, plus cross-browser, touch, RTL, and screen-reader scenarios the automated suite can't cover from this environment
* [`COMPARISON_ALTERNATIVES.md`](./COMPARISON_ALTERNATIVES.md) — an honest, search-grounded comparison against other GitHub grid-layout projects (`vue-grid-layout`, `react-grid-layout`, `gridstack.js`, and the fragmented Vue 3 community forks that fill `vue-grid-layout`'s own gap)
* [`COMPARISON_COMMERCIAL.md`](./COMPARISON_COMMERCIAL.md) — the same, against two commercial products in an adjacent space: Kendo TileLayout and DevExtreme's Dashboard Designer, kept separate since both have a different licensing model (one, DevExtreme, is arguably a different product category entirely)
* [`COMPETITIVE_ROADMAP.md`](./COMPETITIVE_ROADMAP.md) — a prioritized, sequenced plan for closing the gaps identified above, including what's deliberately *not* recommended and why
* [`docs/REFACTOR_STRATEGY.md`](./docs/REFACTOR_STRATEGY.md) — full roadmap: standardization, maintainability, testability, enterprise readiness
* [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — how GridLayout and GridItem talk to each other, and the composable split
* [`docs/BUNDLE_ANALYSIS.md`](./docs/BUNDLE_ANALYSIS.md) — measured bundle composition, including the native drag/resize engine that replaced `interact.js` (removing it as a runtime dependency entirely)
* [`docs/REFACTORING.md`](./docs/REFACTORING.md) — specific refactoring findings from the current source
* [`docs/TESTING.md`](./docs/TESTING.md) — unit + e2e testing guide
* [`docs/STRYKER.md`](./docs/STRYKER.md) — mutation testing: what it's for, how to run it, and what's in scope
* [`docs/VISUAL_REGRESSION.md`](./docs/VISUAL_REGRESSION.md) — screenshot-based regression testing: current status and one-time setup
* [`docs/ACCESSIBILITY.md`](./docs/ACCESSIBILITY.md) — keyboard move/resize support, screen reader support, and what's not covered
* [`docs/FEATURE_RECOMMENDATIONS.md`](./docs/FEATURE_RECOMMENDATIONS.md) — the fuller, source-grounded version of `ROADMAP.md`'s suggestions

## Changelog

See [`CHANGELOG.md`](./CHANGELOG.md) for the full history. Latest entries:

### Unreleased

Two large batches of work on top of the original test/CI/docs
foundation (99%+ coverage, mutation testing, three CI workflows):
first, cross-grid drag/drop, drag-and-drop from outside the grid,
all-edge resize, keyboard move/resize, a first-party persistence
helper, a generic `ILayoutItem<TMeta>`, configurable transitions, a
custom drag-placeholder slot, and alignment guides while dragging.
Then a further batch: `compactNow()`/`rearrange()`, collision-safe
`duplicateItem(id)`, a `MOVE_BLOCKED_BY_COLLISION` feedback event,
per-item `autoHeight`, magnetic `snapToGrid` (distinct from the
visual-only alignment guides), configurable resize-handle appearance,
`outsideDropAccept` and a typed outside-drop payload helper, named
layout presets (`useLayoutPresets`), a dependency-free SVG export
(`exportLayoutAsSvg`), localizable ARIA strings (`ariaLabels`), shared
design tokens between `demo/`/`sandbox/`, and a `npm run package`
script that runs every quality gate and produces the exact publishable
tarball in one command. VitePress documentation grew alongside all of
it, from 26 to 37 interactive examples. See
[`CHANGELOG.md`](./CHANGELOG.md) for the complete, dated list, and
[`docs/REFACTOR_STRATEGY.md`](./docs/REFACTOR_STRATEGY.md) for the
roadmap this was scoped against.

## Setting up vue-ts-responsive-grid-layout in your project

See [INSTALL.md](./INSTALL.md) for adding the package to your own project,
with usage examples (Composition API, Options API, TypeScript). Contributing
to this repository itself instead? See [CONTRIBUTING.md](./CONTRIBUTING.md).

<br/>

#### Auditing the package

```
 npm audit --registry=https://registry.npmjs.org/
```

<br/>

### References

* [Mini.css used in the sandbox](https://minicss.us/docs.htm#)
* [Vue-Multiselect used in the sandbox](https://vue-multiselect.js.org/#sub-getting-started)
* [Vitest](https://vitest.dev/)
* [Vitest UI](https://vitest.dev/guide/ui.html#vitest-ui)
* [Playwright](https://playwright.dev/)
