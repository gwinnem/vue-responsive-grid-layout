# Accessibility

Part of Phase 4 from `docs/REFACTOR_STRATEGY.md`. Before this pass, there
was no way to move or resize a `GridItem` other than a mouse or touch
drag — confirmed by grepping the entire component tree for `aria-*`,
`role=`, and `tabindex` and finding nothing at all. For a library whose
entire purpose is letting end users rearrange a layout, that's a real gap,
not a nice-to-have.

## What's implemented

### Keyboard move and resize

Every non-static, editable `GridItem` is keyboard-focusable
(`tabindex="0"`) and operable:

- **Arrow keys** move it by one grid unit, if it's draggable.
- **Shift + arrow keys** resize it by one grid unit, if it's resizable.

See `src/components/Grid/composables/useGridItemKeyboard.ts` for the
implementation. Each keypress is treated as a complete, atomic gesture —
there's no keyboard equivalent of a continuous drag to preview mid-way
through — and emits the exact same `MOVE`/`MOVED` or `RESIZE`/`RESIZED`
event pairs, and the same eventBus `dragEvent`/`resizeEvent` message
GridLayout already handles for mouse-driven interaction, so compaction
and collision handling apply identically regardless of which input method
triggered the change. This was a deliberate design choice: reusing the
exact same downstream path the mouse/touch composables already use, and
already have significant test coverage for, rather than inventing a
parallel one.

**Works with `multiSelect`'s group move/resize too** — arrow-key/
Shift+arrow movement on a focused, *selected* item moves/resizes every
other selected item by the same delta, the same as a mouse/touch drag
already does. Each keypress emits a synthetic `dragstart`/`resizestart`
immediately before its existing `dragend`/`resizeend`, engaging
`GridLayout`'s own group-move snapshot mechanism rather than a separate
keyboard-specific implementation. This was a genuine gap until it was
found and fixed (see `docs/REFACTORING.md`) — previously, a
keyboard-only user could select multiple items via `multiSelect` but
had no way to move them as a group at all.

**Deliberately scoped to single-unit steps**, not a full WAI-ARIA
[grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) or
[application](https://www.w3.org/WAI/ARIA/apg/patterns/) widget pattern
(roving `tabindex` between cells, a distinct "move mode" toggle key,
etc.). This library isn't a traditional data grid — it's a freeform
draggable canvas — so the full APG grid pattern doesn't map cleanly onto
it. The goal here was closing the actual gap (no keyboard alternative
existed at all), not redesigning the interaction model.

### Screen reader support

- Each interactive item gets `role="group"` and
  `aria-roledescription="Draggable, resizable item"`, so a screen reader
  announces it as something other than a plain, silent `<div>`.
- `aria-describedby` points to a visually-hidden instructions string
  ("Press arrow keys to move." / "Press shift plus arrow keys to
  resize.", each only included if that action actually applies to the
  item) — discoverable on focus, not a mandatory upfront announcement.
- Visible `:focus-visible` outline, so a keyboard user can actually see
  which item currently has focus (previously, focusing an item — once it
  became focusable at all — would have been invisible; browsers don't
  reliably draw a default focus ring on a `<div>` with a custom
  `tabindex`).

### A real, unrelated bug found and fixed along the way

While implementing the instructions text above, found that `.visually-hidden`
— already used by the close button's screen-reader-only "Close" label —
was **never actually defined anywhere in the library's CSS**. It's been
rendering as plain, visible text next to the × icon this whole time,
unless a consumer's own global stylesheet happened to already define a
conventional `.visually-hidden` utility class (a common convention in some
CSS resets/frameworks, but never guaranteed). Fixed by adding the standard
clip-to-1px-box CSS pattern to `GridItem.vue`'s scoped styles.

### A deliberate, non-obvious design decision worth calling out

Keyboard move/resize **ignores `dragAllowFrom`/`dragIgnoreFrom`/
`resizeIgnoreFrom`** entirely — those props restrict which DOM element a
*mouse* drag/resize gesture can originate from (see
[Drag allow/ignore elements](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/05-example.md)
and
[Custom drag handle](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/18-example.md)),
which is a concept that doesn't map onto keyboard interaction at all —
there's no "which element did the keypress originate from" equivalent to
"which element did the mousedown originate from." A keyboard user who
focuses the item gets full move/resize access regardless of whether a
mouse user is restricted to a specific handle. This is intentional, not
an oversight: restricting keyboard users *further* than mouse users, just
because a mouse-specific UI affordance (a drag handle) exists, would be
the wrong direction for an accessibility feature to take.

### The two exported utility components

`CustomCloseButton.vue` previously rendered a `<button>` with **no
accessible name at all** (just a `<span class="icon-cross">` with no text
or `aria-label`) — found and fixed alongside this work by adding
`aria-label="Close"`. `CustomDragElement.vue`'s decorative handle circle
(`.vue-draggable-handle`, a background-image-only `<span>`) is
appropriately non-interactive from a screen reader's perspective already
(it's not a link/button, and screen readers don't announce plain
non-interactive elements), so no change was needed there — its `<button>`
label is a consumer-configurable `text` prop, already documented as such.

## What's not covered (tracked, not silently ignored)

- **No roving-tabindex grid navigation.** Tabbing moves through items in
  DOM order (which usually, but not necessarily, matches visual order),
  the same as any other focusable elements on a page — there's no
  arrow-key-based "move focus to the item above/below/left/right"
  navigation independent of actually moving the focused item. That's part
  of the full APG grid pattern this deliberately doesn't implement (see
  above).
- **No keyboard equivalent for the drag-from-outside / drag-between-grids
  examples** ([Drag, drop from outside](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/11-example.md),
  [Drag, drop from grid to grid](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/examples/12-example.md))
  — those are consumer-level example code, not library internals, and
  would need their own keyboard handling written the same way the
  examples currently write their own mouse handling.
- **Not independently audited against WCAG success criteria** or run
  through an automated tool (axe, Lighthouse, etc.) as part of this pass —
  what's here was reasoned through manually against the specific gap
  found (no keyboard alternative), not verified against a full checklist.
  A real automated accessibility audit is a reasonable next step, and
  would likely find things this pass didn't.
- **Color contrast and the default item styling generally** haven't been
  reviewed — `GridItem`'s content is unstyled by default (see
  [Styling → GridItem](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/components/css-grid-item.md)),
  so this is mostly a consumer responsibility, but the library's own
  default close button and focus outline colors haven't been explicitly
  checked against contrast ratios.

## Verifying this

`tests/GridItem.spec.ts`'s "keyboard accessibility" suite covers: focus
attributes present/absent correctly based on static/edit-mode state,
arrow-key movement (including bounds clamping and the `isDraggable: false`
guard), shift+arrow resize (including `minW`/`minH` clamping and the
`isResizable: false` guard), and that non-arrow keys and disabled
edit-mode are correctly no-ops. `useGridItemKeyboard.ts` itself is at
100% line coverage — see the
[Test Coverage](https://github.com/gwinnem/vue-responsive-grid-layout/blob/main/vitepress-docs/guide/coverage.md)
page.
