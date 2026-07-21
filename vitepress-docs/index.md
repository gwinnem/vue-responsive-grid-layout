---
layout: home

title: Vue TS Responsive Grid Layout
titleTemplate: A draggable, resizable, responsive grid for Vue 3

hero:
  name: vue-ts-responsive-grid-layout
  text: Draggable & resizable grid for Vue 3
  tagline: A TypeScript-first, responsive dashboard grid — drag, resize, multi-select, pluggable compaction, cross-grid drag/drop, undo/redo, and breakpoint-aware layouts, built on Vue 3's Composition API with zero runtime dependencies.
  image:
    src: /Data Grid.svg
    alt: logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View 45 Examples
      link: /examples/01-example
    - theme: alt
      text: GitHub
      link: https://github.com/gwinnem/vue-responsive-grid-layout

features:
  - icon: 🖱️
    title: Drag & resize
    details: Every item is draggable and resizable out of the box, with per-item overrides, drag handles, min/max size constraints, and aspect-ratio locking.
  - icon: 📐
    title: Responsive breakpoints
    details: Auto-generate a layout per breakpoint, or hand it exact pre-defined layouts for full control over how content reflows.
  - icon: ⚙️
    title: Pluggable compaction
    details: Five built-in strategies via compactType — vertical, horizontal, none, and overlap variants of each — or replace the algorithm entirely with a custom ICompactor.
  - icon: 🔀
    title: Multi-select & group move/resize
    details: Select multiple items and drag or resize any of them — the rest of the selection moves or resizes by the same delta, from mouse or keyboard alike.
  - icon: ↔️
    title: Cross-grid & outside drag/drop
    details: Drag items between separate GridLayout instances with accept/reject rules, or drop in a brand-new item from outside the grid entirely.
  - icon: 🧲
    title: Snap-to-grid & alignment guides
    details: Magnetic snapping that actually adjusts an item's position, plus Figma-style alignment guides while dragging — not just a visual overlay.
  - icon: 💾
    title: Persistence & presets
    details: Serialize/restore a layout with a first-party storage helper, or save and switch between multiple named layout presets.
  - icon: ⌨️
    title: Keyboard accessible
    details: Move and resize items with arrow keys and shift+arrow, no mouse required — with localizable ARIA strings for every screen-reader-facing string.
  - icon: 🔤
    title: TypeScript-first
    details: Every prop, event, and enum is fully typed and exported from the package's main entry point — no reaching into an internal path required.
  - icon: ↩️
    title: Undo/redo
    details: Opt-in enableUndoRedo history — snapshots taken at each committed change (drag/resize end, add/remove), not per intermediate frame, with a configurable history limit.
  - icon: 📦
    title: Zero dependencies
    details: 21.84 KB gzip, no runtime dependencies at all — the native drag/resize engine uses Pointer Events directly, not a third-party library.
  - icon: 🖼️
    title: SVG export
    details: Export the current layout to a standalone SVG — a static snapshot for docs, thumbnails, or sharing, no screenshot tooling required.
  - icon: 🌐
    title: RTL layout mirroring
    details: isMirrored flips the entire grid for right-to-left locales — anchor edges, resize direction, and drag math all correctly reverse, with a per-item opt-out.
  - icon: 🧩
    title: Framework-agnostic core
    details: A separate /core entry point exposes the positioning, collision, and compaction engine with zero Vue dependency — usable standalone outside Vue entirely.
  - icon: ✅
    title: Battle-tested
    details: 98%+ statement/branch coverage, a Playwright e2e suite across Chromium/Firefox/WebKit, mutation testing, and CI gates on every PR — not just unit tests against the happy path.
---
