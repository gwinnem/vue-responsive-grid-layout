# Manual Test Checklist

## Why this exists, and how to use it

The automated test suite (99%+ coverage, mutation-tested, 8 e2e spec
files) is thorough — but it has real, documented gaps: no official-browser
e2e run has ever happened (only a Chromium workaround — see
`PRODUCTION_READINESS.md`), zero Firefox/WebKit testing has occurred
anywhere, ever, and no visual regression baselines exist. This checklist
exists for a human, in a real browser, to close that specific gap.

**This is a step-by-step, prop-by-prop checklist, not a summary.** Every
documented prop on `GridLayout` (38) and `GridItem` (27), every event
(14), and every exposed method/value (14) has at least one concrete,
numbered step below with a stated expected result — not a one-line
"check drag/resize works." Follow the numbered steps in order within
each section; the layouts referenced are the demo app's actual current
defaults, not illustrative examples, so exact positions/counts below
should match what you see.

Run the full thing before a release touching drag/resize/collision
logic, or before publishing a version consumers will actually install.
For routine changes, run just the section(s) touched by the change plus
the "Cross-cutting" section.

## Setup

```sh
npm run demo   # one-feature-per-view app — used for most of this checklist
npm run dev    # sandbox — the all-props-in-one test bench, for props no demo view covers
```

Record: **browser + OS + input method** (mouse/trackpad/touch) for
anything that fails — that's exactly the dimension automated testing
can't cover today. Use the sign-off table at the end.

## Browser matrix

Run the entire checklist below in each of these at least once before a
release, in priority order:

- [ ] **Firefox** (desktop) — zero automated coverage today
- [ ] **Safari** (desktop, macOS) — zero automated coverage today
- [ ] **Chrome** (desktop) — some automated coverage via the workaround build
- [ ] **Edge** (desktop) — Chromium-based, but not identical to Chrome in all respects
- [ ] **Mobile Safari** (iOS, physical device if possible)
- [ ] **Mobile Chrome** (Android, physical device if possible)

---

## 1. Basic grid (`demo` → "Basic grid")

Default layout: item `0` (x:0,y:0,w:3,h:2), `1` (x:3,y:0,w:3,h:2),
`2` (x:6,y:0,w:3,h:3), `3` (x:0,y:2,w:3,h:2).

1. [ ] Load the view fresh. All 4 items render at the positions above with no flash of an incorrect layout (e.g. all stacked at 0,0 before settling).
2. [ ] Item `2` is visibly taller than items `0`/`1`/`3` (h:3 vs h:2) — confirms `h`/row-height math is visually correct, not just numerically.
3. [ ] Confirm every item has the `vue-draggable` and `vue-resizable` CSS classes present by default (inspect element) — the library's default `isDraggable`/`isResizable` are both `true`.
4. [ ] Resize the browser window narrower and wider — `colNum` (default 12) keeps the column count fixed; only pixel widths change, items don't reflow to a different column count (that's `responsive`, tested in section 4).

## 2. Drag & resize (`demo` → "Drag & resize")

Default layout: `0` (x:0,w:4,h:2), `1` (x:4,w:4,h:2), `2` (x:8,w:4,h:2), all y:0.

### Dragging

1. [ ] Drag item `0` to the right by roughly one item-width. It moves smoothly, tracking the pointer with no visible lag.
2. [ ] Release mid-drag over item `1`'s original space — item `1` is pushed out of the way (collision push), not overlapped.
3. [ ] Toggle **Draggable** off. Attempt to drag item `0` — it does not move at all.
4. [ ] Toggle **Draggable** back on, toggle **Bounded** on. Drag item `0` toward the right edge past the container boundary — it stops at the edge, it does not extend past the container.
5. [ ] Toggle **Mirrored (RTL)** on. Drag item `1` to the visual left — it should move left (mirrored coordinate math, not the reverse).

### Resizing

6. [ ] Toggle **Mirrored (RTL)** back off. Resize item `1` from its bottom-right corner, growing it — width and height both increase, anchored at the top-left.
7. [ ] Resize item `1` from its **left** edge, shrinking it — the left edge moves right, the right edge stays fixed (this is the edge most likely to have a mirrored-anchor bug — see `docs/REFACTORING.md`'s RTL findings).
8. [ ] Resize item `1` from its **top** edge — same check, top edge moves, bottom stays fixed.
9. [ ] Resize from all 4 corners in turn (top-left, top-right, bottom-left, bottom-right) — each grows/shrinks from the correct anchor corner.
10. [ ] Toggle **Resizable** off. Attempt to resize any item — no resize cursor appears, dragging an edge does nothing.
11. [ ] Toggle **Resizable** back on, toggle **Preserve aspect ratio** on. Resize item `2` from a corner — width and height change together, proportionally; resizing from a single edge (not a corner) either still preserves ratio or is visibly disabled — confirm which, and that it's not silently broken.

### Collision & compaction

12. [ ] Toggle **Vertical compact** off. Drag item `2` down, leaving a gap above it. It stays where dropped — no automatic snap-back.
13. [ ] Toggle **Vertical compact** back on. Drag item `2` down again — after releasing, it does *not* auto-compact back up on its own (compaction runs on the *next* layout-affecting action, not continuously) — drag any item slightly and confirm compaction then closes the gap.
14. [ ] Toggle **Prevent collision** on. Try to drag item `0` on top of item `1` — the drag is rejected; item `0` snaps back to its last valid position rather than overlapping.
15. [ ] Toggle **Horizontal shift** on, **Prevent collision** off. Drag item `0` into item `1`'s space — item `1` shifts horizontally rather than being pushed down.
16. [ ] Toggle **Distribute evenly** on. Set a narrow column count (or resize an item wide enough) so items would overflow the right edge — confirm they spread evenly across the available columns instead of just clamping/overlapping at the edge.
17. [ ] Toggle **Restore on drag** on. Start dragging item `0` over item `1`, then drop somewhere that doesn't collide — item `1` should not have permanently compacted past its pre-drag position during the drag.

### Styling / rendering options

18. [ ] Toggle **Use CSS transforms** off, then on again. Drag an item in both states — should look and behave identically to the user; only the underlying CSS mechanism differs (`transform` vs `top`/`left`).
19. [ ] Toggle **Show close button** on — an ✕ appears on every item. Click it on item `2` — item `2` is removed from the layout.
20. [ ] Reset the layout (undo the removal by reloading), toggle **Edit mode** off — the close button (if on) disappears or becomes inert even with `showCloseButton` on, since edit mode gates it.
21. [ ] Toggle **Use border radius** on, set **Border radius (px)** to a small value (e.g. 4) then a large one (e.g. 40) — corners visibly round at both, no clipping or overflow artifacts at the large value.
22. [ ] Toggle **Show grid lines** on — faint grid lines appear behind the items, aligned with the actual item edges (not offset).
23. [ ] Set **Row height** to a small value (e.g. 30) then a large one (e.g. 150) — items resize proportionally, no layout breakage at either extreme.
24. [ ] Set **Columns** to a small number (e.g. 4) — items visibly reflow to fit fewer, wider columns.
25. [ ] Set **Margin (h)** and **Margin (v)** to 0 — items should visibly touch with no gap. Set both to a large value (e.g. 40) — a large, even gap appears between every item in both directions.
26. [ ] Set **Max rows** to a small number (e.g. 2) — attempt to drag an item below that row count; it should be constrained (exact behavior: confirm it doesn't silently allow rows beyond the configured max).
27. [ ] Set **Transform scale** to `0.5` (simulating this grid rendered inside a zoomed-out ancestor) — dragging should still track the pointer accurately at the scaled-down size, not drift or lag behind the cursor.
28. [ ] Clear the event log, perform one drag — the log shows `dragstart`/`dragmove`/`dragend` entries in order, plus `layout-updated`.

## 3. Add / remove items (`demo` → "Add / remove items")

1. [ ] Click "Add item" — a new item appears, placed in a collision-free spot, not overlapping any existing item.
2. [ ] Add 3-4 items in a row — each lands somewhere sane, no stacking on top of each other.
3. [ ] Click the close button on a middle item (not first or last) — it's removed, and remaining items compact to fill the gap (if `compactType` is `VERTICAL` for this view).
4. [ ] Remove every item down to zero — the grid container doesn't error or collapse to an invalid state; it should just show an empty grid.
5. [ ] Add an item back after removing all of them — confirm the id-generation logic doesn't collide with a previously-used id.

## 4. Responsive breakpoints (`demo` → "Responsive breakpoints")

Default layout (`lg`): `0` (x:0,w:3), `1` (x:3,w:3), `2` (x:6,w:3), `3`
(x:9,w:3), all h:2, y:0. Explicit `md` and `sm` layouts are also
predefined; other breakpoints (`xl`/`xxl`/`xs`/`xxs`) have none and must
auto-generate.

1. [ ] Load at a wide (desktop) window width — the `lg` layout (4 items in a row) renders.
2. [ ] Narrow the browser window until it crosses into `md` range — layout switches to the predefined `md` arrangement (2x2 grid) exactly, not an auto-generated one.
3. [ ] Continue narrowing into `sm` range — layout switches to the predefined `sm` arrangement (stacked single column) exactly.
4. [ ] Narrow further into `xs`/`xxs` range (no predefined layout exists there) — items still arrange sensibly (auto-generated fallback), no overlapping items, no items rendered off-screen.
5. [ ] Widen back through each breakpoint in reverse — each transition is smooth, no flash of an incorrect intermediate layout.
6. [ ] Reload the page directly at a narrow (e.g. mobile) width — the correct narrow-breakpoint layout renders immediately on first paint, not a flash of the desktop layout first.
7. [ ] If the demo exposes editable `cols` per breakpoint, change the `md` column count and confirm the `md` layout reflows to match rather than ignoring the change.

## 5. Cross-grid drag/drop (`demo` → "Cross-grid drag/drop")

Two side-by-side grids, `cross-grid-left` and `cross-grid-right`.

1. [ ] With both **Left enabled** and **Right enabled** toggles on, drag an item from the left grid into the right grid — it lands in the right grid, removed from the left grid's own layout.
2. [ ] Drag an item back from right to left — same check in reverse.
3. [ ] Toggle **Right enabled** (its `allowCrossGridDrag`) off, leaving left on. Drag an item from left toward right — the drop is rejected; the item returns to the left grid rather than vanishing or duplicating.
4. [ ] Toggle **Right rejects** (`disableExternalDrop`) on instead. Drag from left to right — same rejection behavior, but confirm the event log shows `cross-grid-drop-rejected` fired (not silently nothing).
5. [ ] With both grids properly enabled, watch the event log during a successful cross-grid drag — `cross-grid-item-dropped` appears on the receiving grid.
6. [ ] Perform a fast, continuous drag sweeping from deep inside the left grid directly into the right grid in one motion (not a slow, deliberate one) — exactly one item should land in the target grid, not one duplicated in each.

## 6. Per-item overrides (`demo` → "Per-item overrides")

Default layout: `0`, `1`, `2` at x:0/4/8, w:4, h:2, y:0.

1. [ ] Toggle **Is static** on — the affected item can no longer be dragged or resized at all, and other items compact/collide *around* it as a fixed obstacle.
2. [ ] Toggle **Enable edit mode** off — the close button (if configured) disappears or becomes inert for that item specifically.
3. [ ] Toggle **Preserve aspect ratio** on for one item only — resizing that item keeps its ratio; resizing a *different* item (without the toggle) does not.
4. [ ] Toggle **Show close button** (per-item) — the close button appears only on the affected item, not on the others (confirms this is a genuine per-item override, not accidentally grid-wide).
5. [ ] Toggle **Use border radius** + set **Border radius (px)** for one item — only that item gets rounded corners.
6. [ ] Set **Is draggable** dropdown to "false" for one item, "inherit" for the rest — the overridden item can't be dragged; the others still can (confirms `null`/inherit vs explicit `false` both work as documented).
7. [ ] Same check for the **Is resizable** dropdown.
8. [ ] Same check for the **Is bounded** dropdown — set one item's to "true" and confirm only that item is constrained to the container while dragging.
9. [ ] Set **Min W**/**Min H** to specific values (e.g. 2/1) on one item, then try to shrink it below those via resize — it stops at the configured minimum, not smaller.
10. [ ] Set **Max W**/**Max H** similarly, try to grow past them — stops at the configured maximum.
11. [ ] Set **Drag ignore from** to `button` (or similar selector) on an item that has a nested `<button>` in its content — clicking/dragging the button itself doesn't start a grid drag; dragging elsewhere on the same item still does.
12. [ ] Set **Resize ignore from** similarly and confirm the equivalent behavior for resize handles overlapping a nested interactive element, if applicable to this demo's markup.

## 7. Drag from outside / multi-grid (`demo` → "Drag from outside (multi-grid)")

Two grids (`drop-grid-left`, `drop-grid-right`), a palette of draggable
widgets above them including one labeled "Incompatible".

1. [ ] Drag the "A" widget from the palette into the left grid — a live placeholder preview appears while hovering, in the correct grid cell under the pointer, before you release.
2. [ ] Release — the item is added to the left grid's layout at that position, with the correct label/content (confirms the payload was read correctly, not just a generic blank item).
3. [ ] Drag the "B" widget into the right grid instead — lands in the right grid, not the left.
4. [ ] Drag the "Incompatible" widget over either grid — no placeholder preview appears at all (this is `outsideDropAccept` rejecting it before the placeholder shows), and the browser's own "not allowed" cursor is visible.
5. [ ] Release the "Incompatible" widget's drag over a grid anyway — nothing is added to any layout.
6. [ ] Release a drag (compatible widget) in the space *between* the two grids, touching neither — nothing is added anywhere.
7. [ ] Drag an already-placed grid item (not from the outside palette) from the left grid into the right grid — this exercises `allowCrossGridDrag` independently of the outside-drop palette above; confirm it still works alongside the outside-drop feature on the same grids.
8. [ ] Click "Reset" — both grids return to their initial state.

## 8. Layout tools & feedback (`demo` → "Layout tools & feedback")

Default layout: `0` (x:0,y:0,w:2,h:2), `wall` (x:4,y:0,w:2,h:4,
**static**), `growable` (x:0,y:6,w:3,h:2, deliberately far below with a
gap left by design). `compactType` is `NONE` in this view.

1. [ ] Toggle **preventCollision** on. Drag item `0` directly onto the static `wall` item — the drag is rejected, item `0` stays at (or returns to) its prior position, not overlapping `wall`.
2. [ ] Check the "Blocked moves" counter/feedback text — it incremented, and names item `0` as the last blocked item.
3. [ ] Drag `growable` further down (creating an even bigger gap above it, since `compactType` is `NONE` here). Click "Tidy up (compactNow)" — `growable` moves back up to close the gap, all the way up to just below item `0` (not just partially, and not stuck if it was scattered) — this specifically tests the `compactNow()` bug found and fixed in this project's own history (see `CHANGELOG.md`), where it used to be a no-op with `compactType` set to `NONE`.
3b. [ ] Click "rearrange()" instead of "compactNow()" on a similarly-scattered layout — confirm it behaves identically (it's documented as an alias, not a separate implementation).
4. [ ] Click "Duplicate first item" — a new item appears with an id like `0-copy`, placed directly below the original (or wherever the next compaction pass puts it), not overlapping it.
5. [ ] Click "Duplicate" again on the same source — the second copy gets a further-suffixed id (`0-copy-2`), not a collision with the first copy.
6. [ ] Toggle **snapToGrid** on. Drag item `0` slowly near `wall`'s left edge (within a grid unit or so) — item `0`'s edge audibly/visibly "snaps" into exact alignment with `wall`'s edge rather than stopping wherever the pointer released.
7. [ ] Drag item `0` to a position clearly *not* near any other item's edge — no snapping occurs; it lands exactly where released.
8. [ ] Toggle **showResizeHandles** on — small visible resize-handle affordances appear on item edges/corners, not just a cursor change on hover.
9. [ ] Toggle **ariaLabels (Spanish)** on. Inspect (or use a screen reader on) the close button and keyboard-instructions text — they now read in Spanish, not the English defaults.
10. [ ] Save a preset named "compact", rearrange the layout, save a second preset named "detailed". Load "compact" — the layout returns exactly to how it was when that preset was saved (not the most-recently-saved state). Load "detailed" — same check for the other preset.
11. [ ] Reload the page (fresh page load, not just re-navigating within the SPA) and load the "compact" preset again — confirms the preset actually persisted to `localStorage`, not just in-memory state.

---

## Cross-cutting concerns (apply across every view above)

### Touch-specific (mobile Safari + mobile Chrome, physical device if possible)

1. [ ] Dragging an item with a single finger works, on at least 2 different views above (not just one).
2. [ ] Resizing from a corner/edge works with a finger — this is the most likely touch failure point (small hit targets).
3. [ ] Scrolling the page still works when a touch starts on a `GridItem` that isn't actually being dragged.
4. [ ] No "ghost click" or accidental drag triggers from a simple tap.
5. [ ] Pinch-to-zoom on the page doesn't conflict with an in-progress drag/resize gesture.

### Keyboard-only navigation (no mouse/touch at all)

1. [ ] Tab through a page of `GridItem`s — focus order is sane, not jumping unpredictably between items.
2. [ ] With an item focused, press an arrow key — it moves by one grid unit in the expected direction.
3. [ ] Press Shift+arrow — the focused item resizes instead of moving.
4. [ ] Focus an item at the grid's left/top boundary and press the arrow key that would move it further into negative territory — it stays clamped at the boundary, doesn't go off-grid.
5. [ ] Focus a static item (`isStatic`) — arrow keys do nothing to it.
6. [ ] Focus an item with `isDraggable`/`isResizable` both explicitly `false` — same check, no response to any arrow key combination.

### Screen reader (VoiceOver on macOS/iOS, NVDA or Narrator on Windows)

1. [ ] Turn on the screen reader, tab to an item with a close button visible — the button's label is actually announced (not silent, not just "button" with no text).
2. [ ] Tab to a draggable/resizable item — the keyboard move/resize instructions are announced, not just silence.
3. [ ] On the "Layout tools & feedback" view with `ariaLabels (Spanish)` toggled on, confirm the screen reader announces the **Spanish** text, not the English default — this specifically verifies the override actually reaches what gets announced, not just that the attribute exists in markup.
4. [ ] Cross-check against `docs/ACCESSIBILITY.md`'s stated scope — if anything claimed as supported isn't actually announced correctly, that's a documentation bug to file, not just a missing feature.

### RTL / mirrored layout — flagged as lower-confidence in `docs/ACCESSIBILITY.md`

1. [ ] In the sandbox, toggle `isMirrored` on for the whole grid. Drag an item visually to the right — it should move right (not backwards) despite the underlying coordinate mirroring.
2. [ ] Resize from each of the 4 edges with `isMirrored` on — confirm the correct (mirrored) anchor edge stays fixed in each case, matching section 2's steps 6-9 but mirrored.
3. [ ] Separately, set the OS or browser's own text direction to RTL (not just the `isMirrored` prop) and load any demo view — confirm the grid still behaves sensibly; this prop and genuine RTL browser/locale behavior are different mechanisms worth checking independently, not assumed to be the same thing.

### Visual appearance (standing in for the visual regression baselines that don't exist yet — see `docs/VISUAL_REGRESSION.md`)

1. [ ] Grid lines (`showGridLines`) render at the correct spacing, aligned with actual item edges, not offset.
2. [ ] Border radius renders identically-shaped at a small (4px) and large (40px) value, no clipping artifacts at the large end.
3. [ ] The close button's icon and hit-area look correct and are easy to click precisely.
4. [ ] `showResizeHandles`/`resizeHandleColor` renders the visible handle correctly positioned on all 8 edges/corners, not just "close enough."
5. [ ] Configurable transition duration/easing (`transitionDurationMs`/`transitionTimingFunction`) actually resembles the configured easing curve when an item moves/resizes, not generic linear motion regardless of setting.

### Export (VitePress example: "Export layout as SVG")

1. [ ] Generate the exported SVG, then open it directly in a new browser tab/window (not just viewing it rendered inline on the page) — proportions, labels, and layout all look correct, no clipping.
2. [ ] Regenerate at a couple of different `containerWidth` values and confirm the export scales as expected each time.

## Sign-off

| Field | Value |
|---|---|
| Date | |
| Tester | |
| Browser(s) covered | |
| Library version tested | |
| Sections fully run | |
| Result | Pass / Pass with noted issues / Fail |
| Issues found (link to GitHub issues) | |
